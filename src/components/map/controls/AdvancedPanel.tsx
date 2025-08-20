'use client'

import React, {useEffect, useRef} from 'react'

export default function AdvancedPanel({
  poc,
  data,
  onPoc,
  onData,
  onReset,
  onClose,
}: {
  poc: number
  data: number
  onPoc: (v: number) => void
  onData: (v: number) => void
  onReset: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="adv-popover"
      role="dialog"
      aria-label="Forecast advanced options"
    >
      <div className="adv-row">
        <div className="adv-col">
          <div className="adv-label">PoC</div>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={poc}
            onChange={(e) => onPoc(Number(e.target.value))}
            className="slider"
            aria-label="PoC multiplier"
          />
          <div className="adv-val">×{poc.toFixed(2)}</div>
        </div>

        <div className="adv-col">
          <div className="adv-label">Data</div>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={data}
            onChange={(e) => onData(Number(e.target.value))}
            className="slider"
            aria-label="Data multiplier"
          />
          <div className="adv-val">×{data.toFixed(2)}</div>
        </div>
      </div>

      <div className="adv-actions">
        <button type="button" className="chip" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="chip" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
