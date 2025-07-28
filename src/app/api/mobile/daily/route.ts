import {NextResponse} from 'next/server'
import {tableFromIPC} from 'apache-arrow'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FILE =
  process.env.MOBILE_ARROW_FILE ?? 'data/features/mobile_daily_sample.arrow'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const hotspot = url.searchParams.get('hotspot')?.trim()
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const limit = Number(url.searchParams.get('limit') ?? '5000')

  const filePath = path.resolve(FILE)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ok: true, count: 0, rows: [], file: filePath})
  }

  const table = tableFromIPC(fs.readFileSync(filePath))
  const fields = table.schema.fields
  const idx = {
    date: fields.findIndex((f) => f.name === 'date'),
    hotspot: fields.findIndex((f) => f.name === 'hotspot'),
    coverage: fields.findIndex((f) => f.name === 'coverage'),
    data: fields.findIndex((f) => f.name === 'data'),
    speedtest: fields.findIndex((f) => f.name === 'speedtest'),
    total: fields.findIndex((f) => f.name === 'total_bones'),
    rt: fields.findIndex((f) => f.name === 'reward_type'),
  }

  const out: any[] = []
  let totals = {coverage: 0, data: 0, speedtest: 0, total_bones: 0, rows: 0}

  for (let i = 0; i < table.numRows; i++) {
    const d = String(table.getChildAt(idx.date)!.get(i))
    const hs = String(table.getChildAt(idx.hotspot)!.get(i))
    if (hotspot && hs !== hotspot) continue
    if (from && d < from) continue
    if (to && d > to) continue

    const row = {
      date: d,
      hotspot: hs,
      reward_type: String(table.getChildAt(idx.rt)!.get(i)),
      coverage: Number(table.getChildAt(idx.coverage)!.get(i) ?? 0),
      data: Number(table.getChildAt(idx.data)!.get(i) ?? 0),
      speedtest: Number(table.getChildAt(idx.speedtest)!.get(i) ?? 0),
      total_bones: Number(table.getChildAt(idx.total)!.get(i) ?? 0),
    }
    out.push(row)
    totals.coverage += row.coverage
    totals.data += row.data
    totals.speedtest += row.speedtest
    totals.total_bones += row.total_bones
    if (out.length >= limit) break
  }
  totals.rows = out.length

  return NextResponse.json({
    ok: true,
    file: filePath,
    filters: {hotspot, from, to, limit},
    totals,
    rows: out,
  })
}
