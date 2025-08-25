import * as React from 'react'
import {Check} from 'lucide-react'

type SDKCardProps = {
  name: string
  title: string
  description: string
  features: string[]
  icon: React.ReactNode
  accent: 'cyan' | 'violet' | 'pink'
  featured?: boolean
}

const accentRing: Record<SDKCardProps['accent'], string> = {
  cyan: 'from-cyan-400 to-sky-500',
  violet: 'from-violet-400 to-fuchsia-500',
  pink: 'from-pink-400 to-rose-500',
}

export function SDKCard({
  name,
  title,
  description,
  features,
  icon,
  featured,
  accent = 'violet',
}: SDKCardProps) {
  return (
    <article className="group relative h-full">
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
          Core Technology
        </div>
      )}

      <div className="relative h-full rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-7 hover:border-white/20 hover:bg-black/45 transition">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10">
          <div className="mb-6 text-slate-200">{icon}</div>
          <code className="text-sm text-violet-400/90 font-mono block mb-3">
            @depin-atlas/{name}
          </code>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {description}
          </p>

          <ul className="mt-6 space-y-3" role="list">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span
                  className={[
                    'mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full',
                    'bg-gradient-to-br',
                    accentRing[accent],
                    'bg-opacity-20/0',
                  ].join(' ')}
                >
                  <span className="h-5 w-5 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white/90" />
                  </span>
                </span>
                <span className="text-slate-200/90 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
