'use client'

import {Mode} from '@/types/iot'

export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode
  onChange: (m: Mode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Data mode"
      className="inline-flex rounded-full border border-white/15 bg-white/5 p-0.5"
    >
      {[
        {v: 'observed', l: 'Observed'},
        {v: 'forecast', l: 'Forecast'},
      ].map((t) => (
        <button
          key={t.v}
          role="tab"
          aria-selected={mode === (t.v as Mode)}
          className={`px-3 py-1.5 text-xs rounded-full ${
            mode === (t.v as Mode)
              ? 'bg-white/15 text-white border border-white/20'
              : 'text-white/75'
          }`}
          onClick={() => onChange(t.v as Mode)}
          title={
            t.v === 'forecast'
              ? 'Show model forecast and confidence range'
              : 'Show observed values only'
          }
          type="button"
        >
          {t.l}
        </button>
      ))}
    </div>
  )
}
