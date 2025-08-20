'use client'

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react'
import 'leaflet/dist/leaflet.css'
import {MapContainer, TileLayer, Polygon, Tooltip, useMap} from 'react-leaflet'
import {cellToBoundary, cellToLatLng} from 'h3-js'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip as RechartsTooltip,
} from 'recharts'
import * as L from 'leaflet'
import _ from 'lodash'

type H3Row = {
  date: string
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
  forecasted_poc?: number
  forecasted_dc?: number
  forecasted_total?: number
  lower_band?: number
  upper_band?: number
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

type Mode = 'observed' | 'forecast'

const fmt = new Intl.NumberFormat('en-US', {notation: 'compact'})

const palettes = {
  default: ['#183059', '#2d4b87', '#486ab9', '#6b8ee0', '#a8c1ff'],
  cbf: ['#3366cc', '#6699cc', '#99ccff', '#a1d99b', '#2ca25f'],
} as const

const DUR = {
  hover: 0.18,
  panel: 0.24,
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function colorForRank(
  rank: number,
  mode: keyof typeof palettes = 'default',
): string {
  const steps = palettes[mode]
  return steps[Math.min(steps.length - 1, Math.max(0, rank))]
}

function prettyFieldLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace('Ma ', 'MA ')
}

function formatChartDate(d: string): string {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/* Count-up tween hook for numeric changes */
function useCountUp(value: number, duration = 300): number {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  useEffect(() => {
    const reduce = prefersReducedMotion()
    const from = prevRef.current
    const to = value
    prevRef.current = value
    if (reduce) {
      setDisplay(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (to - from) * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return display
}

/* Global styles */
function GlobalStyles() {
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'map-global-styles'
    style.innerHTML = `
      :root {
        --hover-dur: ${DUR.hover}s;
        --panel-dur: ${DUR.panel}s;
        --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
      }

      .glass {
        background: rgba(8, 12, 18, 0.72);
        backdrop-filter: blur(12px) saturate(120%);
        -webkit-backdrop-filter: blur(12px) saturate(120%);
        box-shadow: 0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
      }
      .chip { transition: all var(--hover-dur) var(--ease-smooth); }
      .chip:not(.active):hover { background: rgba(255,255,255,0.08); }

      .legend i {
        width: 14px; height: 14px; border-radius: 3px; display: inline-block;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
      }
      .legend {
        background: rgba(8, 12, 18, 0.72);
        backdrop-filter: blur(10px);
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.12);
        padding: 10px 12px;
        color: rgba(255,255,255,0.9);
        font-size: 11px;
      }
      .legend .row { display:flex; align-items:center; gap:8px; line-height:1.15rem; }

      .leaflet-pane, .leaflet-top, .leaflet-bottom { z-index: 200; }
      .leaflet-tooltip-pane { z-index: 300; }

      .hex-tooltip.leaflet-tooltip {
        background: rgba(13,16,22,0.95);
        color: rgba(255,255,255,0.92);
        border: 1px solid rgba(255,255,255,0.16);
        border-radius: 10px;
        padding: 10px 12px;
        box-shadow: 0 10px 28px rgba(0,0,0,0.45);
        pointer-events: none;
        backdrop-filter: blur(8px) saturate(120%);
        -webkit-backdrop-filter: blur(8px) saturate(120%);
        max-width: 240px; white-space: normal;
        opacity: 0; transform: translateY(6px);
        transition: opacity var(--hover-dur) var(--ease-smooth),
                    transform var(--hover-dur) var(--ease-smooth);
      }
      .hex-tooltip.hex-visible { opacity: 1; transform: translateY(0); }
      .hex-tooltip .t-title { font-weight: 700; letter-spacing: .2px; margin-bottom: 4px; font-size: 12px; }
      .hex-tooltip .t-row { display:flex; justify-content:space-between; gap:10px; font-size:11px; line-height:1.05rem; }
      .hex-tooltip .muted { color: rgba(255,255,255,0.7); }
      .hex-tooltip .badge { font-size: 10px; padding: 1px 6px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); }
      .hex-tooltip .bar { height: 4px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; margin-top: 8px; }
      .hex-tooltip .bar > span { display: block; height: 100%; border-radius: inherit; }

      .hex-selected { filter: drop-shadow(0 0 10px rgba(255,255,255,0.18)); }

      .inspector { width: 360px; max-width: 92vw; z-index: 1000; }
      @media (min-width: 1536px) { .inspector { width: 420px; } }
      .inspector.anim-enter { opacity: 0; transform: translateX(12px); }
      .inspector.anim-enter-active { opacity: 1; transform: translateX(0); transition: opacity var(--panel-dur) var(--ease-smooth), transform var(--panel-dur) var(--ease-smooth); }
      .inspector.anim-exit { opacity: 1; transform: translateX(0); }
      .inspector.anim-exit-active { opacity: 0; transform: translateX(12px); transition: opacity var(--hover-dur) var(--ease-smooth), transform var(--hover-dur) var(--ease-smooth); }

      .modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.35);
        backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
        z-index: 950; opacity: 0; pointer-events: none; transition: opacity var(--hover-dur) var(--ease-smooth);
      }
      .modal-overlay.active { opacity: 1; pointer-events: auto; }

      .map-right-divider {
        position: absolute; top: 0; right: 0; width: 1px; height: 100%;
        background: linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0));
        pointer-events: none; z-index: 250;
      }

      .beacon-layer { position: absolute; inset: 0; pointer-events: none; z-index: 350; }
      .beacon { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 999px; background: rgba(139,92,246,0.95); box-shadow: 0 0 0 2px rgba(139,92,246,0.35); }
      .beacon::after { content: ''; position: absolute; inset: 0; border-radius: 999px; border: 2px solid rgba(139,92,246,0.45); animation: ping 1.5s ease-out infinite; }

      .top-progress {
        position: absolute; top: 0; left: 0; height: 2px; width: 0%;
        background: linear-gradient(90deg, #a78bfa, #60a5fa);
        transition: width var(--panel-dur) var(--ease-smooth), opacity var(--hover-dur) var(--ease-smooth);
        z-index: 500;
        opacity: 0;
      }
      .top-progress.active { opacity: 1; }

      .hex-layer.dim-others .leaflet-interactive {
        opacity: 0.45;
        transition: opacity var(--hover-dur) var(--ease-smooth);
      }
      .hex-layer.dim-others .leaflet-interactive.is-active {
        opacity: 1;
      }

      .slider {
        accent-color: #9ca3af;
        transition: filter var(--hover-dur) var(--ease-smooth);
      }
      .slider:hover { filter: brightness(1.1); }
      .slider:active::-webkit-slider-thumb { transform: scale(1.06); transition: transform 120ms var(--ease-smooth); }
      .slider:active::-moz-range-thumb { transform: scale(1.06); transition: transform 120ms var(--ease-smooth); }

      .hex-layer.loading .leaflet-interactive {
        animation: hexBreath 0.8s ease-in-out infinite alternate;
      }
      @keyframes hexBreath {
        from { fill-opacity: 0.45; }
        to { fill-opacity: 0.6; }
      }
      @media (prefers-reduced-motion: reduce) {
        .hex-layer.loading .leaflet-interactive { animation: none; }
        .beacon::after { animation: none; }
      }

      .leaflet-overlay-pane svg.reveal {
        -webkit-mask-image: linear-gradient(to right, black 60%, transparent 60%);
        mask-image: linear-gradient(to right, black 60%, transparent 60%);
        -webkit-mask-size: 200% 100%;
        mask-size: 200% 100%;
        -webkit-mask-position: 100% 0;
        mask-position: 100% 0;
        transition: -webkit-mask-position 320ms var(--ease-smooth);
        transition: mask-position 320ms var(--ease-smooth);
      }
      .leaflet-overlay-pane svg.reveal.run {
        -webkit-mask-position: 0 0;
        mask-position: 0 0;
      }
      @media (prefers-reduced-motion: reduce) {
        .leaflet-overlay-pane svg.reveal,
        .leaflet-overlay-pane svg.reveal.run {
          transition: none;
          -webkit-mask-image: none; mask-image: none;
        }
      }
    `
    if (!document.getElementById(style.id)) document.head.appendChild(style)
    return () => {
      const el = document.getElementById(style.id)
      if (el) el.remove()
    }
  }, [])
  return null
}

/* Mode toggle */
function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode
  onChange: (m: Mode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Data mode"
      className="inline-flex rounded-full border border-white/15 bg-white/5 p-0.5"
    >
      {[
        {v: 'observed', l: 'Observed'},
        {v: 'forecast', l: 'Forecast'},
      ].map((t) => (
        <button
          key={t.v}
          role="tab"
          aria-selected={mode === (t.v as Mode)}
          className={`px-3 py-1.5 text-xs rounded-full ${
            mode === (t.v as Mode)
              ? 'bg-white/15 text-white border border-white/20'
              : 'text-white/75'
          }`}
          onClick={() => onChange(t.v as Mode)}
          title={
            t.v === 'forecast'
              ? 'Show model forecast and confidence range'
              : 'Show observed values only'
          }
          type="button"
        >
          {t.l}
        </button>
      ))}
    </div>
  )
}

/* Horizon slider + quick chips */
function HorizonSlider({
  value,
  onChange,
  min = 1,
  max = 30,
  presets = [1, 7, 14, 30],
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  presets?: number[]
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-white/60">
        Horizon
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider w-40"
        aria-label="Forecast horizon in days"
      />
      <span className="text-xs text-white/80 w-16 text-right">
        Next {value}d
      </span>
      <div className="flex gap-1">
        {presets.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`chip px-2 py-0.5 rounded-full border text-[11px] ${
              value === d
                ? 'active bg-white/15 border-white/30 text-white'
                : 'border-white/10 text-white/85 bg-white/5'
            }`}
            title={`Next ${d} days`}
          >
            +{d}
          </button>
        ))}
      </div>
    </div>
  )
}

