import {colorClasses} from '@/lib/colors'

type Props = {
  day: string
  coverage: number
  status: string
  color: keyof typeof colorClasses
}

export default function CircularStat({day, coverage, status, color}: Props) {
  const colors = colorClasses[color]
  const r = 36
  const C = 2 * Math.PI * r
  const dash = (coverage / 100) * C

  return (
    <div className="relative group">
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center hover:bg-white/[0.04] transition-all">
        <div className="relative w-20 h-20 mx-auto mb-3">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={r}
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-white/10"
            />
            <circle
              cx="40"
              cy="40"
              r={r}
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${dash} ${C}`}
              className={colors.text}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{coverage}%</span>
          </div>
        </div>
        <div className="text-sm font-medium text-slate-300">{day}</div>
        <div className={`text-xs ${colors.textLight} mt-1`}>{status}</div>
      </div>
    </div>
  )
}
