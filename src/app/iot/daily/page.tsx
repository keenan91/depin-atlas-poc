'use client'
import {useEffect, useMemo, useState} from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Row = {
  date: string
  hotspot: string
  reward_type: string
  beacon: number
  witness: number
  dc: number
  total_bones?: number
}

const fmt = new Intl.NumberFormat('en-US')
const fmtCompact = new Intl.NumberFormat('en-US', {notation: 'compact'})

/** (1) Moving average that DOES NOT emit zeros at the start. */
function movingAverage(values: number[], window = 3): (number | null)[] {
  const out: (number | null)[] = Array(values.length).fill(null)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= window) sum -= values[i - window]
    if (i >= window - 1) out[i] = Math.round(sum / window)
  }
  return out
}

function StatCard({
  title,
  value,
  isLoading,
}: {
  title: string
  value: number
  isLoading?: boolean
}) {
  return (
    <div className="rounded border border-white/10 p-4">
      <div className="text-xs text-white/60">{title}</div>
      <div className="text-2xl font-medium">
        {isLoading ? (
          <span className="inline-block h-7 w-20 bg-white/10 rounded animate-pulse" />
        ) : (
          fmt.format(value)
        )}
      </div>
    </div>
  )
}

function EmptyNotice({
  from,
  to,
  hotspot,
}: {
  from?: string
  to?: string
  hotspot?: string
}) {
  return (
    <p className="text-xs text-white/50 mt-2">
      No data for range
      {from && to ? ` ${from} → ${to}` : ''}{' '}
      {hotspot ? ` and hotspot ${hotspot.slice(0, 8)}…` : ''}. Try broadening
      the dates or verifying the hotspot key.
    </p>
  )
}