/* Legend control */
function LegendControl({
  cuts,
  field,
  palette,
  mode,
}: {
  cuts: number[]
  field: string
  palette: keyof typeof palettes
  mode: Mode
}) {
  const map = useMap()
  useEffect(() => {
    const existing = document.querySelector('.legend')
    existing?.remove()
    const legend = new L.Control({position: 'bottomright'})
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'legend')
      const title =
        prettyFieldLabel(field) + (mode === 'forecast' ? ' (Forecast)' : '')
      const sw = (i: number) => colorForRank(i, palette)
      let html = `<div class="row" style="margin-bottom:6px;">
        <span style="font-weight:600;">${title}</span>
      </div>`
      if (cuts.length > 0) {
        html += `<div class="row"><i style="background:${sw(
          0,
        )}"></i> Low (&lt; ${fmt.format(cuts[0])})</div>`
        for (let i = 0; i < cuts.length - 1; i++) {
          html += `<div class="row"><i style="background:${sw(
            i + 1,
          )}"></i> ${fmt.format(cuts[i])} - ${fmt.format(cuts[i + 1])}</div>`
        }
        html += `<div class="row"><i style="background:${sw(
          cuts.length,
        )}"></i> High (&gt; ${fmt.format(cuts[cuts.length - 1])})</div>`
      } else {
        html += `<div class="row"><i style="background:${sw(0)}"></i> N/A</div>`
      }
      if (mode === 'forecast') {
        html += `<div class="row" style="margin-top:6px;color:#ffffffa8;">
          <span style="border-bottom:1px dashed #fff;">— Forecast</span>
          <span style="margin-left:10px;"><i style="width:10px;height:10px;border-radius:50%;background:#8b5cf6;opacity:.35;display:inline-block;"></i> Confidence band</span>
        </div>`
      }
      div.innerHTML = html
      return div
    }
    legend.addTo(map)
    return () => legend.remove()
  }, [map, cuts, field, palette, mode])
  return null
}

