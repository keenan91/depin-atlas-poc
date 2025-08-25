'use client'

import React, {useId, useMemo, useState} from 'react'
import CopyButton from '@/components/ui/CopyButton'

type Tab = {
  name: string
  desc: string
  header: string
  requestBody: string
  responseBody: string
  footer?: string
  errorBody?: string
}

export default function SolutionShowcase() {
  const base = useId()
  const [active, setActive] = useState(0)

  const tabs: Tab[] = useMemo(
    () => [
      {
        name: 'Hex',
        desc: 'Query by H3 index',
        header: 'Query by H3 hex ID',
        requestBody: `POST /api/v1/iot/forecast
Authorization: Bearer <token>
Content-Type: application/json

{
  "hex": "8828309769fffff",
  "horizon": 4
}`,
        responseBody: `{
  "ok": true,
  "meta": {
    "model": "helium-iot-v1",
    "h3_res": 9,
    "elapsed_ms": 62,
    "units": "IOT tokens",
    "request_id": "req_9Yx3k..."
  },
  "predictions": [
    { "date": "2025-08-21", "expected": 0.026, "p5": 0.015, "p95": 0.044 },
    { "date": "2025-08-22", "expected": 0.024, "p5": 0.014, "p95": 0.041 },
    { "date": "2025-08-23", "expected": 0.023, "p5": 0.013, "p95": 0.040 },
    { "date": "2025-08-24", "expected": 0.022, "p5": 0.012, "p95": 0.038 }
  ]
}`,
        footer:
          'Dates are UTC • expected is the median • p5/p95 are calibrated 95% intervals',
      },
      {
        name: 'Point',
        desc: 'lat/lon + k-ring',
        header: 'Query by coordinates + k-ring',
        requestBody: `POST /api/v1/iot/forecast
Authorization: Bearer <token>
Content-Type: application/json

{
  "lat": 37.7793,
  "lon": -122.4193,
  "res": 9,
  "k": 1,
  "horizon": 4
}`,
        responseBody: `{
  "ok": true,
  "meta": {
    "model": "helium-iot-v1",
    "h3_res": 9,
    "center_hex": "8828309769fffff",
    "hex_count": 7,
    "elapsed_ms": 68,
    "units": "IOT tokens",
    "request_id": "req_2Qf1p..."
  },
  "predictions": [
    { "date": "2025-08-21", "expected": 0.026, "p5": 0.015, "p95": 0.044 },
    { "date": "2025-08-22", "expected": 0.024, "p5": 0.014, "p95": 0.041 },
    { "date": "2025-08-23", "expected": 0.023, "p5": 0.013, "p95": 0.040 },
    { "date": "2025-08-24", "expected": 0.022, "p5": 0.012, "p95": 0.038 }
  ]
}`,
        footer:
          'Dates are UTC • expected is the median • p5/p95 are calibrated 95% intervals',
      },
      {
        name: 'Area',
        desc: 'bounding box',
        header: 'Query by bounding box (minLon, minLat, maxLon, maxLat)',
        requestBody: `POST /api/v1/iot/forecast
Authorization: Bearer <token>
Content-Type: application/json

{
  "bbox": [-122.55, 37.70, -122.35, 37.84],
  "res": 9,
  "horizon": 4,
  "aggregate": true
}`,
        responseBody: `{
  "ok": true,
  "meta": {
    "bbox": [-122.55, 37.70, -122.35, 37.84],
    "hex_count": 284,
    "aggregate": true,
    "elapsed_ms": 142,
    "units": "IOT tokens",
    "request_id": "req_B7a9r..."
  },
  "predictions": [
    { "date": "2025-08-21", "expected_total": 7.384, "expected_per_hex": 0.026, "p5": 4.260, "p95": 12.496 },
    { "date": "2025-08-22", "expected_total": 7.201, "expected_per_hex": 0.025, "p5": 4.050, "p95": 12.110 },
    { "date": "2025-08-23", "expected_total": 6.987, "expected_per_hex": 0.025, "p5": 3.920, "p95": 11.702 },
    { "date": "2025-08-24", "expected_total": 6.812, "expected_per_hex": 0.024, "p5": 3.740, "p95": 11.324 }
  ]
}`,
        errorBody: `{
  "ok": false,
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "bbox must be [minLon, minLat, maxLon, maxLat]",
    "field": "bbox"
  },
  "request_id": "req_XXXX"
}`,
        footer:
          'Dates are UTC • expected is the median • p5/p95 are calibrated 95% intervals',
      },
    ],
    [],
  )

  const tabId = (i: number) => `${base}-tab-${i}`
  const panelId = (i: number) => `${base}-panel-${i}`

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left column */}
        <div className="lg:min-w-0">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 mb-6">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-violet-400" />
            THE SOLUTION
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Introducing
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 mt-2">
              Predictive Intelligence
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            The missing forecasting layer for DePIN networks. Turn historical
            patterns into actionable predictions.
          </p>

          <div className="space-y-5">
            {[
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                ),
                title: 'Flexible Forecasts',
                desc: 'Query by hex, point coordinates, or area bounds',
                color: 'from-violet-500 to-purple-500',
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                ),
                title: 'Governance Simulator',
                desc: 'Model HIP impacts before implementation',
                color: 'from-purple-500 to-pink-500',
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                ),
                title: 'Open Platform',
                desc: 'SDK for any Solana DePIN to add forecasting',
                color: 'from-pink-500 to-rose-500',
              },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} p-[1px] transition-transform duration-300 group-hover:scale-105`}
                >
                  <div className="w-full h-full rounded-2xl bg-black/90 flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-purple-400 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column (tabs) */}
        <div className="relative lg:min-w-0">
          <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/10 to-pink-600/10 rounded-3xl blur-2xl motion-safe:animate-pulse motion-reduce:animate-none" />
          <div className="relative">
            {/* Tablist */}
            <div
              className="flex gap-2 p-2 bg-gradient-to-b from-slate-900/80 to-black/40 backdrop-blur-xl rounded-t-2xl border border-white/10 border-b-0"
              role="tablist"
              aria-label="Forecasting API examples"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight')
                  setActive((p) => (p + 1) % tabs.length)
                if (e.key === 'ArrowLeft')
                  setActive((p) => (p - 1 + tabs.length) % tabs.length)
              }}
            >
              {tabs.map((t, i) => {
                const selected = active === i
                return (
                  <button
                    key={t.name}
                    id={tabId(i)}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId(i)}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(i)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                      selected
                        ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-white border border-white/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40`}
                  >
                    <div className="relative z-10">
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs opacity-70">{t.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Panels */}
            <div className="rounded-b-2xl rounded-tr-2xl border border-white/10 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-xl overflow-hidden shadow-2xl overflow-x-hidden">
              {tabs.map((t, i) => {
                const hidden = active !== i
                return (
                  <div
                    key={t.name}
                    id={panelId(i)}
                    role="tabpanel"
                    aria-labelledby={tabId(i)}
                    aria-live="polite"
                    hidden={hidden}
                    className={`${
                      hidden ? 'hidden' : ''
                    } h-[520px] flex flex-col`}
                  >
                    {/* top bar */}
                    <div className="bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-b border-white/[0.06] px-6 py-3 flex items-center justify-between flex-shrink-0">
                      <span className="text-sm text-slate-400 font-mono">
                        {t.header}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          Requires demo token • Rate limited
                        </span>
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500/30 blur-lg motion-reduce:hidden" />
                          <div className="relative px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30">
                            <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              Live API
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* scroller (vertical only) */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 font-mono text-sm">
                      {/* Request */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-500 flex items-center gap-2">
                          <span className="text-violet-400">#</span> Request
                        </span>
                        <CopyButton getText={() => t.requestBody} />
                      </div>

                      <div className="bg-black/40 rounded-xl p-4 border border-white/5 backdrop-blur-sm space-y-3">
                        <div>
                          <span className="text-pink-500 font-semibold">
                            POST
                          </span>
                          <span className="text-slate-300">
                            {' '}
                            /api/v1/iot/forecast
                          </span>
                        </div>
                        <div className="text-slate-400 text-xs space-y-1">
                          <div>Authorization: Bearer &lt;token&gt;</div>
                          <div>Content-Type: application/json</div>
                        </div>
                        <div className="border-t border-white/5 pt-3">
                          <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{`${
                            t.requestBody.split('\n\n')[1] ?? '{}'
                          }`}</pre>
                        </div>
                      </div>

                      {/* Response */}
                      <div className="flex items-center justify-between mt-6 mb-3">
                        <span className="text-slate-500 flex items-center gap-2">
                          <span className="text-violet-400">#</span> Response
                        </span>
                        <CopyButton getText={() => t.responseBody} />
                      </div>

                      <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl p-4 border border-green-500/10 backdrop-blur-sm">
                        <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                          {t.responseBody}
                        </pre>
                      </div>

                      {/* Optional error block (Area tab) */}
                      {t.errorBody && (
                        <div className="mt-8 pt-6 border-t border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-500 flex items-center gap-2">
                              <span className="text-rose-400">#</span> Error
                              Response
                            </span>
                          </div>
                          <div className="bg-gradient-to-br from-rose-500/5 to-red-500/5 rounded-xl p-4 border border-rose-500/10 backdrop-blur-sm">
                            <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                              {t.errorBody}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* footer */}
                    <div className="px-6 py-3 border-t border-white/[0.06] bg-black/20 flex-shrink-0">
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {t.footer}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
