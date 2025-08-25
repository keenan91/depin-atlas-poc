import CircularStat from '@/components/ui/CircularStat'

export default function ResultsSection() {
  const accuracy = [
    {horizon: 'Day 1', accuracy: 22.8, baseline: 33.9, improvement: 32},
    {horizon: 'Day 2', accuracy: 23.1, baseline: null, improvement: null},
    {horizon: 'Day 3', accuracy: 24.8, baseline: null, improvement: null},
    {horizon: 'Day 4', accuracy: 28.6, baseline: null, improvement: null},
  ] as const

  const coverage = [
    {day: 'D1', coverage: 94, status: 'Calibrated', color: 'green' as const},
    {day: 'D2', coverage: 93, status: 'Calibrated', color: 'green' as const},
    {day: 'D3', coverage: 89, status: 'Good', color: 'yellow' as const},
    {day: 'D4', coverage: 81, status: 'Expected', color: 'orange' as const},
  ]

  return (
    <section id="proven-results" className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 mb-6">
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-violet-400" />
          PROVEN RESULTS
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-violet-400" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          90 Days of Production Validation
        </h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          California IoT network proof-of-concept demonstrates enterprise-grade
          accuracy
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Accuracy */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8">
          <h3 className="text-2xl font-semibold text-white mb-8 flex items-center justify-between">
            Forecast Accuracy
            <span className="text-sm font-normal text-slate-400">SMAPE ↓</span>
          </h3>
          <div className="space-y-6">
            {accuracy.map((item) => (
              <div key={item.horizon} className="relative">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-medium text-slate-300">
                    {item.horizon}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">
                      {item.accuracy}%
                    </span>
                    {item.improvement && (
                      <span className="text-xs text-green-400 ml-2">
                        ↓{item.improvement}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-1000"
                    style={{width: `${100 - item.accuracy}%`}}
                  />
                  {item.baseline && (
                    <div
                      className="absolute inset-y-0 left-0 h-full w-[1px] bg-white/40"
                      style={{left: `${100 - item.baseline}%`}}
                    />
                  )}
                </div>
                {item.baseline && (
                  <div className="text-xs text-slate-500 mt-1">
                    Baseline: {item.baseline}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Coverage */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8">
          <h3 className="text-2xl font-semibold text-white mb-8">
            Prediction Intervals{' '}
            <span className="text-sm font-normal text-slate-400 ml-2">
              95% confidence
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {coverage.map((c) => (
              <CircularStat key={c.day} {...c} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          All metrics computed on strict time-split validation with no location
          data leakage
        </p>
      </div>
    </section>
  )
}
