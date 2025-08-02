import fs from 'fs'
import path from 'path'

function filterHotspotsByLocation(inputFile: string, outputFile: string) {
  // Approximate bounding box for California
  const MIN_LAT = 32.5
  const MAX_LAT = 42.0
  const MIN_LON = -124.5
  const MAX_LON = -114.0

  console.log(`Reading global hotspot file from: ${inputFile}`)
  const allHotspots = JSON.parse(fs.readFileSync(inputFile, 'utf-8'))
  const allKeys = Object.keys(allHotspots)

  const californiaHotspots: Record<string, any> = {}
  let caCount = 0

  console.log(`Filtering ${allKeys.length} total hotspots...`)
  for (const key of allKeys) {
    const hotspot = allHotspots[key]
    if (hotspot && hotspot.lat && hotspot.lon) {
      if (
        hotspot.lat >= MIN_LAT &&
        hotspot.lat <= MAX_LAT &&
        hotspot.lon >= MIN_LON &&
        hotspot.lon <= MAX_LON
      ) {
        californiaHotspots[key] = hotspot
        caCount++
      }
    }
  }

  console.log(`Found ${caCount} hotspots within California.`)
  fs.writeFileSync(outputFile, JSON.stringify(californiaHotspots, null, 2))
  console.log(`✅ Successfully saved filtered hotspots to: ${outputFile}`)
}

// --- Script Execution ---
const inputFile = process.argv[2]
const outputFile = process.argv[3]

if (!inputFile || !outputFile) {
  console.error(
    'Usage: npx tsx scripts/utils/filterHotspots.ts <input-file.json> <output-file.json>',
  )
  process.exit(1)
}

filterHotspotsByLocation(inputFile, outputFile)
