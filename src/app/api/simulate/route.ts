import {NextRequest, NextResponse} from 'next/server'
import {listIotRewards} from '@/lib/relay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEFAULT_HOTSPOT = undefined

export async function GET(req: NextRequest) {
  const {searchParams} = new URL(req.url)

  const hotspot_key = searchParams.get('hotspotKey') ?? DEFAULT_HOTSPOT
  const from =
    searchParams.get('from') ??
    new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)
  const to = searchParams.get('to') ?? new Date().toISOString().slice(0, 10)

  try {
    const resp = await listIotRewards(
      {hotspot_key: hotspot_key || undefined, from, to},
      /* maxPages */ hotspot_key ? 2 : 1,
    )

    const total = resp.records.reduce((s, r) => {
      const d = r.reward_detail || {}
      const amount = d.amount ?? d.beacon_amount ?? d.witness_amount ?? 0
      return s + Number(amount)
    }, 0)

    return NextResponse.json({
      ok: true,
      hotspot_key: hotspot_key || null,
      from,
      to,
      total,
      records: resp.records.length,
      avg_per_record: resp.records.length ? total / resp.records.length : 0,
      meta: resp.meta,
      sample: resp.records.slice(0, 2),
    })
  } catch (e: any) {
    console.error(
      'Relay API error:',
      e?.response?.status,
      e?.response?.data || e.message,
    )
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch data from Relay API.',
        status: e?.response?.status ?? 500,
        details: e?.response?.data || e.message,
      },
      {status: e?.response?.status ?? 500},
    )
  }
}
