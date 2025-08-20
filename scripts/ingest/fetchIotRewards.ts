// scripts/ingest/fetchIotRewardsByHotspot.ts
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import readline from 'readline'
import {listIotRewards, createRelay} from '@/lib/relay'

import * as dotenv from 'dotenv'
dotenv.config({path: path.resolve(__dirname, '../../.env.local')})

type LookupRec = {lat: number; lon: number}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseKeys(argKeys?: string): string[] {
  const envKeys = process.env.RELAY_API_KEYS || process.env.RELAY_API_KEY || ''
  const raw = (argKeys || envKeys || '')
    .split(/[, \n\t]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const uniq = Array.from(new Set(raw))
  if (uniq.length === 0)
    throw new Error('No API keys provided (RELAY_API_KEYS or --apiKeys).')
  return uniq
}

async function readCompletedList(p: string): Promise<Set<string>> {
  const done = new Set<string>()
  if (!fs.existsSync(p)) return done
  const rl = readline.createInterface({
    input: fs.createReadStream(p),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    const k = line.trim()
    if (k) done.add(k)
  }
  return done
}

async function appendCompleted(p: string, key: string) {
  await fsp.mkdir(path.dirname(p), {recursive: true})
  await fsp.appendFile(p, key + '\n', 'utf8')
}

async function loadLookup(
  lookupFile: string,
): Promise<Record<string, LookupRec>> {
  const abs = path.resolve(lookupFile)
  const json = await fsp.readFile(abs, 'utf-8')
  return JSON.parse(json) as Record<string, LookupRec>
}

async function withRetries<T>(
  fn: () => Promise<T>,
  opts: {retries: number; backoffMs: number; label: string},
): Promise<T> {
  const {retries, backoffMs, label} = opts
  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (e: any) {
      attempt++
      const msg = e?.message || String(e)
      if (attempt > retries) {
        console.warn(`[fail] ${label}: ${msg}`)
        throw e
      }
      const wait = backoffMs * Math.max(1, attempt)
      console.warn(
        `[retry ${attempt}/${retries}] ${label}: ${msg} — waiting ${wait}ms`,
      )
      await sleep(wait)
    }
  }
}

async function main() {
  // ---------------- CLI args ----------------
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [k, v] = arg.split('=')
    if (k && v) acc[k.replace(/^--/, '')] = v
    return acc
  }, {} as Record<string, string>)

  const start = args.start || '2025-07-01'
  const end = args.end || '2025-08-12'
  const lookupPath = args.lookup || 'data/lookup/ca_iot_hotspots.json' // California set
  const limit = Number(args.limit || '0') // 0 = all
  const chunkSize = Number(args.chunkSize || '5')
  const chunkDelay = Number(args.chunkDelay || '1200') // ms between chunks
  const retries = Number(args.retries || '3')
  const relayPageLimit = Number(args.relayPageLimit || '20') // passed to listIotRewards (keep your working value)
  const apiKeys = parseKeys(args.apiKeys)

  const outName = args.output || `iot_hotspots_${start}_${end}.jsonl`
  const outPath = path.resolve(__dirname, '../../data/raw/iot', outName)
  const donePath = outPath.replace(/\.jsonl$/i, '.completed.txt')

  await fsp.mkdir(path.dirname(outPath), {recursive: true})

  console.log('[cfg]', {
    start,
    end,
    chunkSize,
    chunkDelay,
    retries,
    relayPageLimit,
  })
  console.log(`[cfg] output: ${outPath}`)
  console.log(`[cfg] keys: ${apiKeys.length}`)
  console.log(`[cfg] lookup: ${lookupPath}`)

  // ---------------- Load hotspot set (California) ----------------
  const lookup = await loadLookup(lookupPath)
  const allKeys = Object.keys(lookup)
  const keysSlice = limit > 0 ? allKeys.slice(0, limit) : allKeys

  // ---------------- Resume: read completed.txt ----------------
  const completed = await readCompletedList(donePath)
  const remaining = keysSlice.filter((k) => !completed.has(k))

  console.log(
    `[resume] completed: ${completed.size} • remaining: ${remaining.length} / ${keysSlice.length}`,
  )
  if (remaining.length === 0) {
    console.log('Nothing to do. Exiting.')
    return
  }

  // ---------------- Writer (append as we go; safe on interrupt) ----------------
  const outFd = fs.openSync(outPath, 'a') // append mode; sync writes
  const writeRows = (rows: any[]) => {
    if (!rows || rows.length === 0) return 0
    const lines = rows.map((r) => JSON.stringify(r)).join('\n') + '\n'
    fs.writeSync(outFd, lines, null, 'utf8')
    return rows.length
  }

  // Graceful shutdown summary
  let totalWritten = 0
  let chunksDone = 0
  const startedAt = Date.now()
  const onExit = () => {
    try {
      fs.closeSync(outFd)
    } catch {}
    const mins = ((Date.now() - startedAt) / 60000).toFixed(1)
    console.log(
      `\n[summary] chunks=${chunksDone} • rows=${totalWritten} • minutes=${mins}`,
    )
  }
  process.on('SIGINT', () => {
    console.log('\n[signal] SIGINT')
    onExit()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    console.log('\n[signal] SIGTERM')
    onExit()
    process.exit(0)
  })
  process.on('exit', onExit)

  // ---------------- Chunked fetch with key rotation ----------------
  for (let i = 0; i < remaining.length; i += chunkSize) {
    const chunk = remaining.slice(i, i + chunkSize)
    const prettyIdx = Math.floor(i / chunkSize) + 1
    console.log(
      `\n[chunk ${prettyIdx}/${Math.ceil(
        remaining.length / chunkSize,
      )}] starting with: ${chunk[0]}`,
    )

    const results = await Promise.allSettled(
      chunk.map(async (hotspotKey, j) => {
        // Rotate key per item in chunk
        const keyIdx = (i + j) % apiKeys.length
        const apiKey = apiKeys[keyIdx]
        const relay = createRelay(apiKey)

        const label = `hotspot ${hotspotKey.slice(
          0,
          6,
        )}… (${start}→${end}) [key#${keyIdx + 1}]`
        const recs = await withRetries(
          async () => {
            const res = await listIotRewards(
              {hotspot_key: hotspotKey, from: start, to: end},
              relayPageLimit,
              relay,
            )
            return res.records || []
          },
          {retries, backoffMs: 1200, label},
        )

        const wrote = writeRows(recs)
        totalWritten += wrote

        // Mark hotspot COMPLETE only after successful fetch finished
        await appendCompleted(donePath, hotspotKey)

        return {hotspotKey, wrote}
      }),
    )

    // Per-chunk reporting
    let chunkRows = 0,
      ok = 0,
      fail = 0
    for (const r of results) {
      if (r.status === 'fulfilled') {
        ok++
        chunkRows += r.value.wrote
      } else {
        fail++
        // Do NOT mark completed on failure; will retry on next run
      }
    }
    chunksDone++
    console.log(
      `[chunk ${prettyIdx}] ok=${ok} fail=${fail} • +${chunkRows} rows • total=${totalWritten}`,
    )

    if (chunkDelay > 0) await sleep(chunkDelay)
  }

  console.log(`\n✅ Done. Total new rows written: ${totalWritten} → ${outPath}`)
}

main().catch((e) => {
  console.error('[fatal]', e?.message || e)
  process.exit(1)
})
