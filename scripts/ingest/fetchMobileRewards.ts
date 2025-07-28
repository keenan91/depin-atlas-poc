import fs from 'node:fs'
import path from 'node:path'
import {listMobileRewards} from '@/lib/relay'
import dayjs from 'dayjs'

const HOTSPOTS = [
  '1trSusf4AydmebT8DXYGRQ6CFRrfRnMZbWai9tBcCAHzbJysMe46vjtKbZcNShdGP2nJzDhztzjKpiqpQwBACoq6deKZgdHMyqnQwSkLF1vkaaEcQ5d91NHy6UzL3mQ4NHsWDgXuoQsH5ihKryiCm8cJSaoqxWy8WNCMGiBaVzFsHqVAx5K9Mmav1Sx1dq5S6TzamNXuxdJBYyWs3GQXiFVpecWKVnbS5MWd7EX2ytJrcsShRxBaWbQWuq64zW55UuywHPVQyXzCx5WrHAwRhGnNXYcssfhmjdCqiWtNaXyWTeCg1DbvjTB8RWyXnhBgr5F675Z3ysdavqyMQadMTAEZHJrWqVB7NiyTU822o1j4Rt',
]

async function main() {
  const to = dayjs().startOf('day')
  const from = to.subtract(23, 'day') // ~24 days, like IoT sample

  const all: any[] = []

  for (const eccKey of HOTSPOTS) {
    const resp = await listMobileRewards({
      from: from.format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD'),
      hotspot_key: eccKey,
    })
    const rows = resp.records ?? []
    console.log(`Pulled ${rows.length} rows for ${eccKey}`)
    all.push(...rows)
  }

  const outDir = path.resolve('data/raw')
  fs.mkdirSync(outDir, {recursive: true})
  const outFile = path.join(
    outDir,
    `mobile_${from.format('YYYY-MM-DD')}_${to.format('YYYY-MM-DD')}.json`,
  )
  fs.writeFileSync(outFile, JSON.stringify(all, null, 2))
  console.log(`Wrote ${all.length} rows → ${outFile}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
