import {NextRequest, NextResponse} from 'next/server'
import {tableFromIPC, Table} from 'apache-arrow'
import fs from 'node:fs'
import path from 'node:path'
import * as ort from 'onnxruntime-node'
import _ from 'lodash'
import {cellToLatLng} from 'h3-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---------- CONFIG ----------
const DEFAULT_ARROW_PATH =
  process.env.IOT_ARROW_FILE ?? 'data/features/iot/ca_iot_daily.arrow'
const MODELS_DIR = path.join(process.cwd(), 'public', 'models')

// Halving awareness (UTC, month is 0-based → 7 = August)
const HALVING_DATE_UTC = Date.UTC(2025, 7, 1)
const EPSILON = 1e-6

const DEFAULT_OBS_SAMPLE_PCT = Number(process.env.IOT_OBS_SAMPLE_PCT ?? '0.12')

function hashUnit(str: string, seed = 1) {
  let h = (0x811c9dc5 ^ seed) >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 4294967296
}

// ---------- CACHES ----------
let session: ort.InferenceSession | null = null
let featTotal: string[] | null = null

let blendWeights: Record<number, number> | null = null // {h: weight}, 1-based horizon
let conformalWidths: Record<number, number> | null = null // {h: width}, 1-based horizon
let bandFallback: {p10: number; p90: number} | null = null

let tableCache: Table | null = null
let hexDataCache: Record<string, any[]> | null = null

// network mean per UTC day (ms @ 00:00), for net_mean_lag1 / net_ma3_lag
let netMeanByDay: Map<number, {sum: number; n: number}> | null = null
let globalMeanTotal = 0
let globalStdAccum = 0
let globalCount = 0

// ---------- TYPES ----------
type Row = any
type ModeledRow = Row & {
  poc_rewards?: number
  dc_rewards?: number
  total_rewards?: number
  forecasted_total?: number
  forecasted_poc?: number
  forecasted_dc?: number
  lower_band?: number
  upper_band?: number
}

// ---------- SMALL UTILS ----------
const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x))
const day0 = (d: Date | number) => {
  const t = typeof d === 'number' ? d : d.getTime()
  const dd = new Date(t)
  dd.setUTCHours(0, 0, 0, 0)
  return dd.getTime()
}
function mean(arr: number[]) {
  return arr.length ? _.mean(arr) : 0
}
function stddev(arr: number[]) {
  if (arr.length <= 1) return 0
  const m = mean(arr)
  return Math.sqrt(mean(arr.map((v) => (v - m) ** 2)))
}
function dayFeaturesUTC(d: Date) {
  const dow = d.getUTCDay()
  const month = d.getUTCMonth() + 1
  const quarter = Math.floor((month - 1) / 3) + 1
  const jan1 = Date.UTC(d.getUTCFullYear(), 0, 1)
  const diffDays = Math.floor((d.getTime() - jan1) / 86400000)
  const week = Math.max(1, Math.floor((diffDays + 4) / 7))
  return {
    day_of_week: dow,
    week,
    month,
    quarter,
    sin_dow: Math.sin((2 * Math.PI * dow) / 7),
    cos_dow: Math.cos((2 * Math.PI * dow) / 7),
    sin_woy: Math.sin((2 * Math.PI * week) / 52),
    cos_woy: Math.cos((2 * Math.PI * week) / 52),
    sin_month: Math.sin((2 * Math.PI * month) / 12),
    cos_month: Math.cos((2 * Math.PI * month) / 12),
  }
}
function seasonalNaiveLag7(history: Row[]) {
  const lag7 = history[history.length - 8]?.total_rewards
  const last = history[history.length - 1]?.total_rewards ?? 0
  const lag1 = history[history.length - 2]?.total_rewards ?? last
  return Number.isFinite(lag7) ? Number(lag7) : Number(lag1)
}
function seasonalMeanForDOW(history: Row[], dow: number) {
  const cutoff = Math.max(0, history.length - 28)
  const vals: number[] = []
  for (let i = cutoff; i < history.length; i++) {
    const r = history[i]
    const d = new Date(r.date)
    if (d.getUTCDay() === dow) vals.push(Number(r.total_rewards ?? 0))
  }
  if (vals.length >= 2) return mean(vals)
  return seasonalNaiveLag7(history)
}
function pocShareEMA(history: Row[], span = 7) {
  const alpha = 2 / (span + 1)
  let ema = 0.5,
    seeded = false
  const start = Math.max(0, history.length - 30)
  for (let i = start; i < history.length; i++) {
    const r = history[i]
    const total = Number(r.total_rewards ?? 0)
    const share =
      total > 0 ? Number(r.poc_rewards ?? 0) / total : seeded ? ema : 0.5
    ema = seeded ? alpha * share + (1 - alpha) * ema : share
    seeded = true
  }
  return clamp(ema, 0, 1)
}
function netMean(dayMillis: number) {
  if (!netMeanByDay) return 0
  const rec = netMeanByDay.get(dayMillis)
  return rec && rec.n > 0 ? rec.sum / rec.n : 0
}
function netMA3Lag(dayMillis: number) {
  const d1 = dayMillis,
    d2 = d1 - 86400000,
    d3 = d2 - 86400000
  return mean([netMean(d1), netMean(d2), netMean(d3)])
}

