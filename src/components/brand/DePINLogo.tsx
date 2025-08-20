'use client'

import * as React from 'react'

type Props = {
  height?: number
  gap?: number
  showBadge?: boolean
  badgeWidth?: number
  pulse?: boolean
  className?: string
  ariaLabel?: string
}

export default function DePINLogoPill({
  height = 40,
  gap = 6,
  showBadge = true,
  badgeWidth = 104,
  pulse = true,
  className,
  ariaLabel = 'DePIN Atlas — Helium Network',
}: Props) {
  const base = 150
  const viewWidth = showBadge ? base + gap + badgeWidth + 24 : base

  return (
    <div className={className} role="img" aria-label={ariaLabel}>
      <style jsx global>{`
        /* SVG-friendly pulse (scale + fade). */
        @keyframes pulseRing {
          0% {
            transform: scale(1);
            opacity: 0.35;
          }
          70% {
            transform: scale(2.2);
            opacity: 0;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .dot-ring {
          transform-box: fill-box; /* make transform origin work in SVG */
          transform-origin: center;
          animation: pulseRing 1.8s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .dot-ring {
            animation: none !important;
          }
        }
      `}</style>

      <svg
        height={height}
        viewBox={`0 0 ${viewWidth} 40`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.06" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <g transform="translate(4,4)">
          <circle cx="16" cy="16" r="18" fill="url(#innerGlow)" />
          <path
            d="M16 1 L28 8 L28 24 L16 31 L4 24 L4 8 Z"
            stroke="url(#hexGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinejoin="round"
            filter="url(#softGlow)"
          />
          <path
            d="M16 1 L28 8 L28 24 L16 31 L4 24 L4 8 Z"
            fill="url(#innerGlow)"
            opacity=".4"
          />
          <g opacity=".85">
            <circle cx="16" cy="16" r="3" fill="#A78BFA" />
            <g stroke="#7C3AED" strokeWidth="1" opacity=".35">
              <line x1="16" y1="16" x2="16" y2="8" />
              <line x1="16" y1="16" x2="23" y2="12" />
              <line x1="16" y1="16" x2="23" y2="20" />
              <line x1="16" y1="16" x2="16" y2="24" />
              <line x1="16" y1="16" x2="9" y2="20" />
              <line x1="16" y1="16" x2="9" y2="12" />
            </g>
            <circle cx="16" cy="8" r="1.2" fill="#C4B5FD" />
            <circle cx="23" cy="12" r="1.2" fill="#C4B5FD" />
            <circle cx="23" cy="20" r="1.2" fill="#C4B5FD" />
            <circle cx="16" cy="24" r="1.2" fill="#C4B5FD" />
            <circle cx="9" cy="20" r="1.2" fill="#C4B5FD" />
            <circle cx="9" cy="12" r="1.2" fill="#C4B5FD" />
          </g>
        </g>
        <text
          x="40"
          y="24"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          fontSize="18"
          fontWeight="700"
          fill="#FFFFFF"
          letterSpacing="-0.02em"
        >
          DePIN
        </text>
        <text
          x={93 + gap}
          y="24"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          fontSize="18"
          fontWeight="300"
          fill="#A3B0C2"
          letterSpacing="-0.02em"
        >
          Atlas
        </text>

        {/* HELIUM Badge */}
        {showBadge && (
          <g transform={`translate(${140 + gap}, 9)`}>
            <rect
              width={badgeWidth}
              height="22"
              rx="11"
              fill="url(#badgeGrad)"
              stroke="rgba(139,92,246,0.30)"
              strokeWidth="1"
            />
            {pulse && (
              <circle
                className="dot-ring"
                cx="14"
                cy="11"
                r="3"
                fill="#10B981"
              />
            )}
            <circle cx="14" cy="11" r="3" fill="#10B981" />
            <text
              x={badgeWidth / 2 + 6}
              y="15"
              fontFamily="Inter, system-ui, -apple-system, sans-serif"
              fontSize="11"
              fontWeight="600"
              fill="#A78BFA"
              letterSpacing=".08em"
              textAnchor="middle"
            >
              HELIUM
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
