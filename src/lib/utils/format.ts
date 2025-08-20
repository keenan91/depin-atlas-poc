// src/lib/utils/format.ts
export const fmt = new Intl.NumberFormat('en-US', {notation: 'compact'})

export function prettyFieldLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace('Ma ', 'MA ')
}

export function formatChartDate(d: string): string {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
