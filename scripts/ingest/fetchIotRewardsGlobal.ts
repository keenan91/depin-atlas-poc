/* eslint-disable no-console */
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import {fileURLToPath} from 'url'
import readline from 'readline'
import * as dotenv from 'dotenv'
import {createRelay, listIotRewardsOnce} from '@/lib/relay'

// Load env (supports .env.local colocated with repo root)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({path: path.resolve(__dirname, '../../.env.local')})

/** ---------- small utils ---------- */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const fmt = (d: Date) => d.toISOString().slice(0, 10)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** CLI args */
type Args = {
  start: string
  end: string
  lookup: string
  output: string
  pageDelay?: number
  retries?: number
  retryBackoffMs?: number
  windowDays?: number
  maxPages?: number // 0 = unlimited
  checkpoint?: string
  apiKeys?: string // comma/space separated
  onlyCA?: string // "true"/"false"
  resume?: string // "true"/"false"
}

const args: Args = process.argv.slice(2).reduce((acc, arg) => {
  const [k, v] = arg.split('=')
  if (k && v !== undefined) acc[k.replace(/^--/, '') as keyof Args] = v as any
  return acc
}, {} as any)

const START = args.start || '2025-07-01'
const END = args.end || '2025-08-12'
const LOOKUP = args.lookup || 'data/lookup/ca_iot_hotspots.json'
const OUT_FILE =
  args.output ||
  path.join(__dirname, '../../data/raw/iot', `iot_${START}_${END}.jsonl`)

const PAGE_DELAY = Number(args.pageDelay ?? 600) // ms
const RETRIES = clamp(Number(args.retries ?? 5), 0, 10)
const RETRY_BACKOFF_MS = clamp(Number(args.retryBackoffMs ?? 1200), 200, 60_000)
const WINDOW_DAYS = clamp(Number(args.windowDays ?? 7), 1, 14)
const MAX_PAGES = Number(args.maxPages ?? 0) // 0 = unlimited
const ONLY_CA = (args.onlyCA ?? 'true') === 'true'
const RESUME = (args.resume ?? 'true') === 'true'

const API_KEYS_RAW =
  args.apiKeys || process.env.RELAY_API_KEYS || process.env.RELAY_API_KEY || ''
const API_KEYS = API_KEYS_RAW.split(/[,;\s]+/).filter(Boolean)

const outDir = path.dirname(OUT_FILE)
const checkpointDefault = path.join(
  outDir,
  `_${path.basename(OUT_FILE).replace(/\.[^.]+$/, '')}_checkpoint.json`,
)
const CHECKPOINT_FILE = args.checkpoint || checkpointDefault

// Ensure output dir exists
fs.mkdirSync(outDir, {recursive: true})

let caKeys = new Set<string>()
async function loadLookupKeys(p: string) {
  try {
    const raw = await fsp.readFile(path.resolve(p), 'utf-8')
    const js = JSON.parse(raw)
    if (Array.isArray(js)) {
      for (const o of js) {
        const k = o?.address || o?.hotspot_key || o?.gateway || o?.key || o?.id
        if (k && typeof k === 'string') caKeys.add(k)
      }
    } else if (js && typeof js === 'object') {
      for (const k of Object.keys(js)) {
        if (k) caKeys.add(k)
      }
    }
  } catch (e) {
    console.warn(
      `[warn] failed to load lookup ${p}; proceeding without onlyCA filter`,
    )
    ONLY_CA && (caKeys = new Set()) // empty set will pass none if we enforced it
  }
}

// Append one reward line to JSONL
function appendJsonlLine(filePath: string, obj: any) {
  // incremental write: safe even if interrupted
  fs.appendFileSync(filePath, JSON.stringify(obj) + '\n')
}

type RelayMeta = {
  pagination?: {next_page?: number | null}
}

type RelayResp = {
  records: any[]
  meta: RelayMeta
}

