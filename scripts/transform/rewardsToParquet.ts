import * as fs from 'fs'
import {tableFromJSON, tableToIPC} from 'apache-arrow'

const [rawPath, outPathArg] = process.argv.slice(2)
if (!rawPath) {
  console.error(
    'Usage: tsx scripts/transform/rewardsToParquet.ts <raw.json> [out.arrow]',
  )
  process.exit(1)
}

const outPath = outPathArg ?? rawPath.replace(/\.json$/i, '.arrow')

const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'))

const rows = raw.map((r: any) => ({
  date: (r.start_period ?? '').slice(0, 10),
  hotspot: r.reward_detail?.hotspot_key ?? null,
  beacon: r.reward_detail?.beacon_amount ?? 0,
  witness: r.reward_detail?.witness_amount ?? 0,
  dc: r.reward_detail?.dc_transfer_amount ?? 0,
  reward_type: r.reward_type ?? null,
}))

const table = tableFromJSON(rows)
const buf = Buffer.from(tableToIPC(table)) // Arrow IPC (Feather) binary
fs.writeFileSync(outPath, buf)
console.log(`Wrote ${rows.length} rows → ${outPath}`)
