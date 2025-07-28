import {NextRequest, NextResponse} from 'next/server'
import {tableFromIPC} from 'apache-arrow'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_ARROW_PATH =
  process.env.IOT_ARROW_FILE ?? 'data/features/iot/latest.arrow'

type Row = {
  date?: string
  date_start?: string
  date_end?: string
  hotspot?: string
  hotspot_key?: string
  reward_type?: string
  beacon?: number
  witness?: number
  dc?: number
  total_bones?: number
}

function asString(v: unknown) {
  return v == null ? undefined : String(v)
}

function asNumber(v: unknown) {
  if (v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const hotspot =
      url.searchParams.get('hotspot') ??
      url.searchParams.get('hotspot_key') ??
      undefined
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
      date: colIndex('date'),
      date_start: colIndex('date_start'),
      date_end: colIndex('date_end'),
      hotspot:
        colIndex('hotspot') >= 0
          ? colIndex('hotspot')
          : colIndex('hotspot_key'),
      reward_type: colIndex('reward_type'),
      beacon: colIndex('beacon'),
      witness: colIndex('witness'),
      dc: colIndex('dc'),
      total_bones: colIndex('total_bones'),
    }

    const get = (i: number, c: number) => table.getChildAt(c)?.get(i)

    const rows: Row[] = []
    const pushRow = (i: number) => {
      const r: Row = {
        date: asString(idx.date >= 0 ? get(i, idx.date) : undefined),
        date_start: asString(
          idx.date_start >= 0 ? get(i, idx.date_start) : undefined,
        ),
        date_end: asString(
          idx.date_end >= 0 ? get(i, idx.date_end) : undefined,
        ),
        hotspot: asString(idx.hotspot >= 0 ? get(i, idx.hotspot) : undefined),
        reward_type: asString(
          idx.reward_type >= 0 ? get(i, idx.reward_type) : undefined,
        ),
        beacon: asNumber(idx.beacon >= 0 ? get(i, idx.beacon) : undefined),
        witness: asNumber(idx.witness >= 0 ? get(i, idx.witness) : undefined),
        dc: asNumber(idx.dc >= 0 ? get(i, idx.dc) : undefined),
        total_bones: asNumber(
          idx.total_bones >= 0 ? get(i, idx.total_bones) : undefined,
        ),
      }
      rows.push(r)
    }

    // Filter helpers
    const inRange = (d?: string) => {
      if (!d) return true
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    }

    // Iterate & filter
    for (let i = 0; i < table.numRows && rows.length < limit; i++) {
      const hs = asString(idx.hotspot >= 0 ? get(i, idx.hotspot) : undefined)
      if (hotspot && hs !== hotspot) continue

      // prefer single 'date', else fall back to date_start/date_end overlap check
      const d = asString(idx.date >= 0 ? get(i, idx.date) : undefined)
      if (d) {
        if (!inRange(d)) continue
      } else {
        const ds = asString(
          idx.date_start >= 0 ? get(i, idx.date_start) : undefined,
        )
        const de = asString(
          idx.date_end >= 0 ? get(i, idx.date_end) : undefined,
        )
        const qFrom = from ?? '0000-00-00'
        const qTo = to ?? '9999-12-31'
        const rowFrom = ds ?? de ?? '0000-00-00'
        const rowTo = de ?? ds ?? '9999-12-31'
        const intersects = !(rowTo < qFrom || rowFrom > qTo)
        if (!intersects) continue
      }

      pushRow(i)
    }

    // Simple aggregates
    const sum = (key: keyof Row) =>
      rows.reduce(
        (s, r) => s + (typeof r[key] === 'number' ? (r[key] as number) : 0),
        0,
      )
    const totals = {
      beacon: sum('beacon'),
      witness: sum('witness'),
      dc: sum('dc'),
      total_bones: sum('total_bones'),
      rows: rows.length,
    }

    return NextResponse.json({
      ok: true,
      file: absolute,
      filters: {hotspot, from, to, limit},
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
