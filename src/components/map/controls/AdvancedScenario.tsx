'use client'

import React, {useState} from 'react'

export default function AdvancedScenario({
  poc,
  data,
  onPoc,
  onData,
  onReset,
  disabled,
}: {
  poc: number
  data: number
  onPoc: (v: number) => void
  onData: (v: number) => void
  onReset: () => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  const Slider = ({
    label,
    value,
    onChange,
    color,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
    color: string
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-white/60 min-w-[34px]">
        {label}
      </span>
      <input
        type="range"
        min={0.5}
        max={1.5}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider w-28"
        aria-label={`${label} multiplier`}
        style={{accentColor: color}}
        disabled={disabled}
      />
      <span className="text-xs text-white/80 w-12 text-right">
        ×{value.toFixed(2)}
      </span>
    </div>
  )

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={`chip px-2 py-0.5 rounded-full border text-[11px] ${
          open ? 'active bg-white/15 border-white/30 text-white' : ''
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        title="Scenario multipliers"
        aria-expanded={open}
        aria-controls="advanced-scenario-panel"
      >
        Advanced
      </button>

      {open && (
        <div
          id="advanced-scenario-panel"
          className="flex items-center flex-wrap gap-3 rounded-xl border border-white/12 bg-white/5 px-3 py-2"
        >
          <Slider label="PoC" value={poc} onChange={onPoc} color="#8b5cf6" />
          <Slider label="Data" value={data} onChange={onData} color="#60a5fa" />
          <button
            type="button"
            className="chip px-2 py-0.5 rounded-full border text-[11px]"
            onClick={onReset}
            disabled={disabled}
            title="Reset multipliers"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  )
}
