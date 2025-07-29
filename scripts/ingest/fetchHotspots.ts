// Fetch all IOT hotspots from Helium v2 API, filter to CA bbox, save JSON lookup: { hotspot_key: { lat, lon, gain, elevation } }
// Usage: npx tsx scripts/ingest/fetchHotspots.ts --swlat=32 --swlon=-125 --nelat=42 --nelon=-114 --output data/lookup/ca_iot_hotspots.json

import fs from 'fs/promises'
import path from 'path'
import fetch from 'node-fetch'

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchAllIotHotspots(
  swlat: number,
  swlon: number,
  nelat: number,
  nelon: number,
  output: string,
) {
  let cursor = ''
  const lookup: Record<
    string,
    {lat: number; lon: number; gain: number; elevation: number}
  > = {}
  let totalFetched = 0
  let totalFiltered = 0

  do {
    const url = `https://entities.nft.helium.io/v2/hotspots?subnetwork=iot&cursor=${cursor}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText} - URL: ${url}`)
    }
    const data = (await response.json()) as {items: any[]; cursor?: string}
    totalFetched += data.items.length

    data.items.forEach((hs: any) => {
      const lat = hs.lat
      const lon = hs.long
      if (lat >= swlat && lat <= nelat && lon >= swlon && lon <= nelon) {
        lookup[hs.entity_key_str] = {
          lat,
          lon,
          gain: hs.gain || 0,
          elevation: hs.elevation || 0,
        }
        totalFiltered++
      }
    })

    cursor = data.cursor || ''
    console.log(
      `Fetched ${data.items.length} hotspots (total fetched: ${totalFetched}, filtered to CA: ${totalFiltered})`,
    )
    if (cursor) await delay(200) // Rate limit avoidance
  } while (cursor)

  const filePath = path.resolve(output)
  await fs.writeFile(filePath, JSON.stringify(lookup, null, 2))
  console.log(`Saved ${totalFiltered} CA IOT hotspots to ${filePath}`)
}

// Parse CLI args
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=')
  acc[key.replace('--', '')] = value
  return acc
}, {} as Record<string, string>)

const swlat = Number(args.swlat) || 32
const swlon = Number(args.swlon) || -125
const nelat = Number(args.nelat) || 42
const nelon = Number(args.nelon) || -114
const output = args.output || 'data/lookup/ca_iot_hotspots.json'

fetchAllIotHotspots(swlat, swlon, nelat, nelon, output).catch((e) => {
  console.error(e)
  process.exit(1)
})
