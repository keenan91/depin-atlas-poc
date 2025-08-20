'use client'

import React, {useState, useEffect, useRef} from 'react'

export type AggMode = 'sum' | 'avg'

interface ForecastOptionsProps {
  poc: number
  data: number
  onPoc: (value: number) => void
  onData: (value: number) => void
  agg: AggMode
  onAgg: (mode: AggMode) => void
}

export default function ForecastOptions({
  poc,
  data,
  onPoc,
  onData,
  agg,
  onAgg,
}: ForecastOptionsProps) {
  const [isPocChanging, setIsPocChanging] = useState(false)
  const [isDataChanging, setIsDataChanging] = useState(false)
  const [prevPoc, setPrevPoc] = useState(poc)
  const [prevData, setPrevData] = useState(data)
  const [isValueChanging, setIsValueChanging] = useState(false)
  const pocTimeoutRef = useRef<NodeJS.Timeout>()
  const dataTimeoutRef = useRef<NodeJS.Timeout>()
  const valueTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (poc !== prevPoc) {
      setIsPocChanging(true)
      setIsValueChanging(true)
      setPrevPoc(poc)

      if (pocTimeoutRef.current) clearTimeout(pocTimeoutRef.current)
      if (valueTimeoutRef.current) clearTimeout(valueTimeoutRef.current)

      pocTimeoutRef.current = setTimeout(() => setIsPocChanging(false), 300)
      valueTimeoutRef.current = setTimeout(() => setIsValueChanging(false), 300)
    }
  }, [poc, prevPoc])

  useEffect(() => {
    if (data !== prevData) {
      setIsDataChanging(true)
      setIsValueChanging(true)
      setPrevData(data)

      if (dataTimeoutRef.current) clearTimeout(dataTimeoutRef.current)
      if (valueTimeoutRef.current) clearTimeout(valueTimeoutRef.current)

      dataTimeoutRef.current = setTimeout(() => setIsDataChanging(false), 300)
      valueTimeoutRef.current = setTimeout(() => setIsValueChanging(false), 300)
    }
  }, [data, prevData])

  const handleReset = () => {
    onPoc(1)
    onData(1)
  }

  const scenarioImpact = ((poc + data) / 2) * 100
  const isDefault = poc === 1 && data === 1

  return (
    <div
      className={`forecast-options ${isValueChanging ? 'value-changing' : ''}`}
    >
      {/* Header */}
      <div className="forecast-header">
        <div className="forecast-title">
          <span className="forecast-icon">⚡</span>
          <span>Forecast Scenario</span>
        </div>
        <div className="forecast-subtitle">
          Adjust multipliers to model different scenarios
        </div>
      </div>

      {/* Aggregate Mode with smooth toggle */}
      <div className="forecast-section">
        <label className="forecast-label">
          <span className="label-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect
                x="2"
                y="2"
                width="4"
                height="4"
                rx="1"
                fill="currentColor"
                opacity="0.8"
              />
              <rect
                x="8"
                y="2"
                width="4"
                height="4"
                rx="1"
                fill="currentColor"
                opacity="0.6"
              />
              <rect
                x="2"
                y="8"
                width="4"
                height="4"
                rx="1"
                fill="currentColor"
                opacity="0.6"
              />
              <rect
                x="8"
                y="8"
                width="4"
                height="4"
                rx="1"
                fill="currentColor"
                opacity="0.8"
              />
            </svg>
          </span>
          <span>Aggregation</span>
        </label>
        <div className="agg-pills" data-active={agg}>
          <button
            type="button"
            onClick={() => onAgg('sum')}
            className={`agg-pill ${agg === 'sum' ? 'active' : ''}`}
          >
            <span className="pill-icon">∑</span>
            <span>Sum</span>
          </button>
          <button
            type="button"
            onClick={() => onAgg('avg')}
            className={`agg-pill ${agg === 'avg' ? 'active' : ''}`}
          >
            <span className="pill-icon">≈</span>
            <span>Daily Avg</span>
          </button>
        </div>
      </div>

      {/* POC Multiplier with animated value */}
      <div className="forecast-section">
        <div className="multiplier-header">
          <label className="forecast-label">
            <span className="label-icon poc">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <polygon
                  points="7,2 9,6 13,6 10,9 11,13 7,11 3,13 4,9 1,6 5,6"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span>PoC Rewards</span>
          </label>
          <div className="multiplier-value">
            <span className="mult-symbol">×</span>
            <span className={`mult-number ${isPocChanging ? 'changing' : ''}`}>
              {poc.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={poc}
            onChange={(e) => onPoc(Number(e.target.value))}
            className="multiplier-slider poc-slider"
            style={{
              background: `linear-gradient(90deg, #8b5cf6 ${
                (poc / 2) * 100
              }%, rgba(148, 163, 184, 0.15) ${(poc / 2) * 100}%)`,
            }}
          />
          <div className="slider-marks">
            <span>0</span>
            <span>1</span>
            <span>2</span>
          </div>
        </div>
      </div>

      {/* Data Multiplier with animated value */}
      <div className="forecast-section">
        <div className="multiplier-header">
          <label className="forecast-label">
            <span className="label-icon data">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1L11.5 3.5V10.5L7 13L2.5 10.5V3.5L7 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
              </svg>
            </span>
            <span>Data Credits</span>
          </label>
          <div className="multiplier-value">
            <span className="mult-symbol">×</span>
            <span className={`mult-number ${isDataChanging ? 'changing' : ''}`}>
              {data.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={data}
            onChange={(e) => onData(Number(e.target.value))}
            className="multiplier-slider data-slider"
            style={{
              background: `linear-gradient(90deg, #3b82f6 ${
                (data / 2) * 100
              }%, rgba(148, 163, 184, 0.15) ${(data / 2) * 100}%)`,
            }}
          />
          <div className="slider-marks">
            <span>0</span>
            <span>1</span>
            <span>2</span>
          </div>
        </div>
      </div>

      <div className="forecast-actions">
        <button type="button" onClick={handleReset} className="reset-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M12 7A5 5 0 112 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M12 4V7H9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Reset</span>
        </button>
        <div className="scenario-indicator">
          <span className="scenario-label">Scenario Impact</span>
          <span
            className={`scenario-value ${!isDefault ? 'active' : ''} ${
              isValueChanging ? 'changing' : ''
            }`}
            style={{
              color: isDefault ? '#94a3b8' : undefined,
            }}
          >
            {scenarioImpact.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}
