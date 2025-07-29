'use client'

import React, {useEffect, useMemo, useState} from 'react'
import 'leaflet/dist/leaflet.css'
import {MapContainer, TileLayer, Polygon, Tooltip} from 'react-leaflet'
import {cellToBoundary, cellToLatLng} from 'h3-js'

type H3Row = {
  date: string
  hex: string
  res: number
  // optional in API; we'll compute if absent
  lat?: number
  lon?: number
  beacon: number
  witness: number
  coverage: number
  data: number
  total_bones: number
  hotspot_count: number
}

type ApiResponse = {
  ok: boolean
  rows: H3Row[]
  status?: {lastUpdated?: string; range?: {from?: string; to?: string}}
  totals?: {
    rows: number
    beacon: number
    witness: number
    coverage: number
    data: number
    total_bones: number
    hotspot_count: number
    selected: number
  }
}

const fmt = new Intl.NumberFormat('en-US', {notation: 'compact'})

function colorForRank(rank: number) {
  const steps = ['#b3c7ff', '#85a7ff', '#5a89ff', '#3368ff', '#114cff']
  return steps[Math.min(steps.length - 1, Math.max(0, rank))]
}

export default function MapCanvas() {
  const [mounted, setMounted] = useState(false)

  const [field, setField] = useState<
    'witness' | 'beacon' | 'coverage' | 'data'
  >('witness')
  const [res, setRes] = useState<number>(9)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [rows, setRows] = useState<H3Row[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [serverRange, setServerRange] = useState<{from?: string; to?: string}>(
    {},
  )

  useEffect(() => setMounted(true), [])

  async function fetchHexes() {
    const q = new URLSearchParams()
    q.set('res', String(res))
    q.set('field', field)
    if (from) q.set('from', from)
    if (to) q.set('to', to)

    const r = await fetch(`/api/iot/h3/daily?${q.toString()}`)
    const j = (await r.json()) as ApiResponse
    if (!j.ok) {
      setRows([])
      setLastUpdated(null)
      setServerRange({})
      return
    }

    // ensure lat/lon exist; compute from hex if missing
    const withCenters = (j.rows ?? []).map((row) => {
      if (row.lat == null || row.lon == null) {
        const [lat, lon] = cellToLatLng(row.hex)
        return {...row, lat, lon}
      }
      return row
    })

    setRows(withCenters)
    setLastUpdated(j.status?.lastUpdated ?? null)
    setServerRange(j.status?.range ?? {})
  }

  useEffect(() => {
    if (!mounted) return
    fetchHexes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, field, res])

  const onApply = (e: React.FormEvent) => {
    e.preventDefault()
    fetchHexes()
  }

  // Reduce all daily rows to one value per hex (sum over selected field)
  const byHex = useMemo(() => {
    const m = new Map<
      string,
      {hex: string; lat: number; lon: number; value: number}
    >()
    for (const r of rows) {
      const v =
        field === 'witness'
          ? r.witness
          : field === 'beacon'
          ? r.beacon
          : field === 'coverage'
          ? r.coverage
          : r.data
      const cur = m.get(r.hex) ?? {
        hex: r.hex,
        lat: r.lat!,
        lon: r.lon!,
        value: 0,
      }
      cur.value += v || 0
      cur.lat = r.lat!
      cur.lon = r.lon!
      m.set(r.hex, cur)
    }
    return [...m.values()]
  }, [rows, field])

  // Build ranks for choropleth
  const bands = 5
  const ranks = useMemo(() => {
    if (byHex.length === 0) return new Map<string, number>()
    const values = byHex.map((h) => h.value).sort((a, b) => a - b)
    const cuts = Array.from({length: bands}, (_, i) => {
      const p = (i + 1) / bands
      const idx = Math.max(
        0,
        Math.min(values.length - 1, Math.floor(values.length * p) - 1),
      )
      return values[idx]
    })
    const map = new Map<string, number>()
    for (const h of byHex) {
      let rank = 0
      while (rank < bands - 1 && h.value > cuts[rank]) rank++
      map.set(h.hex, rank)
    }
    return map
  }, [byHex])

  const center = useMemo<[number, number]>(() => {
    if (byHex.length > 0) return [byHex[0].lat, byHex[0].lon]
    return [37.7749, -122.4194] // SF fallback
  }, [byHex])

  const totalsText = useMemo(() => {
    const total = byHex.reduce((s, h) => s + (h.value || 0), 0)
    const label =
      field === 'witness'
        ? 'Witness'
        : field === 'beacon'
        ? 'Beacon'
        : field === 'coverage'
        ? 'Coverage'
        : 'Data'
    return `Hexes: ${byHex.length} • Total ${label}: ${fmt.format(total)}`
  }, [byHex, field])

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
          <option value="witness">Witness</option>
          <option value="beacon">Beacon</option>
          <option value="coverage">Coverage</option>
          <option value="data">Data</option>
        </select>

        <label className="text-xs text-white/60">H3 Resolution</label>
        <select
          className="rounded bg-black/30 border border-white/10 px-2 py-1"
          value={res}
          onChange={(e) => setRes(Number(e.target.value))}
        >
          <option value={7}>r7</option>
          <option value={8}>r8</option>
          <option value={9}>r9</option>
          <option value={10}>r10</option>
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

      <div className="text-xs text-white/60">
        Server Range:{' '}
        {serverRange?.from && serverRange?.to
          ? `${serverRange.from} → ${serverRange.to}`
          : '—'}{' '}
        • Last Updated:{' '}
        {lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'} •{' '}
        {totalsText}
      </div>

      <div className="rounded border border-white/10 overflow-hidden">
        {mounted ? (
          <MapContainer
            center={center as any}
            zoom={12}
            style={{height: '640px', width: '100%'}}
            preferCanvas
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
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
                >
                  <Tooltip>
                    <div className="text-xs">
                      <div>{h.hex}</div>
                      <div>
                        {field}: {fmt.format(h.value)}
                      </div>
                    </div>
                  </Tooltip>
                </Polygon>
              )
            })}
          </MapContainer>
        ) : (
          <div className="p-6 text-sm text-white/60">Loading map…</div>
        )}
      </div>
    </div>
  )
}
