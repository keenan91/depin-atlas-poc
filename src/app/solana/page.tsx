import type {Metadata} from 'next'
import AnimatedBackground from '@/components/layout/AnimatedBackground'
import SiteHeader from '@/components/layout/SiteHeader'
import Hero from '@/components/landing/Hero'
import DemoShowcase from '@/components/landing/DemoShowcase'
import SolutionShowcase from '@/components/sections/SolutionShowcase'
import ResultsSection from '@/components/landing/ResultsSection'
import ArchitectureSection from '@/components/landing/ArchitectureSection'
import FinalCTA from '@/components/landing/FinalCTA'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'DePIN Atlas — The First Forecasting Platform for Solana DePINs',
  description:
    'Open forecasting layer for Solana DePINs: SDK adapters, H3 schema, calibrated uncertainty, and production-ready APIs.',
  openGraph: {
    title: 'DePIN Atlas — Forecasting for Solana DePINs',
    description:
      'Add predictive intelligence to your Solana DePIN with hex-level forecasts and an open SDK.',
    images: ['/og-solana.png'],
    siteName: 'DePIN Atlas',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DePIN Atlas — Forecasting for Solana DePINs',
    description:
      'Predictive intelligence + SDKs for Solana DePINs. Try the live demo.',
    images: ['/og-solana.png'],
  },
  alternates: {canonical: '/solana'},
}

export default function SolanaPage() {
  return (
    <main className="min-h-[100svh] bg-[#0a0b0d] text-slate-200 overflow-x-hidden">
      <AnimatedBackground />
      <SiteHeader />

      <Hero />
      <DemoShowcase />
      <SolutionShowcase />
      <ResultsSection />
      <ArchitectureSection audience="solana" />
      <FinalCTA />

      <SiteFooter />
    </main>
  )
}
