'use client'

import Link from 'next/link'

type Audience = 'home' | 'solana' | 'helium'

export default function BadgeLink({audience = 'home' as Audience}) {
  const copy =
    audience === 'helium'
      ? {label: 'Helium Foundation Grant Proposal', href: '/helium#grant'}
      : audience === 'solana'
      ? {label: 'Solana Foundation Grant Proposal', href: '/solana#grant'}
      : {label: 'Solana Foundation Grant Proposal', href: '/solana#grant'}

  return (
    <Link
      href={copy.href}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium
                 text-violet-100 bg-violet-500/10 ring-1 ring-violet-500/30 hover:ring-violet-400/50
                 transition"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
      {copy.label}
    </Link>
  )
}
