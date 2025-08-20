'use client'

import React, {useMemo} from 'react'

export default function HorizonSlider({
  value,
  onChange,
  min = 1,
  max = 30,
  marks = [1, 7, 14, 30],
  width = 220,
  showBubble = true,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  marks?: number[]
  width?: number | string
  showBubble?: boolean
}) {
  const pct = useMemo(() => {
    const span = Math.max(1, max - min)
    return ((Math.min(max, Math.max(min, value)) - min) / span) * 100
  }, [value, min, max])

  const trackBg = useMemo(() => {
    return `linear-gradient(90deg, var(--accent) ${pct}%, #ffffff1f ${pct}%)`
  }, [pct])

  return (
    <div
      className="horizon-group"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span className="toolbar-label">Horizon</span>
      <div className="horizon-wrap" style={{position: 'relative'}}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider slider-pro"
          aria-label="Forecast horizon in days"
          style={{width, background: trackBg}}
        />
        {showBubble && (
          <span
            className="h-bubble"
            style={{
              left: `calc(${pct}% - 16px)`,
            }}
            aria-hidden
          >
            H+{value}
          </span>
        )}
        <div className="h-marks">
          {marks.map((m) => (
            <button
              key={m}
              type="button"
              className={`h-mark ${m === value ? 'active' : ''}`}
              onClick={() => onChange(m)}
              title={`Next ${m} days`}
              aria-label={`Set horizon to ${m} days`}
            >
              +{m}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
