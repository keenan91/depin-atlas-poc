import fs from 'node:fs'
import path from 'node:path'
import {tableFromJSON, tableToIPC} from 'apache-arrow'

// Normalize raw MOBILE reward rows to daily aggregates:
// columns: date, hotspot, coverage, data, speedtest, total_bones, reward_type, lat?, lon?
type Raw = any

function ymdFromEndPeriod(s: string): string {
  const m = String(s ?? '').match(/\d{4}-\d{2}-\d{2}/)
  return m ? m[0] : ''
}

function safeNum(x: unknown): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}

function normalize(r: Raw) {
  const d =
    ymdFromEndPeriod(r.end_period) ||
    ymdFromEndPeriod(r.endTimestamp) ||
    ymdFromEndPeriod(r.date)

  const k =
    r.reward_detail?.hotspot_key ??
    r.hotspot_key ??
    r.hotspot ??
    r.gateway ??
    ''

  const coverage =
    safeNum(
      r.reward_detail?.modeled_coverage_amount ?? r.modeled_coverage_amount,
    ) || 0
  const data = safeNum(
    r.reward_detail?.data_transfer_amount ?? r.data_transfer_amount,
  )
  const speedtest =
    safeNum(r.reward_detail?.speedtest_amount ?? r.speedtest_amount) || 0
  const total =
    safeNum(
      r.reward_detail?.total_amount ??
        r.total_amount ??
        coverage + data + speedtest,
    ) || 0

  const lat = Number.isFinite(Number(r.reward_detail?.lat))
    ? Number(r.reward_detail.lat)
    : Number.isFinite(Number(r.lat))
    ? Number(r.lat)
    : undefined
  const lon = Number.isFinite(Number(r.reward_detail?.lon))
    ? Number(r.reward_detail.lon)
    : Number.isFinite(Number(r.lon))
    ? Number(r.lon)
    : undefined

  return {
    date: d,
    hotspot: String(k),
    coverage,
    data,
    speedtest,
    total_bones: total,
    reward_type: String(r.reward_type ?? 'mobile_reward'),
    lat,
    lon,
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
      reward_type: r.reward_type,
      lat: r.lat,
      lon: r.lon,
    }
    agg.coverage += r.coverage
    agg.data += r.data
    agg.speedtest += r.speedtest
    agg.total_bones += r.total_bones
    if (agg.lat === undefined && r.lat !== undefined) agg.lat = r.lat
    if (agg.lon === undefined && r.lon !== undefined) agg.lon = r.lon
    map.set(k, agg)
  }
  // stable order by date asc
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
