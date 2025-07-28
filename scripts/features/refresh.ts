import fs from 'node:fs'
import path from 'node:path'

import {
  DailyRow,
  normalizeMobile,
  normalizeIoT,
  rollupDaily,
  writeArrow,
} from '../../src/lib/datasets/shared'

// VERY light arg parsing
// Usage:
//   tsx scripts/features/refresh.ts --network mobile --input data/raw/mobile.json --out data/features/mobile/latest.arrow
// Defaults:
//   --network mobile
//   --input   data/raw/mobile.json
//   --out     data/features/mobile/latest.arrow
const args = new Map<string, string>()
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i]
  const v = process.argv[i + 1]
  if (k?.startsWith('--')) args.set(k.slice(2), v ?? '')
}

const network = (args.get('network') ?? 'mobile').toLowerCase() // 'mobile' | 'iot'
const input =
  args.get('input') ??
  (network === 'iot' ? 'data/raw/iot.json' : 'data/raw/mobile.json')
const out =
  args.get('out') ??
  (network === 'iot'
    ? 'data/features/iot/latest.arrow'
    : 'data/features/mobile/latest.arrow')

function readJsonArray(file: string): any[] {
  const abs = path.resolve(file)
  if (!fs.existsSync(abs)) {
    throw new Error(`Input file not found: ${abs}`)
  }
  const txt = fs.readFileSync(abs, 'utf-8').trim()
  const data = JSON.parse(txt)
  if (!Array.isArray(data)) {
    throw new Error(`Input must be a JSON array: ${abs}`)
  }
  return data
}

async function main() {
  console.log(`Refreshing features for network='${network}'`)
  console.log(`  input: ${input}`)
  console.log(`  out:   ${out}`)

  const raw = readJsonArray(input)
  let normalized: DailyRow[]
  if (network === 'iot') {
    normalized = raw.map(normalizeIoT)
  } else {
    normalized = raw.map(normalizeMobile)
  }

  const rolled = rollupDaily(normalized)

  writeArrow(out, rolled)

  const range = rolled.length
    ? `${rolled[0].date} → ${rolled[rolled.length - 1].date}`
    : '(empty)'

  console.log(
    `Wrote ${rolled.length} rows → ${path.resolve(out)} (range ${range})`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
