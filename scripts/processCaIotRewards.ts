import fs from 'fs'
import path from 'path'
import * as h3 from 'h3-js'
import _ from 'lodash'
import {makeTable, tableToIPC} from 'apache-arrow'
import fsExtra from 'fs-extra'
import readline from 'readline'

const HOTSPOTS_FILE = path.join(
  __dirname,
  '../data/lookup/ca_iot_hotspots.json',
)
const HOTSPOTS_WITH_HEX_FILE = path.join(
  __dirname,
  '../data/lookup/ca_iot_hotspots_with_hex.json',
)
const REWARDS_FILE = path.join(__dirname, '../data/raw/iot/all_rewards.jsonl')
const OUTPUT_ARROW_FILE = path.join(
  __dirname,
  '../data/features/iot/ca_iot_daily.arrow',
)

interface Hotspot {
  lat: number
  lon: number
  gain: number
  elevation: number
  hex?: string
}

async function addHexToHotspots() {
  const hotspots: Record<string, Hotspot> = await fsExtra.readJson(
    HOTSPOTS_FILE,
  )
  for (const key in hotspots) {
    const {lat, lon} = hotspots[key]
    hotspots[key].hex = h3.latLngToCell(lat, lon, 8)
  }
  await fsExtra.writeJson(HOTSPOTS_WITH_HEX_FILE, hotspots, {spaces: 2})
  console.log('Updated hotspots with hex saved to:', HOTSPOTS_WITH_HEX_FILE)
  return hotspots
}

interface RewardDetail {
  beacon_amount: number
  dc_transfer_amount: number
  formatted_beacon_amount: string
  formatted_dc_transfer_amount: string
  formatted_witness_amount: string
  hotspot_key: string
  witness_amount: number
}

interface Reward {
  id: string
  end_period: string
  reward_detail: RewardDetail
  reward_manifest: any
  reward_type: string
  start_period: string
  hotspot_key: string
}

async function loadRewardsStream(): Promise<Reward[]> {
  console.log('Streaming and loading rewards from:', REWARDS_FILE)
  const rewards: Reward[] = []
  const fileStream = fs.createReadStream(REWARDS_FILE)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (line) {
      rewards.push(JSON.parse(line))
    }
  }
  console.log(`Stream-loaded ${rewards.length} reward records.`)
  return rewards
}

async function processRewards() {
  let hotspots = await fsExtra
    .readJson(HOTSPOTS_WITH_HEX_FILE)
    .catch(() => null)
  if (!hotspots) {
    hotspots = await addHexToHotspots()
  }
  const hotspotToHex: Record<string, string> = Object.fromEntries(
    Object.entries(hotspots).map(([key, value]: [string, any]) => [
      key,
      value.hex,
    ]),
  )

  const rewards = await loadRewardsStream()

  const parsedRewards = rewards
    .map((r) => ({
      hex: hotspotToHex[r.reward_detail.hotspot_key] || 'unknown',
      date: new Date(r.start_period).toISOString().split('T')[0],
      beacon: parseFloat(r.reward_detail.formatted_beacon_amount),
      witness: parseFloat(r.reward_detail.formatted_witness_amount),
      dc_transfer: parseFloat(r.reward_detail.formatted_dc_transfer_amount),
    }))
    .filter((r) => r.hex !== 'unknown')

  const grouped = _.groupBy(parsedRewards, (r) => `${r.hex}|${r.date}`)
  const dailyAgg: any[] = Object.values(grouped).map((group) => {
    const first = group[0]
    return {
      hex: first.hex,
      date: first.date,
      beacon: _.sumBy(group, 'beacon'),
      witness: _.sumBy(group, 'witness'),
      dc_transfer: _.sumBy(group, 'dc_transfer'),
      total_rewards:
        _.sumBy(group, 'beacon') +
        _.sumBy(group, 'witness') +
        _.sumBy(group, 'dc_transfer'),
      poc_rewards: _.sumBy(group, 'beacon') + _.sumBy(group, 'witness'),
    }
  })

  const hexCounts = _.countBy(Object.values(hotspots).map((h: any) => h.hex))
  dailyAgg.forEach((agg) => {
    agg.hotspot_count = hexCounts[agg.hex] || 0
  })

  dailyAgg.forEach((agg) => {
    const neighbors = h3.gridDisk(agg.hex, 1)
    agg.density_k1 = neighbors.reduce(
      (sum: number, n: string) => sum + (hexCounts[n] || 0),
      0,
    )
  })

  const sortedAgg = _.sortBy(dailyAgg, ['hex', 'date'])
  const groupedByHex = _.groupBy(sortedAgg, 'hex')
  for (const hexGroup of Object.values(groupedByHex)) {
    for (let i = 0; i < hexGroup.length; i++) {
      const window = hexGroup.slice(Math.max(0, i - 2), i + 1)
      hexGroup[i].ma_3d_total = _.meanBy(window, 'total_rewards')
      hexGroup[i].ma_3d_poc = _.meanBy(window, 'poc_rewards')
    }
  }

  const targetDensity = 1
  dailyAgg.forEach((agg) => {
    agg.transmit_scale_approx =
      agg.hotspot_count > 0 ? Math.min(1, targetDensity / agg.hotspot_count) : 0
  })

  // ✅ FIXED: Pass the raw arrays directly to makeTable to resolve type errors
  const table = makeTable({
    hex: dailyAgg.map((d) => d.hex),
    date: dailyAgg.map((d) => new Date(d.date)),
    beacon: dailyAgg.map((d) => d.beacon),
    witness: dailyAgg.map((d) => d.witness),
    dc_transfer: dailyAgg.map((d) => d.dc_transfer),
    total_rewards: dailyAgg.map((d) => d.total_rewards),
    poc_rewards: dailyAgg.map((d) => d.poc_rewards),
    hotspot_count: dailyAgg.map((d) => d.hotspot_count),
    density_k1: dailyAgg.map((d) => d.density_k1),
    ma_3d_total: dailyAgg.map((d) => d.ma_3d_total),
    ma_3d_poc: dailyAgg.map((d) => d.ma_3d_poc),
    transmit_scale_approx: dailyAgg.map((d) => d.transmit_scale_approx),
  })

  const buffer = tableToIPC(table)
  fs.writeFileSync(OUTPUT_ARROW_FILE, buffer)
  console.log('Processed data saved to Arrow file:', OUTPUT_ARROW_FILE)

  await fsExtra.writeJson(
    OUTPUT_ARROW_FILE.replace('.arrow', '.json'),
    dailyAgg,
    {spaces: 2},
  )
}

processRewards().catch(console.error)
