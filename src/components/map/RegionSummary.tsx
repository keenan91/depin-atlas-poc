'use client'

import React, {useMemo, useState} from 'react'
import {fmt} from '@/lib/utils/format'

type HexAgg = {
  hex: string
  value: number
  lower_band?: number
  upper_band?: number
  hotspot_count: number
  density_k1: number
}

export default function RegionSummary({
  items,
  title = 'Region Summary',
  perDay,
  day,
  horizon,
}: {
  items: HexAgg[]
  title?: string
  perDay: boolean
  day: number
  horizon: number
}) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const agg = useMemo(() => {
    const total = items.reduce((a, b) => a + (b.value || 0), 0)
    const lower = items.reduce((a, b) => a + (b.lower_band || 0), 0)
    const upper = items.reduce((a, b) => a + (b.upper_band || 0), 0)
    const hs = items.reduce((a, b) => a + (b.hotspot_count || 0), 0)
    return {total, lower, upper, hs}
  }, [items])

  const downloadCsv = async () => {
    setIsExporting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate processing

      const header = [
        'hex',
        'value',
        'lower_band',
        'upper_band',
        'hotspot_count',
        'density_k1',
      ]
      const lines = [
        header.join(','),
        ...items.map((r) =>
          [
            r.hex,
            r.value ?? 0,
            r.lower_band ?? '',
            r.upper_band ?? '',
            r.hotspot_count ?? '',
            r.density_k1 ?? '',
          ].join(','),
        ),
      ].join('\n')
      const blob = new Blob([lines], {type: 'text/csv;charset=utf-8;'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'region_forecast.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className={`
        fixed right-4 bottom-4 z-[860] 
        transition-all duration-300 ease-out
        ${isMinimized ? 'translate-y-[calc(100%-48px)]' : 'translate-y-0'}
      `}
      style={{
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(20px) saturate(140%)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        minWidth: '280px',
        maxWidth: '92vw',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
        style={{
          borderBottom: isMinimized ? 'none' : '1px solid var(--glass-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
            }}
          />
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
        <button
          type="button"
          className="icon-btn"
          style={{width: '24px', height: '24px'}}
          aria-label={isMinimized ? 'Expand' : 'Minimize'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d={isMinimized ? 'M7 14l5-5 5 5' : 'M7 10l5 5 5-5'} />
          </svg>
        </button>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 pt-3">
          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {/* Total */}
            <div
              style={{
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '12px',
                padding: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                Total Value
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--accent-light)',
                }}
              >
                {fmt.format(agg.total)}
              </div>
            </div>

            {/* Hotspots */}
            <div
              style={{
                background: 'rgba(96, 165, 250, 0.05)',
                border: '1px solid rgba(96, 165, 250, 0.15)',
                borderRadius: '12px',
                padding: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                Hotspots
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#60a5fa',
                }}
              >
                {fmt.format(agg.hs)}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <div className="flex justify-between items-center">
              <span style={{color: 'var(--text-muted)'}}>Confidence Band</span>
              <span style={{fontWeight: 500}}>
                {fmt.format(agg.lower)} – {fmt.format(agg.upper)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{color: 'var(--text-muted)'}}>Time Window</span>
              <span
                className="chip"
                style={{
                  height: '20px',
                  padding: '0 8px',
                  fontSize: '11px',
                }}
              >
                {perDay ? `Day ${day}` : `Next ${horizon}d`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{color: 'var(--text-muted)'}}>Selected Hexes</span>
              <span style={{fontWeight: 500}}>{items.length}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{marginTop: '16px'}}>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={isExporting}
              style={{
                width: '100%',
                height: '36px',
                borderRadius: '10px',
                background:
                  'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                color: 'var(--accent-light)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isExporting ? 'wait' : 'pointer',
                transition: 'all 0.2s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(139, 92, 246, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {isExporting ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{animation: 'spin 1s linear infinite'}}
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      strokeDasharray="32"
                      strokeDashoffset="32"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="32;0"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
