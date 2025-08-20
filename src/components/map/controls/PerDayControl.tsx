'use client'

import React from 'react'

interface PerDayControlProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  playing: boolean
  onTogglePlay: () => void
  day: number
  max: number
}

export default function PerDayControl({
  enabled,
  onToggle,
  playing,
  onTogglePlay,
  day,
  max,
}: PerDayControlProps) {
  return (
    <div className="perday-control-group">
      <label className="perday-toggle">
        <input
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="perday-toggle-track">
          <span className="perday-toggle-thumb">
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className="perday-toggle-icon"
            >
              <path
                d="M2 5L4 7L8 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        <span className="perday-toggle-label">Per-day</span>
      </label>

      {/* Playback button */}
      <button
        type="button"
        onClick={onTogglePlay}
        disabled={!enabled}
        className={`perday-play-btn ${playing ? 'playing' : ''} ${
          !enabled ? 'disabled' : ''
        }`}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect
              x="3"
              y="3"
              width="3"
              height="8"
              rx="0.5"
              fill="currentColor"
            />
            <rect
              x="8"
              y="3"
              width="3"
              height="8"
              rx="0.5"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M4 3.5V10.5L10 7L4 3.5Z"
              fill="currentColor"
              stroke="currentColor"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Day indicator */}
      <div className={`perday-indicator ${!enabled ? 'disabled' : ''}`}>
        <span className="perday-indicator-label">H+{day}</span>
        <span className="perday-indicator-divider">/</span>
        <span className="perday-indicator-max">{max}</span>
      </div>
    </div>
  )
}
