'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import {useEffect, useState} from 'react'
import {motion} from 'framer-motion'

const DemoClip = dynamic(() => import('@/components/DemoClip'), {
  loading: () => (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 to-purple-900/10 animate-pulse" />
      <div className="flex h-full items-center justify-center">
        <motion.div
          animate={{rotate: 360}}
          transition={{duration: 2, repeat: Infinity, ease: 'linear'}}
          className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent"
        />
      </div>
    </div>
  ),
})

export default function DemoShowcase() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeMetric, setActiveMetric] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveMetric((p) => (p + 1) % 3)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const metrics = [
    {
      icon: '📡',
      label: 'Real-time Data',
      value: 'Live',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: '🎯',
      label: 'Forecast Accuracy',
      value: '94%',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: '🔮',
      label: 'Prediction Window',
      value: '1–4 Days',
      color: 'from-blue-500 to-cyan-500',
    },
  ] as const

  return (
    <section className="relative mx-auto max-w-[1400px] overflow-hidden px-4 py-12 sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2]}}
          transition={{duration: 8, repeat: Infinity, ease: 'easeInOut'}}
          className="absolute -left-1/3 top-0 h-[480px] w-[480px] rounded-full bg-violet-500/20 blur-[100px] [mask-image:radial-gradient(60%_60%_at_50%_50%,#000,transparent)]"
        />
        <motion.div
          animate={{scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2]}}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.6,
          }}
          className="absolute -right-1/3 bottom-0 h-[480px] w-[480px] rounded-full bg-purple-500/20 blur-[100px] [mask-image:radial-gradient(60%_60%_at_50%_50%,#000,transparent)]"
        />
      </div>

      <motion.div
        initial={{opacity: 0, y: 24}}
        animate={{opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 24}}
        transition={{duration: 0.6}}
        className="relative mb-10 text-center"
      >
        <div className="mb-3 inline-flex items-center gap-3 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            Live Demonstration
          </span>
        </div>

        <h2 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
          See Predictive Intelligence{' '}
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            in Action
          </span>
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-300">
          Real-time hex-level forecasting with calibrated uncertainty bounds
        </p>
      </motion.div>

      <motion.div
        initial={{opacity: 0, scale: 0.96}}
        animate={{opacity: 1, scale: 1}}
        transition={{duration: 0.7, type: 'spring'}}
        className="group relative overflow-hidden rounded-2xl"
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 opacity-0 blur-[6px] transition-opacity duration-700 group-hover:opacity-15" />

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-xl backdrop-blur-xl">
          <div className="border-b border-white/5 bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-transparent">
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {['bg-red-500', 'bg-yellow-500', 'bg-green-500'].map(
                    (c, i) => (
                      <motion.div
                        key={i}
                        whileHover={{scale: 1.2}}
                        className={`h-3 w-3 rounded-full ${c} ring-2 ring-white/20`}
                      />
                    ),
                  )}
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="rounded-md bg-white/5 px-2.5 py-1 text-sm font-medium text-slate-300">
                    atlas.depin.xyz
                  </span>
                  <span className="hidden text-xs text-slate-500 lg:block">
                    Helium Network • California Region
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-green-400">
                  Live
                </span>
              </div>
            </div>
          </div>

          <div className="relative aspect-[16/9] md:aspect-[2/1] lg:aspect-[21/9] overflow-hidden bg-gradient-to-b from-black/80 to-black/95">
            <DemoClip />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
              <div className="flex items-end justify-between">
                <div className="pointer-events-auto rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-md">
                  💡 Click any hex to explore forecasts
                </div>

                <Link
                  href="/iot/map"
                  className="pointer-events-auto group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
                  aria-label="Launch the full interactive demo"
                >
                  Launch Full Demo
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.35 + i * 0.06}}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-2 text-sm backdrop-blur-md hover:border-white/20"
            onHoverStart={() => setActiveMetric(i)}
          >
            <span className="text-base leading-none">{m.icon}</span>
            <span className="text-slate-300">{m.label}</span>
            <span className="mx-1 h-1 w-1 rounded-full bg-slate-500/60" />
            <span className="font-semibold text-white">{m.value}</span>
            <motion.span
              animate={{
                scale: activeMetric === i ? [1, 1.18, 1] : 1,
                opacity: activeMetric === i ? 1 : 0.6,
              }}
              transition={{duration: 0.5}}
              className={`ml-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r ${m.color}`}
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
