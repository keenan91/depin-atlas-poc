import type {Metadata} from 'next'
import AnimatedBackground from '@/components/layout/AnimatedBackground'
import SiteHeader from '@/components/layout/SiteHeader'
import Hero from '@/components/landing/Hero'
import DemoShowcase from '@/components/landing/DemoShowcase'
import ProblemSection from '@/components/landing/ProblemSection'
import SolutionShowcase from '@/components/sections/SolutionShowcase'
import ResultsSection from '@/components/landing/ResultsSection'
import ArchitectureSection from '@/components/landing/ArchitectureSection'
import FinalCTA from '@/components/landing/FinalCTA'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'DePIN Atlas — The First Forecasting Platform for Solana DePINs',
  description:
    'Turn historical DePIN data into predictive intelligence. Hex-level forecasts with calibrated uncertainty, HIP impact simulations, and an open API. Starting with Helium.',
  openGraph: {
    title: 'DePIN Atlas — Forecasting for Solana DePINs',
    description:
      'The missing predictive layer for DePIN networks. Location-specific forecasts, governance simulations, and uncertainty quantification.',
    images: ['/og.png'],
    siteName: 'DePIN Atlas',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DePIN Atlas — The First DePIN Forecasting Platform',
    description:
      'Turn historical data into predictive intelligence. Starting with Helium.',
    images: ['/og.png'],
  },
}

export default function LandingPage() {
  return (
    <main className="min-h-[100svh] bg-[#0a0b0d] text-slate-200 overflow-x-hidden">
      <AnimatedBackground />
      <SiteHeader />

      <Hero />
      <DemoShowcase />
      <ProblemSection />
      <SolutionShowcase />
      <ResultsSection />
      <ArchitectureSection audience="home" />
      <FinalCTA />

      <SiteFooter />
    </main>
  )
}
