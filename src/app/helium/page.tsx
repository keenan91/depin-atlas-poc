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
  title: 'DePIN Atlas for Helium — Forecasts & HIP Simulator',
  description:
    'Hex-level forecasts (1–4d) with calibrated uncertainty and a HIP impact simulator. Purpose-built for Helium.',
  openGraph: {
    title: 'DePIN Atlas — Predictive Intelligence for Helium',
    description:
      'Forecast rewards and simulate HIPs before voting. Live demo + public API.',
    images: ['/og-helium.png'],
    siteName: 'DePIN Atlas',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DePIN Atlas — Predictive Intelligence for Helium',
    description: 'Hex-level forecasts & HIP simulator. Built for Helium.',
    images: ['/og-helium.png'],
  },
  alternates: {canonical: '/helium'},
}
export default function HeliumLandingPage() {
  return (
    <main className="min-h-[100svh] bg-[#0a0b0d] text-slate-200 overflow-x-hidden">
      <AnimatedBackground />
      <SiteHeader />
      <Hero />
      <DemoShowcase />
      <ProblemSection />
      <SolutionShowcase />
      <ResultsSection />
      <ArchitectureSection audience="helium" />
      <FinalCTA />
      <SiteFooter />
    </main>
  )
}
