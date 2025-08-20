'use client'

import React, {useEffect} from 'react'

export default function DayScrubber({
  perDay,
  onPerDay,
  day,
  onDay,
  horizon,
  playing,
  onTogglePlay,
  speed = 900,
}: {
  perDay: boolean
  onPerDay: (v: boolean) => void
  day: number
  onDay: (v: number) => void
  horizon: number
  playing: boolean
  onTogglePlay: () => void
  speed?: number
}) {
  useEffect(() => {
    if (!perDay || !playing) return
    const id = window.setInterval(() => {
      onDay((d) => (d >= horizon ? 1 : d + 1))
    }, Math.max(250, speed))
    return () => window.clearInterval(id)
  }, [perDay, playing, horizon, speed, onDay])

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-[11px] text-white/70">
        <input
          type="checkbox"
          className="accent-white/80"
          checked={perDay}
          onChange={(e) => onPerDay(e.target.checked)}
        />
        Per-day
      </label>

      <button
        type="button"
        onClick={onTogglePlay}
        disabled={!perDay}
        className={`px-2 py-1 rounded-md border text-xs ${
          perDay
            ? 'border-white/15 bg-white/10 hover:bg-white/15 text-white/85'
            : 'border-white/10 bg-white/5 text-white/60 cursor-not-allowed'
        }`}
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶︎'}
      </button>

      <input
        type="range"
        min={1}
        max={Math.max(1, horizon)}
        value={Math.min(Math.max(1, day), Math.max(1, horizon))}
        onChange={(e) => onDay(Number(e.target.value))}
        className="slider w-36"
        disabled={!perDay}
        aria-label="Per-day horizon scrubber"
      />
      <span className="text-xs text-white/80 w-12 text-right">
        H+{Math.min(Math.max(1, day), Math.max(1, horizon))}
      </span>
    </div>
  )
}
