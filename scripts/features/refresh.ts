import fs from 'node:fs'
import path from 'node:path'
import {tableFromJSON, tableToIPC} from 'apache-arrow'

/**
 * CLI
 *   npx tsx scripts/features/refresh.ts --network mobile --days 90
 *   npx tsx scripts/features/refresh.ts --network iot --days 90
 */

type Network = 'mobile' | 'iot'

export type DailyRow = {
  date: string
  hotspot: string
  reward_type: string
  total_bones?: number
  lat?: number
  lon?: number

  // MOBILE-style columns (used by /api/mobile/daily)
  coverage?: number
  data?: number
  speedtest?: number

  // IoT-style columns (used by /api/iot/daily)
  beacon?: number
  witness?: number
  dc?: number
}

/* --------------------------- args & helpers --------------------------- */

function parseArgs() {
  const args = new Map<string, string>()
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i]
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=')
      if (v !== undefined) args.set(k, v)
      else if (
        i + 1 < process.argv.length &&
        !process.argv[i + 1].startsWith('--')
      ) {
        args.set(k, process.argv[++i])
      } else {
        args.set(k, 'true')
      }
    }
  }
  return args
}

function safeNum(x: any): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}
function yyyymmdd(s: any): string {
  return String(s ?? '').slice(0, 10)
}
function warn(msg: string) {
  console.warn(`[features:refresh] ${msg}`)
}
function safePreview(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2).slice(0, 400)
  } catch {
    return String(obj)
  }
}

/* --------------------------- Normalizers --------------------------- */

/** MOBILE: writes coverage/data/speedtest/total_bones (for /api/mobile/daily) */
function normalizeMobile(r: any): DailyRow | null {
  const d = yyyymmdd(r.end_period ?? r.endTimestamp ?? r.date ?? '')
  const k =
    r.reward_detail?.hotspot_key ??
    r.hotspot_key ??
    r.hotspot ??
    r.gateway ??
    ''

  if (!d || !k) {
    warn(`Mobile row missing date or hotspot (row=${safePreview(r)})`)
    return null
  }

  const rd = r.reward_detail ?? {}

  const coverage = safeNum(
    rd.modeled_coverage_amount ??
      r.modeled_coverage_amount ??
      rd.base_poc_reward ??
      r.base_poc_reward ??
      rd.coverage_amount ??
      r.coverage_amount ??
      0,
  )

  const data = safeNum(
    rd.data_transfer_amount ??
      r.data_transfer_amount ??
      rd.dc_transfer_reward ??
      r.dc_transfer_reward ??
      0,
  )

  const speedtest = safeNum(rd.speedtest_amount ?? r.speedtest_amount ?? 0)

  const total =
    safeNum(
      rd.total_amount ??
        r.total_amount ??
        rd.amount ??
        r.amount ??
        coverage + data + speedtest,
    ) || 0

  return {
    date: d,
    hotspot: String(k),
    reward_type: String(r.reward_type ?? 'mobile_reward'),

    // mobile columns
    coverage,
    data,
    speedtest,

    total_bones: total,
    lat: typeof rd.lat === 'number' ? (rd.lat as number) : undefined,
    lon: typeof rd.lon === 'number' ? (rd.lon as number) : undefined,
  }
}

/** IoT: writes beacon/witness/dc/total_bones (for /api/iot/daily) */
function normalizeIot(r: any): DailyRow | null {
  const d = yyyymmdd(r.end_period ?? r.endTimestamp ?? r.date ?? '')
  const k =
    r.reward_detail?.hotspot_key ??
    r.hotspot_key ??
    r.hotspot ??
    r.gateway ??
    ''

  if (!d || !k) {
    warn(`IoT row missing date or hotspot (row=${safePreview(r)})`)
    return null
  }

  const rd = r.reward_detail ?? {}

  const beacon = safeNum(rd.beacon_amount ?? r.beacon_amount ?? 0)
  const witness = safeNum(rd.witness_amount ?? r.witness_amount ?? 0)

  // Some feeds put DC in `amount` with a specific reward_type; default 0 otherwise.
  const maybeAmount = safeNum(rd.amount ?? r.amount ?? 0)
  const dc =
    String(r.reward_type ?? '').includes('dc') ||
    String(r.reward_type ?? '') === 'dc_transfer_reward'
      ? maybeAmount
      : 0

  const total =
    safeNum(rd.total_amount ?? r.total_amount ?? beacon + witness + dc) || 0

  return {
    date: d,
    hotspot: String(k),
    reward_type: String(r.reward_type ?? 'gateway_reward'),

    // iot columns
    beacon,
    witness,
    dc,

    total_bones: total,
    lat: typeof rd.lat === 'number' ? (rd.lat as number) : undefined,
    lon: typeof rd.lon === 'number' ? (rd.lon as number) : undefined,
  }
}

/* --------------------------- Rollup & Arrow --------------------------- */

