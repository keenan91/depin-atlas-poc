'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import MetricCard from '@/components/ui/MetricCard'
import BadgeLink from '@/components/ui/BadgeLink'

type Variant = 'home' | 'solana' | 'helium'

export default function Hero() {
  const pathname = usePathname()
  const variant: Variant = pathname?.startsWith('/helium')
    ? 'helium'
    : pathname?.startsWith('/solana')
    ? 'solana'
    : 'home'

  const copy = {
    badgeHint:
      variant === 'helium'
        ? 'Helium Foundation Grant Proposal'
        : 'Solana Foundation Grant Proposal',

    // Headline blocks
    line1: variant === 'helium' ? 'Introducing' : 'The First',
    gradientWord:
      variant === 'helium' ? 'Predictive Intelligence' : 'Forecasting',
    kicker: variant === 'helium' ? 'for Helium' : 'Platform for Solana DePINs',

    // Subhead
    subhead:
      variant === 'helium'
        ? `Hex-level forecasts with calibrated uncertainty. HIP impact simulations for deployers and governance.`
        : `Every DePIN shows you yesterday's data. None show tomorrow's opportunities.`,

    subheadAccent:
      variant === 'helium' ? 'Purpose-built for Helium.' : 'Until now.',
  } as const

  const metrics = [
    {
      value: '22.8%',
      label: 'SMAPE',
      sublabel: 'vs 33.9% baseline',
      trend: '+32%',
    },
    {
      value: '94%',
      label: 'Coverage',
      sublabel: 'prediction intervals',
      trend: 'Calibrated',
    },
    {
      value: '1-4d',
      label: 'Horizon',
      sublabel: 'forecast range',
      trend: 'Flexible',
    },
    {
      value: '90d',
      label: 'Validated',
      sublabel: variant === 'helium' ? 'CA IoT network' : 'CA IoT network',
      trend: 'Proven',
    },
  ] as const

  return (
    <section className="relative min-h-screen flex items-center pt-14">
      {/* subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-20 w-full">
        <div className="max-w-5xl">
          <div className="inline-flex items-center gap-3 animate-fade-in">
            <BadgeLink audience={variant} />
          </div>

          {/* Headline (identical structure/spacing to your original) */}
          <h1 className="mt-8 text-6xl md:text-8xl font-bold tracking-tight">
            <span className="block text-white opacity-90 animate-fade-in-up">
              {copy.line1}
            </span>

            <span className="block mt-2 animate-fade-in-up animation-delay-200">
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300 motion-safe:animate-gradient-x">
                  {copy.gradientWord}
                </span>
                <span className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-pink-600/20 blur-2xl motion-safe:animate-pulse-glow motion-reduce:animate-none" />
              </span>
            </span>

            <span className="block text-white/80 text-5xl md:text-6xl mt-4 animate-fade-in-up animation-delay-400">
              {copy.kicker}
            </span>
          </h1>

          {/* Subhead */}
          <p className="mt-8 text-xl md:text-2xl text-slate-300 leading-relaxed max-w-4xl animate-fade-in-up animation-delay-600">
            {copy.subhead}{' '}
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-pink-300">
              {copy.subheadAccent}
            </span>
          </p>

          <div className="mt-10 flex flex-wrap gap-4 animate-fade-in-up animation-delay-800">
            <Link
              href="/iot/map"
              className="group relative inline-flex items-center gap-3 rounded-2xl px-8 py-4 overflow-hidden transition-all duration-500 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 motion-safe:animate-gradient-xy" />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
              <span className="relative z-10 font-semibold text-white">
                Launch Demo
              </span>
              <svg
                className="relative z-10 w-5 h-5 text-white group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>

            <Link
              href="#proven-results"
              className="group relative inline-flex items-center gap-3 rounded-2xl px-8 py-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.02]"
            >
              <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">
                View Performance Metrics
              </span>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up animation-delay-1000">
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:animate-bounce-slow motion-reduce:animate-none">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
          <div className="w-1 h-3 bg-white/40 rounded-full motion-safe:animate-scroll-indicator" />
        </div>
      </div>
    </section>
  )
}
