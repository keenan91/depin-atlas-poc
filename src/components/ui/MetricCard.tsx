type Props = {value: string; label: string; sublabel: string; trend: string}
export default function MetricCard({value, label, sublabel, trend}: Props) {
  return (
    <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/5">
      <div className="absolute top-2 right-2 text-xs font-medium text-green-400/80">
        {trend}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-300">{label}</div>
      <div className="text-xs text-slate-500 mt-1">{sublabel}</div>
    </div>
  )
}
