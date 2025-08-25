export default function ProblemSection() {
  const cards = [
    {
      icon: '🎯',
      title: 'Blind Deployments',
      desc: 'Operators invest $3,000+ per hotspot based on current rewards, not future potential',
      gradient: 'from-red-500 to-rose-500',
      stats: '$180M+ at risk',
    },
    {
      icon: '🗳️',
      title: 'Governance Guesswork',
      desc: 'HIPs approved without quantified network-wide impact modeling',
      gradient: 'from-orange-500 to-amber-500',
      stats: '47 HIPs blind voted',
    },
    {
      icon: '💸',
      title: 'Capital Inefficiency',
      desc: 'Resources flow to oversaturated areas while underserved regions remain dark',
      gradient: 'from-yellow-500 to-orange-500',
      stats: '~40% misallocated',
    },
  ] as const

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 relative">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          The{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
            $3,000
          </span>{' '}
          Problem
        </h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Every deployment decision. Every governance vote.
          <span className="text-white font-medium">
            {' '}
            Made blind to future outcomes.
          </span>
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <div
            key={c.title}
            className="group relative rounded-3xl p-8 overflow-hidden hover:scale-[1.02] transition-all duration-500"
            style={{transitionDelay: `${i * 100}ms`}}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-[0.15] group-hover:opacity-20 transition-opacity`}
            />
            <div
              className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${c.gradient} opacity-20`}
            />
            <div className="absolute inset-[1px] rounded-3xl bg-black" />
            <div className="relative">
              <div className="text-4xl mb-4">{c.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {c.title}
              </h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                {c.desc}
              </p>
              <div
                className={`text-sm font-semibold bg-gradient-to-r ${c.gradient} text-transparent bg-clip-text`}
              >
                {c.stats}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
