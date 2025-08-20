'use client'

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import 'leaflet/dist/leaflet.css'
import {MapContainer, TileLayer, Polygon, Tooltip} from 'react-leaflet'
import {cellToBoundary, cellToLatLng} from 'h3-js'
import * as L from 'leaflet'
import _ from 'lodash'

import GlobalStyles from './GlobalStyles'
import LegendControl from './LegendControl'
import ForecastHatchDefs from './ForecastHatchDefs'
import Beacon from './Beacon'
import ModeToggle from './controls/ModeToggle'
import Inspector from './Inspector'
import LassoLayer from './LassoLayer'
import ForecastOptions, {AggMode} from './controls/ForecastOptions'
import PerDayControl from './controls/PerDayControl'

import {fmt, prettyFieldLabel} from '@/lib/utils/format'
import {colorForRank, PaletteKey} from '@/lib/utils/colors'
import {prefersReducedMotion} from '@/lib/utils/motion'
import {ApiResponse, H3Row, Mode} from '@/types/iot'
import {useSpring, animated} from '@react-spring/web'

const AnimatedTooltipValue = ({
  value,
  format = true,
}: {
  value: number
  format?: boolean
}) => {
  const props = useSpring({
    val: value,
    from: {val: value},
    config: {
      tension: 280,
      friction: 60,
      precision: 0.0001,
    },
  })

  return (
    <animated.span
      className="tooltip-value"
      style={{
        fontVariantNumeric: 'tabular-nums',
        display: 'inline-block',
        minWidth: '60px',
        textAlign: 'right',
      }}
    >
      {props.val.to((x) => (format ? fmt.format(x) : x.toFixed(4)))}
    </animated.span>
  )
}

const AnimatedProgressBar = ({value, max}: {value: number; max: number}) => {
  const percentage = Math.min((value / max) * 100, 100)

  const props = useSpring({
    width: percentage,
    from: {width: 0},
    config: {
      tension: 280,
      friction: 60,
    },
  })

  return (
    <div className="tooltip-stat-bar">
      <animated.div
        className="tooltip-stat-fill"
        style={{
          width: props.width.to((x) => `${x}%`),
        }}
      />
    </div>
  )
}

