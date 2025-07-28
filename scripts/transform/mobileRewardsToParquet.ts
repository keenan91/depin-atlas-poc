import fs from 'node:fs'
import path from 'node:path'
import {tableFromJSON, tableToIPC} from 'apache-arrow'

// Normalize raw MOBILE reward rows to daily aggregates:
// columns: date, hotspot, coverage, data, speedtest, total_bones, reward_type
type Raw = any

function num(...vals: any[]): number {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
  }
  return 0
}

function normalize(r: Raw) {
  const d = String(r.end_period ?? r.endTimestamp ?? r.date ?? '').slice(0, 10)

  const k =
    r.reward_detail?.hotspot_key ??
    r.hotspot_key ??
    r.hotspot ??
    r.gateway ??
    ''

  const rt = String(r.reward_type ?? '')

  const coverage = num(
    r.reward_detail?.base_poc_reward,
    r.base_poc_reward,
    r.reward_detail?.modeled_coverage_amount, // fallback for other shapes
  )

  const data = num(
    r.reward_detail?.dc_transfer_reward,
    r.dc_transfer_reward,
    r.reward_detail?.data_transfer_amount, // fallback for other shapes
  )

  const speedtest = num(r.reward_detail?.speedtest_amount, r.speedtest_amount)

  const total = num(
    r.reward_detail?.total_amount,
    r.total_amount,
    coverage + data + speedtest,
  )

  return {
    date: d,
    hotspot: String(k),
    coverage,
    data,
    speedtest,
    total_bones: total,
    reward_type: rt || 'mobile',
  }
}

function rollupDaily(rows: ReturnType<typeof normalize>[]) {
  // group by (date, hotspot)
  const key = (x: any) => `${x.date}__${x.hotspot}`
  const map = new Map<string, any>()
  for (const r of rows) {
    if (!r.date || !r.hotspot) continue
    const k = key(r)
    const agg = map.get(k) ?? {
      date: r.date,
      hotspot: r.hotspot,
      coverage: 0,
      data: 0,
      speedtest: 0,
      total_bones: 0,
      reward_type: 'mobile',
    }
    agg.coverage += r.coverage
    agg.data += r.data
    agg.speedtest += r.speedtest
    agg.total_bones += r.total_bones
    map.set(k, agg)
  }
  // stable order by date asc, then hotspot
  return [...map.values()].sort((a, b) =>
    a.date === b.date
      ? a.hotspot.localeCompare(b.hotspot)
      : a.date.localeCompare(b.date),
  )
}

function toArrow(rows: any[]) {
  const table = tableFromJSON(rows)
  return tableToIPC(table)
}

async function main() {
  const inFile = process.argv[2] ?? 'data/raw/mobile_YYYY-MM-DD_YYYY-MM-DD.json'
  const outFile = process.argv[3] ?? 'data/features/mobile_daily_sample.arrow'

  const raw = JSON.parse(
    fs.readFileSync(path.resolve(inFile), 'utf-8'),
  ) as Raw[]
  const normalized = raw.map(normalize)
  const rolled = rollupDaily(normalized)

  fs.mkdirSync(path.dirname(path.resolve(outFile)), {recursive: true})
  fs.writeFileSync(path.resolve(outFile), toArrow(rolled))
  console.log(
    `Wrote ${rolled.length} rows → ${path.resolve(outFile)} (from ${
      normalized.length
    } raw)`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
