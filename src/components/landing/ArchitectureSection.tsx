'use client'

import {StageFlow} from '@/components/ui/StageFlow'
import {SDKCard} from '@/components/ui/SDKCard'
import {Globe, Repeat, Hexagon, Brain, Sparkles, Zap} from 'lucide-react'

type Audience = 'home' | 'solana' | 'helium'

export default function ArchitectureSection({audience = 'home' as Audience}) {
  const isHelium = audience === 'helium'
  const kicker = isHelium ? 'HELIUM DELIVERABLES' : 'OPEN ARCHITECTURE'
  const title = isHelium
    ? 'Built for Helium, Open by Design'
    : 'Built for the Entire Ecosystem'
  const subhead = isHelium
    ? 'Purpose-built for Helium. Open so explorers, wallets, and deployers can integrate, audit, and self-host.'
    : 'Open architecture enabling any Solana DePIN to add predictive capabilities'

  const stages = isHelium
    ? [
        {
          name: 'Helium Data',
          icon: <Globe className="w-8 h-8" />,
          description: 'Direct-to-chain ETL + features',
        },
        {
          name: 'H3 r8 Feature Store',
          icon: <Hexagon className="w-8 h-8" />,
          description: 'Rewards, density, demand signals',
        },
        {
          name: 'Forecasting',
          icon: <Brain className="w-8 h-8" />,
          description: '1–4 day forecasts with intervals',
        },
        {
          name: 'HIP Simulator',
          icon: <Zap className="w-8 h-8" />,
          description: 'Model policy impacts pre-vote',
        },
        {
          name: 'API & Explorer',
          icon: <Sparkles className="w-8 h-8" />,
          description: 'Public endpoints & map UI',
        },
      ]
    : [
        {
          name: 'DePIN Networks',
          icon: <Globe className="w-8 h-8" />,
          description: 'Raw network data ingestion',
        },
        {
          name: 'Adapter SDK',
          icon: <Repeat className="w-8 h-8" />,
          description: 'Standardized transformation',
        },
        {
          name: 'H3 Schema',
          icon: <Hexagon className="w-8 h-8" />,
          description: 'Unified geospatial indexing',
        },
        {
          name: 'Forecasting',
          icon: <Brain className="w-8 h-8" />,
          description: 'ML models + calibrated uncertainty',
        },
        {
          name: 'Predictive API & UI',
          icon: <Sparkles className="w-8 h-8" />,
          description: 'Developer-ready endpoints & components',
        },
      ]

  const cards = isHelium
    ? ([
        {
          name: 'forecasting-engine',
          title: 'Forecasting Engine',
          description:
            'Hex-level daily predictions with calibrated uncertainty (5–95% intervals).',
          features: [
            '22.8% SMAPE (CA IoT)',
            '1–4 day horizon',
            '~94% PI coverage',
          ],
          icon: <Brain className="w-12 h-12" />,
          accent: 'violet' as const,
          featured: true,
          pkg: '@depin-atlas/forecasting-engine',
        },
        {
          name: 'hip-simulator',
          title: 'HIP Simulator',
          description:
            'Model policy changes before voting (PoC/Data splits, density scalars).',
          features: [
            'Scenario export',
            'Leak-safe backtesting',
            'Governance-ready',
          ],
          icon: <Zap className="w-12 h-12" />,
          accent: 'cyan' as const,
          pkg: '@depin-atlas/hip-simulator',
        },
        {
          name: 'api-explorer',
          title: 'API & Explorer',
          description:
            'Rate-limited public endpoints and React map UI for exploration.',
          features: [
            'OpenAPI + TS/Py clients',
            'Hex/point/area queries',
            'Maps, charts, controls',
          ],
          icon: <Sparkles className="w-12 h-12" />,
          accent: 'pink' as const,
          pkg: '@depin-atlas/api-explorer',
        },
      ] as const)
    : ([
        {
          name: 'adapter-sdk',
          title: 'Network Adapters',
          description: 'TypeScript contracts for seamless data translation',
          features: [
            'Type-safe contracts',
            'Built-in validation',
            'Automated testing',
          ],
          icon: <Repeat className="w-12 h-12" />,
          accent: 'cyan' as const,
          pkg: '@depin-atlas/adapter-sdk',
        },
        {
          name: 'forecasting-sdk',
          title: 'ML Pipeline',
          description:
            'Production-ready forecasting with uncertainty quantification',
          features: [
            'Conformal prediction',
            'ONNX optimization',
            'AutoML backbone',
          ],
          icon: <Brain className="w-12 h-12" />,
          accent: 'violet' as const,
          featured: true,
          pkg: '@depin-atlas/forecasting-sdk',
        },
        {
          name: 'ui-kit',
          title: 'Components',
          description: 'Beautiful React components for data visualization',
          features: ['Interactive maps', 'Real-time charts', 'Custom controls'],
          icon: <Sparkles className="w-12 h-12" />,
          accent: 'pink' as const,
          pkg: '@depin-atlas/ui-kit',
        },
      ] as const)

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
      <div className="mb-12 text-center sm:mb-14">
        <div className="mb-3 text-xs uppercase tracking-wide text-violet-300/80">
          {kicker}
        </div>
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        <p className="mx-auto max-w-3xl text-lg text-slate-300">{subhead}</p>
      </div>

      <div className="mt-6 mb-16 sm:mb-20">
        <StageFlow stages={stages} />
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {cards.map((sdk) => (
          <SDKCard key={sdk.name} {...sdk} />
        ))}
      </div>

      {isHelium && (
        <p className="mt-6 text-center text-sm text-slate-400">
          Built on open SDKs (
          <code className="text-violet-300">adapter-sdk</code>,{' '}
          <code className="text-violet-300">forecasting-sdk</code>,{' '}
          <code className="text-violet-300">ui-kit</code>) so Helium explorers,
          wallets, and deployers can integrate, audit, and self-host. Grant
          funds are used exclusively for Helium deliverables.
        </p>
      )}
    </section>
  )
}
