import {NextRequest, NextResponse} from 'next/server'
import path from 'node:path'
import fs from 'node:fs'
import {tableFromIPC} from 'apache-arrow'
import {cellToLatLng as h3ToLatLng} from 'h3-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Base directory containing r{RES}/latest.arrow
const BASE_DIR =
  process.env.IOT_H3_DIR ?? path.resolve('data', 'features', 'iot', 'h3')

type H3Row = {
  date?: string
  hex?: string
  res?: number
  beacon?: number
  witness?: number
  coverage?: number
  data?: number
  total_bones?: number
  hotspot_count?: number
}

function asNum(v: unknown): number | undefined {
  if (v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
function asStr(v: unknown): string | undefined {
  return v == null ? undefined : String(v)
}

function parseBBox(s?: string) {
  if (!s) return null
  const parts = s.split(',').map((x) => Number(x.trim()))
  if (parts.length !== 4 || parts.some((x) => !Number.isFinite(x))) return null
  const [minLon, minLat, maxLon, maxLat] = parts
  return {minLon, minLat, maxLon, maxLat}
}
function inBBox(lon: number, lat: number, bbox: ReturnType<typeof parseBBox>) {
  if (!bbox) return true
  return (
    lon >= bbox.minLon &&
    lon <= bbox.maxLon &&
    lat >= bbox.minLat &&
    lat <= bbox.maxLat
  )
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)

    const res = Number(url.searchParams.get('res') ?? 9)
    const from = url.searchParams.get('from') ?? undefined
    const to = url.searchParams.get('to') ?? undefined
    const hexFilter = url.searchParams.get('hex') // comma separated list
    const bbox = parseBBox(url.searchParams.get('bbox') ?? undefined)
    const field = (url.searchParams.get('field') ?? 'witness') as
      | 'beacon'
      | 'witness'
      | 'data'
      | 'coverage'
      | 'total_bones'
    const limit = Number(url.searchParams.get('limit') ?? 5000)

    const file = path.resolve(BASE_DIR, `r${res}`, 'latest.arrow')
    if (!fs.existsSync(file)) {
      return NextResponse.json(
        {
          ok: true,
          file,
          status: {lastUpdated: null, range: null},
          rows: [],
          totals: {},
          res,
        },
        {status: 200},
      )
    }

    const stat = fs.statSync(file)
    const buf = fs.readFileSync(file)
    const table = tableFromIPC(buf)

    const fields = table.schema.fields.map((f) => f.name)
    const idx = (n: string) => fields.indexOf(n)
    const ix = {
      date: idx('date'),
      hex: idx('hex'),
      res: idx('res'),
      beacon: idx('beacon'),
      witness: idx('witness'),
      coverage: idx('coverage'),
      data: idx('data'),
      total_bones: idx('total_bones'),
      hotspot_count: idx('hotspot_count'),
    }
    const get = (r: number, c: number) =>
      c >= 0 ? (table.getChildAt(c)?.get(r) as any) : undefined

    const hexSet = new Set<string>()
    if (hexFilter) {
      for (const h of hexFilter.split(',').map((s) => s.trim())) {
        if (h) hexSet.add(h)
      }
    }

    const rows: H3Row[] = []
    for (let i = 0; i < table.numRows && rows.length < limit; i++) {
      const d = asStr(get(i, ix.date))
      if (from && d && d < from) continue
      if (to && d && d > to) continue

      const hex = asStr(get(i, ix.hex))
      if (!hex) continue
      if (hexSet.size > 0 && !hexSet.has(hex)) continue

      if (bbox) {
        const [lat, lon] = h3ToLatLng(hex)
        if (!inBBox(lon, lat, bbox)) continue
      }

      rows.push({
        date: d,
        hex,
        res: asNum(get(i, ix.res)),
        beacon: asNum(get(i, ix.beacon)) ?? 0,
        witness: asNum(get(i, ix.witness)) ?? 0,
        coverage: asNum(get(i, ix.coverage)) ?? 0,
        data: asNum(get(i, ix.data)) ?? 0,
        total_bones: asNum(get(i, ix.total_bones)) ?? 0,
        hotspot_count: asNum(get(i, ix.hotspot_count)) ?? 0,
      })
    }

    const sum = (k: keyof H3Row) =>
      rows.reduce((s, r) => s + (Number(r[k] ?? 0) || 0), 0)

    const range =
      rows.length > 0
        ? {from: rows[0].date, to: rows[rows.length - 1].date}
        : null

    const totals: Record<string, number> = {
      rows: rows.length,
      beacon: sum('beacon'),
      witness: sum('witness'),
      coverage: sum('coverage'),
      data: sum('data'),
      total_bones: sum('total_bones'),
      hotspot_count: sum('hotspot_count'),
      selected: sum(field), // convenience
    }

    return NextResponse.json({
      ok: true,
      file,
      res,
      filters: {from, to, hex: hexFilter, bbox, field, limit},
      status: {lastUpdated: stat.mtime.toISOString(), range},
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
