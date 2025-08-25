'use client'

import * as React from 'react'
import {ChevronRight} from 'lucide-react'

type Stage = {
  name: string
  icon: React.ReactNode
  description: string
}

export function StageFlow({stages}: {stages: Stage[]}) {
  return (
    <>
      {/* Desktop layout */}
      <ol
        role="list"
        className="hidden lg:flex lg:items-center lg:justify-between lg:gap-2 max-w-6xl mx-auto"
        aria-label="Processing pipeline"
      >
        {stages.map((stage, i) => (
          <li key={stage.name} className="flex items-center flex-1">
            <StageCard stage={stage} index={i} />
            {i < stages.length - 1 && <Connector />}
          </li>
        ))}
      </ol>

      {/* Mobile layout */}
      <ol
        role="list"
        className="lg:hidden relative pl-10"
        aria-label="Processing pipeline"
      >
        <div className="absolute left-5 top-8 bottom-8 w-px bg-gradient-to-b from-violet-500/50 via-violet-500/20 to-transparent" />
        {stages.map((stage, i) => (
          <li key={stage.name} className="relative mb-6 last:mb-0">
            <StageCard stage={stage} index={i} orientation="horizontal" />
          </li>
        ))}
      </ol>
    </>
  )
}

function StageCard({
  stage,
  index,
  orientation = 'vertical',
}: {
  stage: Stage
  index: number
  orientation?: 'vertical' | 'horizontal'
}) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      className={`
        relative w-full text-left bg-black/40 backdrop-blur-sm rounded-2xl 
        border border-white/10 hover:border-violet-500/30 hover:bg-black/50 
        transition-all duration-300 group focus-within:ring-2 
        focus-within:ring-violet-500/50 focus-within:ring-offset-2 focus-within:ring-offset-black
        ${isHorizontal ? 'flex items-center gap-4 p-4 pl-12' : 'p-6'}
        min-h-[176px] md:min-h-[184px]
      `}
      aria-label={`Stage ${index + 1}: ${stage.name} - ${stage.description}`}
    >
      <div
        className={`
        absolute ${
          isHorizontal ? 'left-0 top-1/2 -translate-y-1/2' : '-top-3 left-6'
        } w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 
        flex items-center justify-center font-bold shadow-lg text-sm
      `}
      >
        {index + 1}
      </div>

      <div className={`text-slate-300 ${isHorizontal ? '' : 'mb-3'}`}>
        {stage.icon}
      </div>

      <div className={`${isHorizontal ? 'flex-1 min-w-0' : ''}`}>
        <div className="text-xs font-medium text-violet-400 mb-1 uppercase tracking-wider">
          Stage
        </div>
        <h3 className="text-base font-semibold text-white mb-1">
          {stage.name}
        </h3>
        <p className="text-sm text-slate-400">{stage.description}</p>
      </div>
    </div>
  )
}

function Connector() {
  return (
    <div className="relative flex-shrink-0 mx-1">
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/10 -translate-y-1/2" />
      <div
        className="relative z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm 
                   border border-white/10 flex items-center justify-center 
                   hover:border-white/20 hover:bg-black/40 transition-all duration-300"
        aria-hidden="true"
      >
        <ChevronRight className="w-5 h-5 text-white/60" />
      </div>
    </div>
  )
}
