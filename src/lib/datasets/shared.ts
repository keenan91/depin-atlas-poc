import fs from 'node:fs'
import path from 'node:path'
import {tableFromJSON, tableToIPC, Table} from 'apache-arrow'

/**
 * Unified row shape we persist to Arrow.
 * Columns: date, hotspot, coverage, data, speedtest, total_bones, reward_type
 */
export type DailyRow = {
  date: string
  hotspot: string
  coverage: number
  data: number
  speedtest: number
  total_bones: number
  reward_type: string
}

function warn(msg: string) {
  // minimal; upgrade to structured logging later
  console.warn(`[QA] ${msg}`)
}

function safeNum(x: unknown): number {
  const n = Number(x ?? 0)
  return Number.isFinite(n) ? n : 0
}

function ymdFromEndPeriod(v: unknown): string {
  const s = String(v ?? '')
  // Accept "YYYY-MM-DD 00:00:00 UTC" or "YYYY-MM-DD"
  const ymd = s.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    warn(`Bad date '${s}', using empty string`)
    return ''
  }
  return ymd
}

/* ----------------------------- MOBILE normalize ---------------------------- */

export type RawMobile = {
  end_period?: string
  endTimestamp?: string
  date?: string
  reward_type?: string
  reward_detail?: Record<string, unknown>
  hotspot_key?: string
  hotspot?: string
}

export function normalizeMobile(r: RawMobile): DailyRow {
  const date = ymdFromEndPeriod(r.end_period ?? r.endTimestamp ?? r.date ?? '')

  const hotspot = String(
    r.reward_detail?.['hotspot_key'] ?? r.hotspot_key ?? r.hotspot ?? '',
  )

  // Coverage + Data: handle multiple field spellings seen in Relay dumps
  // coverage: prefer base_poc_reward, fallback to modeled_coverage_amount
  const coverage =
    safeNum(r.reward_detail?.['base_poc_reward']) ||
    safeNum(r.reward_detail?.['modeled_coverage_amount']) ||
    0

  // data: prefer dc_transfer_reward, fallback to data_transfer_amount
  const data =
    safeNum(r.reward_detail?.['dc_transfer_reward']) ||
    safeNum(r.reward_detail?.['data_transfer_amount']) ||
    0

  // MOBILE doesn't use speedtest here (keep 0 for now)
  const speedtest = safeNum(r.reward_detail?.['speedtest_amount']) || 0

  // total: prefer explicit total if present; else sum parts
  const total =
    safeNum(r.reward_detail?.['total_amount']) || coverage + data + speedtest

  if (!date || !hotspot) {
    warn(
      `Mobile row missing date or hotspot (date='${date}', hotspot='${hotspot}')`,
    )
  }
  if (coverage < 0 || data < 0 || speedtest < 0 || total < 0) {
    warn(
      `Mobile row has negative values (hotspot='${hotspot}', date='${date}')`,
    )
  }

  return {
    date,
    hotspot,
    coverage,
    data,
    speedtest,
    total_bones: total,
    reward_type: String(r.reward_type ?? 'gateway_reward'),
  }
}

/* -------------------------------- IoT normalize ---------------------------- */

export type RawIoT = {
  end_period?: string
  endTimestamp?: string
  date?: string
  reward_type?: string
  reward_detail?: Record<string, unknown>
  hotspot_key?: string
  hotspot?: string
}

export function normalizeIoT(r: RawIoT): DailyRow {
  const date = ymdFromEndPeriod(r.end_period ?? r.endTimestamp ?? r.date ?? '')

  const hotspot = String(
    r.reward_detail?.['hotspot_key'] ?? r.hotspot_key ?? r.hotspot ?? '',
  )

  // IoT common amounts: beacon_amount (consider "coverage"), witness_amount (consider "data")
  const beacon = safeNum(r.reward_detail?.['beacon_amount']) || 0
  const witness = safeNum(r.reward_detail?.['witness_amount']) || 0
  const amount = safeNum(r.reward_detail?.['amount']) || 0

  const coverage = beacon
  const data = witness
  const speedtest = 0
  const total = amount || coverage + data + speedtest

  if (!date || !hotspot) {
    warn(
      `IoT row missing date or hotspot (date='${date}', hotspot='${hotspot}')`,
    )
  }
  if (coverage < 0 || data < 0 || total < 0) {
    warn(`IoT row has negative values (hotspot='${hotspot}', date='${date}')`)
  }

  return {
    date,
    hotspot,
    coverage,
    data,
    speedtest,
    total_bones: total,
    reward_type: String(r.reward_type ?? 'gateway_reward'),
  }
}

/* ------------------------------ Aggregation utils -------------------------- */

export function rollupDaily(rows: DailyRow[]): DailyRow[] {
  const key = (x: DailyRow) => `${x.date}__${x.hotspot}`
  const map = new Map<string, DailyRow>()

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
    }
    agg.coverage += r.coverage
    agg.data += r.data
    agg.speedtest += r.speedtest
    agg.total_bones += r.total_bones
    map.set(k, agg)
  }

  return [...map.values()].sort((a, b) =>
    a.date === b.date
      ? a.hotspot.localeCompare(b.hotspot)
      : a.date.localeCompare(b.date),
  )
}

/* --------------------------------- Arrow I/O -------------------------------- */

export function toArrowBuffer(rows: DailyRow[]): Uint8Array {
  // NOTE: Do NOT pass a second arg to tableFromJSON to avoid TS2554 in apache-arrow types.
  const table: Table = tableFromJSON(rows)
  return tableToIPC(table)
}

export function writeArrow(filePath: string, rows: DailyRow[]) {
  const abs = path.resolve(filePath)
  fs.mkdirSync(path.dirname(abs), {recursive: true})
  fs.writeFileSync(abs, toArrowBuffer(rows))
}

export function fileLastUpdated(filePath: string): string | null {
  try {
    const st = fs.statSync(path.resolve(filePath))
    return st.mtime.toISOString()
  } catch {
    return null
  }
}
