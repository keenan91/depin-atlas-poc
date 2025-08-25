import Link from 'next/link'
import DePINLogoPill from '@/components/brand/DePINLogo'

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <DePINLogoPill height={28} badgeWidth={72} gap={5} />
            <span className="text-sm text-slate-500">© 2025</span>
          </div>

          <div className="flex items-center gap-8">
            <Link
              href="/iot/map"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Demo
            </Link>
            <Link
              href="https://github.com/depin-atlas/platform"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="#proven-results"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Results
            </Link>
          </div>

          <div className="text-sm text-slate-500">
            Apache-2.0 • Built for Solana
          </div>
        </div>
      </div>
    </footer>
  )
}