/* Inject SVG hatch pattern into Leaflet overlay SVG */
function ForecastHatchDefs() {
  const map = useMap()
  useLayoutEffect(() => {
    const panes = (map as any)?._panes
    const svg = panes?.overlayPane?.querySelector('svg') as SVGSVGElement | null
    if (!svg) return
    if (svg.querySelector('#forecastHatch')) return
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    defs.setAttribute('id', 'forecastHatchDefs')
    defs.innerHTML = `
      <pattern id="forecastHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="transparent"/>
        <line x1="0" y1="0" x2="0" y2="6" stroke="white" stroke-opacity="0.18" stroke-width="1"/>
      </pattern>
    `
    svg.prepend(defs)
  }, [map])
  return null
}

/* Beacon */
function Beacon({lat, lon}: {lat: number | null; lon: number | null}) {
  const map = useMap()
  const [p, setP] = useState<{x: number; y: number} | null>(null)
  useEffect(() => {
    if (lat == null || lon == null) {
      setP(null)
      return
    }
    const update = () => {
      const pt = map.latLngToContainerPoint([lat, lon])
      setP({x: pt.x, y: pt.y})
    }
    update()
    map.on('move zoom resize', update)
    return () => map.off('move zoom resize', update)
  }, [map, lat, lon])
  if (!p) return null
  return (
    <div className="beacon-layer">
      <span className="beacon" style={{left: p.x, top: p.y}} />
    </div>
  )
}

