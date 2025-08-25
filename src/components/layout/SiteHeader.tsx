'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'

type NavItem = {href: string; label: string}

const tabs: readonly NavItem[] = [
  {href: '/', label: 'Overview'},
  {href: '/solana', label: 'Solana'},
  {href: '/helium', label: 'Helium'},
] as const

const jumps = [{href: '/#proven-results', label: 'Results'}] as const
export default function SiteHeader() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActiveTab = (href: string) => pathname === href

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'border-b border-white/10 bg-[#0a0b0d]/95 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="group relative flex items-center gap-2 font-semibold tracking-tight"
            aria-label="DePIN Atlas — Home"
          >
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 opacity-80 blur-lg transition-all group-hover:opacity-100" />
              <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-white">DePIN</span>
              <span className="ml-1 text-purple-400">Atlas</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map((item) => {
              const active = isActiveTab(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className="group relative px-4 py-2 text-sm font-medium"
                >
                  <span
                    className={`relative z-10 transition-colors duration-200 ${
                      active
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 rounded-xl bg-white/10"
                      transition={{type: 'spring', stiffness: 380, damping: 30}}
                    />
                  )}
                  <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              )
            })}

            {jumps.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                scroll
                className="group relative px-4 py-2 text-sm font-medium"
              >
                <span className="relative z-10 text-slate-400 transition-colors group-hover:text-white">
                  {item.label}
                </span>
                <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative hidden overflow-hidden rounded-lg p-2 text-slate-400 transition-colors hover:text-white md:inline-flex"
              aria-label="View on GitHub"
              title="View on GitHub"
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <svg
                className="relative h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>

            <Link
              href="/iot/map"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-[1px] transition-all hover:scale-105"
            >
              <div className="flex items-center gap-2 rounded-full bg-[#0a0b0d] px-5 py-2.5 transition-all group-hover:bg-transparent">
                <span className="font-semibold text-white">Launch Demo</span>
                <motion.svg
                  className="h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  animate={{x: 0}}
                  whileHover={{x: 3}}
                  transition={{type: 'spring', stiffness: 400}}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5-5 5M6 12h12"
                  />
                </motion.svg>
              </div>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="relative h-10 w-10 rounded-lg bg-white/5 p-2 text-white transition-colors hover:bg-white/10 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="relative h-full w-full">
                <span
                  className={`absolute left-0 top-0 h-0.5 w-full bg-current transition-all ${
                    isMobileMenuOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : ''
                  }`}
                />
                <span
                  className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-current transition-all ${
                    isMobileMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 h-0.5 w-full bg-current transition-all ${
                    isMobileMenuOpen
                      ? 'bottom-1/2 translate-y-1/2 -rotate-45'
                      : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{opacity: 0, y: -20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
            transition={{duration: 0.2}}
            className="fixed inset-x-0 top-16 z-30 md:hidden"
          >
            <div className="mx-4 rounded-2xl border border-white/10 bg-[#0a0b0d]/95 p-6 backdrop-blur-xl">
              <nav className="flex flex-col gap-2">
                {[...tabs, ...jumps].map((item, i) => {
                  const active = tabs.some((t) => t.href === item.href)
                    ? isActiveTab(item.href)
                    : false
                  return (
                    <motion.div
                      key={item.href}
                      initial={{opacity: 0, x: -20}}
                      animate={{opacity: 1, x: 0}}
                      transition={{delay: i * 0.05}}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block rounded-xl px-4 py-3 font-medium transition-all ${
                          active
                            ? 'bg-white/10 text-white'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>
              <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.2}}
                className="mt-6 flex items-center justify-between border-t border-white/10 pt-6"
              >
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="text-sm">View on GitHub</span>
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