// ---------- LOADERS ----------
async function loadModelsOnly() {
  if (!session) {
    const totalPath = path.join(MODELS_DIR, 'iot_total_adj_predictor_q0.5.onnx')
    session = await ort.InferenceSession.create(totalPath)
  }
  if (!featTotal) {
    const featsPath = path.join(MODELS_DIR, 'total_adj_features.json')
    featTotal = JSON.parse(fs.readFileSync(featsPath, 'utf8'))
  }
  if (!blendWeights) {
    try {
      blendWeights = JSON.parse(
        fs.readFileSync(path.join(MODELS_DIR, 'blend_weights.json'), 'utf8'),
      )
    } catch {
      blendWeights = {1: 0.9, 2: 0.8, 3: 0.7, 4: 0.6}
    }
  }
  if (!conformalWidths) {
    try {
      conformalWidths = JSON.parse(
        fs.readFileSync(path.join(MODELS_DIR, 'conformal_widths.json'), 'utf8'),
      )
    } catch {
      conformalWidths = null
      try {
        bandFallback = JSON.parse(
          fs.readFileSync(path.join(MODELS_DIR, 'residual_band.json'), 'utf8'),
        )
      } catch {
        bandFallback = {p10: -0.5, p90: 0.5}
      }
    }
  }
}

async function loadDataOnly() {
  if (tableCache && hexDataCache && netMeanByDay) return
  const absolute = path.resolve(DEFAULT_ARROW_PATH)
  if (!fs.existsSync(absolute))
    throw new Error(`Arrow file not found: ${absolute}`)
  const buf = fs.readFileSync(absolute)
  tableCache = tableFromIPC(buf)

  const allRows = tableCache.toArray().map((r) => {
    const d: any = {...r}
    if (d.dc_transfer != null && d.dc_rewards == null)
      d.dc_rewards = d.dc_transfer
    if (d.neighbor_ma3_total == null && d.neighbor_ma7_total != null)
      d.neighbor_ma3_total = d.neighbor_ma7_total
    const t = new Date(d.date).getTime()
    const day = day0(t)
    const total =
      Number(d.total_rewards ?? 0) ||
      Number(d.poc_rewards ?? 0) + Number(d.dc_rewards ?? 0)
    globalMeanTotal += total
    globalStdAccum += total * total
    globalCount += 1
    return {...d, date: day}
  })

  hexDataCache = _.groupBy(allRows, 'hex')
  for (const hex in hexDataCache)
    hexDataCache[hex] = _.sortBy(hexDataCache[hex], 'date')

  netMeanByDay = new Map()
  for (const r of allRows) {
    const day = r.date
    const tot =
      Number(r.total_rewards ?? 0) ||
      Number(r.poc_rewards ?? 0) + Number(r.dc_rewards ?? 0)
    const cur = netMeanByDay.get(day)
    if (cur) {
      cur.sum += tot
      cur.n += 1
    } else {
      netMeanByDay.set(day, {sum: tot, n: 1})
    }
  }
}

