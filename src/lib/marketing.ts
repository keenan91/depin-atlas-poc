export type Audience = 'home' | 'solana' | 'helium'

export const heroCopy: Record<
  Audience,
  {
    badge?: string
    title: string[]
    sub: string
    primaryCta: {label: string; href: string}
    secondaryCta?: {label: string; href: string}
  }
> = {
  home: {
    badge: undefined,
    title: ['Predictive Intelligence', 'for DePIN Networks'],
    sub: 'Forecasts with calibrated uncertainty, open architecture, production-ready APIs.',
    primaryCta: {label: 'Launch Demo', href: '/#demo'},
    secondaryCta: {label: 'View Performance Metrics', href: '/#results'},
  },
  solana: {
    badge: 'Solana Foundation Grant Proposal',
    title: ['The First Forecasting', 'Platform for Solana DePINs'],
    sub: 'Open architecture enabling any Solana DePIN to add predictive capabilities.',
    primaryCta: {label: 'Launch Demo', href: '/#demo'},
    secondaryCta: {label: 'Read Proposal (PDF)', href: '/reviewers#solana'},
  },
  helium: {
    badge: 'Helium Foundation Grant Proposal',
    title: ['Forecasting & HIP Simulator', 'for the Helium Network'],
    sub: 'Hex-level predictions with calibrated uncertainty and policy impact simulation.',
    primaryCta: {label: 'Launch Demo', href: '/#demo'},
    secondaryCta: {label: 'Read Proposal (PDF)', href: '/reviewers#helium'},
  },
}

export const disclosures: Record<Audience, string | undefined> = {
  home: undefined,
  solana:
    'Disclosure: We’re also applying to the Helium Foundation for Helium-specific work. Funds are ring-fenced; no double-spend.',
  helium:
    'Disclosure: We’re also applying to the Solana Foundation for cross-network, open-source components. Funds are ring-fenced; no double-spend.',
}