// Checkpoint helpers (per-window page pointer)
type Checkpoint = Record<
  string,
  {
    nextPage: number // 0 => window done
  }
>

async function loadCheckpoint(): Promise<Checkpoint> {
  if (!RESUME) return {}
  try {
    const raw = await fsp.readFile(CHECKPOINT_FILE, 'utf-8')
    return JSON.parse(raw) as Checkpoint
  } catch {
    return {}
  }
}

async function saveCheckpoint(
  file: string,
  key: string,
  nextPage: number,
): Promise<void> {
  if (!RESUME) return
  let cp: Checkpoint = {}
  try {
    cp = JSON.parse(await fsp.readFile(file, 'utf-8'))
  } catch {
    // ignore
  }
  cp[key] = {nextPage}
  await fsp.writeFile(file, JSON.stringify(cp, null, 2))
}

const shouldRotateOrRetry = (err: any) => {
  const msg = (err?.message || String(err || '')).toLowerCase()
  // Typical retry-able cases: timeouts, 5xx, gateway, rate limits
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('429') ||
    msg.includes('rate') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('bad gateway') ||
    msg.includes('network error')
  )
}

/** ---------- main ---------- */
;(async () => {
  await loadLookupKeys(LOOKUP)

  console.log(`[cfg] ${START} → ${END}`)
  console.log(`[cfg] out: ${path.resolve(OUT_FILE)}`)
  console.log(
    `[cfg] keys: ${API_KEYS.length || 0} (${
      API_KEYS.length > 1 ? 'rotation ENABLED' : 'rotation DISABLED'
    })`,
  )
  console.log(
    `[cfg] windowDays=${WINDOW_DAYS}, pageDelay=${PAGE_DELAY}ms, retries=${RETRIES}, resume=${RESUME}, onlyCA=${ONLY_CA}`,
  )

  const cpAll = await loadCheckpoint()

  const startDate = new Date(START + 'T00:00:00Z')
  const endDate = new Date(END + 'T00:00:00Z')
  if (!(startDate < endDate)) {
    console.error(`Invalid date range.`)
    process.exit(1)
  }

  // Ensure output file exists (incremental appends)
  if (!fs.existsSync(OUT_FILE)) {
    fs.writeFileSync(OUT_FILE, '') // create empty file
  }

  // For resume-only UI (optional): count lines (not needed for logic)
  async function countLines(p: string): Promise<number> {
    if (!fs.existsSync(p)) return 0
    const fileStream = fs.createReadStream(p)
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    })
    let n = 0
    // eslint-disable-next-line no-unused-vars
    for await (const _ of rl) n++
    return n
  }
  const existingLines = await countLines(OUT_FILE)
  console.log(`[resume] existing lines in file: ${existingLines}`)

  let totalPages = 0
  let totalRows = 0

  // Key rotation
  let keyIdx = 0
  const relayFor = (i: number) =>
    createRelay(API_KEYS.length ? API_KEYS[i] : '')

  // Slide windows
  for (
    let ws = new Date(startDate);
    ws <= endDate;
    ws = new Date(ws.getTime() + WINDOW_DAYS * 86400000)
  ) {
    const we = new Date(
      Math.min(endDate.getTime(), ws.getTime() + (WINDOW_DAYS - 1) * 86400000),
    )

    const cpKey = `${fmt(ws)}_${fmt(we)}`
    let page = 1

    if (RESUME && cpAll[cpKey]) {
      const storedNext = Number(cpAll[cpKey].nextPage || 0)
      if (storedNext <= 0) {
        console.log(`[window] ${fmt(ws)} → ${fmt(we)} already complete (cp).`)
        continue
      }
      page = storedNext
    }

    console.log(`[window] ${fmt(ws)} → ${fmt(we)}`)

    let pagesInWindow = 0
    let rowsInWindow = 0

    // Page loop with retry
    while (true) {
      if (MAX_PAGES > 0 && totalPages >= MAX_PAGES) {
        console.log(
          `Reached global maxPages=${MAX_PAGES}. Stopping ingestion now.`,
        )
        break
      }

      const relay = relayFor(keyIdx)
      let attempt = 0

      // Attempt loop for this page
      // On success: we "continue" the while to progress with nextPage
      // On give-up: we "page += 1" and break (optimistic advance)
      while (true) {
        try {
          console.log(
            `Fetching page ${page} (key ${keyIdx + 1}/${Math.max(
              1,
              API_KEYS.length,
            )}) for ${fmt(ws)}–${fmt(we)}…`,
          )

          const resp = (await listIotRewardsOnce(
            {from: fmt(ws), to: fmt(we), page},
            relay,
          )) as RelayResp

          const {records, meta} = resp || ({} as RelayResp)
          let added = 0

          if (Array.isArray(records) && records.length) {
            for (const reward of records) {
              // Filter to CA if requested
              if (ONLY_CA) {
                const k =
                  reward?.reward_detail?.hotspot_key ||
                  reward?.hotspot_key ||
                  reward?.gateway ||
                  reward?.address ||
                  ''
                if (!caKeys.has(k)) continue
              }
              appendJsonlLine(OUT_FILE, reward)
              added++
            }
          }

          rowsInWindow += added
          pagesInWindow++
          totalRows += added
          totalPages++

          console.log(
            `→ page ${page}: +${added} rows • totals: pages=${pagesInWindow}, rows=${rowsInWindow}`,
          )

          const nextPage = meta?.pagination?.next_page ?? null

          // Store checkpoint as the *next page to fetch* (0 means window complete)
          await saveCheckpoint(
            CHECKPOINT_FILE,
            cpKey,
            nextPage ? Number(nextPage) : 0,
          )

          if (!nextPage) {
            console.log(`Window ${fmt(ws)}–${fmt(we)} complete.`)
            break // break attempt loop
          }

          // advance to server-provided next page
          page = Number(nextPage)

          // small pacing delay
          await delay(PAGE_DELAY)
          continue // success → keep processing nextPage (stay in attempt loop)
        } catch (err: any) {
          const msg = err?.message || String(err || '')
          console.error(`   error: ${msg}`)

          if (attempt < RETRIES && shouldRotateOrRetry(err)) {
            attempt++
            // rotate key if we have multiple
            if (API_KEYS.length > 1) {
              keyIdx = (keyIdx + 1) % API_KEYS.length
              console.log(
                `   retry ${attempt}/${RETRIES} → rotating key to #${
                  keyIdx + 1
                }, backoff ${RETRY_BACKOFF_MS}ms`,
              )
            } else {
              console.log(
                `   retry ${attempt}/${RETRIES} after backoff ${RETRY_BACKOFF_MS}ms`,
              )
            }
            await delay(RETRY_BACKOFF_MS)
            continue // try same page again
          }

          console.log(`   giving up on this page; moving on.`)
          // optimistic advance to avoid being stuck if server dropped the page
          page += 1
          break // exit attempt loop; while-loop will keep going with incremented page
        }
      } // end attempt loop

      // If we finished the window (checkpoint wrote 0), leave
      const freshCp = await loadCheckpoint()
      if (freshCp[cpKey]?.nextPage === 0) break

      // Basic guard: if page grows absurdly (defensive)
      if (pagesInWindow > 25_000) {
        console.warn(
          `Too many pages in window ${fmt(ws)}–${fmt(
            we,
          )}; breaking for safety.`,
        )
        break
      }
    } // end page while

    console.log(
      `[window done] ${fmt(ws)}–${fmt(
        we,
      )} • pages=${pagesInWindow}, rows=${rowsInWindow}`,
    )
  } // end window for

  console.log(
    `✅ Done. Pages: ${totalPages} • New rows: ${totalRows} • File: ${OUT_FILE}`,
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