// ---------- EAGER COLD-START MODEL LOAD ----------
const eagerModelLoadPromise = (async () => {
  try {
    await loadModelsOnly()
  } catch (e) {
    console.error('Cold-start model load failed (will retry on request):', e)
  }
})()

// ---------- FEATURE BUILDER (unchanged) ----------
function buildFeatureDict(
  hexId: string,
  history: Row[],
  currentDate: Date,
  policy?: {densityMult?: number; txScaleMult?: number},
) {
  const last = history[history.length - 1] || {}

  const isPost = currentDate.getTime() >= HALVING_DATE_UTC
  const daysSinceHalving = Math.max(
    0,
    Math.floor((day0(currentDate) - HALVING_DATE_UTC) / 86400000),
  )

  const totals = history.map((r) => Number(r.total_rewards ?? 0))
  const lag1 = totals[totals.length - 1] ?? 0
  const lag2 = totals[totals.length - 2] ?? lag1
  const lag3 = totals[totals.length - 3] ?? lag2
  const ma3 = mean(totals.slice(-3))
  const ma7 = mean(totals.slice(-7))
  const vol7 = stddev(totals.slice(-7))
  const rsi7 = (() => {
    const diffs = []
    for (let i = Math.max(0, totals.length - 8); i < totals.length - 1; i++)
      diffs.push(totals[i + 1] - totals[i])
    const gains = diffs.filter((d) => d > 0)
    const losses = diffs.filter((d) => d < 0).map((d) => -d)
    const avgGain = mean(gains) || 0
    const avgLoss = mean(losses) || 0
    const rs = avgLoss > 0 ? avgGain / avgLoss : 0
    return 100 - 100 / (1 + rs)
  })()
  const reward_cv = ma7 > 0 ? vol7 / ma7 : 0
  const lag1_div_ma3 = ma3 > 0 ? lag1 / ma3 : 0

  const {
    day_of_week,
    week,
    month,
    quarter,
    sin_dow,
    cos_dow,
    sin_woy,
    cos_woy,
    sin_month,
    cos_month,
  } = dayFeaturesUTC(currentDate)
  const seasonal_mean = seasonalMeanForDOW(history, day_of_week)
  const naive_blend =
    0.8 * (0.5 * lag1 + 0.3 * lag2 + 0.2 * lag3) + 0.2 * seasonal_mean

  const density =
    Number(last.density_k1 ?? 0) * Number(policy?.densityMult ?? 1)
  const txscale =
    Number(last.transmit_scale_approx ?? 0) * Number(policy?.txScaleMult ?? 1)

  const neighbor_ma3_total = Number(last.neighbor_ma3_total ?? 0)
  const yday = day0(new Date(currentDate.getTime() - 86400000))
  const net_mean_lag1 = netMean(yday)
  const net_ma3_lag = netMA3Lag(yday)

  const recent = totals.slice(-28)
  const hex_mean_train_total =
    recent.length >= 5
      ? mean(recent)
      : globalCount
      ? globalMeanTotal / globalCount
      : 0
  const hex_std_train_total =
    recent.length >= 5
      ? stddev(recent)
      : globalCount
      ? Math.sqrt(
          globalStdAccum / globalCount - (globalMeanTotal / globalCount) ** 2,
        )
      : 0

  const poc_share_lag1 =
    lag1 > 0
      ? Number(last.poc_rewards ?? 0) / Number(last.total_rewards ?? lag1)
      : 0

  const f: Record<string, number | string> = {
    naive_blend,
    lag1_total: lag1,
    lag2_total: lag2,
    lag3_total: lag3,
    ma_3d_total: ma3,
    lag1_div_ma3,

    poc_share_lag1,
    trend_7d: (() => {
      const xs = totals.slice(-7)
      if (xs.length <= 1) return 0
      const x = xs.map((_, i) => i)
      const xm = mean(x),
        ym = mean(xs)
      const denom = x.reduce((s, v) => s + (v - xm) ** 2, 0)
      if (denom === 0) return 0
      const num = xs.reduce((s, v, i) => s + (i - xm) * (v - ym), 0)
      return num / denom
    })(),
    volatility_7d: vol7,
    rsi_7d: rsi7,
    reward_cv,

    neighbor_ma3_total,
    net_mean_lag1,
    net_ma3_lag,

    day_of_week,
    sin_dow,
    cos_dow,
    week,
    sin_woy,
    cos_woy,
    month,
    sin_month,
    cos_month,
    quarter,
    is_post_halving: isPost ? 1 : 0,
    days_since_halving: daysSinceHalving,

    hotspot_count: Number(last.hotspot_count ?? 0),
    density_k1: density,
    transmit_scale_approx: txscale,

    hex_mean_train_total,
    hex_std_train_total,
    seasonal_mean,
    hex: hexId,
  }
  return f
}
function tensorFromOrder(
  order: string[],
  dict: Record<string, number | string>,
) {
  const arr = Float32Array.from(order.map((k) => Number(dict[k] ?? 0)))
  return new ort.Tensor('float32', arr, [1, order.length])
}
function naiveBlendNextDay(history: Row[], currentDate: Date) {
  const totals = history.map((r) => Number(r.total_rewards ?? 0))
  const lag1 = totals[totals.length - 1] ?? 0
  const lag2 = totals[totals.length - 2] ?? lag1
  const lag3 = totals[totals.length - 3] ?? lag2
  const nextDOW = (currentDate.getUTCDay() + 1) % 7
  const seas = seasonalMeanForDOW(history, nextDOW)
  return 0.8 * (0.5 * lag1 + 0.3 * lag2 + 0.2 * lag3) + 0.2 * seas
}

