'use client'

import {useState} from 'react'

type Props = {
  getText: () => string
  label?: string
  className?: string
}

export default function CopyButton({
  getText,
  label = 'Copy',
  className,
}: Props) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      aria-live="polite"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText())
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch {}
      }}
      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20 ${
        className ?? ''
      }`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={
            copied
              ? 'M5 13l4 4L19 7'
              : 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
          }
        />
      </svg>
      <span className="text-xs font-medium">{copied ? 'Copied' : label}</span>
    </button>
  )
}
