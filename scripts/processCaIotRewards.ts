// scripts/processCaIotRewards.ts
import fs from 'fs'
import path from 'path'
import * as h3 from 'h3-js'
import _ from 'lodash'
import {
  makeTable,
  vectorFromArray,
  Float,
  Utf8,
  Date_ as ArrowDate,
  DateUnit,
  Precision,
  tableToIPC,
} from 'apache-arrow'
import fsExtra from 'fs-extra'
import readline from 'readline'

// ---------- CLI (optional) ----------
const argMap = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.split('=')
  if (k && v) acc[k.replace(/^--/, '')] = v
  return acc
}, {} as Record<string, string>)

// ---------- Paths (defaults; overridable via CLI) ----------
const HOTSPOTS_FILE = path.resolve(
  argMap.hotspots ||
    path.join(__dirname, '../data/lookup/ca_iot_hotspots.json'),
)
const HOTSPOTS_WITH_HEX_FILE = path.resolve(
  argMap.hotspotsHex ||
    path.join(__dirname, '../data/lookup/ca_iot_hotspots_with_hex.json'),
)
const REWARDS_FILE = path.resolve(
  argMap.rewards ||
    path.join(
      __dirname,
      '../data/raw/iot/iot_ca_hotspots_2025-07-01_2025-08-12.jsonl',
    ),
)
const OUTPUT_ARROW_FILE = path.resolve(
  argMap.arrow ||
    path.join(__dirname, '../data/features/iot/ca_iot_daily.arrow'),
)
const OUTPUT_JSON_FILE = path.resolve(
  argMap.json || OUTPUT_ARROW_FILE.replace(/\.arrow$/, '.json'),
)

// ---------- Types ----------
interface Hotspot {
  lat: number
  lon: number
  hex?: string
}
interface RewardDetail {
  formatted_beacon_amount?: string
  formatted_witness_amount?: string
  formatted_dc_transfer_amount?: string
  beacon_amount?: number
  witness_amount?: number
  dc_transfer_amount?: number
  hotspot_key?: string
}
interface Reward {
  hotspot_key?: string
  start_period?: string
  end_period?: string
  reward_detail?: RewardDetail
  reward_manifest?: {
    end_timestamp?: string
    start_timestamp?: string
  }
}

// ---------- Utils ----------
function toIsoDayUTC(s: string | undefined | null): string | null {
  if (!s) return null
  // inputs look like "2025-07-01 00:00:00 UTC"
  const cleaned = s.replace(' UTC', '').replace(' ', 'T') + 'Z'
  const day = cleaned.slice(0, 10) // safe: "YYYY-MM-DD"
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null
}

function bestRewardDay(r: Reward): string | null {
  return (
    toIsoDayUTC(r.reward_manifest?.end_timestamp) ||
    toIsoDayUTC(r.end_period) ||
    toIsoDayUTC(r.start_period) ||
    null
  )
}

function safeNum(x: any, fallback = 0): number {
  const n = typeof x === 'string' ? parseFloat(x) : Number(x)
  return Number.isFinite(n) ? n : fallback
}

// ---------- Build hotspot -> hex (and cache with hex) ----------
async function addHexToHotspots(): Promise<Record<string, Hotspot>> {
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

// ---------- Stream rewards ----------
async function loadRewardsStream(file: string): Promise<Reward[]> {
  console.log('Streaming and loading rewards from:', file)
  const rewards: Reward[] = []
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line) continue
    try {
      rewards.push(JSON.parse(line))
    } catch {
      // skip corrupt line
    }
  }
  console.log(
    `Stream-loaded ${rewards.length.toLocaleString()} reward records.`,
  )
  return rewards
}