export async function GET(req: NextRequest) {
  try {
    // Ensure cold-start model load has completed (even for observed calls)
    await eagerModelLoadPromise

    const url = new URL(req.url)

    // Governance knobs
    const densityMult = Number(url.searchParams.get('densityMult') ?? '1')
    const txScaleMult = Number(url.searchParams.get('txScaleMult') ?? '1')
    const pocShareOverride = url.searchParams.get('pocShare')
    const pocShareParam =
      pocShareOverride != null ? clamp(Number(pocShareOverride), 0, 1) : null

    // Basic filters
    const hexParam = url.searchParams.get('hex') ?? undefined
    const from = url.searchParams.get('from') ?? undefined
    const to = url.searchParams.get('to') ?? undefined
    const forecast = url.searchParams.get('forecast') === 'true'
    const limit = Number(url.searchParams.get('limit') ?? '5000')
    const horizon = Math.max(1, Number(url.searchParams.get('horizon') ?? '1'))

    // Observed-mode sampling controls
    const full =
      url.searchParams.get('full') === '1' ||
      url.searchParams.get('full') === 'true'
    const samplePct = Math.max(
      0,
      Math.min(
        1,
        Number(url.searchParams.get('sample') ?? `${DEFAULT_OBS_SAMPLE_PCT}`),
      ),
    )
    const sampleSeed = Number(url.searchParams.get('seed') ?? '1') | 0

    // polygon lasso
    const polyRaw = url.searchParams.get('poly')
    let lassoPoly: [number, number][] | null = null
    if (polyRaw) {
      try {
        lassoPoly = JSON.parse(polyRaw)
      } catch {
        lassoPoly = null
      }
    }

    // Load data; models will have been loaded via cold-start promise,
    // but still ensure them for forecast paths just in case.
    if (forecast) {
      await Promise.all([loadDataOnly(), loadModelsOnly()])
    } else {
      await loadDataOnly()
    }
    if (!hexDataCache) throw new Error('Initialization failed')

    if (url.searchParams.get('debug') === '1') {
      return NextResponse.json({
        ok: true,
        modelLoaded: Boolean(session),
        hasConformalWidths: Boolean(conformalWidths),
        hasBandFallback: Boolean(bandFallback),
      })
    }

    // Restrict hex set by polygon if provided
    let eligibleHexes: string[] | null = null
    if (lassoPoly && lassoPoly.length >= 3) {
      const selected: string[] = []
      for (const hexId of Object.keys(hexDataCache)) {
        const [clat, clon] = cellToLatLng(hexId)
        let inside = false
        for (
          let i = 0, j = lassoPoly.length - 1;
          i < lassoPoly.length;
          j = i++
        ) {
          const xi = lassoPoly[i][0],
            yi = lassoPoly[i][1]
          const xj = lassoPoly[j][0],
            yj = lassoPoly[j][1]
          const intersect =
            yi > clon !== yj > clon &&
            clat < ((xj - xi) * (clon - yi)) / (yj - yi || 1e-12) + xi
          if (intersect) inside = !inside
        }
        if (inside) selected.push(hexId)
      }
      eligibleHexes = selected
    }

    let outputRows: ModeledRow[] = []

    if (forecast) {
      const explicitHexes =
        hexParam
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? []

      const hexes =
        eligibleHexes && eligibleHexes.length
          ? eligibleHexes
          : explicitHexes.length
          ? explicitHexes
          : []

      if (hexes.length === 0) {
        const body = {
          ok: true,
          filters: {
            hex: hexParam,
            from,
            to,
            forecast,
            limit,
            horizon,
            poly: !!lassoPoly,
            densityMult,
            txScaleMult,
            pocShare: pocShareOverride ?? null,
            sampling: {enabled: false, samplePct, seed: sampleSeed, full},
          },
          rows: [],
          totals: {rows: 0, poc_rewards: 0, dc_rewards: 0, total_rewards: 0},
        }
        return NextResponse.json(body)
      }

      // Target date defaults to today at 00:00 UTC (or "to" date)
      let targetDate = to ? new Date(to) : new Date()
      targetDate.setUTCHours(0, 0, 0, 0)

      const wSched = blendWeights ?? {1: 0.9, 2: 0.8, 3: 0.7, 4: 0.6}
      const baseWidthFor = (h: number, scalar: number) => {
        if (conformalWidths && conformalWidths[h] != null)
          return conformalWidths[h] * scalar
        const width = bandFallback
          ? 0.5 * Math.abs(bandFallback.p90 - bandFallback.p10)
          : 0
        return width * scalar
      }

      for (const hexId of hexes) {
        const fullHist = (hexDataCache[hexId] || []).slice()
        if (fullHist.length === 0) continue

        const cutoff = new Date(targetDate)
        cutoff.setUTCDate(cutoff.getUTCDate() - 1)
        const cutoffMs = day0(cutoff)
        let history = fullHist.filter((r) => r.date <= cutoffMs)
        if (history.length === 0)
          history = fullHist.slice(0, Math.min(14, fullHist.length))

        const forecasts: ModeledRow[] = []
        let currentDate = new Date(targetDate)

        for (let step = 0; step < horizon; step++) {
          const lastKnownDay = history[history.length - 1]
          const featureDict = buildFeatureDict(hexId, history, currentDate, {
            densityMult,
            txScaleMult,
          })
          const totalIn = tensorFromOrder(featTotal!, featureDict)
          const out = await session!.run({input: totalIn})
          const corr = (Object.values(out)[0].data as Float32Array)[0]

          const naiveNext = naiveBlendNextDay(history, currentDate)
          let modelMedian = Math.max(
            0,
            (naiveNext + EPSILON) * Math.exp(corr) - EPSILON,
          )

          const h = step + 1
          const w = wSched[h] ?? 0.6
          const blended = w * modelMedian + (1 - w) * naiveNext

          const scalar = currentDate.getTime() >= HALVING_DATE_UTC ? 0.5 : 1.0
          const baseWidth = baseWidthFor(h, scalar)
          const width = baseWidth * (1 + 0.05 * Math.sqrt(h))
          const lower = Math.max(blended - width, 0)
          const upper = blended + width

          const sBase =
            pocShareParam != null ? pocShareParam : pocShareEMA(history)
          const poc = blended * sBase
          const data = blended - poc

          const predictedRow: ModeledRow = {
            ...lastKnownDay,
            hex: hexId,
            date: day0(currentDate),
            poc_rewards: poc,
            dc_rewards: data,
            total_rewards: blended,
            forecasted_poc: poc,
            forecasted_dc: data,
            forecasted_total: blended,
            lower_band: lower,
            upper_band: upper,
          }

          forecasts.push(predictedRow)
          history.push(predictedRow)

          currentDate = new Date(currentDate)
          currentDate.setUTCDate(currentDate.getUTCDate() + 1)
        }

        outputRows.push(...forecasts)
      }

      outputRows = outputRows.slice(0, limit)
    } else {
      // Historical passthrough (filters)
      const fromTime = from ? day0(new Date(from)) : -Infinity
      const toTime = to ? day0(new Date(to)) : Infinity

      let allHistoricalRows = Object.values(hexDataCache!).flat()
      if (eligibleHexes) {
        const allowed = new Set(eligibleHexes)
        allHistoricalRows = allHistoricalRows.filter((r) => allowed.has(r.hex))
      }
      if (hexParam) {
        const only = new Set(
          hexParam
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        )
        allHistoricalRows = allHistoricalRows.filter((r) => only.has(r.hex))
      }

      // Deterministic sampling (observed only, no region/hex, not full)
      if (!full && !lassoPoly && !hexParam) {
        const allowedHexes = new Set(
          Object.keys(hexDataCache!).filter(
            (h) => hashUnit(h, sampleSeed) < samplePct,
          ),
        )
        allHistoricalRows = allHistoricalRows.filter((r) =>
          allowedHexes.has(r.hex),
        )
      }

      outputRows = allHistoricalRows
        .filter((r) => r.date >= fromTime && r.date <= toTime)
        .slice(0, limit)
    }

    const finalRows = outputRows.map((r) => ({
      ...r,
      poc_rewards: Number(r.poc_rewards ?? 0),
      dc_rewards: Number(r.dc_rewards ?? 0),
      total_rewards: Number(r.total_rewards ?? 0),
      date: new Date(r.date).toISOString().split('T')[0],
    }))

    // quick totals
    const totals = (() => {
      const acc = {
        rows: finalRows.length,
        poc_rewards: 0,
        dc_rewards: 0,
        total_rewards: 0,
      }
      for (const r of finalRows) {
        acc.poc_rewards += Number(r.poc_rewards ?? r.forecasted_poc ?? 0)
        acc.dc_rewards += Number(r.dc_rewards ?? r.forecasted_dc ?? 0)
        acc.total_rewards += Number(r.total_rewards ?? r.forecasted_total ?? 0)
      }
      return acc
    })()

    const body = {
      ok: true,
      filters: {
        hex: hexParam,
        from,
        to,
        forecast,
        limit,
        horizon,
        poly: Boolean(lassoPoly),
        densityMult,
        txScaleMult,
        pocShare: pocShareOverride ?? null,
        sampling: {
          enabled: !forecast && !full,
          samplePct,
          seed: sampleSeed,
          full,
        },
      },
      rows: finalRows,
      totals,
    }

    const canCacheObserved = !forecast && !hexParam && !lassoPoly && !full
    if (canCacheObserved) {
      return NextResponse.json(body, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      })
    }
    return NextResponse.json(body)
  } catch (e: any) {
    console.error('API Error:', e)
    return NextResponse.json(
      {ok: false, error: e?.message ?? 'unknown error'},
      {status: 500},
    )
  }
}
