// Usage:
//   npx tsx scripts/features/refresh-h3.ts --res 9 --days 60 \
//     --hotspots data/lookup/iot_hotspots.json \
//     [--source data/features/iot_daily_sample.arrow]
//
// Output:
//   data/features/iot/h3/r{RES}/latest.arrow

import fs from 'node:fs'
import path from 'node:path'
import {tableFromIPC, tableFromJSON, tableToIPC} from 'apache-arrow'
import {latLngToCell, cellToLatLng} from 'h3-js'

// ----------------------------- CLI args -----------------------------
function parseArgs() {
  const args = new Map<string, string>()
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i]
    if (!a.startsWith('--')) continue
    const eq = a.indexOf('=')
    if (eq > 2) {
      args.set(a.slice(2, eq), a.slice(eq + 1))
    } else {
      const k = a.slice(2)
      const v =
        i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')
          ? process.argv[++i]
          : 'true'
      args.set(k, v)
    }
  }
  return args
}

const args = parseArgs()
const RES = Number(args.get('res') ?? 9)
const DAYS = Number(args.get('days') ?? 60)
const HOTSPOTS_LOOKUP = args.get('hotspots') ?? ''
const SOURCE =
  args.get('source') ??
  (fs.existsSync('data/features/iot_daily_sample.arrow')
    ? 'data/features/iot_daily_sample.arrow'
    : 'data/features/iot/latest.arrow')

function warn(msg: string) {
  console.warn(`[features:refresh-h3] ${msg}`)
}

// ----------------------------- IO helpers -----------------------------
function loadHotspotLookup(
  file?: string,
): Record<string, {lat: number; lon: number}> {
  if (!file) return {}
  try {
    const p = path.resolve(file)
    const txt = fs.readFileSync(p, 'utf-8')
    const obj = JSON.parse(txt) as Record<string, {lat: number; lon: number}>
    return obj ?? {}
  } catch (e: any) {
    warn(
      `Failed to read hotspot lookup ${path.resolve(file!)}: ${
        e?.message ?? String(e)
      }`,
    )
    return {}
  }
}

function readArrow(file: string) {
  const absolute = path.resolve(file)
  if (!fs.existsSync(absolute)) {
    throw new Error(`Source arrow not found: ${absolute}`)
  }
  const buf = fs.readFileSync(absolute)
  return tableFromIPC(buf)
}