function rollupDaily(rows: DailyRow[]): DailyRow[] {
  const key = (x: DailyRow) => `${x.date}__${x.hotspot}`
  const map = new Map<string, DailyRow>()

  for (const r of rows) {
    if (!r.date || !r.hotspot) continue
    const k = key(r)
    const agg =
      map.get(k) ??
      ({
        date: r.date,
        hotspot: r.hotspot,
        reward_type: r.reward_type,
        coverage: 0,
        data: 0,
        speedtest: 0,
        beacon: 0,
        witness: 0,
        dc: 0,
        total_bones: 0,
        lat: r.lat,
        lon: r.lon,
      } as DailyRow)

    agg.coverage = (agg.coverage ?? 0) + (r.coverage ?? 0)
    agg.data = (agg.data ?? 0) + (r.data ?? 0)
    agg.speedtest = (agg.speedtest ?? 0) + (r.speedtest ?? 0)

    agg.beacon = (agg.beacon ?? 0) + (r.beacon ?? 0)
    agg.witness = (agg.witness ?? 0) + (r.witness ?? 0)
    agg.dc = (agg.dc ?? 0) + (r.dc ?? 0)

    agg.total_bones = (agg.total_bones ?? 0) + (r.total_bones ?? 0)

    if (agg.lat == null && r.lat != null) agg.lat = r.lat
    if (agg.lon == null && r.lon != null) agg.lon = r.lon

    map.set(k, agg)
  }

  return [...map.values()].sort((a, b) =>
    a.date === b.date
      ? a.hotspot.localeCompare(b.hotspot)
      : a.date.localeCompare(b.date),
  )
}

function toArrowBuffer(rows: DailyRow[]): Uint8Array {
  // Union schema is fine — tableFromJSON will include all keys present in rows.
  const table = tableFromJSON(rows)
  return tableToIPC(table)
}

/* --------------------------- IO helpers --------------------------- */

function readJsonArray(file: string): any[] {
  try {
    const txt = fs.readFileSync(file, 'utf-8')
    const parsed = JSON.parse(txt)
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray((parsed as any).records))
      return (parsed as any).records
    if (parsed && Array.isArray((parsed as any).rows))
      return (parsed as any).rows
    return []
  } catch (e) {
    warn(`Failed to parse ${file}: ${(e as Error).message}`)
    return []
  }
}

function listRawFiles(rawDir: string): string[] {
  if (!fs.existsSync(rawDir)) return []
  return fs
    .readdirSync(rawDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(rawDir, f))
}

/* --------------------------- Main --------------------------- */

async function main() {
  const args = parseArgs()
  const network = (args.get('network') ?? 'mobile') as Network
  const days = Number(args.get('days') ?? 90)

  const rawDir = path.resolve('data', 'raw', network)
  const outDir = path.resolve('data', 'features', network)
  const outFile = path.join(outDir, 'latest.arrow')

  const files = listRawFiles(rawDir)
  if (!files.length) {
    warn(`Raw dir not found or empty: ${rawDir}`)
    fs.mkdirSync(outDir, {recursive: true})
    fs.writeFileSync(outFile, toArrowBuffer([]))
    console.log(
      `[features:refresh] No rows found in raw JSON. Proceeding with empty dataset.\nBuilt ${outFile} — rows=0, range=-..- (network=${network}, days=${days})`,
    )
    return
  }

  const rows: DailyRow[] = []
  let mobHasBasePoc = 0,
    mobHasDcTransfer = 0,
    mobHasAmount = 0

  for (const file of files) {
    const arr = readJsonArray(file)
    for (const r of arr) {
      const n = network === 'mobile' ? normalizeMobile(r) : normalizeIot(r)
      if (n) {
        rows.push(n)
        if (network === 'mobile') {
          const rd = r.reward_detail ?? {}
          if (rd.base_poc_reward != null || rd.modeled_coverage_amount != null)
            mobHasBasePoc++
          if (rd.dc_transfer_reward != null || rd.data_transfer_amount != null)
            mobHasDcTransfer++
          if (rd.amount != null || rd.total_amount != null) mobHasAmount++
        }
      }
    }
  }

  // optional days filter
  let filtered = rows
  if (days && Number.isFinite(days)) {
    const minDate = new Date(Date.now() - days * 86400000)
      .toISOString()
      .slice(0, 10)
    filtered = rows.filter((r) => r.date >= minDate)
  }

  // roll up & write
  const rolled = rollupDaily(filtered)
  fs.mkdirSync(outDir, {recursive: true})
  fs.writeFileSync(outFile, toArrowBuffer(rolled))

  const range =
    rolled.length > 0
      ? `${rolled[0].date}..${rolled[rolled.length - 1].date}`
      : '-..-'

  console.log(
    `Built ${outFile} — rows=${rolled.length}, range=${range} (network=${network}, days=${days})`,
  )
  if (network === 'mobile') {
    console.log(
      `[features:refresh] MOBILE key presence: base_poc/modeled=${mobHasBasePoc}, dc_transfer/data_transfer=${mobHasDcTransfer}, amount/total_amount=${mobHasAmount}`,
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
