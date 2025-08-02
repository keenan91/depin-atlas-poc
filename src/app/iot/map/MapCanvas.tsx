'use client'

import React, {useEffect, useMemo, useState} from 'react'
import 'leaflet/dist/leaflet.css'
import {MapContainer, TileLayer, Polygon, Tooltip, useMap} from 'react-leaflet'
import {cellToBoundary, cellToLatLng} from 'h3-js'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend as ChartLegend,
  Tooltip as ChartTooltip,
} from 'recharts'
import * as L from 'leaflet'
import _ from 'lodash'

type H3Row = {
  date: string // Millisecond timestamp as a string
  hex: string
  poc_rewards: number
  dc_rewards: number
  total_rewards: number
  hotspot_count: number
  density_k1: number
  ma_3d_total: number
  ma_3d_poc: number
  transmit_scale_approx: number
  lat?: number
  lon?: number
}

type ApiResponse = {
  ok: boolean
  rows: H3Row[]
  totals?: {
    rows: number
    poc_rewards: number
    dc_rewards: number
    total_rewards: number
  }
}

const fmt = new Intl.NumberFormat('en-US', {notation: 'compact'})

function colorForRank(rank: number) {
  const steps = ['#26428c', '#3b55a5', '#536abf', '#6e82d8', '#8fa0f2']
  return steps[Math.min(steps.length - 1, Math.max(0, rank))]
}

