'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip as RechartsTooltip,
  Dot,
} from 'recharts'
import {fmt, formatChartDate, prettyFieldLabel} from '@/lib/utils/format'
import {colorForRank, PaletteKey} from '@/lib/utils/colors'
import {prefersReducedMotion} from '@/lib/utils/motion'
import {H3Row, Mode} from '@/types/iot'

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

const InteractiveDot = (props: any) => {
  const {cx, cy, payload, dataKey} = props

  if (!cx || !cy || (dataKey !== 'observed' && dataKey !== 'forecast'))
    return null

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="white"
      stroke="#8b5cf6"
      strokeWidth={2}
      style={{
        filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))',
      }}
    />
  )
}
export default function Inspector({
  field,
  paletteMode,
  hexData,
  onClose,
  open,
  mode,
  horizon,
  scenario = {poc: 1, data: 1},
}: {
  field: keyof H3Row
  paletteMode: PaletteKey
  hexData: H3Row[] | null
  onClose: () => void
  open: boolean
  mode: Mode
  horizon: number
  scenario?: {poc: number; data: number}
}) {
  const [mounted, setMounted] = useState(false)
  const [animState, setAnimState] = useState<
    'enter' | 'enter-active' | 'exit' | 'exit-active' | null
  >(null)
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'insights'>(
    'chart',
  )
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const rows = hexData ?? []
  const hasData = rows.length > 0

  const sorted = useMemo(() => {
    return [...rows].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
  }, [rows])

  const series = useMemo(() => {
    return sorted.map((r, idx) => {
      const observed = (r[field] as number) ?? 0
      const poc = scenario.poc * ((r.forecasted_poc as number) ?? 0)
      const dc = scenario.data * ((r.forecasted_dc as number) ?? 0)
      const totalBase = (r.forecasted_total as number | undefined) ?? poc + dc
      const totalAdj = poc + dc || totalBase || 0
      const ratio = totalBase > 0 ? totalAdj / totalBase : 1
      return {
        idx,
        ts: new Date(r.date).getTime(),
        label: formatChartDate(r.date),
        observed,
        forecast: totalAdj || null,
        forecast_poc: poc || null,
        forecast_dc: dc || null,
        lower: r.lower_band != null ? (r.lower_band as number) * ratio : null,
        upper: r.upper_band != null ? (r.upper_band as number) * ratio : null,
      }
    })
  }, [sorted, field, scenario])

  const firstForecastIdx = useMemo(
    () => series.findIndex((d) => d.forecast != null),
    [series],
  )

  const latestRaw = useMemo(() => {
    if (!series.length) return 0
    const last = series[series.length - 1]
    return mode === 'forecast' && last?.forecast != null
      ? (last.forecast as number)
      : (last?.observed as number) ?? 0
  }, [series, mode])

  const latestValue = useCountUp(latestRaw ?? 0, 260)
  const color = colorForRank(3, paletteMode)

  const insights = useMemo(() => {
    if (!series.length) return null

    const observedValues = series
      .filter((d) => d.observed > 0)
      .map((d) => d.observed)

    const forecastValues = series
      .filter((d) => d.forecast != null)
      .map((d) => d.forecast!)

    const avgObserved = observedValues.length
      ? observedValues.reduce((a, b) => a + b, 0) / observedValues.length
      : 0

    const avgForecast = forecastValues.length
      ? forecastValues.reduce((a, b) => a + b, 0) / forecastValues.length
      : 0

    const trend =
      observedValues.length > 1
        ? ((observedValues[observedValues.length - 1] - observedValues[0]) /
            observedValues[0]) *
          100
        : 0

    const volatility =
      observedValues.length > 1
        ? Math.sqrt(
            observedValues
              .map((v) => Math.pow(v - avgObserved, 2))
              .reduce((a, b) => a + b, 0) / observedValues.length,
          ) / avgObserved
        : 0

    return {
      avgObserved,
      avgForecast,
      trend,
      volatility,
      peakValue: Math.max(...observedValues, 0),
      peakDate:
        series.find((s) => s.observed === Math.max(...observedValues, 0))
          ?.label || '',
    }
  }, [series])

  const animClass =
    open && (animState === 'enter' || animState === 'enter-active')
      ? `anim-enter${animState === 'enter-active' ? '-active' : ''}`
      : !open && (animState === 'exit' || animState === 'exit-active')
      ? `anim-exit${animState === 'exit-active' ? '-active' : ''}`
      : ''

  if (!mounted || !open || !hasData) return null

  const title = rows[0].hex

  const modalContent = (
    <>
      {/* Overlay */}
      <div
        className="modal-overlay active"
        onClick={onClose}
        style={{
          zIndex: 1999,
          position: 'fixed',
          inset: 0,
        }}
      />

      {/* Enhanced Inspector Panel */}
      <aside
        className={`hex-modal ${animClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Hex ${title} details`}
        style={{
          zIndex: 2000,
          position: 'fixed',
          right: '16px',
          top: '80px',
          bottom: '16px',
          width: '480px',
          maxWidth: 'calc(100vw - 32px)',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(20, 27, 45, 0.96) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '16px',
          boxShadow:
            '0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Enhanced Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
            background:
              'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: 0,
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(148, 163, 184, 0.8)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Hex
              </h3>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'rgba(248, 250, 252, 0.95)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </div>
            </div>
            <span className="modal-header-badge">
              <span></span>
              Live Data
            </span>
          </div>
          <button
            onClick={onClose}
            className="advanced-close"
            aria-label="Close inspector"
            title="Close (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Metrics Section */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'rgba(148, 163, 184, 0.8)',
                fontWeight: 500,
              }}
            >
              {prettyFieldLabel(String(field))}
              {mode === 'forecast' ? ' • Forecast' : ''}
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              {mode === 'forecast' && (
                <span
                  className="chip"
                  style={{
                    height: '24px',
                    padding: '0 10px',
                    fontSize: '11px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    color: '#a78bfa',
                  }}
                >
                  Next {horizon}d
                </span>
              )}
              <span
                className="chip"
                style={{
                  height: '24px',
                  padding: '0 10px',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}40`,
                  }}
                />
                Latest
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'rgba(248, 250, 252, 0.95)',
            }}
          >
            {fmt.format(latestValue ?? 0)}
          </div>
        </div>

        {/* Tabs */}
        <div
          className="modal-tabs"
          style={{
            display: 'flex',
            gap: '4px',
            padding: '0 24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
          }}
        >
          {['chart', 'table', 'insights'].map((tab) => (
            <button
              key={tab}
              className={`modal-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab as any)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background:
                  activeTab === tab ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === tab
                    ? '2px solid #8b5cf6'
                    : '2px solid transparent',
                color:
                  activeTab === tab ? '#a78bfa' : 'rgba(203, 213, 225, 0.8)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                textTransform: 'capitalize',
              }}
            >
              {tab} View
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{flex: 1, overflow: 'auto', padding: '24px'}}>
          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <div className="forecast-chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={series}
                  margin={{top: 10, right: 12, left: 0, bottom: 0}}
                  onClick={(e: unknown) => {
                    const raw = (e as {activeTooltipIndex?: number | string})
                      ?.activeTooltipIndex
                    const idx =
                      typeof raw === 'number'
                        ? raw
                        : typeof raw === 'string'
                        ? Number(raw)
                        : NaN
                    if (Number.isFinite(idx)) setSelectedPoint(idx)
                  }}
                >
                  <defs>
                    <linearGradient id="vfillDrift" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                      <stop
                        offset="100%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="100%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="label"
                    stroke="var(--text-muted)"
                    tick={{fontSize: 10, fill: 'var(--text-muted)'}}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    tick={{fontSize: 10, fill: 'var(--text-muted)'}}
                    width={48}
                    tickFormatter={(v) => fmt.format(v as number)}
                  />
                  <CartesianGrid
                    strokeDasharray="2 3"
                    stroke="var(--glass-border)"
                  />

                  <Area
                    type="monotone"
                    dataKey="observed"
                    stroke="#8b5cf6"
                    fill="url(#vfillDrift)"
                    strokeWidth={2}
                    dot={<InteractiveDot />}
                    isAnimationActive={false}
                  />

                  {mode === 'forecast' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="forecast_poc"
                        stackId="f"
                        stroke="none"
                        fill="rgba(139,92,246,0.25)"
                        dot={false}
                        connectNulls
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="forecast_dc"
                        stackId="f"
                        stroke="none"
                        fill="rgba(96,165,250,0.25)"
                        dot={false}
                        connectNulls
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="forecast"
                        stroke="#8b5cf6"
                        strokeDasharray="4 3"
                        fill="none"
                        strokeWidth={2}
                        dot={<InteractiveDot />}
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
                          stroke="var(--text-muted)"
                          strokeDasharray="3 3"
                          label={{
                            value: 'Forecast',
                            position: 'top',
                            fill: 'var(--text-muted)',
                            fontSize: 10,
                          }}
                        />
                      )}
                    </>
                  )}

                  <RechartsTooltip
                    contentStyle={{
                      background: 'var(--bg-overlay)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      padding: '12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    }}
                    formatter={(val: any, key: any) => {
                      const label =
                        key === 'observed'
                          ? 'Observed'
                          : key === 'forecast'
                          ? 'Forecast'
                          : key === 'forecast_poc'
                          ? 'Forecast PoC'
                          : key === 'forecast_dc'
                          ? 'Forecast Data'
                          : key
                      return [fmt.format(val ?? 0), label]
                    }}
                    labelFormatter={(l) => String(l)}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Selected Point Details */}
              {selectedPoint !== null && series[selectedPoint] && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'rgba(148, 163, 184, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(148, 163, 184, 0.8)',
                      marginBottom: '8px',
                    }}
                  >
                    Selected: {series[selectedPoint].label}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'rgba(148, 163, 184, 0.6)',
                        }}
                      >
                        Observed
                      </div>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: 'rgba(248, 250, 252, 0.95)',
                        }}
                      >
                        {fmt.format(series[selectedPoint].observed)}
                      </div>
                    </div>
                    {series[selectedPoint].forecast != null && (
                      <div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'rgba(148, 163, 184, 0.6)',
                          }}
                        >
                          Forecast
                        </div>
                        <div
                          style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#a78bfa',
                          }}
                        >
                          {fmt.format(series[selectedPoint].forecast!)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Table Tab */}
          {activeTab === 'table' && (
            <div
              className="data-table"
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(148, 163, 184, 0.08)',
              }}
            >
              {[...sorted].reverse().map((r, idx) => {
                const isForecast =
                  (r as any)[`forecasted_${String(field)}`] != null
                const v =
                  (r as any)[
                    isForecast ? `forecasted_${String(field)}` : String(field)
                  ] ?? 0
                return (
                  <div
                    key={r.date}
                    className={`table-row ${isForecast ? 'forecast' : ''}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 100px',
                      padding: '14px 20px',
                      borderBottom:
                        idx < sorted.length - 1
                          ? '1px solid rgba(148, 163, 184, 0.06)'
                          : 'none',
                      transition: 'all 150ms ease',
                      cursor: 'pointer',
                      background: isForecast
                        ? 'rgba(139, 92, 246, 0.03)'
                        : 'transparent',
                      borderLeft: isForecast
                        ? '3px solid #8b5cf6'
                        : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(139, 92, 246, 0.05)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isForecast
                        ? 'rgba(139, 92, 246, 0.03)'
                        : 'transparent'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{color: 'rgba(248, 250, 252, 0.95)'}}>
                      {formatChartDate(r.date)}
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'rgba(248, 250, 252, 0.95)',
                      }}
                    >
                      {fmt.format(v)}
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <span
                        className={`type-badge ${
                          isForecast ? 'forecast' : 'observed'
                        }`}
                      >
                        {isForecast ? 'Forecast' : 'Observed'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && insights && (
            <div
              style={{display: 'flex', flexDirection: 'column', gap: '20px'}}
            >
              {/* Key Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(148, 163, 184, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(148, 163, 184, 0.6)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Average Observed
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: 'rgba(248, 250, 252, 0.95)',
                    }}
                  >
                    {fmt.format(insights.avgObserved)}
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(167, 139, 250, 0.8)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Average Forecast
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#a78bfa',
                    }}
                  >
                    {fmt.format(insights.avgForecast)}
                  </div>
                </div>
              </div>

              {/* Trend Analysis */}
              <div
                style={{
                  padding: '20px',
                  background: 'rgba(148, 163, 184, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.08)',
                }}
              >
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgba(248, 250, 252, 0.95)',
                    marginBottom: '16px',
                  }}
                >
                  Trend Analysis
                </h4>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'rgba(203, 213, 225, 0.8)',
                      }}
                    >
                      Overall Trend
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color:
                          insights.trend > 0
                            ? '#34d399'
                            : insights.trend < 0
                            ? '#f87171'
                            : '#94a3b8',
                      }}
                    >
                      {insights.trend > 0
                        ? '↑'
                        : insights.trend < 0
                        ? '↓'
                        : '→'}{' '}
                      {Math.abs(insights.trend).toFixed(1)}%
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'rgba(203, 213, 225, 0.8)',
                      }}
                    >
                      Volatility
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color:
                          insights.volatility > 0.3 ? '#f59e0b' : '#10b981',
                      }}
                    >
                      {(insights.volatility * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'rgba(203, 213, 225, 0.8)',
                      }}
                    >
                      Peak Value
                    </span>
                    <div style={{textAlign: 'right'}}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'rgba(248, 250, 252, 0.95)',
                        }}
                      >
                        {fmt.format(insights.peakValue)}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'rgba(148, 163, 184, 0.6)',
                        }}
                      >
                        on {insights.peakDate}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence Indicator */}
              {mode === 'forecast' && (
                <div
                  style={{
                    padding: '16px',
                    background:
                      'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.08) 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#a78bfa',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 10H7v-2h2v2zm0-3H7V4h2v4z" />
                    </svg>
                    <span>Forecast confidence bands shown in chart view</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Action Bar */}
        <div className="modal-actions">
          <button className="modal-action-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="modal-action-primary"
            onClick={() => {
              console.log('Export data for hex:', title)
            }}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 500,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 200ms ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow =
                '0 8px 24px rgba(139, 92, 246, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 10L12 6L10.6 6L10.6 1L5.4 1L5.4 6L4 6L8 10Z" />
              <path d="M2 9L2 14L14 14L14 9L12 9L12 12L4 12L4 9L2 9Z" />
            </svg>
            Export Data
          </button>
        </div>
      </aside>
    </>
  )

  return createPortal(modalContent, document.body)
}
