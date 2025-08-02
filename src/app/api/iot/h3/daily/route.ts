import {NextRequest, NextResponse} from 'next/server'
import {tableFromIPC} from 'apache-arrow'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_ARROW_PATH =
  process.env.IOT_ARROW_FILE ?? 'data/features/iot/ca_iot_daily.arrow'

type Row = {
  hex?: string
  date?: string
  beacon?: number
  witness?: number
  dc_transfer?: number
  total_rewards?: number
  poc_rewards?: number
  hotspot_count?: number
  density_k1?: number
  ma_3d_total?: number
  ma_3d_poc?: number
  transmit_scale_approx?: number
}

function asString(v: unknown): string | undefined {
  return v == null ? undefined : String(v)
}

function asNumber(v: unknown): number | undefined {
  if (v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const hex = url.searchParams.get('hex') ?? undefined
    const from = url.searchParams.get('from') ?? undefined // YYYY-MM-DD
    const to = url.searchParams.get('to') ?? undefined // YYYY-MM-DD
    const limit = Number(url.searchParams.get('limit') ?? '5000')
    const file = url.searchParams.get('file') ?? DEFAULT_ARROW_PATH
    const absolute = path.resolve(file)
    if (!fs.existsSync(absolute)) {
      return NextResponse.json(
        {ok: false, error: `Arrow file not found: ${absolute}`},
        {status: 404},
      )
    }

    const buf = fs.readFileSync(absolute)
    const table = tableFromIPC(buf)

    const fields = table.schema.fields
    const colIndex = (n: string) => fields.findIndex((f) => f.name === n)
    const idx = {
      hex: colIndex('hex'),
      date: colIndex('date'),
      beacon: colIndex('beacon'),
      witness: colIndex('witness'),
      dc_transfer: colIndex('dc_transfer'),
      total_rewards: colIndex('total_rewards'),
      poc_rewards: colIndex('poc_rewards'),
      hotspot_count: colIndex('hotspot_count'),
      density_k1: colIndex('density_k1'),
      ma_3d_total: colIndex('ma_3d_total'),
      ma_3d_poc: colIndex('ma_3d_poc'),
      transmit_scale_approx: colIndex('transmit_scale_approx'),
    }

    const get = (i: number, c: number) => table.getChildAt(c)?.get(i)

    const rows: Row[] = []
    const pushRow = (i: number) => {
      const r: Row = {
        hex: asString(idx.hex >= 0 ? get(i, idx.hex) : undefined),
        date: asString(idx.date >= 0 ? get(i, idx.date) : undefined),
        beacon: asNumber(idx.beacon >= 0 ? get(i, idx.beacon) : undefined),
        witness: asNumber(idx.witness >= 0 ? get(i, idx.witness) : undefined),
        dc_transfer: asNumber(
          idx.dc_transfer >= 0 ? get(i, idx.dc_transfer) : undefined,
        ),
        total_rewards: asNumber(
          idx.total_rewards >= 0 ? get(i, idx.total_rewards) : undefined,
        ),
        poc_rewards: asNumber(
          idx.poc_rewards >= 0 ? get(i, idx.poc_rewards) : undefined,
        ),
        hotspot_count: asNumber(
          idx.hotspot_count >= 0 ? get(i, idx.hotspot_count) : undefined,
        ),
        density_k1: asNumber(
          idx.density_k1 >= 0 ? get(i, idx.density_k1) : undefined,
        ),
        ma_3d_total: asNumber(
          idx.ma_3d_total >= 0 ? get(i, idx.ma_3d_total) : undefined,
        ),
        ma_3d_poc: asNumber(
          idx.ma_3d_poc >= 0 ? get(i, idx.ma_3d_poc) : undefined,
        ),
        transmit_scale_approx: asNumber(
          idx.transmit_scale_approx >= 0
            ? get(i, idx.transmit_scale_approx)
            : undefined,
        ),
      }
      rows.push(r)
    }

    const inRange = (d?: string) => {
      if (!d) return true
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    }

    for (let i = 0; i < table.numRows && rows.length < limit; i++) {
      const currentHex = asString(idx.hex >= 0 ? get(i, idx.hex) : undefined)
      if (hex && currentHex !== hex) continue

      const d = asString(idx.date >= 0 ? get(i, idx.date) : undefined)
      if (d && !inRange(d)) continue

      pushRow(i)
    }

    const sum = (key: keyof Row) =>
      rows.reduce(
        (s, r) => s + (typeof r[key] === 'number' ? (r[key] as number) : 0),
        0,
      )
    const totals = {
      beacon: sum('beacon'),
      witness: sum('witness'),
      dc_transfer: sum('dc_transfer'),
      total_rewards: sum('total_rewards'),
      poc_rewards: sum('poc_rewards'),
      hotspot_count: sum('hotspot_count'),
      density_k1: sum('density_k1'),
      ma_3d_total: sum('ma_3d_total'),
      ma_3d_poc: sum('ma_3d_poc'),
      rows: rows.length,
    }

    return NextResponse.json({
      ok: true,
      file: absolute,
      filters: {hex, from, to, limit},
      totals,
      rows,
    })
  } catch (e: any) {
    return NextResponse.json(
      {ok: false, error: e?.message ?? 'unknown error'},
      {status: 500},
    )
  }
}
