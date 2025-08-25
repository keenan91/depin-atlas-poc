'use client'

import {useEffect, useRef} from 'react'
import * as L from 'leaflet'
import {useMap} from 'react-leaflet'
import {fmt, prettyFieldLabel} from '@/lib/utils/format'
import {PaletteKey, colorForRank} from '@/lib/utils/colors'
import type {Mode} from '@/types/iot'

type Props = {
  cuts: number[]
  field: string
  palette: PaletteKey
  mode: Mode
}

export default function LegendControl({cuts, field, palette, mode}: Props) {
  const map = useMap()
  const containerRef = useRef<HTMLElement | null>(null)
  const controlRef = useRef<L.Control | null>(null)

  function renderHtml(): string {
    const bands = Math.max(1, (cuts?.length ?? 0) + 1)

    const labels: string[] = []
    if (bands === 1) {
      labels.push('N/A')
    } else {
      const f = (n: number) => fmt.format(n)
      labels.push(`Low (&lt; ${f(cuts[0])})`)
      for (let i = 1; i < cuts.length; i++) {
        labels.push(`${f(cuts[i - 1])} - ${f(cuts[i])}`)
      }
      labels.push(`High (&gt; ${f(cuts[cuts.length - 1])})`)
    }

    const swatches = Array.from({length: bands}, (_, i) => {
      const col = colorForRank(i, palette)
      const gradientId = `grad-${i}`
      return `
        <li class="legend-item">
          <svg class="legend-swatch" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${col};stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:${col};stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#${gradientId})" />
            <rect x="0" y="0" width="24" height="24" rx="6" fill="none" stroke="${col}" stroke-width="1" opacity="0.3" />
          </svg>
          <span class="legend-label">${labels[i]}</span>
        </li>`
    }).join('')

    const title = prettyFieldLabel(field)
    const modeTag =
      mode === 'forecast'
        ? '<span class="legend-mode-tag">Forecast</span>'
        : '<span class="legend-mode-tag">Observed</span>'

    const forecastInfo =
      mode === 'forecast'
        ? `
      <div class="legend-info">
        <div class="legend-info-item">
          <svg width="20" height="2" class="legend-dash">
            <line x1="0" y1="1" x2="20" y2="1" stroke="currentColor" stroke-dasharray="4 2" />
          </svg>
          <span>Forecast values</span>
        </div>
        <div class="legend-info-item">
          <svg width="16" height="16" viewBox="0 0 16 16" class="legend-icon">
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6" />
            <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
          <span>Width = Uncertainty</span>
        </div>
      </div>`
        : ''

    return `
      <div class="legend-container">
        <div class="legend-header">
          <h3 class="legend-title">${title}</h3>
          ${modeTag}
        </div>
        <ul class="legend-list">${swatches}</ul>
        ${forecastInfo}
      </div>
    `
  }

  useEffect(() => {
    const styleId = 'legend-custom-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        .legend {
          background: var(--bg-overlay, rgba(20, 27, 45, 0.95));
          backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid var(--glass-border, rgba(148, 163, 184, 0.1));
          border-radius: 16px;
          padding: 0;
          color: var(--text-primary, rgba(248, 250, 252, 0.95));
          font-size: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          min-width: 220px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        
        .legend:hover {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
          transform: translateY(-2px);
        }
        
        .legend-container { padding: 16px; }
        .legend-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px; padding-bottom: 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .legend-title { font-size: 14px; font-weight: 600; margin: 0; color: var(--text-primary, rgba(248, 250, 252, 0.95)); }
        .legend-mode-tag {
          font-size: 10px; padding: 3px 8px; border-radius: 999px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 1px solid rgba(139, 92, 246, 0.3); color: var(--accent-light, #a78bfa);
          font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em;
        }
        .legend-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .legend-item { display: flex; align-items: center; gap: 10px; transition: all 0.15s ease-out; padding: 4px; border-radius: 8px; margin: 0 -4px; }
        .legend-item:hover { background: rgba(139, 92, 246, 0.05); }
        .legend-swatch { width: 20px; height: 20px; flex-shrink: 0; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)); transition: transform 0.15s ease-out; }
        .legend-item:hover .legend-swatch { transform: scale(1.1); }
        .legend-label { font-size: 12px; color: var(--text-secondary, rgba(203, 213, 225, 0.8)); line-height: 1.4; }
        .legend-info { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(148, 163, 184, 0.08); display: flex; flex-direction: column; gap: 6px; }
        .legend-info-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted, rgba(148, 163, 184, 0.6)); }
        .legend-dash { opacity: 0.7; }
        .legend-icon { opacity: 0.6; }
      `
      document.head.appendChild(style)
    }

    // ✅ Construct via class to satisfy TS in some Leaflet type bundles
    const ctrl = new L.Control({position: 'bottomright'})
    ctrl.onAdd = () => {
      const div = L.DomUtil.create('div', 'legend') as HTMLElement
      L.DomEvent.disableClickPropagation(div)
      div.innerHTML = renderHtml()
      containerRef.current = div
      return div
    }
    ctrl.addTo(map)
    controlRef.current = ctrl

    return () => {
      map.removeControl(ctrl)
      controlRef.current = null
      containerRef.current = null
    }
  }, [map])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = renderHtml()
    }
  }, [cuts, field, palette, mode])

  return null
}
