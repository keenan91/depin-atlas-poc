// src/components/ui/SDKCard.tsx
import {Check} from 'lucide-react'

type SDKCardProps = {
  name: string
  title: string
  description: string
  features: ReadonlyArray<string> // accept readonly arrays
  icon: React.ReactNode
  accent: 'cyan' | 'violet' | 'pink'
  featured?: boolean
  /** Optional package label to display instead of @depin-atlas/{name} */
  pkg?: string
}

export function SDKCard({
  name,
  title,
  description,
  features,
  icon,
  featured,
  pkg,
}: SDKCardProps) {
  const pkgLabel = pkg ?? `@depin-atlas/${name}`

  return (
    <article className="group relative h-full">
      {/* Featured badge */}
      {featured && (
        <div
          className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full 
                     bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1 
                     text-xs font-bold uppercase tracking-wider"
        >
          Core Technology
        </div>
      )}

      {/* Card */}
      <div
        className={`
          relative h-full rounded-2xl border border-white/10 bg-black/40 p-8 
          backdrop-blur-xl transition-all duration-500 hover:border-violet-500/30 hover:bg-black/50
          ${featured ? 'lg:scale-[1.02]' : ''}
        `}
      >
        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="mb-6 text-slate-300">{icon}</div>

          {/* Package name */}
          <code className="mb-4 block font-mono text-sm text-violet-400">
            {pkgLabel}
          </code>

          {/* Title & Description */}
          <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            {description}
          </p>

          {/* Features */}
          <ul className="space-y-3" role="list">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                  <Check className="h-3 w-3 text-violet-400" />
                </div>
                <span className="text-sm text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
