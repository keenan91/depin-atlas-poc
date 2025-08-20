'use client'

import React, {useMemo} from 'react'

export type Agg = AggMode

export default function ForecastGroup({
  agg,
  onAgg,
  perDay,
  onPerDay,
  playing,
  onTogglePlay,
  day,
  onDay,
  horizon = 4, // locked
  disabled,
}: {
  agg: AggMode
  onAgg: (m: AggMode) => void
  perDay: boolean
  onPerDay: (v: boolean) => void
  playing: boolean
  onTogglePlay: () => void
  day: number
  onDay: (v: number) => void
  horizon?: number
  disabled?: boolean
}) {
  const pct = useMemo(() => {
    const span = Math.max(1, horizon - 1)
    return ((Math.min(horizon, Math.max(1, day)) - 1) / span) * 100
  }, [day, horizon])

  const trackBg = useMemo(
    () => `linear-gradient(90deg, var(--accent) ${pct}%, #ffffff1f ${pct}%)`,
    [pct],
  )

  return (
    <div className={`flex items-center gap-3 ${disabled ? 'opacity-60' : ''}`}>
      {/* Forecast window */}
      <span
        className="px-2 py-1 rounded-full border border-white/12 bg-white/5 text-xs"
        title="Forecast window (locked)"
      >
        Next 4d
      </span>

      {/* Aggregate */}
      <div className="flex items-center gap-1">
        {(['sum', 'avg'] as AggMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => !disabled && onAgg(m)}
            className={`chip px-2 py-0.5 rounded-full border text-[11px] ${
              agg === m
                ? 'active bg-white/15 border-white/30 text-white'
                : 'border-white/10 text-white/85 bg-white/5'
            }`}
            title={
              m === 'sum'
                ? 'Sum over next 4 days'
                : 'Daily average over next 4 days'
            }
          >
            {m === 'sum' ? 'Sum' : 'Daily Avg'}
          </button>
        ))}
      </div>

      {/* Per-day controls */}
      <label className="switch ml-1">
        <input
          type="checkbox"
          checked={perDay}
          onChange={(e) => onPerDay(e.target.checked)}
          aria-label="Per-day mode"
          disabled={disabled}
        />
        <span className="switch-ui" />
        <span className="switch-label">Per-day</span>
      </label>

      <button
        type="button"
        className={`icon-btn ${perDay && !disabled ? '' : 'disabled'}`}
        onClick={onTogglePlay}
        disabled={!perDay || disabled}
        aria-label={playing ? 'Pause' : 'Play'}
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="horizon-wrap" style={{position: 'relative'}}>
        <input
          type="range"
          min={1}
          max={horizon}
          value={Math.min(Math.max(1, day), horizon)}
          onChange={(e) => onDay(Number(e.target.value))}
          className="slider slider-pro"
          aria-label="Per-day horizon scrubber"
          style={{
            width: 180,
            background: trackBg,
            opacity: perDay ? 1 : 0.5,
          }}
          disabled={!perDay || disabled}
        />
        <span
          className="h-bubble"
          style={{left: `calc(${pct}% - 16px)`}}
          aria-hidden
        >
          H+{Math.min(Math.max(1, day), horizon)}
        </span>
      </div>
    </div>
  )
}

export type AggModeLocal = 'sum' | 'avg'
export const AggModeValues: AggModeLocal[] = ['sum', 'avg']
export type AggMode = AggModeLocal
