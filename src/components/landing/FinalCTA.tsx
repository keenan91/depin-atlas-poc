import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-32 text-center relative">
      <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 via-transparent to-transparent -z-10" />

      <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
        Ready to Shape the
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 motion-safe:animate-gradient-x">
          Future of DePINs?
        </span>
      </h2>

      <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12">
        Experience the first predictive intelligence platform for decentralized
        infrastructure
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/iot/map"
          className="group relative inline-flex items-center gap-3 rounded-2xl px-10 py-5 overflow-hidden transition-all duration-500 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10 text-lg font-semibold text-white">
            Launch Demo
          </span>
          <svg
            className="relative z-10 w-5 h-5 text-white group-hover:translate-x-2 transition-transform"
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
          href="https://github.com/depin-atlas/platform"
          className="group relative inline-flex items-center gap-3 rounded-2xl px-10 py-5 border border-white/20 hover:border-white/30 transition-all duration-300"
        >
          <span className="text-lg font-semibold text-slate-300 group-hover:text-white transition-colors">
            View Source Code
          </span>
        </Link>
      </div>

      <div className="mt-20 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] border border-white/10">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        <p className="text-sm text-slate-400">
          Full technical documentation and API specifications available for
          grant reviewers
        </p>
      </div>
    </section>
  )
}