/* Inspector (unchanged besides typing) */
function Inspector({
  field,
  paletteMode,
  hexData,
  onClose,
  open,
  mode,
  horizon,
}: {
  field: keyof H3Row
  paletteMode: keyof typeof palettes
  hexData: H3Row[] | null
  onClose: () => void
  open: boolean
  mode: Mode
  horizon: number
}) {
  const [animState, setAnimState] = useState<'enter' | 'exit' | null>(null)

  useEffect(() => {
    if (open) {
      setAnimState('enter')
      const t = requestAnimationFrame(() => setAnimState('enter-active'))
      return () => cancelAnimationFrame(t)
    } else {
      setAnimState('exit')
      const id = setTimeout(() => setAnimState('exit-active'), 10)
      return () => clearTimeout(id)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!hexData || hexData.length === 0) return null
  const title = hexData[0].hex

  const sorted = [...hexData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const series = sorted.map((r) => {
    const observed = (r[field] as number) ?? 0
    const forecast =
      (r[`forecasted_${field}` as keyof H3Row] as number | undefined) ?? null
    return {
      ts: new Date(r.date).getTime(),
      label: formatChartDate(r.date),
      observed,
      forecast,
      lower: r.lower_band ?? null,
      upper: r.upper_band ?? null,
    }
  })

  const firstForecastIdx = series.findIndex((d) => d.forecast != null)
  const last = series[series.length - 1]
  const latestRaw =
    mode === 'forecast' && last.forecast != null ? last.forecast : last.observed
  const latestValue = useCountUp(latestRaw ?? 0, 300)

  const color = colorForRank(3, paletteMode)

  const animClass =
    open && (animState as any)?.startsWith('enter')
      ? `anim-enter${(animState as any).endsWith('active') ? '-active' : ''}`
      : !open && (animState as any)?.startsWith('exit')
      ? `anim-exit${(animState as any).endsWith('active') ? '-active' : ''}`
      : ''

  return (
    <>
      <div
        className={`modal-overlay ${open ? 'active' : ''}`}
        onClick={onClose}
      />
      <aside
        className={`inspector glass fixed right-4 top-20 bottom-4 rounded-2xl border border-white/10 overflow-hidden flex flex-col ${animClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Hex ${title} details`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="min-w-0">
            <div className="text-xs text-white/60">Hex</div>
            <div className="truncate font-semibold text-white/90">{title}</div>
          </div>
          <button
            onClick={onClose}
            className="px-2 h-8 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition"
            aria-label="Close inspector"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="px-4 pt-3 pb-1">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            {prettyFieldLabel(String(field))}
            {mode === 'forecast' ? ' • Forecast' : ''}
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-semibold">
              {fmt.format(latestValue ?? 0)}
            </div>
            {mode === 'forecast' && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
                Next {horizon}d
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
              <span
                className="h-2 w-2 rounded-full"
                style={{background: color}}
              />
              Latest
            </span>
          </div>
        </div>

        <div className="px-3">
          <div
            className="h-[140px] rounded-xl border border-white/10 overflow-hidden"
            aria-label={
              mode === 'forecast'
                ? 'Chart with observed values, dashed forecast, and confidence band'
                : 'Chart with observed values'
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series}
                margin={{top: 10, right: 12, left: 0, bottom: 0}}
              >
                <defs>
                  <linearGradient id="vfillDrift" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.05}
                    />
                    {prefersReducedMotion()
                      ? ''
                      : `<animateTransform attributeName="gradientTransform" type="translate" values="0 0; 0 -0.06; 0 0" dur="10s" repeatCount="indefinite" />`}
                  </linearGradient>
                  <linearGradient
                    id="glintStroke"
                    x1="-20%"
                    x2="-5%"
                    y1="0%"
                    y2="0%"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    {prefersReducedMotion()
                      ? ''
                      : `<animate attributeName="x1" values="-20%; 120%" dur="6.5s" repeatCount="indefinite" />
                           <animate attributeName="x2" values="-5%; 135%" dur="6.5s" repeatCount="indefinite" />`}
                  </linearGradient>
                  <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="label"
                  stroke="#ffffff70"
                  tick={{fontSize: 10}}
                />
                <YAxis
                  stroke="#ffffff70"
                  tick={{fontSize: 10}}
                  width={42}
                  tickFormatter={(v) => fmt.format(v as number)}
                />
                <CartesianGrid strokeDasharray="2 3" stroke="#ffffff15" />

                <Area
                  type="monotone"
                  dataKey="observed"
                  stroke="#8b5cf6"
                  fill="url(#vfillDrift)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="observed"
                  stroke="url(#glintStroke)"
                  fill="none"
                  strokeWidth={2.2}
                  dot={false}
                  opacity={0.6}
                  isAnimationActive={false}
                />

                {mode === 'forecast' && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      stroke="#8b5cf6"
                      strokeDasharray="4 3"
                      fill="none"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill="url(#bandFill)"
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                    {firstForecastIdx > -1 && (
                      <ReferenceLine
                        x={series[firstForecastIdx].label}
                        stroke="#ffffff90"
                        strokeDasharray="3 3"
                      />
                    )}
                  </>
                )}

                <RechartsTooltip
                  contentStyle={{
                    background: 'rgba(13,16,22,0.95)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    borderRadius: 10,
                  }}
                  formatter={(val: any, key: any) => {
                    const label =
                      key === 'observed'
                        ? 'Observed'
                        : key === 'forecast'
                        ? 'Forecast'
                        : key
                    return [fmt.format(val ?? 0), label]
                  }}
                  labelFormatter={(l) => String(l)}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="px-4 pt-3 pb-2 text-xs text-white/70">
          History {mode === 'forecast' ? '(includes forecast)' : ''}
        </div>
        <div className="px-3 pb-3 overflow-auto">
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#0c1016] text-white/70">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-right p-2">
                    {prettyFieldLabel(String(field))}
                  </th>
                  <th className="text-right p-2">Type</th>
                </tr>
              </thead>
              <tbody className="text-white/85">
                {[...sorted].reverse().map((r) => {
                  const isForecast =
                    (r as any)[`forecasted_${String(field)}`] != null
                  const v =
                    (r as any)[
                      isForecast ? `forecasted_${String(field)}` : String(field)
                    ] ?? 0
                  return (
                    <tr
                      key={r.date}
                      className={`border-t border-white/10 ${
                        isForecast ? 'italic text-white/80' : ''
                      } hover:bg-white/5`}
                    >
                      <td className="p-2">{formatChartDate(r.date)}</td>
                      <td className="text-right p-2">{fmt.format(v)}</td>
                      <td className="text-right p-2">
                        {isForecast ? 'Forecast' : 'Observed'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </aside>
    </>
  )
}

/* Lasso Layer — now returns polygon points (lat,lon) */
function LassoLayer({
  active,
  onSelected,
  onPolygon,
  allHexes,
}: {
  active: boolean
  onSelected: (hexes: string[] | null) => void
  onPolygon: (poly: [number, number][] | null) => void
  allHexes: {hex: string; lat: number; lon: number}[]
}) {
  const map = useMap()
  const pathRef = useRef<L.Polyline | null>(null)
  const polygonRef = useRef<L.Polygon | null>(null)
  const drawingRef = useRef(false)
  const ptsRef = useRef<L.LatLng[]>([])

  useEffect(() => {
    if (!active) {
      drawingRef.current = false
      ptsRef.current = []
      pathRef.current?.remove()
      polygonRef.current?.remove()
      pathRef.current = null
      polygonRef.current = null
      onPolygon(null)
      onSelected(null)
      return
    }

    const onDown = (e: L.LeafletMouseEvent) => {
      drawingRef.current = true
      ptsRef.current = [e.latlng]
      pathRef.current?.remove()
      polygonRef.current?.remove()
      pathRef.current = L.polyline(ptsRef.current, {
        color: '#a78bfa',
        weight: 2,
        opacity: 0.9,
      }).addTo(map)
      map.dragging.disable()
      ;(map.getContainer() as HTMLElement).style.cursor = 'crosshair'
    }

    const onMove = (e: L.LeafletMouseEvent) => {
      if (!drawingRef.current || !pathRef.current) return
      const last = ptsRef.current[ptsRef.current.length - 1]
      if (last && last.distanceTo(e.latlng) < 5) return
      ptsRef.current.push(e.latlng)
      pathRef.current.setLatLngs(ptsRef.current)
    }

    const onUp = () => {
      if (!drawingRef.current) return
      drawingRef.current = false
      map.dragging.enable()
      ;(map.getContainer() as HTMLElement).style.cursor = ''

      const latlngs = ptsRef.current.slice()
      if (latlngs.length < 3) {
        pathRef.current?.remove()
        pathRef.current = null
        ptsRef.current = []
        onPolygon(null)
        onSelected(null)
        return
      }

      polygonRef.current?.remove()
      polygonRef.current = L.polygon(latlngs, {
        color: '#a78bfa',
        weight: 2,
        fill: true,
        fillColor: '#8b5cf6',
        fillOpacity: 0.08,
        dashArray: '4 3',
      }).addTo(map)

      const polyLatLng: [number, number][] = latlngs.map((p) => [p.lat, p.lng])
      onPolygon(polyLatLng)

      // still return a quick “selected hex list” for UI dimming (optional)
      const poly = polygonRef.current
      const selected = allHexes
        .filter((h) => poly?.getBounds().contains([h.lat, h.lon]))
        .filter((h) => {
          return L.polygon(latlngs).contains(L.latLng(h.lat, h.lon))
        })
        .map((h) => h.hex)

      onSelected(selected.length ? selected : null)

      pathRef.current?.remove()
      pathRef.current = null
      ptsRef.current = []
    }

    map.on('mousedown', onDown)
    map.on('mousemove', onMove)
    map.on('mouseup', onUp)
    map.on('mouseleave', onUp)

    return () => {
      map.off('mousedown', onDown)
      map.off('mousemove', onMove)
      map.off('mouseup', onUp)
      map.off('mouseleave', onUp)
      ;(map.getContainer() as HTMLElement).style.cursor = ''
    }
  }, [active, map, onSelected, onPolygon, allHexes])

  return null
}

/* Persist Leaflet map across Fast Refresh */
const leafMapCache: {map: L.Map | null} = {map: null}
let leafMapEpoch = 0

export default function MapCanvas() {
  const [mounted, setMounted] = useState(false)

  const [field, setFieldState] = useState<keyof H3Row>('total_rewards')
  const [from, setFromState] = useState('')
  const [to, setToState] = useState('')

  const [paletteMode, setPaletteMode] =
    useState<keyof typeof palettes>('default')

  const [mode, setMode] = useState<Mode>('observed')
  const [horizon, setHorizon] = useState<number>(7)

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

  // URL helpers
  const pushUrl = useCallback(
    (next: {
      field?: keyof H3Row
      from?: string
      to?: string
      hex?: string | null
      palette?: keyof typeof palettes
      mode?: Mode
      horizon?: number
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
    const qPalette =
      (params.get('palette') as keyof typeof palettes) || 'default'
    const qMode = (params.get('mode') as Mode) || 'observed'
    const qHorizon = Number(params.get('horizon') || '7')

    if (qField) setFieldState(qField)
    if (qFrom) setFromState(qFrom)
    if (qTo) setToState(qTo)
    if (qHex) setSelectedHexState(qHex)
    setPaletteMode(qPalette)
    setMode(qMode === 'forecast' ? 'forecast' : 'observed')
    if (!Number.isNaN(qHorizon)) setHorizon(Math.max(1, Math.min(30, qHorizon)))
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
    pushUrl,
  ])

  const setField = (f: keyof H3Row) => setFieldState(f)
  const setFrom = (v: string) => setFromState(v)
  const setTo = (v: string) => setToState(v)
  const setSelectedHex = (hex: string | null) => setSelectedHexState(hex)

  // Hover delay
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
        setProgressPhase('idle')
      }, 380)
      return () => clearTimeout(t2)
    }
  }, [loading])

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
    } catch {
      // no-op
    }
  }, [])

  // Abortable fetch + progress
  const abortRef = useRef<AbortController | null>(null)
  async function fetchHexes(signal?: AbortSignal) {
    try {
      setLoading(true)

      // Guard: in forecast mode we require a polygon
      if (mode === 'forecast' && (!lassoPoly || lassoPoly.length < 3)) {
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
        q.set('horizon', String(horizon))
        if (lassoPoly) q.set('poly', JSON.stringify(lassoPoly))
      }
      // observed still respects hex list if you want to filter by lasso immediately:
      // else if (selectedHexesLasso?.length) q.set('hex', selectedHexesLasso.join(','))

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

  // Initial fetch (observed only)
  useEffect(() => {
    if (!mounted) return
    // only auto-fetch for observed initially
    if (mode !== 'observed') return
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    fetchHexes(ctl.signal)
    return () => ctl.abort()
  }, [mounted])

  // Debounced auto-apply for horizon changes (only if we have a poly)
  useEffect(() => {
    if (!mounted) return
    if (mode !== 'forecast') return
    if (!lassoPoly || lassoPoly.length < 3) return
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    const id = window.setTimeout(() => fetchHexes(ctl.signal), 400)
    return () => {
      ctl.abort()
      window.clearTimeout(id)
    }
  }, [mode, horizon, lassoPoly, mounted])

  const onApply = (e: React.FormEvent) => {
    e.preventDefault()
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    fetchHexes(ctl.signal)
  }

  // Aggregate by hex
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
        lower_band?: number
        upper_band?: number
      }
    >()
    if (mode === 'forecast') {
      const grouped = _.groupBy(rows, 'hex')
      for (const hexId in grouped) {
        const hexRows = grouped[hexId]
        const sumValue = _.sumBy(hexRows, 'forecasted_total')
        const avgLower = _.meanBy(hexRows, 'lower_band')
        const avgUpper = _.meanBy(hexRows, 'upper_band')
        const lastRow = hexRows[hexRows.length - 1]
        m.set(hexId, {
          hex: hexId,
          lat: lastRow.lat!,
          lon: lastRow.lon!,
          value: sumValue,
          hotspot_count: lastRow.hotspot_count,
          density_k1: lastRow.density_k1,
          lower_band: avgLower,
          upper_band: avgUpper,
        })
      }
    } else {
      for (const r of rows) {
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
  }, [rows, field, mode])

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
    const total = totals ? (totals[field as keyof typeof totals] as number) : 0
    const label = prettyFieldLabel(String(field))
    const suffix = mode === 'forecast' ? ' (Forecast)' : ''
    return `Hexes: ${byHex.length} • Total ${label}: ${fmt.format(
      total ?? 0,
    )}${suffix}`
  }, [byHex.length, field, totals, mode])

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
      const finalTarget =
        distMeters < tiny ? L.latLng(nudge(h.lat), nudge(h.lon)) : target
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

  // Reset view button
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

  const showForecastHint =
    mode === 'forecast' && (!lassoPoly || lassoPoly.length < 3)

  return (
    <div className="space-y-3">
      <GlobalStyles />

      <form
        onSubmit={onApply}
        className="glass sticky top-0 rounded-2xl border border-white/10 p-3 md:p-4 flex flex-wrap items-center gap-3"
        style={{zIndex: 900}}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] uppercase tracking-wide text-white/60">
            Field
          </span>
          <div className="flex flex-wrap gap-1">
            {[
              {v: 'total_rewards', l: 'Total'},
              {v: 'poc_rewards', l: 'PoC'},
              {v: 'dc_rewards', l: 'Data'},
              {v: 'hotspot_count', l: 'Hotspots'},
              {v: 'density_k1', l: 'k=1 Density'},
              {v: 'ma_3d_total', l: '3D MA Total'},
              {v: 'ma_3d_poc', l: '3D MA PoC'},
              {v: 'transmit_scale_approx', l: 'Tx Scale'},
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setField(opt.v as keyof H3Row)}
                className={`chip px-2.5 py-1 rounded-full border text-xs ${
                  field === (opt.v as keyof H3Row)
                    ? 'active bg-white/15 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/80'
                }`}
                aria-pressed={field === (opt.v as keyof H3Row)}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text:[11px] uppercase tracking-wide text-white/60">
            Range
          </span>
          <input
            placeholder="yyyy-mm-dd"
            className="rounded-md bg-white/5 border border-white/15 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="From date"
          />
          <span className="text-white/40">to</span>
          <input
            placeholder="yyyy-mm-dd"
            className="rounded-md bg-white/5 border border-white/15 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="To date"
          />
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle mode={mode} onChange={setMode} />
          {mode === 'forecast' && (
            <HorizonSlider value={horizon} onChange={setHorizon} />
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-white/80"
              checked={paletteMode === 'cbf'}
              onChange={(e) =>
                setPaletteMode(e.target.checked ? 'cbf' : 'default')
              }
            />
            CBF Palette
          </label>

          <button
            type="button"
            onClick={() => setLassoActive((v) => !v)}
            className={`px-3 py-2 rounded-lg border text-sm transition ${
              lassoActive
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-white/10 border-white/15 text-white/85 hover:bg-white/15'
            }`}
            title="Freehand lasso to select an area"
          >
            {lassoActive ? 'Lasso: On' : 'Lasso'}
          </button>

          {selectedHexesLasso && (
            <span className="text-xs px-2 py-1 rounded-md border border-white/15 bg-white/5">
              Selected: {selectedHexesLasso.length}
              <button
                type="button"
                className="ml-2 underline text-white/80"
                onClick={() => {
                  setSelectedHexesLasso(null)
                  setLassoPoly(null)
                }}
                title="Clear selection"
              >
                Clear
              </button>
            </span>
          )}

          <button
            type="submit"
            className="px-3 py-2 rounded-lg border border-white/15 text-sm bg-white/10 hover:bg-white/15 transition"
            disabled={
              mode === 'forecast' && (!lassoPoly || lassoPoly.length < 3)
            }
            title={
              mode === 'forecast' && (!lassoPoly || lassoPoly.length < 3)
                ? 'Draw a lasso first'
                : 'Apply'
            }
          >
            Apply
          </button>
        </div>
      </form>

      <div className="text-xs text-white/65 px-1">
        {showForecastHint
          ? 'Forecast mode: draw a lasso to select hexes, then click Apply.'
          : totalsText}
      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden relative">
        <div
          className={`top-progress ${progressPhase === 'idle' ? '' : 'active'}`}
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

        {!mounted ? (
          <div className="h-[640px] p-6 text-sm text-white/60 flex items-center justify-center">
            <div className="animate-pulse w-full h-full bg-gradient-to-b from-[#0b0f14] to-[#0a0d12]" />
          </div>
        ) : byHex.length === 0 ? (
          <div className="h-[640px] grid place-items-center p-6">
            <div className="glass rounded-2xl border border-white/10 p-6 text-center text-white/75">
              <div className="text-sm font-medium">No hexes found</div>
              <div className="text-xs text-white/60 mt-1">
                {showForecastHint
                  ? 'Draw a lasso and click Apply to fetch a forecast.'
                  : 'Try expanding the date range or switching fields.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-0">
            <span className="map-right-divider" />

            <button
              type="button"
              onClick={resetView}
              className="glass fixed z-[850] bottom-5 left-5 px-3 py-2 rounded-lg border border-white/10 text-xs text-white/85 hover:bg-white/10 transition"
              title="Reset view"
            >
              Reset View
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
              className={`z-0 hex-layer ${
                selectedHex || selectedHexesLasso ? 'dim-others' : ''
              } ${loading && mode === 'forecast' ? 'loading' : ''}`}
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

              {/* Lasso interactions */}
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
                const baseStyle: L.PathOptions = {
                  color: isActive ? '#ffffff' : '#d8e1ff',
                  weight: isActive ? 2.0 : 0.7,
                  opacity: isActive ? 1.0 : 0.6,
                  fillColor: fill,
                  fillOpacity: isActive ? 0.7 : 0.55,
                }

                const forecastCue: L.PathOptions =
                  mode === 'forecast'
                    ? ({
                        dashArray: '2 2',
                      } as L.PathOptions)
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
                        if (
                          el &&
                          el.ownerSVGElement?.querySelector('#forecastHatch')
                        ) {
                          try {
                            el.setAttribute('fill', 'url(#forecastHatch)')
                          } catch {
                            // ignore
                          }
                        }
                      },
                      click: () => setSelectedHex(h.hex),
                      mouseover: (e) => {
                        setHoverHexSafe(h.hex)
                        const layer = e.target as any
                        if (selectedHex !== h.hex && !selectedSet?.has(h.hex)) {
                          layer.setStyle({
                            weight: 1.6,
                            opacity: 0.95,
                            fillOpacity: 0.65,
                          })
                        }
                        layer._path?.classList.add('hex-selected')
                        layer._path?.classList.add('is-active')
                      },
                      mouseout: (e) => {
                        setHoverHexSafe(null)
                        const layer = e.target as any
                        if (selectedHex !== h.hex && !selectedSet?.has(h.hex)) {
                          layer.setStyle({...baseStyle, ...forecastCue})
                          layer._path?.classList.remove('hex-selected')
                        }
                        layer._path?.classList.remove('is-active')
                      },
                      tooltipopen: (e) => {
                        const el = (e as any).tooltip?._container as
                          | HTMLElement
                          | undefined
                        el?.classList.add('hex-visible')
                      },
                      tooltipclose: (e) => {
                        const el = (e as any).tooltip?._container as
                          | HTMLElement
                          | undefined
                        el?.classList.remove('hex-visible')
                      },
                    }}
                  >
                    <Tooltip
                      direction="top"
                      offset={[0, -14]}
                      sticky
                      className="hex-tooltip"
                    >
                      <div className="t-title">{h.hex}</div>
                      <div className="t-row">
                        <span className="muted">
                          {prettyFieldLabel(String(field))}
                          {mode === 'forecast' ? ` (over ${horizon} days)` : ''}
                        </span>
                        <span>
                          {mode === 'forecast' && (
                            <span className="badge mr-1">F</span>
                          )}
                          {fmt.format(h.value)}
                        </span>
                      </div>
                      {mode === 'forecast' &&
                        h.lower_band !== undefined &&
                        h.upper_band !== undefined && (
                          <div className="t-row">
                            <span className="muted">Band (5-95%)</span>
                            <span>
                              {fmt.format(h.lower_band)} -{' '}
                              {fmt.format(h.upper_band)}
                            </span>
                          </div>
                        )}
                      <div className="t-row">
                        <span className="muted">Band</span>
                        <span>
                          {rank + 1} / {bands}
                        </span>
                      </div>
                      <div className="t-row">
                        <span className="muted">Hotspots</span>
                        <span>{fmt.format(h.hotspot_count)}</span>
                      </div>
                      <div className="t-row">
                        <span className="muted">k=1 Density</span>
                        <span>{fmt.format(h.density_k1)}</span>
                      </div>
                      <div className="bar" aria-hidden="true">
                        <span
                          style={{width: `${pct * 100}%`, background: fill}}
                        />
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
                horizon={horizon}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
