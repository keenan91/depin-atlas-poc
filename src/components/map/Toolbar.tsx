'use client'

import React, {useMemo, useState} from 'react'
import ModeToggle from './controls/ModeToggle'
import PerDayControl from './controls/PerDayControl'
import {AggMode} from './controls/ForecastOptions'
import {PaletteKey} from '@/lib/utils/colors'
import {H3Row, Mode} from '@/types/iot'

type FieldKey = keyof H3Row

export default function Toolbar({
  field,
  onField,
  mode,
  onMode,
  agg,
  onAgg,
  perDay,
  onPerDay,
  playing,
  onTogglePlay,
  day,
  onDay,
  paletteMode,
  onPaletteMode,
  lassoActive,
  onToggleLasso,
  advancedOpen,
  onToggleAdvanced,
  pocMult,
  dataMult,
  onPoc,
  onData,
  onResetScalars,
  onApply,
}: {
  field: FieldKey
  onField: (f: FieldKey) => void
  mode: Mode
  onMode: (m: Mode) => void
  agg: AggMode
  onAgg: (m: AggMode) => void
  perDay: boolean
  onPerDay: (v: boolean) => void
  playing: boolean
  onTogglePlay: () => void
  day: number
  onDay: (v: number) => void
  paletteMode: PaletteKey
  onPaletteMode: (p: PaletteKey) => void
  lassoActive: boolean
  onToggleLasso: () => void
  advancedOpen: boolean
  onToggleAdvanced: () => void
  pocMult: number
  dataMult: number
  onPoc: (v: number) => void
  onData: (v: number) => void
  onResetScalars: () => void
  onApply: (e: React.FormEvent) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const H_MAX = 4

  // Consolidated field groups
  const fieldGroups = {
    rewards: [
      {v: 'total_rewards' as FieldKey, l: 'Total', icon: '💰'},
      {v: 'poc_rewards' as FieldKey, l: 'PoC', icon: '📡'},
      {v: 'dc_rewards' as FieldKey, l: 'Data', icon: '📊'},
    ],
    network: [
      {v: 'hotspot_count' as FieldKey, l: 'Hotspots', icon: '📍'},
      {v: 'density_k1' as FieldKey, l: 'Density', icon: '🗺️'},
      {v: 'transmit_scale_approx' as FieldKey, l: 'Tx Scale', icon: '📶'},
    ],
    analytics: [
      {v: 'ma_3d_total' as FieldKey, l: '3D MA Total', icon: '📈'},
      {v: 'ma_3d_poc' as FieldKey, l: '3D MA PoC', icon: '📉'},
    ],
  }

  const dayPct = useMemo(() => {
    const span = Math.max(1, H_MAX - 1)
    return ((Math.min(H_MAX, Math.max(1, day)) - 1) / span) * 100
  }, [day])

  const forecastDisabled = mode !== 'forecast'

  // Find current field for display
  const currentField = Object.values(fieldGroups)
    .flat()
    .find((f) => f.v === field)

  return (
    <div className="toolbar-container">
      <form onSubmit={onApply} className="map-toolbar">
        {/* Main Row */}
        <div className="toolbar-row">
          {/* Mode Toggle */}
          <div className="group">
            <ModeToggle mode={mode} onChange={onMode} />
          </div>

          <span className="divider" />

          {/* Field Selection */}
          <div className="group" style={{flex: 1}}>
            <span className="label">Field</span>
            <select
              value={field}
              onChange={(e) => onField(e.target.value as FieldKey)}
              className="chip"
              style={{
                minWidth: '160px',
              }}
            >
              {Object.entries(fieldGroups).map(([group, fields]) => (
                <optgroup
                  key={group}
                  label={group.charAt(0).toUpperCase() + group.slice(1)}
                >
                  {fields.map((f) => (
                    <option key={f.v} value={f.v}>
                      {f.icon} {f.l}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Primary Actions */}
          <div className="group" style={{marginLeft: 'auto'}}>
            <button
              type="button"
              className="chip"
              aria-pressed={lassoActive}
              onClick={onToggleLasso}
              title="Select area with lasso"
            >
              {lassoActive ? '✓ Lasso' : 'Lasso'}
            </button>

            <label className="switch" title="Colorblind friendly palette">
              <input
                type="checkbox"
                checked={paletteMode === 'cbf'}
                onChange={(e) =>
                  onPaletteMode(e.target.checked ? 'cbf' : 'default')
                }
              />
              <span className="switch-ui" />
              <span>CBF</span>
            </label>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d={collapsed ? 'M7 10l5 5 5-5' : 'M7 14l5-5 5 5'} />
              </svg>
            </button>

            <button type="submit" className="btn-apply">
              Apply
            </button>
          </div>
        </div>

        {/* Forecast Controls - Collapsible */}
        {!collapsed && mode === 'forecast' && (
          <div
            className="toolbar-row"
            style={{
              borderTop: '1px solid var(--glass-border)',
              paddingTop: 'var(--space-3)',
              marginTop: 'var(--space-1)',
            }}
          >
            {/* Forecast Info */}
            <span
              className="chip"
              style={{background: 'transparent', cursor: 'default'}}
            >
              Next 4d
            </span>

            <span className="divider" />

            {/* Aggregate */}
            <div className="group">
              <span className="label">Aggregate</span>
              {(['sum', 'avg'] as AggMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="chip"
                  aria-pressed={agg === m}
                  onClick={() => onAgg(m)}
                >
                  {m === 'sum' ? 'Sum' : 'Average'}
                </button>
              ))}
            </div>

            <span className="divider" />

            {/* Per Day Controls */}
            <div className="group" style={{flex: 1}}>
              <PerDayControl
                enabled={!forecastDisabled && perDay}
                onToggle={onPerDay}
                playing={playing}
                onTogglePlay={onTogglePlay}
                day={day}
                max={H_MAX}
              />

              {perDay && (
                <div
                  className="horizon-wrap"
                  style={{flex: 1, maxWidth: '240px'}}
                >
                  <input
                    type="range"
                    min={1}
                    max={H_MAX}
                    value={Math.min(Math.max(1, day), H_MAX)}
                    onChange={(e) => onDay(Number(e.target.value))}
                    className="slider"
                    style={{
                      width: '100%',
                      background: `linear-gradient(90deg, var(--accent-primary) ${dayPct}%, var(--glass-bg) ${dayPct}%)`,
                    }}
                    disabled={forecastDisabled || !perDay}
                  />
                  <span className="h-bubble" style={{left: `${dayPct}%`}}>
                    Day {Math.min(Math.max(1, day), H_MAX)}
                  </span>
                </div>
              )}
            </div>

            {/* Advanced Toggle */}
            <button
              type="button"
              className="chip"
              onClick={onToggleAdvanced}
              aria-pressed={advancedOpen}
            >
              Advanced
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