function ymd(s: any): string {
  return String(s ?? '').slice(0, 10)
}
function asNum(v: unknown): number | undefined {
  if (v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
function asStr(v: unknown): string | undefined {
  return v == null ? undefined : String(v)
}

// ----------------------------- Types -----------------------------
type RowIn = {
  date?: string
  date_start?: string
  date_end?: string
  hotspot?: string
  hotspot_key?: string
  lat?: number
  lon?: number
  beacon?: number
  witness?: number
  coverage?: number
  data?: number
  total_bones?: number
}

type RowOut = {
  date: string
  hex: string
  res: number
  lat: number // hex centroid
  lon: number // hex centroid
  beacon: number
  witness: number
  coverage: number
  data: number
  total_bones: number
  hotspot_count: number
}

// ----------------------------- Main -----------------------------
async function main() {
  const lookup = loadHotspotLookup(HOTSPOTS_LOOKUP)

  const table = readArrow(SOURCE)

  const fields = table.schema.fields
  const colIndex = (n: string) => fields.findIndex((f) => f.name === n)
  const idx = {
    date: colIndex('date'),
    date_start: colIndex('date_start'),
    date_end: colIndex('date_end'),
    hotspot:
      colIndex('hotspot') >= 0 ? colIndex('hotspot') : colIndex('hotspot_key'),
    lat: colIndex('lat'),
    lon: colIndex('lon'),
    beacon: colIndex('beacon'),
    witness: colIndex('witness'),
    coverage: colIndex('coverage'),
    data: colIndex('data'),
    total_bones: colIndex('total_bones'),
  }
  const get = (i: number, c: number) => table.getChildAt(c)?.get(i)

  // Time window (DAYS)
  const minDate =
    Number.isFinite(DAYS) && DAYS > 0
      ? new Date(Date.now() - DAYS * 86400000).toISOString().slice(0, 10)
      : '0000-00-00'

  // Aggregate per (date,hex,res)
  const agg = new Map<
    string,
    {
      date: string
      hex: string
      res: number
      // centroid of hex
      lat: number
      lon: number
      beacon: number
      witness: number
      coverage: number
      data: number
      total_bones: number
      hotspots: Set<string>
    }
  >()

  let totalRows = 0
  let usedLookup = 0
  let noGeo = 0

  const N = table.numRows
  for (let i = 0; i < N; i++) {
    totalRows++

    // date (prefer single 'date', else fall back to date_end/start)
    const d =
      asStr(idx.date >= 0 ? get(i, idx.date) : undefined) ??
      asStr(idx.date_end >= 0 ? get(i, idx.date_end) : undefined) ??
      asStr(idx.date_start >= 0 ? get(i, idx.date_start) : undefined) ??
      ''
    const date = ymd(d)
    if (!date || date < minDate) continue

    const hs = asStr(idx.hotspot >= 0 ? get(i, idx.hotspot) : undefined) ?? ''
    if (!hs) continue

    // Measures (fall back if some columns missing)
    const beacon = asNum(idx.beacon >= 0 ? get(i, idx.beacon) : undefined) ?? 0
    const witness =
      asNum(idx.witness >= 0 ? get(i, idx.witness) : undefined) ?? 0
    // If 'coverage' absent, use beacon+witness
    const coverage =
      asNum(idx.coverage >= 0 ? get(i, idx.coverage) : undefined) ??
      beacon + witness
    const data = asNum(idx.data >= 0 ? get(i, idx.data) : undefined) ?? 0
    const total_bones =
      asNum(idx.total_bones >= 0 ? get(i, idx.total_bones) : undefined) ??
      beacon + witness + data

    // Geo: prefer existing lat/lon; else lookup by hotspot
    let lat =
      asNum(idx.lat >= 0 ? get(i, idx.lat) : undefined) ?? lookup[hs]?.lat
    let lon =
      asNum(idx.lon >= 0 ? get(i, idx.lon) : undefined) ?? lookup[hs]?.lon

    if (lat == null || lon == null) {
      noGeo++
      continue
    }
    if (
      (idx.lat < 0 || idx.lon < 0) &&
      lookup[hs] &&
      lookup[hs].lat != null &&
      lookup[hs].lon != null
    ) {
      usedLookup++
    }

    // H3 cell and centroid
    const hex = latLngToCell(lat!, lon!, RES)
    const [centLat, centLon] = cellToLatLng(hex) // centroid of that hex

    // Aggregate
    const key = `${date}__${hex}__${RES}`
    const cur = agg.get(key) ?? {
      date,
      hex,
      res: RES,
      lat: centLat,
      lon: centLon,
      beacon: 0,
      witness: 0,
      coverage: 0,
      data: 0,
      total_bones: 0,
      hotspots: new Set<string>(),
    }
    cur.beacon += beacon
    cur.witness += witness
    cur.coverage += coverage
    cur.data += data
    cur.total_bones += total_bones
    cur.hotspots.add(hs)
    agg.set(key, cur)
  }

  const out: RowOut[] = [...agg.values()]
    .map((r) => ({
      date: r.date,
      hex: r.hex,
      res: r.res,
      lat: r.lat,
      lon: r.lon,
      beacon: Math.round(r.beacon),
      witness: Math.round(r.witness),
      coverage: Math.round(r.coverage),
      data: Math.round(r.data),
      total_bones: Math.round(r.total_bones),
      hotspot_count: r.hotspots.size,
    }))
    .sort((a, b) =>
      a.date === b.date
        ? a.hex.localeCompare(b.hex)
        : a.date.localeCompare(b.date),
    )

  const outDir = path.resolve('data', 'features', 'iot', 'h3', `r${RES}`)
  const outFile = path.join(outDir, 'latest.arrow')
  fs.mkdirSync(outDir, {recursive: true})
  const arrowBuf = tableToIPC(tableFromJSON(out))
  fs.writeFileSync(outFile, arrowBuf)

  const range =
    out.length > 0 ? `${out[0].date}..${out[out.length - 1].date}` : '-..-'

  console.log(
    `Built ${outFile} — rows=${out.length}, range=${range} (res=${RES}, days=${DAYS})`,
  )
  console.log(
    `[features:refresh-h3] geoStats total=${totalRows}, noGeo=${noGeo}, usedLookup=${usedLookup}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
