'use client'

import {useEffect, useMemo, useState} from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type Row = {
  date: string
  hotspot: string
  coverage: number
  data: number
  speedtest: number
  total_bones: number
  reward_type: string
  lat?: number
  lon?: number
}

const fmt = new Intl.NumberFormat('en-US')
const fmtCompact = new Intl.NumberFormat('en-US', {notation: 'compact'})

function movingAverage(values: number[], window = 3): (number | null)[] {
  const out = Array(values.length).fill(null)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= window) sum -= values[i - window]
    if (i >= window - 1) out[i] = Math.round(sum / window)
  }
  return out
}

export default function MobileDailyPage() {
  const [hotspot, setHotspot] = useState<string>(
    '1trSusf4AydmebT8DXYGRQ6CFRrfRnMZbWai9tBcCAHzbJysMe46vjtKbZcNShdGP2nJzDhztzjKpiqpQwBACoq6deKZgdHMyqnQwSkLF1vkaaEcQ5d91NHy6UzL3mQ4NHsWDgXuoQsH5ihKryiCm8cJSaoqxWy8WNCMGiBaVzFsHqVAx5K9Mmav1Sx1dq5S6TzamNXuxdJBYyWs3GQXiFVpecWKVnbS5MWd7EX2ytJrcsShRxBaWbQWuq64zW55UuywHPVQyXzCx5WrHAwRhGnNXYcssfhmjdCqiWtNaXyWTeCg1DbvjTB8RWyXnhBgr5F675Z3ysdavqyMQadMTAEZHJrWqVB7NiyTU822o1j4Rt'
      .trim()
      .replace(/\s/g, ''),
  )
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [dateError, setDateError] = useState<string | null>(null)
  const [show, setShow] = useState({
    coverage: true,
    coverage_ma: true,
    data: true,
    data_ma: true,
  })

  useEffect(() => {
    const q = new URLSearchParams(location.search)
    const hs = q.get('hotspot')?.trim().replace(/\s/g, '')
    const f = q.get('from') ?? ''
    const t = q.get('to') ?? ''
    if (hs) setHotspot(hs)
    if (f) setFrom(f)
    if (t) setTo(t)
  }, [])

  useEffect(() => {
    const q = new URLSearchParams()
    if (hotspot) q.set('hotspot', hotspot)
    if (from) q.set('from', from)
    if (to) q.set('to', to)
    const url = `${location.pathname}?${q.toString()}`
    window.history.replaceState(null, '', url)
  }, [hotspot, from, to])

  async function fetchData() {
    setLoading(true)
    setDateError(null)
    try {
      const params = new URLSearchParams()
      if (hotspot) params.set('hotspot', hotspot)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`/api/mobile/daily?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch /api/mobile/daily')
      const json = await res.json()
      setRows(json.rows ?? [])
    } finally {
      setLoading(false)
    }
  }

  function onApply(e: React.FormEvent) {
    e.preventDefault()
    if (
      (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) ||
      (to && !/^\d{4}-\d{2}-\d{2}$/.test(to))
    ) {
      setDateError('Invalid date format (YYYY-MM-DD)')
      return
    }
    if (from && to && from > to) {
      // swap
      const f = to
      const t = from
      setFrom(f)
      setTo(t)
      setTimeout(fetchData, 0)
      return
    }
    fetchData()
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chartData = useMemo(() => {
    const cov = rows.map((r) => r.coverage || 0)
    const dat = rows.map((r) => r.data || 0)
    const cov_ma = movingAverage(cov, 3)
    const dat_ma = movingAverage(dat, 3)
    return rows.map((r, i) => ({
      ...r,
      coverage_ma: cov_ma[i],
      data_ma: dat_ma[i],
    }))
  }, [rows])

  const stats = useMemo(() => {
    if (!rows.length) return {covAvg: 0, dataAvg: 0, days: 0, last: ''}
    const covSum = rows.reduce((s, r) => s + (r.coverage || 0), 0)
    const datSum = rows.reduce((s, r) => s + (r.data || 0), 0)
    return {
      covAvg: Math.round(covSum / rows.length),
      dataAvg: Math.round(datSum / rows.length),
      days: rows.length,
      last: rows[rows.length - 1].date,
    }
  }, [rows])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">MOBILE Daily Rewards</h1>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3" onSubmit={onApply}>
        <div className="flex flex-col">
          <label className="text-xs text-white/60">Hotspot</label>
          <input
            className="bg-black/30 border rounded px-3 py-2 w-[560px]"
            value={hotspot}
            onChange={(e) =>
              setHotspot(e.target.value.trim().replace(/\s/g, ''))
            }
            placeholder="ECC key"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-white/60">From</label>
          <input
            type="date"
            className="bg-black/30 border rounded px-3 py-2"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="yyyy-mm-dd"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-white/60">To</label>
          <input
            type="date"
            className="bg-black/30 border rounded px-3 py-2"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="yyyy-mm-dd"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-3 py-2 rounded border text-sm ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'
          }`}
        >
          {loading ? (
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
          onClick={() => {
            // CSV of current rows
            const headers: (keyof Row)[] = [
              'date',
              'hotspot',
              'coverage',
              'data',
              'speedtest',
              'total_bones',
              'reward_type',
            ]
            const csv = [
              headers.join(','),
              ...rows.map((r) => headers.map((h) => (r as any)[h]).join(',')),
            ].join('\n')
            const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'mobile_daily.csv'
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="px-3 py-2 rounded border text-sm hover:bg-white/5"
        >
          Export CSV
        </button>
      </form>

      {dateError && <p className="text-xs text-red-400">{dateError}</p>}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Avg Coverage (bones/day)"
          value={stats.covAvg}
          loading={loading}
        />
        <StatCard
          label="Avg Data (bones/day)"
          value={stats.dataAvg}
          loading={loading}
        />
        <StatCard
          label="Total Days"
          value={stats.days}
          loading={loading}
          fmt="int"
        />
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-4 text-sm">
        {[
          ['Coverage', 'coverage'],
          ['Coverage (3‑day MA)', 'coverage_ma'],
          ['Data', 'data'],
          ['Data (3‑day MA)', 'data_ma'],
        ].map(([label, key]) => (
          <label key={key} className="flex items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={(show as any)[key]}
              onChange={(e) =>
                setShow((s) => ({...s, [key]: e.target.checked}))
              }
            />
            {label}
          </label>
        ))}
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="absolute right-2 top-2 text-xs text-white/60">
          {rows.length
            ? `Range: ${rows[0].date} → ${rows[rows.length - 1].date}`
            : ''}
        </div>
        <div className="h-[520px] w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                yAxisId="left"
                domain={
                  show.coverage || show.coverage_ma
                    ? [
                        (dataMin: number) => dataMin * 0.95,
                        (dataMax: number) => dataMax * 1.05,
                      ]
                    : [0, 'auto']
                }
                tickFormatter={fmtCompact.format}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={
                  show.data || show.data_ma
                    ? [
                        (dataMin: number) => dataMin * 0.95,
                        (dataMax: number) => dataMax * 1.05,
                      ]
                    : [0, 'auto']
                }
                tickFormatter={fmtCompact.format}
              />
              <Tooltip />
              <Legend />

              {show.coverage && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="coverage"
                  name="Coverage (bones)"
                  dot={false}
                  strokeWidth={2}
                />
              )}
              {show.coverage_ma && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="coverage_ma"
                  name="Coverage (3‑day MA)"
                  dot={false}
                  strokeDasharray="4 4"
                  connectNulls
                />
              )}
              {show.data && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="data"
                  name="Data (bones)"
                  dot={false}
                  strokeWidth={2}
                />
              )}
              {show.data_ma && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="data_ma"
                  name="Data (3‑day MA)"
                  dot={false}
                  strokeDasharray="4 4"
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!rows.length && !loading && (
        <p className="text-xs text-white/60">
          No data for range. Try broadening dates or verifying the hotspot key.
        </p>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  loading,
  fmt: kind,
}: {
  label: string
  value: number
  loading: boolean
  fmt?: 'int'
}) {
  return (
    <div className="border rounded p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-2xl font-medium">
        {loading ? (
          <span className="inline-block h-7 w-20 bg-white/10 rounded animate-pulse" />
        ) : kind === 'int' ? (
          value
        ) : (
          fmt.format(value)
        )}
      </div>
    </div>
  )
}