function formatChartDate(msString: string): string {
  const date = new Date(Number(msString))
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function LegendControl({cuts, field}: {cuts: number[]; field: string}) {
  const map = useMap()

  useEffect(() => {
    const existingLegend = document.querySelector('.legend')
    if (existingLegend) {
      existingLegend.remove()
    }

    const legend = new L.Control({position: 'bottomright'})
    legend.onAdd = () => {
      const div = L.DomUtil.create(
        'div',
        'legend bg-[#1a1a1a] p-2 rounded shadow-lg text-white/80 text-xs border border-white/20',
      )
      let html = `<div class="font-semibold mb-1">${field.replace(
        /_/g,
        ' ',
      )}</div>`
      const steps = colorForRank

      if (cuts.length > 0) {
        html += `<div><i style="background: ${steps(
          0,
        )};"></i> Low (&lt; ${fmt.format(cuts[0])})</div>`
        for (let i = 0; i < cuts.length - 1; i++) {
          html += `<div><i style="background: ${steps(
            i + 1,
          )};"></i> ${fmt.format(cuts[i])} - ${fmt.format(cuts[i + 1])}</div>`
        }
        html += `<div><i style="background: ${steps(
          cuts.length,
        )};"></i> High (&gt; ${fmt.format(cuts[cuts.length - 1])})</div>`
      } else {
        html += `<div><i style="background: ${steps(0)};"></i> N/A</div>`
      }

      div.innerHTML = html
      return div
    }
    legend.addTo(map)
    return () => {
      legend.remove()
    }
  }, [map, cuts, field])

  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .legend i {
        width: 18px;
        height: 18px;
        float: left;
        margin-right: 8px;
        opacity: 0.7;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return null
}

function HexModal({
  hexData,
  onClose,
}: {
  hexData: H3Row[] | null
  onClose: () => void
}) {
  if (!hexData) return null

  const chartData = hexData
    .sort((a, b) => Number(a.date) - Number(b.date)) // Sort by number, not string
    .map((r) => ({
      date: formatChartDate(r.date),
      '3D MA Total': r.ma_3d_total,
      'Total Rewards': r.total_rewards,
    }))

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] border border-white/20 p-4 rounded-lg shadow-lg max-w-2xl w-full text-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">Hex Details: {hexData[0].hex}</h3>
          <button
            onClick={onClose}
            className="text-2xl text-white/50 hover:text-white"
          >
            &times;
          </button>
        </div>
        <div style={{height: '250px'}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{top: 5, right: 20, left: -10, bottom: 5}}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="date" stroke="#ffffff80" fontSize={12} />
              <YAxis
                stroke="#ffffff80"
                fontSize={12}
                tickFormatter={(value) => fmt.format(value as number)}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: '#111',
                  border: '1px solid #ffffff30',
                }}
              />
              <ChartLegend wrapperStyle={{fontSize: '14px'}} />
              <Line
                type="monotone"
                dataKey="3D MA Total"
                stroke="#8884d8"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Total Rewards"
                stroke="#82ca9d"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="max-h-48 overflow-y-auto mt-2">
          <table className="text-xs w-full mt-2">
            <thead className="sticky top-0 bg-[#1e1e1e]">
              <tr>
                <th className="text-left p-1">Date</th>
                <th className="text-right p-1">Total Rewards</th>
                <th className="text-right p-1">Hotspots</th>
                <th className="text-right p-1">Density (k=1)</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {hexData.map((r) => (
                <tr key={r.date} className="border-t border-white/10">
                  <td className="p-1">{formatChartDate(r.date)}</td>
                  <td className="text-right p-1">
                    {fmt.format(r.total_rewards)}
                  </td>
                  <td className="text-right p-1">{r.hotspot_count}</td>
                  <td className="text-right p-1">{r.density_k1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function MapCanvas() {
  const [mounted, setMounted] = useState(false)

  const [field, setField] = useState<keyof H3Row>('total_rewards')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [rows, setRows] = useState<H3Row[]>([])
  const [totals, setTotals] = useState<ApiResponse['totals'] | null>(null)

  const [selectedHex, setSelectedHex] = useState<string | null>(null)
  const selectedData = useMemo(() => {
    if (!selectedHex) return null
    return rows.filter((r) => r.hex === selectedHex)
  }, [rows, selectedHex])

  useEffect(() => setMounted(true), [])

  async function fetchHexes() {
    const q = new URLSearchParams()
    if (from) q.set('from', from)
    if (to) q.set('to', to)

    const r = await fetch(`/api/iot/h3/daily?${q.toString()}`)
    const j = (await r.json()) as ApiResponse
    if (!j.ok) {
      setRows([])
      setTotals(null)
      return
    }

    const withCenters = (j.rows ?? []).map((row) => {
      const [lat, lon] = cellToLatLng(row.hex)
      return {...row, lat, lon}
    })

    setRows(withCenters)
    setTotals(j.totals ?? null)
  }

  useEffect(() => {
    if (!mounted) return
    fetchHexes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  const onApply = (e: React.FormEvent) => {
    e.preventDefault()
    fetchHexes()
  }

  const byHex = useMemo(() => {
    const m = new Map<
      string,
      {
        hex: string
        lat: number
        lon: number
        value: number
        hotspot_count: number
        density_k1: number
      }
    >()
    for (const r of rows) {
      const v = r[field] as number
      const cur = m.get(r.hex) ?? {
        hex: r.hex,
        lat: r.lat!,
        lon: r.lon!,
        value: 0,
        hotspot_count: r.hotspot_count,
        density_k1: r.density_k1,
      }
      cur.value += v || 0
      m.set(r.hex, cur)
    }
    return [...m.values()]
  }, [rows, field])

  const bands = 5
  const {ranks, cuts} = useMemo(() => {
    if (byHex.length === 0) return {ranks: new Map<string, number>(), cuts: []}
    const values = byHex
      .map((h) => h.value)
      .filter((v) => v > 0)
      .sort((a, b) => a - b)
    if (values.length === 0) return {ranks: new Map<string, number>(), cuts: []}

    const cuts: number[] = Array.from({length: bands - 1}, (_, i) => {
      const p = (i + 1) / bands
      const idx = Math.floor(values.length * p)
      return values[Math.min(values.length - 1, idx)]
    })
    const map = new Map<string, number>()
    for (const h of byHex) {
      let rank = 0
      while (rank < bands - 1 && h.value > cuts[rank]) rank++
      map.set(h.hex, rank)
    }
    return {ranks: map, cuts}
  }, [byHex])

  const center = useMemo<[number, number]>(() => {
    if (byHex.length > 0) {
      const avgLat = _.meanBy(byHex, 'lat')
      const avgLon = _.meanBy(byHex, 'lon')
      return [avgLat, avgLon]
    }
    return [37.7749, -122.4194] // SF fallback
  }, [byHex])

  const totalsText = useMemo(() => {
    const total = totals ? totals[field as keyof typeof totals] : 0
    const label = field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
    return `Hexes: ${byHex.length} • Total ${label}: ${fmt.format(total ?? 0)}`
  }, [byHex.length, field, totals])

  return (
    <div className="space-y-3">
      {/* Controls */}
      <form onSubmit={onApply} className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-white/60">Field</label>
        <select
          className="rounded bg-black/30 border border-white/10 px-2 py-1"
          value={field}
          onChange={(e) => setField(e.target.value as any)}
        >
          <option value="total_rewards">Total Rewards</option>
          <option value="poc_rewards">PoC Rewards</option>
          <option value="dc_rewards">Data Rewards</option>
          <option value="hotspot_count">Hotspot Count</option>
          <option value="density_k1">k=1 Density</option>
          <option value="ma_3d_total">3-Day MA Total</option>
          <option value="ma_3d_poc">3-Day MA PoC</option>
          <option value="transmit_scale_approx">Transmit Scale Approx</option>
        </select>

        <label className="text-xs text-white/60">From</label>
        <input
          placeholder="yyyy-mm-dd"
          className="rounded bg-black/30 border border-white/10 px-2 py-1"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <label className="text-xs text-white/60">To</label>
        <input
          placeholder="yyyy-mm-dd"
          className="rounded bg-black/30 border border-white/10 px-2 py-1"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <button
          type="submit"
          className="px-3 py-2 rounded border text-sm hover:bg-white/5"
        >
          Apply
        </button>
      </form>

      <div className="text-xs text-white/60">{totalsText}</div>

      <div className="rounded border border-white/10 overflow-hidden relative">
        {mounted ? (
          <MapContainer
            center={center as any}
            zoom={6}
            style={{height: '640px', width: '100%', backgroundColor: '#1a1a1a'}}
            preferCanvas
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <LegendControl cuts={cuts} field={field} />
            {byHex.map((h) => {
              const boundary = cellToBoundary(h.hex).map(
                ([lat, lng]) => [lat, lng] as [number, number],
              )
              const rank = ranks.get(h.hex) ?? 0
              const fill = colorForRank(rank)
              return (
                <Polygon
                  key={h.hex}
                  positions={boundary}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 1,
                    opacity: 0.7,
                    fillColor: fill,
                    fillOpacity: 0.45,
                  }}
                  eventHandlers={{
                    click: () => setSelectedHex(h.hex),
                  }}
                >
                  <Tooltip>
                    <div className="text-xs">
                      <div>{h.hex}</div>
                      <div>
                        {field.replace(/_/g, ' ')}: {fmt.format(h.value)}
                      </div>
                      <div>Hotspots: {fmt.format(h.hotspot_count)}</div>
                      <div>Density (k=1): {fmt.format(h.density_k1)}</div>
                    </div>
                  </Tooltip>
                </Polygon>
              )
            })}
          </MapContainer>
        ) : (
          <div className="h-[640px] p-6 text-sm text-white/60 flex items-center justify-center">
            Loading map…
          </div>
        )}
      </div>

      <HexModal hexData={selectedData} onClose={() => setSelectedHex(null)} />
    </div>
  )
}