// ---------- Main ----------
async function processRewards() {
  // hotspots + hex cache
  let hotspots = await fsExtra
    .readJson(HOTSPOTS_WITH_HEX_FILE)
    .catch(() => null)
  if (!hotspots) {
    hotspots = await addHexToHotspots()
  }
  const hotspotToHex: Record<string, string> = Object.fromEntries(
    Object.entries(hotspots as Record<string, Hotspot>).map(([key, value]) => [
      key,
      value.hex as string,
    ]),
  )

  const rewards = await loadRewardsStream(REWARDS_FILE)

  let unknownHex = 0
  const parsed = rewards
    .map((r) => {
      const key = r.reward_detail?.hotspot_key || r.hotspot_key || null
      if (!key) return null

      const day = bestRewardDay(r)
      if (!day) return null

      const hx = hotspotToHex[key]
      if (!hx) {
        unknownHex++
        return null
      }

      const rd = r.reward_detail || {}
      let beacon = safeNum(rd.formatted_beacon_amount, NaN)
      let witness = safeNum(rd.formatted_witness_amount, NaN)
      let dc = safeNum(rd.formatted_dc_transfer_amount, NaN)

      // if formatted missing, fall back to bones
      if (
        !Number.isFinite(beacon) ||
        !Number.isFinite(witness) ||
        !Number.isFinite(dc)
      ) {
        const scale = 1e8
        beacon = Number.isFinite(beacon)
          ? beacon
          : safeNum(rd.beacon_amount, 0) / scale
        witness = Number.isFinite(witness)
          ? witness
          : safeNum(rd.witness_amount, 0) / scale
        dc = Number.isFinite(dc)
          ? dc
          : safeNum(rd.dc_transfer_amount, 0) / scale
      }

      const poc = beacon + witness
      const total = poc + dc

      return {
        hex: hx,
        date: day, // <-- aligned to end_timestamp (then end_period), else start_period
        beacon,
        witness,
        dc_transfer: dc,
        poc_rewards: poc,
        total_rewards: total,
      }
    })
    .filter(Boolean) as Array<{
    hex: string
    date: string
    beacon: number
    witness: number
    dc_transfer: number
    poc_rewards: number
    total_rewards: number
  }>

  // Group to daily per-hex
  const grouped = _.groupBy(parsed, (r) => `${r.hex}|${r.date}`)
  const dailyAgg: any[] = Object.values(grouped).map((g) => {
    const first = g[0]!
    const beacon = _.sumBy(g, 'beacon')
    const witness = _.sumBy(g, 'witness')
    const dc_transfer = _.sumBy(g, 'dc_transfer')
    const poc_rewards = beacon + witness
    const total_rewards = poc_rewards + dc_transfer
    return {
      hex: first.hex,
      date: first.date,
      beacon,
      witness,
      dc_transfer,
      poc_rewards,
      total_rewards,
    }
  })

  // hotspot_count per hex (from lookup)
  const hexCounts = _.countBy(
    Object.values(hotspots as Record<string, Hotspot>).map((h: any) => h.hex),
  )
  dailyAgg.forEach((row) => {
    row.hotspot_count = hexCounts[row.hex] || 0
  })

  // density k=1 (neighbors)
  dailyAgg.forEach((row) => {
    const neighbors = h3.gridDisk(row.hex, 1)
    row.density_k1 = neighbors.reduce(
      (sum: number, n: string) => sum + (hexCounts[n] || 0),
      0,
    )
  })

  // sort + moving averages
  const sortedAgg = _.sortBy(dailyAgg, ['hex', 'date'])
  const groupedByHex = _.groupBy(sortedAgg, 'hex')
  for (const hexGroup of Object.values(groupedByHex)) {
    for (let i = 0; i < hexGroup.length; i++) {
      const window = hexGroup.slice(Math.max(0, i - 2), i + 1)
      hexGroup[i].ma_3d_total = _.meanBy(window, 'total_rewards')
      hexGroup[i].ma_3d_poc = _.meanBy(window, 'poc_rewards')
    }
  }

  // rough transmit scale proxy (density cap at 1)
  const targetDensity = 1
  dailyAgg.forEach((row) => {
    row.transmit_scale_approx =
      row.hotspot_count > 0 ? Math.min(1, targetDensity / row.hotspot_count) : 0
  })

  // Coverage logs
  const days = Array.from(new Set(dailyAgg.map((d) => d.date))).sort()
  const minDay = days[0],
    maxDay = days[days.length - 1]
  const hexCount = new Set(dailyAgg.map((d) => d.hex)).size
  console.log(
    `\nDaily rows: ${dailyAgg.length.toLocaleString()} • Hexes: ${hexCount.toLocaleString()}`,
  )
  console.log(`Date span: ${minDay} → ${maxDay}`)
  if (unknownHex > 0) {
    console.warn(
      `Skipped rewards with unknown hotspot hex: ${unknownHex.toLocaleString()}`,
    )
  }

  // ---------- Arrow ----------
  // @ts-ignore – Arrow's TS types can be fussy; this is the working pattern
  const table = makeTable({
    hex: vectorFromArray(
      dailyAgg.map((d) => d.hex),
      new Utf8(),
    ),
    date: vectorFromArray(
      dailyAgg.map((d) => new Date(d.date)),
      new ArrowDate(DateUnit.DAY),
    ),
    beacon: vectorFromArray(
      dailyAgg.map((d) => d.beacon),
      new Float(Precision.DOUBLE),
    ),
    witness: vectorFromArray(
      dailyAgg.map((d) => d.witness),
      new Float(Precision.DOUBLE),
    ),
    dc_transfer: vectorFromArray(
      dailyAgg.map((d) => d.dc_transfer),
      new Float(Precision.DOUBLE),
    ),
    total_rewards: vectorFromArray(
      dailyAgg.map((d) => d.total_rewards),
      new Float(Precision.DOUBLE),
    ),
    poc_rewards: vectorFromArray(
      dailyAgg.map((d) => d.poc_rewards),
      new Float(Precision.DOUBLE),
    ),
    hotspot_count: vectorFromArray(
      dailyAgg.map((d) => d.hotspot_count),
      new Float(Precision.DOUBLE),
    ),
    density_k1: vectorFromArray(
      dailyAgg.map((d) => d.density_k1),
      new Float(Precision.DOUBLE),
    ),
    ma_3d_total: vectorFromArray(
      dailyAgg.map((d) => d.ma_3d_total),
      new Float(Precision.DOUBLE),
    ),
    ma_3d_poc: vectorFromArray(
      dailyAgg.map((d) => d.ma_3d_poc),
      new Float(Precision.DOUBLE),
    ),
    transmit_scale_approx: vectorFromArray(
      dailyAgg.map((d) => d.transmit_scale_approx),
      new Float(Precision.DOUBLE),
    ),
  })

  const buf = tableToIPC(table)
  await fsExtra.ensureDir(path.dirname(OUTPUT_ARROW_FILE))
  fs.writeFileSync(OUTPUT_ARROW_FILE, buf)
  console.log('Processed data saved to Arrow file:', OUTPUT_ARROW_FILE)

  // ---------- JSON (for Colab) ----------
  await fsExtra.writeJson(OUTPUT_JSON_FILE, dailyAgg, {spaces: 2})
  console.log('Also wrote JSON:', OUTPUT_JSON_FILE)
}

processRewards().catch((e) => {
  console.error(e)
  process.exit(1)
})
