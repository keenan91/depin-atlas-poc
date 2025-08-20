export const palettes = {
  default: ['#183059', '#2d4b87', '#486ab9', '#6b8ee0', '#a8c1ff'],
  cbf: ['#3366cc', '#6699cc', '#99ccff', '#a1d99b', '#2ca25f'],
} as const

export type PaletteKey = keyof typeof palettes

export function colorForRank(rank: number, palette: PaletteKey = 'default') {
  const steps = palettes[palette]
  return steps[Math.min(steps.length - 1, Math.max(0, rank))]
}