export default function IotDailyPage() {
  const params =
    typeof window !== 'undefined' ? new URLSearchParams(location.search) : null

  const initialHotspot = (
    params?.get('hotspot') ??
    '112k33FQz3Qs6F38gCeosbrmvCCKyPnP6rfoXtHpuTbxLtpy r9Yv'
  )
    .trim()
    .replace(/\s/g, '') // (3) guard stray whitespace in sample
  const initialFrom = params?.get('from') ?? ''
  const initialTo = params?.get('to') ?? ''

  const [hotspot, setHotspot] = useState(initialHotspot)
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)

  const [rows, setRows] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)

  const [show, setShow] = useState({
    beacon: true,
    beacon_ma: true,
    witness: true,
    witness_ma: true,
  })

  // (4) Persist filters to URL so refresh/deep-linking keeps state
  useEffect(() => {
    const q = new URLSearchParams()
    if (hotspot) q.set('hotspot', hotspot)
    if (from) q.set('from', from)
    if (to) q.set('to', to)
    const url = `${location.pathname}?${q.toString()}`
    window.history.replaceState(null, '', url)
  }, [hotspot, from, to])

  const dateValid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

  async function fetchData(hs: string, f?: string, t?: string) {
    setIsLoading(true)
    setError(null)
    try {
      const q = new URLSearchParams()
      if (hs) q.set('hotspot', hs)
      if (f) q.set('from', f)
      if (t) q.set('to', t)
      const r = await fetch(`/api/iot/daily?${q.toString()}`)
      if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`)
      const {rows: data} = (await r.json()) as {rows: Row[]}
      setRows(data ?? [])
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch data')
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }

  // initial load
  useEffect(() => {
    fetchData(initialHotspot, initialFrom || undefined, initialTo || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // (2) Validate & swap dates if necessary, then fetch
  const onApply = (e: React.FormEvent) => {
    e.preventDefault()

    const f = from?.trim()
    const t = to?.trim()

    if ((f && !dateValid(f)) || (t && !dateValid(t))) {
      setDateError('Invalid date format (YYYY-MM-DD)')
      return
    }
    setDateError(null)

    let f2 = f
    let t2 = t
    if (f && t && f > t) {
      // swap
      f2 = t
      t2 = f
      setFrom(f2)
      setTo(t2)
    }

    fetchData(
      hotspot.trim().replace(/\s/g, ''),
      f2 || undefined,
      t2 || undefined,
    )
  }

  const summary = useMemo(() => {
    if (!rows.length) return {avgBeacon: 0, avgWitness: 0, days: 0}
    const totalB = rows.reduce((s, r) => s + (r.beacon || 0), 0)
    const totalW = rows.reduce((s, r) => s + (r.witness || 0), 0)
    return {
      avgBeacon: Math.round(totalB / rows.length),
      avgWitness: Math.round(totalW / rows.length),
      days: rows.length,
    }
  }, [rows])

  const chartData = useMemo(() => {
    if (!rows.length) return []
    const beacons = rows.map((r) => r.beacon || 0)
    const witnesses = rows.map((r) => r.witness || 0)
    const bMA = movingAverage(beacons, 3)
    const wMA = movingAverage(witnesses, 3)
    return rows.map((r, i) => ({
      date: r.date,
      beacon: r.beacon,
      witness: r.witness,
      beacon_ma: bMA[i],
      witness_ma: wMA[i],
    }))
  }, [rows])

  const dateRange =
    rows.length > 0 ? `${rows[0].date} → ${rows[rows.length - 1].date}` : null

  function exportCSV() {
    const header = ['date', 'hotspot', 'beacon', 'witness', 'dc', 'reward_type']
    const body = rows
      .map((r) =>
        [r.date, r.hotspot, r.beacon, r.witness, r.dc, r.reward_type]
          .map((v) => String(v ?? ''))
          .join(','),
      )
      .join('\n')
    const csv = `${header.join(',')}\n${body}\n`
    const blob = new Blob([csv], {type: 'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iot_daily_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const leftDomain =
    show.beacon || show.beacon_ma
      ? [
          ((dataMin: number) => dataMin * 0.95) as any,
          ((dataMax: number) => dataMax * 1.05) as any,
        ]
      : [0, 'auto']
  const rightDomain =
    show.witness || show.witness_ma
      ? [
          ((dataMin: number) => dataMin * 0.95) as any,
          ((dataMax: number) => dataMax * 1.05) as any,
        ]
      : [0, 'auto']

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">IoT Daily Rewards</h1>

      {/* Controls */}
      <form onSubmit={onApply} className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[260px]">
          <label className="text-xs text-white/60 block">Hotspot</label>
          <input
            className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm"
            value={hotspot}
            onChange={(e) =>
              setHotspot(e.target.value.trim().replace(/\s/g, ''))
            }
            placeholder="ECC key"
          />
        </div>
        <div>
          <label className="text-xs text-white/60 block">From</label>
          <input
            className="rounded bg-black/30 border border-white/10 px-3 py-2 text-sm"
            placeholder="yyyy-mm-dd"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-white/60 block">To</label>
          <input
            className="rounded bg-black/30 border border-white/10 px-3 py-2 text-sm"
            placeholder="yyyy-mm-dd"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={
            isLoading ||
            (!!from && !dateValid(from)) ||
            (!!to && !dateValid(to))
          }
          className={`px-3 py-2 rounded border text-sm ${
            isLoading || (from && !dateValid(from)) || (to && !dateValid(to))
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white/5'
          }`}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading…
            </span>
          ) : (
            'Apply'
          )}
        </button>

        <button
          type="button"
          onClick={exportCSV}
          className="px-3 py-2 rounded border text-sm hover:bg-white/5"
        >
          Export CSV
        </button>
      </form>

      {dateError && <p className="text-xs text-red-400">{dateError}</p>}

      {/* Subheader / meta */}
      <div className="text-xs text-white/60">
        Hotspot:{' '}
        <span className="px-2 py-1 bg-white/5 rounded">
          {hotspot || '(none)'}
        </span>
        {rows.length > 0 && (
          <>
            {' '}
            • {summary.days} days • Last: {rows[rows.length - 1].date}
          </>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Avg Beacon (bones/day)"
          value={summary.avgBeacon}
          isLoading={isLoading}
        />
        <StatCard
          title="Avg Witness (bones/day)"
          value={summary.avgWitness}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Days"
          value={summary.days}
          isLoading={isLoading}
        />
      </div>

      {/* Series toggles */}
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={show.beacon}
            onChange={(e) => setShow((s) => ({...s, beacon: e.target.checked}))}
          />
          <span>Beacon</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={show.beacon_ma}
            onChange={(e) =>
              setShow((s) => ({...s, beacon_ma: e.target.checked}))
            }
          />
          <span>Beacon (3‑day MA)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={show.witness}
            onChange={(e) =>
              setShow((s) => ({...s, witness: e.target.checked}))
            }
          />
          <span>Witness</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={show.witness_ma}
            onChange={(e) =>
              setShow((s) => ({...s, witness_ma: e.target.checked}))
            }
          />
          <span>Witness (3‑day MA)</span>
        </label>
      </div>

      {/* Chart */}
      <div className="relative rounded border border-white/10">
        <div className="absolute right-3 top-2 text-xs text-white/50">
          {dateRange ? `Range: ${dateRange}` : ''}
        </div>
        <div className="h-[520px] px-2 py-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="date" />
              <YAxis
                yAxisId="left"
                domain={leftDomain as any}
                tickFormatter={(v) => fmtCompact.format(Number(v))}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={rightDomain as any}
                tickFormatter={(v) => fmtCompact.format(Number(v))}
              />
              <Tooltip
                formatter={(v: any) => fmt.format(Number(v) || 0)}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Legend />
              {show.beacon && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="beacon"
                  name="Beacon (bones)"
                  dot={false}
                />
              )}
              {show.beacon_ma && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="beacon_ma"
                  name="Beacon (3‑day MA)"
                  dot={false}
                  connectNulls={true} // (1) start only when MA is defined
                  strokeDasharray="4 4"
                />
              )}
              {show.witness && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="witness"
                  name="Witness (bones)"
                  dot={false}
                />
              )}
              {show.witness_ma && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="witness_ma"
                  name="Witness (3‑day MA)"
                  dot={false}
                  connectNulls={true}
                  strokeDasharray="4 4"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Empty / error notices */}
      {!isLoading && rows.length === 0 && (
        <EmptyNotice
          from={from || undefined}
          to={to || undefined}
          hotspot={hotspot}
        />
      )}
      {error && <p className="text-xs text-red-400">Error: {error}</p>}

      <p className="text-xs text-white/40">
        Tip: add <code>?from=YYYY-MM-DD</code> &amp; <code>to=YYYY-MM-DD</code>{' '}
        or <code>?hotspot=ECC_KEY</code> to the URL and press <b>Apply</b>.
      </p>
    </div>
  )
}
