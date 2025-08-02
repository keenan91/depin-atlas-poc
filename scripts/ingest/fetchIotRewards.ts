import fs from 'fs/promises'
import {existsSync, createReadStream, appendFileSync} from 'fs'
import path from 'path'
import readline from 'readline'
import {listIotRewards, createRelay, IoTRewardShare} from '@/lib/relay'

import * as dotenv from 'dotenv'
dotenv.config({path: path.resolve(__dirname, '../../.env.local')})

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchHotspotRewards(
  key: string,
  start: string,
  end: string,
  relayInstance: ReturnType<typeof createRelay>,
) {
  try {
    const res = await listIotRewards(
      {hotspot_key: key, from: start, to: end},
      20,
      relayInstance,
    )
    return res.records.map((r) => ({...r, hotspot_key: key}))
  } catch (e: unknown) {
    console.warn(`Failed to fetch rewards for ${key}: ${(e as Error).message}`)
    return []
  }
}

async function getCompletedKeys(filePath: string): Promise<Set<string>> {
  const completedKeys = new Set<string>()
  if (!existsSync(filePath)) {
    return completedKeys
  }
  const fileStream = createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    try {
      const record = JSON.parse(line)
      if (record.hotspot_key) {
        completedKeys.add(record.hotspot_key)
      }
    } catch (e) {
      console.warn('Skipping corrupt line in output file:', line)
    }
  }
  return completedKeys
}

async function fetchIotRewards(
  start: string,
  end: string,
  lookupFile: string,
  limit: number,
  chunkSize: number,
  apiKey: string,
  outputFilename: string,
) {
  if (!apiKey) {
    throw new Error('API key is required')
  }
  console.log('API Key loaded:', apiKey.substring(0, 8) + '...')

  const relayInstance = createRelay(apiKey)
  const lookup = JSON.parse(
    await fs.readFile(path.resolve(lookupFile), 'utf-8'),
  ) as Record<string, {lat: number; lon: number}>
  const allKeys = Object.keys(lookup).slice(
    0,
    limit || Object.keys(lookup).length,
  )

  const filePath = path.join(__dirname, '../../data/raw/iot', outputFilename)
  console.log(`Writing output to: ${filePath}`)

  const completedKeys = await getCompletedKeys(filePath)
  console.log(
    `Found ${completedKeys.size} hotspots already completed in output file.`,
  )

  const keysToFetch = allKeys.filter((key) => !completedKeys.has(key))
  console.log(
    `Fetching rewards for ${keysToFetch.length} remaining hotspots from ${start} to ${end}`,
  )

  if (keysToFetch.length === 0) {
    console.log('All hotspots have been processed. Exiting.')
    return
  }

  let totalNewRewards = 0
  for (let i = 0; i < keysToFetch.length; i += chunkSize) {
    const chunk = keysToFetch.slice(i, i + chunkSize)
    console.log(`\nProcessing chunk starting with: ${chunk[0]}`)

    const chunkRewards = await Promise.allSettled(
      chunk.map((key) => fetchHotspotRewards(key, start, end, relayInstance)),
    )

    let newRewardsInChunk = 0
    chunkRewards.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        result.value.forEach((reward) => {
          appendFileSync(filePath, JSON.stringify(reward) + '\n')
          newRewardsInChunk++
        })
      }
    })

    totalNewRewards += newRewardsInChunk
    console.log(
      `Processed chunk ${i / chunkSize + 1} of ${Math.ceil(
        keysToFetch.length / chunkSize,
      )}. Added ${newRewardsInChunk} new reward entries. Total new: ${totalNewRewards}`,
    )

    await delay(5000)
  }

  console.log(
    `\n✅ Done. Added a total of ${totalNewRewards} new reward entries to ${filePath}`,
  )
}

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=')
  acc[key.replace('--', '')] = value
  return acc
}, {} as Record<string, string>)

const start = args.start || '2025-07-15'
const end = args.end || '2025-07-29'
const lookup = args.lookup || 'data/lookup/ca_iot_hotspots.json'
const limit = Number(args.limit) || 0
const chunkSize = Number(args.chunkSize) || 3
const apiKey = args.apiKey || process.env.RELAY_API_KEY || ''

const output = args.output || `iot_${start}_${end}.jsonl`

fetchIotRewards(start, end, lookup, limit, chunkSize, apiKey, output).catch(
  (e: unknown) => {
    console.error(e)
    process.exit(1)
  },
)
