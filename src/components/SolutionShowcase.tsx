'use client'

import {useRef, useState} from 'react'

type TabKey = 'hex' | 'point' | 'area'

export default function SolutionShowcase() {
  const [tab, setTab] = useState<TabKey>('hex')

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
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

          <div className="space-y-6">
            {[
              {
                title: 'Flexible Forecasts',
                desc: 'Query by hex, point coordinates, or area bounds',
                color: 'from-violet-500 to-purple-500',
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
              },
              {
                title: 'Governance Simulator',
                desc: 'Model HIP impacts before implementation',
                color: 'from-purple-500 to-pink-500',
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
              },
              {
                title: 'Open Platform',
                desc: 'SDK for any Solana DePIN to add forecasting',
                color: 'from-pink-500 to-rose-500',
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
              },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 group">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} p-[1px] transition-transform duration-300 group-hover:scale-105`}
                >
                  <div className="w-full h-full rounded-2xl bg-black/90 flex items-center justify-center text-white">
                    {f.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-purple-400 transition-all duration-300">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="relative lg:min-w-0">
          <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/15 to-pink-600/15 rounded-3xl blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
          <div className="relative">
            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Forecast API modes"
              className="flex gap-2 p-2 bg-gradient-to-b from-slate-900/80 to-black/40 backdrop-blur-xl rounded-t-2xl border border-white/10 border-b-0"
            >
              {[
                {key: 'hex', name: 'Hex', desc: 'Query by H3 index'},
                {key: 'point', name: 'Point', desc: 'lat/lon + k-ring'},
                {key: 'area', name: 'Area', desc: 'bounding box'},
              ].map(({key, name, desc}) => {
                const active = tab === key
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    aria-controls={`panel-${key}`}
                    id={`tab-${key}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setTab(key as TabKey)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative ${
                      active
                        ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-white border border-white/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="font-semibold">{name}</div>
                    <div className="text-xs opacity-70 mt-0.5">{desc}</div>
                    {active && (
                      <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-violet-500/10 to-purple-500/10 animate-[shimmer_2s_infinite]" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Panels */}
            <div className="rounded-b-2xl rounded-tr-2xl border border-white/10 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-xl overflow-hidden shadow-2xl">
              <ApiPanel
                id="panel-hex"
                tabId="tab-hex"
                active={tab === 'hex'}
                header="Query by H3 hex ID"
                requestLines={[
                  ['POST', '/api/v1/iot/forecast'],
                  ['{'],
                  ['  "hex": ', '"8828309769fffff"', ','],
                  ['  "horizon": ', '4'],
                  ['}'],
                ]}
                responseText={`{
  "ok": true,
  "meta": { "model": "helium-iot-v1", "elapsed_ms": 62 },
  "predictions": [{
    "date": "2025-08-21",
    "expected": 0.026, "p5": 0.015, "p95": 0.044
  }]
}`}
              />

              <ApiPanel
                id="panel-point"
                tabId="tab-point"
                active={tab === 'point'}
                header="Query by coordinates + k-ring"
                requestLines={[
                  ['POST', '/api/v1/iot/forecast'],
                  ['{'],
                  ['  "lat": ', '37.7793', ','],
                  ['  "lon": ', '-122.4193', ','],
                  ['  "res": ', '9', ','],
                  ['  "k": ', '1', ', // ring radius (default 1)'],
                  ['  "horizon": ', '4'],
                  ['}'],
                ]}
                responseText={`{
  "ok": true,
  "meta": {
    "model": "helium-iot-v1",
    "h3_res": 9,
    "center_hex": "8828309769fffff",
    "hex_count": 7,
    "elapsed_ms": 68
  },
  "predictions": [{
    "date": "2025-08-21",
    "expected": 0.026, "p5": 0.015, "p95": 0.044
  }]
}`}
              />

              <ApiPanel
                id="panel-area"
                tabId="tab-area"
                active={tab === 'area'}
                header="Query by bounding box (minLon, minLat, maxLon, maxLat)"
                requestLines={[
                  ['POST', '/api/v1/iot/forecast'],
                  ['{'],
                  [
                    '  "bbox": [',
                    '-122.55',
                    ', ',
                    '37.70',
                    ', ',
                    '-122.35',
                    ', ',
                    '37.84',
                    '],',
                  ],
                  ['  "res": ', '9', ','],
                  ['  "horizon": ', '4', ','],
                  ['  "aggregate": ', 'true', ' // region totals'],
                  ['}'],
                ]}
                responseText={`{
  "ok": true,
  "meta": {
    "bbox": [-122.55, 37.70, -122.35, 37.84],
    "hex_count": 284,
    "aggregate": true,
    "elapsed_ms": 142
  },
  "predictions": [{
    "date": "2025-08-21",
    "total_rewards": 7.384,
    "avg_per_hex": 0.026,
    "p5": 4.260, "p95": 12.496
  }]
}`}
                footerNote="bbox order is [minLon, minLat, maxLon, maxLat]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* local keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </section>
  )
}

/* ---------- Reusable Panel ---------- */
function ApiPanel({
  id,
  tabId,
  active,
  header,
  requestLines,
  responseText,
  footerNote,
}: {
  id: string
  tabId: string
  active: boolean
  header: string
  requestLines: (string | number)[][]
  responseText: string
  footerNote?: string
}) {
  const reqRef = useRef<HTMLDivElement>(null)
  const resRef = useRef<HTMLPreElement>(null)

  const copyRequest = () => {
    const plain = reqRef.current?.getAttribute('data-plain') || ''
    navigator.clipboard?.writeText(plain)
  }
  const copyResponse = () => {
    const text = resRef.current?.innerText || ''
    navigator.clipboard?.writeText(text)
  }

  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={tabId}
      hidden={!active}
      className="min-h-[580px]"
    >
      <div className="bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <span className="text-sm text-slate-400 font-mono">{header}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Requires demo token • Rate limited
          </span>
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/40 blur-xl motion-reduce:animate-none animate-pulse" />
            <div className="relative px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30">
              <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 motion-reduce:animate-none animate-pulse" />
                Live API
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 font-mono text-sm">
        {/* Request */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-500 flex items-center gap-2">
            <span className="text-violet-400">#</span> Request
          </span>
          <button
            onClick={copyRequest}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-medium">Copy</span>
          </button>
        </div>

        <div
          ref={reqRef}
          data-plain={requestLines
            .map((parts) => parts.join('').replace(/,\s*\/\/.*$/, ','))
            .join('\n')}
          className="bg-black/40 rounded-xl p-4 border border-white/5 backdrop-blur-sm overflow-auto"
        >
          <div className="space-y-1 leading-relaxed text-slate-300">
            <div>
              <span className="text-pink-500 font-semibold">POST</span>
              <span className="text-slate-300 ml-2">{requestLines[0][1]}</span>
            </div>
            {requestLines.slice(1).map((row, i) => (
              <div key={i}>
                {row.map((chunk, j) => {
                  const s = String(chunk)
                  if (s.startsWith('"') && s.endsWith('"')) {
                    const isKey = /^\s*\"[a-z_]+\"\s*:?$/.test(s)
                    return (
                      <span
                        key={j}
                        className={isKey ? 'text-blue-400' : 'text-emerald-400'}
                      >
                        {s}
                      </span>
                    )
                  }
                  if (
                    /^\s*\d+(\.\d+)?\s*[,}]?$/.test(s) ||
                    s.trim() === 'true' ||
                    s.trim() === 'false'
                  ) {
                    return (
                      <span key={j} className="text-amber-400">
                        {s}
                      </span>
                    )
                  }
                  if (s.includes('//')) {
                    const [before, comment] = s.split('//')
                    return (
                      <span key={j}>
                        <span className="text-slate-400">{before}</span>
                        <span className="text-slate-600">//{comment}</span>
                      </span>
                    )
                  }
                  return (
                    <span key={j} className="text-slate-400">
                      {s}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Response */}
        <div className="flex items-center justify-between mt-8 mb-4">
          <span className="text-slate-500 flex items-center gap-2">
            <span className="text-violet-400">#</span> Response
          </span>
          <button
            onClick={copyResponse}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-medium">Copy</span>
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl p-4 border border-green-500/10 backdrop-blur-sm overflow-auto">
          <pre
            ref={resRef}
            className="text-xs text-slate-300 leading-relaxed whitespace-pre"
          >
            {responseText}
          </pre>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          Dates are UTC • <code className="font-mono">expected</code> is the
          median • p5/p95 are calibrated 95% intervals
          {footerNote ? <> • {footerNote}</> : null}
        </p>
      </div>
    </div>
  )
}