const MapSkeleton = () => (
  <div className="map-skeleton-container">
    <div className="skeleton-grid">
      {Array.from({length: 12}).map((_, i) => (
        <div
          key={i}
          className="hex-skeleton"
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
    <div className="skeleton-loading-text">
      <div className="skeleton-spinner" />
      <span>Loading hex data...</span>
    </div>
  </div>
)
const AnimatedStat = ({
  value,
  label,
  suffix = '',
}: {
  value: number
  label: string
  suffix?: string
}) => {
  const props = useSpring({
    val: value,
    from: {val: 0},
    config: {tension: 280, friction: 60},
  })

  return (
    <span className="stat-value">
      <animated.span>
        {props.val.to((x) => fmt.format(Math.floor(x)))}
      </animated.span>
      {suffix && <span className="stat-suffix">{suffix}</span>}
    </span>
  )
}

const leafMapCache: {map: L.Map | null} = {map: null}
let leafMapEpoch = 0

type HintKind = 'info' | 'warn' | 'error' | 'success'
type Hint = {
  kind: HintKind
  text: string
  actions?: {label: string; onClick: () => void}[]
}

function polygonAreaKm2(coords: [number, number][]): number {
  if (coords.length < 3) return 0
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const lat0 = toRad(coords[0][0])
  const x = (lat: number, lon: number) => toRad(lon) * Math.cos(lat0)
  const y = (lat: number) => toRad(lat)
  let sum = 0
  for (let i = 0; i < coords.length; i++) {
    const [lat1, lon1] = coords[i]
    const [lat2, lon2] = coords[(i + 1) % coords.length]
    const x1 = x(lat1, lon1)
    const y1 = y(lat1)
    const x2 = x(lat2, lon2)
    const y2 = y(lat2)
    sum += x1 * y2 - x2 * y1
  }
  const area = Math.abs(sum) * 0.5 * R * R
  return area
}

export default function MapCanvas() {
  const [mounted, setMounted] = useState(false)

  const [field, setFieldState] = useState<keyof H3Row>('total_rewards')
  const [from, setFromState] = useState('')
  const [to, setToState] = useState('')

  const [paletteMode, setPaletteMode] = useState<PaletteKey>('default')

  const [mode, setMode] = useState<Mode>('observed')

  // Horizon is capped to 4 (temporary)
  const [horizon, setHorizon] = useState<number>(4)

  const [selectedHex, setSelectedHexState] = useState<string | null>(null)
  const [hoverHex, setHoverHex] = useState<string | null>(null)

  const [rows, setRows] = useState<H3Row[]>([])
  const [totals, setTotals] = useState<ApiResponse['totals'] | null>(null)

  const [loading, setLoading] = useState(false)
  const [progressPhase, setProgressPhase] = useState<
    'idle' | 'start' | 'mid' | 'done'
  >('idle')

  const mapRef = useRef<L.Map | null>(leafMapCache.map)
  const [mapReady, setMapReady] = useState<boolean>(Boolean(leafMapCache.map))
  const [mapEpoch, setMapEpoch] = useState<number>(
    leafMapCache.map ? leafMapEpoch : 0,
  )

  // Lasso state
  const [lassoActive, setLassoActive] = useState(false)
  const [selectedHexesLasso, setSelectedHexesLasso] = useState<string[] | null>(
    null,
  )
  const [lassoPoly, setLassoPoly] = useState<[number, number][] | null>(null)

  // Inline hint bar
  const [hint, setHint] = useState<Hint | null>(null)

  // Forecast scenario + aggregation
  const [agg, setAgg] = useState<AggMode>('sum')
  const [scenario, setScenario] = useState<{poc: number; data: number}>({
    poc: 1,
    data: 1,
  })

  // Per-day playback
  const [perDay, setPerDay] = useState(false)
  const [day, setDay] = useState(1)
  const [playing, setPlaying] = useState(false)

  // Advanced popover
  const [showAdvanced, setShowAdvanced] = useState(false)

  // URL helpers
  const pushUrl = useCallback(
    (next: {
      field?: keyof H3Row
      from?: string
      to?: string
      hex?: string | null
      palette?: PaletteKey
      mode?: Mode
      horizon?: number
      agg?: AggMode
      poly?: [number, number][] | null
      per?: boolean
      d?: number
    }) => {
      const url = new URL(window.location.href)
      const params = url.searchParams
      if (next.field) params.set('field', String(next.field))
      if (next.from !== undefined)
        next.from ? params.set('from', next.from) : params.delete('from')
      if (next.to !== undefined)
        next.to ? params.set('to', next.to) : params.delete('to')
      if (next.hex !== undefined)
        next.hex ? params.set('hex', next.hex) : params.delete('hex')
      if (next.palette) params.set('palette', next.palette)
      if (next.mode) params.set('mode', next.mode)
      if (next.horizon !== undefined)
        params.set('horizon', String(next.horizon))
      if (next.agg) params.set('agg', next.agg)
      if (next.poly !== undefined) {
        if (next.poly && next.poly.length >= 3) {
          params.set('poly', encodeURIComponent(JSON.stringify(next.poly)))
        } else {
          params.delete('poly')
        }
      }
      if (next.per !== undefined) params.set('per', String(next.per))
      if (next.d !== undefined) params.set('d', String(next.d))
      window.history.replaceState(
        {},
        '',
        `${url.pathname}?${params.toString()}${url.hash}`,
      )
    },
    [],
  )

  // Initialize from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qField = params.get('field') as keyof H3Row | null
    const qFrom = params.get('from') || ''
    const qTo = params.get('to') || ''
    const qHex = params.get('hex')
    const qPalette = (params.get('palette') as PaletteKey) || 'default'
    const qMode = (params.get('mode') as Mode) || 'observed'
    const qAgg = (params.get('agg') as AggMode) || 'sum'
    const qPer = params.get('per')
    const qD = Number(params.get('d') || '1')

    if (qField) setFieldState(qField)
    if (qFrom) setFromState(qFrom)
    if (qTo) setToState(qTo)
    if (qHex) setSelectedHexState(qHex)
    setPaletteMode(qPalette)
    setMode(qMode === 'forecast' ? 'forecast' : 'observed')
    setAgg(qAgg === 'avg' ? 'avg' : 'sum')
    setPerDay(qPer === 'true')
    if (!Number.isNaN(qD)) setDay(Math.max(1, Math.min(4, qD)))

    setMounted(true)
  }, [])

  // Sync URL
  useEffect(() => {
    if (!mounted) return
    pushUrl({
      field,
      from,
      to,
      hex: selectedHex,
      palette: paletteMode,
      mode,
      horizon,
      agg,
      poly: lassoPoly,
      per: perDay,
      d: day,
    })
  }, [
    mounted,
    field,
    from,
    to,
    selectedHex,
    paletteMode,
    mode,
    horizon,
    agg,
    lassoPoly,
    perDay,
    day,
    pushUrl,
  ])

  // Keep day in range (1..4)
  useEffect(() => {
    setDay((d) => Math.min(Math.max(1, d), 4))
  }, [horizon])

  // Playback timer
  useEffect(() => {
    if (!perDay || !playing) return
    const id = window.setInterval(() => {
      setDay((d) => (d >= 4 ? 1 : d + 1))
    }, 900)
    return () => window.clearInterval(id)
  }, [perDay, playing])

  const setField = (f: keyof H3Row) => setFieldState(f)
  const setFrom = (v: string) => setFromState(v)
  const setTo = (v: string) => setToState(v)
  const setSelectedHex = (hex: string | null) => setSelectedHexState(hex)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'Enter') {
        e.preventDefault()
        const fake = new Event('submit') as unknown as React.FormEvent
        onApply(fake)
        return
      }
      if (e.key.toLowerCase() === 'l') setLassoActive((v) => !v)
      if (e.key === 'Escape') {
        if (lassoActive) setLassoActive(false)
        else if (selectedHexesLasso || lassoPoly) {
          setSelectedHexesLasso(null)
          setLassoPoly(null)
        }
      }
      if (mode === 'forecast') {
        if (e.key === '+') setDay((d) => Math.min(4, d + 1))
        if (e.key === '-') setDay((d) => Math.max(1, d - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lassoActive, selectedHexesLasso, lassoPoly, mode])

  const hoverTimeoutRef = useRef<number | null>(null)
  const setHoverHexSafe = (hex: string | null) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (hex === null) {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setHoverHex(null)
        hoverTimeoutRef.current = null
      }, 60)
    } else {
      setHoverHex(hex)
    }
  }
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  const selectedData = useMemo(() => {
    if (!selectedHex) return null
    return rows.filter((r) => r.hex === selectedHex)
  }, [rows, selectedHex])

  // Progress phases
  useEffect(() => {
    if (loading) {
      setProgressPhase('start')
      const t1 = setTimeout(() => setProgressPhase('mid'), 250)
      return () => clearTimeout(t1)
    } else if (progressPhase !== 'idle') {
      setProgressPhase('done')
      const t2 = setTimeout(() => {
        setProgressPhase((p) => (loading ? p : 'idle'))
      }, 380)
      return () => clearTimeout(t2)
    }
  }, [loading, progressPhase])

  // Hints lifecycle
  useEffect(() => {
    if (
      mode === 'forecast' &&
      (!lassoPoly || lassoPoly.length < 3) &&
      !selectedHex
    ) {
      setHint({
        kind: 'info',
        text: 'Draw a lasso to select hexes, or click a hex, then Apply.',
        actions: [{label: 'Start Lasso', onClick: () => setLassoActive(true)}],
      })
    } else if (
      mode === 'forecast' &&
      lassoPoly &&
      lassoPoly.length >= 3 &&
      !loading &&
      byHex.length === 0
    ) {
      setHint({
        kind: 'warn',
        text: 'No hexes in region for current filters.',
        actions: [
          {label: 'Retry', onClick: () => onApply(new Event('submit') as any)},
          {
            label: 'Clear Lasso',
            onClick: () => {
              setSelectedHexesLasso(null)
              setLassoPoly(null)
            },
          },
        ],
      })
    } else {
      setHint(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lassoPoly, loading /* byHex length wired below */])

  // Overlay reveal sweep
  const runOverlayReveal = useCallback(() => {
    try {
      const map = mapRef.current as any
      const svg: SVGSVGElement | null =
        map?._panes?.overlayPane?.querySelector('svg') || null
      if (!svg) return
      svg.classList.add('reveal')
      void svg.offsetWidth
      svg.classList.add('run')
      setTimeout(() => {
        svg.classList.remove('run')
        svg.classList.remove('reveal')
      }, 360)
    } catch {}
  }, [])

  const abortRef = useRef<AbortController | null>(null)
  async function fetchHexes(signal?: AbortSignal) {
    try {
      setLoading(true)
      if (
        mode === 'forecast' &&
        !selectedHex &&
        (!lassoPoly || lassoPoly.length < 3)
      ) {
        setRows([])
        setTotals(null)
        setLoading(false)
        return
      }
      const q = new URLSearchParams()
      if (from) q.set('from', from)
      if (to) q.set('to', to)
      if (mode === 'forecast') {
        q.set('forecast', 'true')
        q.set('horizon', String(Math.min(4, horizon)))
        if (lassoPoly && lassoPoly.length >= 3)
          q.set('poly', JSON.stringify(lassoPoly))
        if (!lassoPoly && selectedHex) q.set('hex', selectedHex)
      }
      const r = await fetch(`/api/iot/h3/daily?${q.toString()}`, {signal})
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
      if (mode === 'forecast') runOverlayReveal()
    } catch (e) {
      if ((e as any).name !== 'AbortError') {
        setRows([])
        setTotals(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch (observed)
  useEffect(() => {
    if (!mounted) return
    if (mode !== 'observed') return
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    fetchHexes(ctl.signal)
    return () => ctl.abort()
  }, [mounted])

  // Debounced auto-fetch forecast once region/hex exists
  useEffect(() => {
    if (!mounted) return
    if (mode !== 'forecast') return
    if (!selectedHex && (!lassoPoly || lassoPoly.length < 3)) return
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    const id = window.setTimeout(() => fetchHexes(ctl.signal), 380)
    return () => {
      ctl.abort()
      window.clearTimeout(id)
    }
  }, [mode, horizon, lassoPoly, selectedHex, mounted])

  const onApply = (e: React.FormEvent) => {
    e.preventDefault()
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    fetchHexes(ctl.signal)
  }

  // Aggregate
  const byHex = useMemo(() => {
    type Row = H3Row & {lat: number; lon: number}
    const m = new Map<
      string,
      {
        hex: string
        lat: number
        lon: number
        value: number
        hotspot_count: number
        density_k1: number
        lower_band?: number
        upper_band?: number
        rel_unc?: number
      }
    >()
    if (mode === 'forecast') {
      const grouped = _.groupBy(rows as Row[], 'hex')
      for (const hexId in grouped) {
        const hexRows = grouped[hexId]
        const fRows = hexRows
          .filter(
            (r) =>
              r.forecasted_total != null ||
              r.forecasted_poc != null ||
              r.forecasted_dc != null,
          )
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          )

        const sumPoc = _.sumBy(hexRows, (r) => r.forecasted_poc ?? 0)
        const sumData = _.sumBy(hexRows, (r) => r.forecasted_dc ?? 0)
        const sumTot =
          _.sumBy(hexRows, (r) => r.forecasted_total ?? 0) || sumPoc + sumData

        const adjustedSum = scenario.poc * sumPoc + scenario.data * sumData

        const lastRow = hexRows[hexRows.length - 1]

        let value = 0
        let lower = 0
        let upper = 0

        if (perDay && fRows.length > 0) {
          const idx = Math.min(Math.max(1, day), Math.min(4, fRows.length)) - 1
          const r = fRows[idx]
          const poc = scenario.poc * ((r.forecasted_poc as number) ?? 0)
          const dc = scenario.data * ((r.forecasted_dc as number) ?? 0)
          const base = (r.forecasted_total as number | undefined) ?? poc + dc
          const totalAdj = poc + dc || base || 0
          const ratio = base > 0 ? totalAdj / base : 1
          value = totalAdj
          lower = (r.lower_band ?? 0) * ratio
          upper = (r.upper_band ?? 0) * ratio
        } else {
          const base = sumTot > 0 ? sumTot : adjustedSum
          const ratio = base > 0 ? adjustedSum / base : 1
          const avgLower = _.meanBy(hexRows, (r) => r.lower_band ?? 0) * ratio
          const avgUpper = _.meanBy(hexRows, (r) => r.upper_band ?? 0) * ratio
          const summed = adjustedSum
          value =
            agg === 'sum' ? summed : summed / Math.max(1, Math.min(4, horizon))
          lower =
            agg === 'sum'
              ? avgLower
              : avgLower / Math.max(1, Math.min(4, horizon))
          upper =
            agg === 'sum'
              ? avgUpper
              : avgUpper / Math.max(1, Math.min(4, horizon))
        }

        const relUnc = value > 0 ? (upper - lower) / Math.max(value, 1e-9) : 0

        m.set(hexId, {
          hex: hexId,
          lat: lastRow.lat!,
          lon: lastRow.lon!,
          value,
          hotspot_count: lastRow.hotspot_count,
          density_k1: lastRow.density_k1,
          lower_band: lower,
          upper_band: upper,
          rel_unc: Math.max(0, Math.min(1.5, relUnc)),
        })
      }
    } else {
      for (const r of rows as Row[]) {
        const observedVal = (r[field] as number) ?? 0
        const cur =
          m.get(r.hex) ??
          ({
            hex: r.hex,
            lat: r.lat!,
            lon: r.lon!,
            value: 0,
            hotspot_count: r.hotspot_count,
            density_k1: r.density_k1,
          } as const)
        m.set(r.hex, {
          ...cur,
          value: cur.value + observedVal,
        })
      }
    }
    return [...m.values()]
  }, [rows, field, mode, scenario, agg, horizon, perDay, day])

  // Update hint when byHex changes
  useEffect(() => {
    if (
      mode === 'forecast' &&
      !selectedHex &&
      (!lassoPoly || lassoPoly.length < 3)
    ) {
      setHint({
        kind: 'info',
        text: 'Draw a lasso to select hexes, or click a hex, then Apply.',
        actions: [{label: 'Start Lasso', onClick: () => setLassoActive(true)}],
      })
    } else if (
      mode === 'forecast' &&
      (lassoPoly || selectedHex) &&
      !loading &&
      byHex.length === 0
    ) {
      setHint({
        kind: 'warn',
        text: 'No hexes in region for current filters.',
        actions: [
          {label: 'Retry', onClick: () => onApply(new Event('submit') as any)},
          {
            label: 'Clear',
            onClick: () => {
              setSelectedHexesLasso(null)
              setLassoPoly(null)
              setSelectedHex(null)
            },
          },
        ],
      })
    } else {
      setHint(null)
    }
  }, [mode, lassoPoly, selectedHex, byHex.length, loading])

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
    return [37.7749, -122.4194]
  }, [byHex])

  const totalsText = useMemo(() => {
    const label = prettyFieldLabel(String(field))
    const total = byHex.reduce((acc, h) => acc + (h.value ?? 0), 0)
    const suffix =
      mode === 'forecast'
        ? perDay
          ? ` (H+${day})`
          : agg === 'sum'
          ? ' (Next 4d Sum)'
          : ' (Next 4d Daily Avg)'
        : ''
    return {
      hexes: byHex.length,
      label,
      total,
      suffix,
    }
  }, [byHex, field, mode, agg, perDay, day])

  const boundaryCache = useMemo(() => new Map<string, [number, number][]>(), [])
  const getBoundary = (hex: string) => {
    if (boundaryCache.has(hex)) return boundaryCache.get(hex)!
    const b = cellToBoundary(hex).map(
      ([lat, lng]) => [lat, lng] as [number, number],
    )
    boundaryCache.set(hex, b)
    return b
  }

  const activeHex = selectedHex ?? hoverHex

  // Fly to selected hex
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedHex) return
    const h = byHex.find((x) => x.hex === selectedHex)
    if (!h) return

    const reduce = prefersReducedMotion()
    const raf = requestAnimationFrame(() => {
      const current = map.getCenter()
      const target = L.latLng(h.lat, h.lon)
      let distMeters = current.distanceTo(target)
      const tiny = 0.75
      const nudge = (val: number) => val + (Math.random() * 1e-6 - 5e-7)
      const isAnimating = (map as any)._animateToCenter != null
      const finalTarget =
        distMeters < tiny && !isAnimating
          ? L.latLng(nudge(h.lat), nudge(h.lon))
          : target
      distMeters = map.distance(current, finalTarget)
      const duration = reduce
        ? 0
        : Math.min(0.9, Math.max(0.3, distMeters / 50000))
      const targetZoom = Math.max(map.getZoom(), 7)
      map.flyTo(finalTarget, targetZoom, {
        duration,
        easeLinearity: 0.25,
        animate: !reduce,
        noMoveStart: false,
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [selectedHex, byHex])

  // Autofocus region on zero results
  useEffect(() => {
    if (!mapRef.current) return
    if (
      mode === 'forecast' &&
      lassoPoly &&
      lassoPoly.length >= 3 &&
      byHex.length === 0 &&
      !loading
    ) {
      const bounds = L.latLngBounds(
        lassoPoly.map(([lat, lon]) => [lat, lon] as [number, number]),
      )
      const reduce = prefersReducedMotion()
      mapRef.current.fitBounds(bounds, {animate: !reduce, padding: [40, 40]})
      setLassoActive(true)
    }
  }, [mode, lassoPoly, byHex.length, loading])

  const resetView = () => {
    const map = mapRef.current
    if (!map) return
    const reduce = prefersReducedMotion()
    map.flyTo(center as L.LatLngExpression, 6, {
      duration: reduce ? 0 : 0.6,
      easeLinearity: 0.25,
      animate: !reduce,
    })
  }

  const selectedSet =
    selectedHexesLasso && new Set(selectedHexesLasso as string[])

  const regionHexCount = lassoPoly ? byHex.length : 0
  const regionArea = lassoPoly ? polygonAreaKm2(lassoPoly) : 0

  const dayPct = useMemo(() => {
    const span = Math.max(1, 4 - 1)
    return ((Math.min(4, Math.max(1, day)) - 1) / span) * 100
  }, [day])
  const dayTrackBg = useMemo(() => {
    return `linear-gradient(90deg, var(--accent-primary) ${dayPct}%, rgba(148, 163, 184, 0.15) ${dayPct}%)`
  }, [dayPct])

  return (
    <div className="space-y-3 relative">
      <GlobalStyles />

      <form onSubmit={onApply} className="map-toolbar-container">
        <div className="map-toolbar glass-pro">
          {/* Row 1: Field selection and controls */}
          <div className="toolbar-row">
            <div className="field-group">
              <span className="toolbar-label">Field</span>
              <div className="chip-group">
                {[
                  {v: 'total_rewards', l: 'Total', icon: '∑'},
                  {v: 'poc_rewards', l: 'PoC', icon: '◈'},
                  {v: 'dc_rewards', l: 'Data', icon: '⬢'},
                  {v: 'hotspot_count', l: 'Hotspots', icon: '•'},
                  {v: 'density_k1', l: 'k=1 Density', icon: '◉'},
                  {v: 'ma_3d_total', l: '3D MA Total', icon: '∿'},
                  {v: 'ma_3d_poc', l: '3D MA PoC', icon: '∿'},
                  {v: 'transmit_scale_approx', l: 'Tx Scale', icon: '⟳'},
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setField(opt.v as keyof H3Row)}
                    className={`chip-enhanced ${
                      field === (opt.v as keyof H3Row) ? 'active' : ''
                    }`}
                    aria-pressed={field === (opt.v as keyof H3Row)}
                  >
                    <span className="chip-icon">{opt.icon}</span>
                    <span className="chip-label">{opt.l}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mode-toggle-wrapper">
              <ModeToggle
                mode={mode}
                onChange={(m) => {
                  setMode(m)
                  if (m === 'observed') {
                    setShowAdvanced(false)
                    setPerDay(false)
                  }
                }}
              />
            </div>

            <div className="flex-1" />

            <div className="toolbar-actions">
              <label className="palette-toggle">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={paletteMode === 'cbf'}
                  onChange={(e) =>
                    setPaletteMode(e.target.checked ? 'cbf' : 'default')
                  }
                />
                <span className="palette-toggle-track">
                  <span className="palette-toggle-thumb" />
                </span>
                <span className="palette-toggle-label">CBF Palette</span>
              </label>

              <button
                type="button"
                onClick={() => setLassoActive((v) => !v)}
                className={`lasso-btn ${lassoActive ? 'active' : ''}`}
                title="Freehand lasso to select an area (L)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="lasso-icon"
                >
                  <path
                    d="M2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={lassoActive ? '2 2' : 'none'}
                  />
                  <path
                    d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={lassoActive ? '2 2' : 'none'}
                  />
                </svg>
                <span>Lasso</span>
                <kbd className="lasso-kbd">L</kbd>
              </button>

              <button type="submit" className="apply-btn-pro">
                <span className="apply-btn-text">Apply</span>
                <span className="apply-btn-shine" />
              </button>
            </div>
          </div>

          {/* Row 2: Forecast controls */}
          {mode === 'forecast' && (
            <div className="toolbar-row forecast-row">
              <div className="forecast-badge">
                <span className="forecast-badge-icon">⟳</span>
                <span>Next 4 days</span>
              </div>

              <div className="agg-toggle">
                <span className="toolbar-label">Aggregate</span>
                {(['sum', 'avg'] as AggMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAgg(m)}
                    className={`agg-btn ${agg === m ? 'active' : ''}`}
                    title={
                      m === 'sum' ? 'Sum over next N days' : 'Daily average'
                    }
                  >
                    {m === 'sum' ? 'Sum' : 'Daily Avg'}
                  </button>
                ))}
              </div>

              {/* Per-day controls */}
              <div className="perday-controls">
                <PerDayControl
                  enabled={perDay}
                  onToggle={(v) => {
                    setPerDay(v)
                    if (!v) setPlaying(false)
                  }}
                  playing={playing}
                  onTogglePlay={() => setPlaying((p) => !p)}
                  day={day}
                  max={4}
                />
                <div className="day-slider-container">
                  <input
                    type="range"
                    min={1}
                    max={4}
                    value={Math.min(Math.max(1, day), 4)}
                    onChange={(e) => setDay(Number(e.target.value))}
                    className="day-slider"
                    aria-label="Per-day horizon scrubber"
                    style={{
                      background: dayTrackBg,
                      opacity: perDay ? 1 : 0.5,
                    }}
                    disabled={!perDay}
                  />
                  <span
                    className="day-bubble"
                    style={{left: `calc(${dayPct}% - 20px)`}}
                    aria-hidden
                  >
                    H+{Math.min(Math.max(1, day), 4)}
                  </span>
                </div>
              </div>

              {/* Advanced popover */}
              <div className="relative">
                <button
                  type="button"
                  className={`advanced-toggle ${showAdvanced ? 'active' : ''}`}
                  onClick={() => setShowAdvanced((v) => !v)}
                  title="Show PoC/Data multipliers"
                >
                  <span>Advanced</span>
                  <svg
                    width="12"
                    height="12"
                    className={`advanced-icon ${showAdvanced ? 'rotate' : ''}`}
                  >
                    <path
                      d="M3 5L6 8L9 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </button>
                {showAdvanced && (
                  <div className="advanced-popover glass-pro">
                    <ForecastOptions
                      poc={scenario.poc}
                      data={scenario.data}
                      onPoc={(v) => setScenario((s) => ({...s, poc: v}))}
                      onData={(v) => setScenario((s) => ({...s, data: v}))}
                      agg={agg}
                      onAgg={setAgg}
                    />
                    <button
                      type="button"
                      className="advanced-close"
                      onClick={() => setShowAdvanced(false)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M12 4L4 12M4 4L12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Stats bar */}
      <div className="stats-bar glass">
        <div className="stat-item">
          <span className="stat-icon">⬢</span>
          <span className="stat-label">Hexes</span>
          <AnimatedStat value={totalsText.hexes} />
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-icon">∑</span>
          <span className="stat-label">Total {totalsText.label}</span>
          <AnimatedStat value={totalsText.total} suffix={totalsText.suffix} />
        </div>
        {lassoPoly && lassoPoly.length >= 3 && (
          <>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-icon">◈</span>
              <span className="stat-label">Region Area</span>
              <AnimatedStat value={regionArea} suffix=" km²" />
            </div>
          </>
        )}
      </div>

      {/* Map container */}
      <div className="map-wrapper">
        {/* Progress bar */}
        <div
          className={`map-progress ${progressPhase !== 'idle' ? 'active' : ''}`}
          style={{
            width:
              progressPhase === 'start'
                ? '40%'
                : progressPhase === 'mid'
                ? '70%'
                : progressPhase === 'done'
                ? '100%'
                : '0%',
          }}
        />

        {loading && mode === 'observed' && (
          <div className="map-skeleton-overlay">
            <MapSkeleton />
          </div>
        )}

        {/* Reset view button */}
        <button
          type="button"
          onClick={resetView}
          className="reset-view-btn glass"
          title="Reset view"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M14 8A6 6 0 112 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M14 4V8H10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Reset View</span>
        </button>

        <MapContainer
          whenCreated={(m: L.Map) => {
            leafMapCache.map = m
            mapRef.current = m
            leafMapEpoch += 1
            setMapEpoch(leafMapEpoch)
            setMapReady(true)
          }}
          center={center as [number, number]}
          zoom={6}
          style={{
            height: '640px',
            width: '100%',
            backgroundColor: '#0a0e14',
            cursor: lassoActive ? 'crosshair' : 'inherit',
          }}
          preferCanvas
          zoomControl
          className={`map-canvas ${
            (selectedHex || selectedHexesLasso) && byHex.length > 0
              ? 'dim-others'
              : ''
          } ${loading && mode === 'forecast' ? 'loading' : ''}`}
          onclick={() => {
            if (hint) setHint(null)
            if (selectedHex) {
              setSelectedHex(null)
              setHoverHex(null)
            }
          }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <LegendControl
            cuts={cuts}
            field={String(field)}
            palette={paletteMode}
            mode={mode}
          />

          {mode === 'forecast' && <ForecastHatchDefs />}

          {mapReady &&
            selectedHex &&
            (() => {
              const h = byHex.find((x) => x.hex === selectedHex)
              return h ? <Beacon lat={h.lat} lon={h.lon} /> : null
            })()}

          <LassoLayer
            active={lassoActive}
            allHexes={byHex.map((h) => ({
              hex: h.hex,
              lat: h.lat,
              lon: h.lon,
            }))}
            onSelected={(hexes) => {
              setSelectedHexesLasso(hexes)
              if (hexes && mode !== 'forecast') setMode('forecast')
            }}
            onPolygon={(poly) => setLassoPoly(poly)}
          />

          {byHex.map((h) => {
            const boundary = getBoundary(h.hex)
            const rank = ranks.get(h.hex) ?? 0
            const fill = colorForRank(rank, paletteMode)

            let pct = 1
            if (cuts.length) {
              const max = cuts[cuts.length - 1] || 1
              pct = Math.max(0.02, Math.min(1, h.value / max))
            }

            const isActive =
              activeHex === h.hex || (selectedSet && selectedSet.has(h.hex))

            const baseWeight = isActive ? 2.5 : 0.8
            const extra =
              mode === 'forecast'
                ? 1.7 * Math.min(1, (h.rel_unc ?? 0) / 1.0)
                : 0

            const baseStyle: L.PathOptions = {
              color: isActive ? '#ffffff' : '#d8e1ff',
              weight: baseWeight + extra,
              opacity: isActive ? 1.0 : 0.65,
              fillColor: fill,
              fillOpacity: isActive ? 0.75 : 0.5,
            }

            const forecastCue: L.PathOptions =
              mode === 'forecast'
                ? ({dashArray: '3 3'} as L.PathOptions)
                : ({} as L.PathOptions)

            return (
              <Polygon
                key={h.hex}
                positions={boundary}
                pathOptions={{...baseStyle, ...forecastCue}}
                eventHandlers={{
                  add: (e) => {
                    if (mode !== 'forecast') return
                    const el = (e as any).target?._path as
                      | SVGPathElement
                      | undefined
                    if (!el) return
                    queueMicrotask(() => {
                      const svg = el.ownerSVGElement
                      if (svg?.querySelector('#forecastHatch')) {
                        try {
                          el.setAttribute('fill', 'url(#forecastHatch)')
                        } catch {}
                      }
                    })
                  },
                  click: () => setSelectedHex(h.hex),
                  mouseover: (e) => {
                    if (lassoActive) return
                    setHoverHexSafe(h.hex)
                    const layer = e.target as any
                    if (selectedHex !== h.hex && !selectedSet?.has(h.hex)) {
                      layer.setStyle({
                        weight: (baseWeight + extra) * 1.2,
                        opacity: 0.95,
                        fillOpacity: 0.7,
                      })
                    }
                    layer._path?.classList.add('hex-hover')
                  },
                  mouseout: (e) => {
                    if (lassoActive) return
                    setHoverHexSafe(null)
                    const layer = e.target as any
                    if (selectedHex !== h.hex && !selectedSet?.has(h.hex)) {
                      layer.setStyle({...baseStyle, ...forecastCue})
                      layer._path?.classList.remove('hex-hover')
                    }
                  },
                  tooltipopen: (e) => {
                    const el = (e as any).tooltip?._container as
                      | HTMLElement
                      | undefined
                    if (el) {
                      el.classList.add('hex-tooltip-visible')
                      // Add subtle entrance animation
                      el.style.animation =
                        'tooltipSlideIn 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }
                  },
                  tooltipclose: (e) => {
                    const el = (e as any).tooltip?._container as
                      | HTMLElement
                      | undefined
                    if (el) {
                      el.classList.remove('hex-tooltip-visible')
                    }
                  },
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -14]}
                  sticky
                  className="hex-tooltip-pro"
                >
                  <div className="tooltip-header">
                    <span className="tooltip-title">{h.hex}</span>
                    {mode === 'forecast' && (
                      <span className="tooltip-badge forecast">
                        <span className="forecast-icon">⚡</span>
                        Forecast
                      </span>
                    )}
                  </div>
                  <div className="tooltip-content">
                    <div className="tooltip-stat">
                      <div className="tooltip-row">
                        <span className="tooltip-label">
                          {prettyFieldLabel(String(field))}
                          {mode === 'forecast'
                            ? perDay
                              ? ` (H+${Math.min(Math.max(1, day), 4)})`
                              : ` (4d ${agg === 'sum' ? 'sum' : 'avg'})`
                            : ''}
                        </span>
                        <AnimatedTooltipValue value={h.value} />
                      </div>
                      <AnimatedProgressBar
                        value={h.value}
                        max={cuts[cuts.length - 1] || 1}
                      />
                    </div>

                    {'lower_band' in h &&
                      'upper_band' in h &&
                      mode === 'forecast' &&
                      h.lower_band !== undefined &&
                      h.upper_band !== undefined && (
                        <div className="tooltip-row">
                          <span className="tooltip-label">Band (5-95%)</span>
                          <span
                            className="tooltip-value"
                            style={{display: 'flex', gap: '4px'}}
                          >
                            <AnimatedTooltipValue value={h.lower_band!} />
                            <span>-</span>
                            <AnimatedTooltipValue value={h.upper_band!} />
                          </span>
                        </div>
                      )}

                    <div className="tooltip-stat">
                      <div className="tooltip-row">
                        <span className="tooltip-label">k=1 Density</span>
                        <AnimatedTooltipValue value={h.density_k1} />
                      </div>
                      <AnimatedProgressBar value={h.density_k1} max={200} />
                    </div>

                    <div className="tooltip-row">
                      <span className="tooltip-label">Band</span>
                      <span className="tooltip-value">
                        {(ranks.get(h.hex) ?? 0) + 1} / {bands}
                      </span>
                    </div>

                    <div className="tooltip-row">
                      <span className="tooltip-label">Hotspots</span>
                      <span className="tooltip-value">
                        {fmt.format(h.hotspot_count)}
                      </span>
                    </div>
                  </div>

                  <div className="tooltip-actions">
                    <button
                      className="tooltip-action"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedHex(h.hex)
                      }}
                    >
                      View Details
                    </button>
                    <button
                      className="tooltip-action"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      Compare
                    </button>
                  </div>
                </Tooltip>
              </Polygon>
            )
          })}
        </MapContainer>

        {selectedData && (
          <Inspector
            open={Boolean(selectedHex)}
            field={field}
            paletteMode={paletteMode}
            hexData={selectedData}
            onClose={() => {
              setSelectedHex(null)
              setHoverHex(null)
            }}
            mode={mode}
            horizon={4}
            scenario={scenario}
          />
        )}
      </div>

      {hint && (
        <div
          role="status"
          aria-live="polite"
          className={`hint-bar glass ${hint.kind}`}
        >
          <div className="hint-content">
            <span className="hint-icon">
              {hint.kind === 'info' && 'ℹ'}
              {hint.kind === 'warn' && '⚠'}
              {hint.kind === 'error' && '✕'}
              {hint.kind === 'success' && '✓'}
            </span>
            <span className="hint-text">{hint.text}</span>
          </div>
          {hint.actions && hint.actions.length > 0 && (
            <div className="hint-actions">
              {hint.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={a.onClick}
                  className="hint-action-btn"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="hint-close"
            onClick={() => setHint(null)}
            aria-label="Dismiss hint"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M10 4L4 10M4 4L10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
