// src/lib/ui/motion.ts
export const DUR = {
  hover: 0.18,
  panel: 0.24,
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
