// Tiny CLI that pulls a week of IoT‑reward rows for a couple test hotspots
// and stores them under data/raw/.
// Usage:  npx ts-node scripts/ingest/fetchIotRewards.ts

import {listIotRewards} from '@/lib/relay'
import fs from 'node:fs/promises'
import path from 'node:path'

const HOTSPOTS = [
  '112525c3839a5047', // <- replace with real ECC keys you care about
  '112k33FQz3Qs6F38gCeosbrmvCCKyPnP6rfoXtHpuTbxLtpyr9Yv',
]

const from = '2025-07-01'
const to = '2025-07-24'

;(async () => {
  const out: any[] = []

  for (const h of HOTSPOTS) {
    const res = await listIotRewards({hotspot_key: h, from, to}, 2)
    out.push(...res.records)
    console.log(`Pulled ${res.records.length} rows for ${h}`)
  }

  const outfile = path.join(
    process.cwd(),
    'data',
    'raw',
    `iot_${from}_${to}.json`,
  )
  await fs.writeFile(outfile, JSON.stringify(out, null, 2))
  console.log(`Wrote ${out.length} rows → ${outfile}`)
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
