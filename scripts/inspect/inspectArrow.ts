import {tableFromIPC} from 'apache-arrow'
import fs from 'node:fs'
import path from 'node:path'

const file = process.argv[2] ?? 'data/features/iot_daily_sample.arrow'
const buf = fs.readFileSync(path.resolve(file))
const table = tableFromIPC(buf)

const fields = table.schema.fields
const colIndex = (name: string) => fields.findIndex((f) => f.name === name)
const getCol = (idx: number) => (idx >= 0 ? table.getChildAt(idx)! : null)

const idx = {
  date: colIndex('date'),
  date_start: colIndex('date_start'),
  date_end: colIndex('date_end'),
  hotspot:
    colIndex('hotspot') >= 0 ? colIndex('hotspot') : colIndex('hotspot_key'),
  beacon: colIndex('beacon'),
  witness: colIndex('witness'),
  dc: colIndex('dc'),
  reward_type: colIndex('reward_type'),
}

// basic header
console.log('Rows:', table.numRows)
console.log(
  'Columns:',
  fields.map((f) => `${f.name}:${f.type}`),
)

// helper to read a cell as a primitive/string
function cell(idx: number, row: number) {
  if (idx < 0) return undefined
  const col = table.getChildAt(idx)
  const v = col?.get(row)
  // Arrow dictionary vectors stringify nicely via String()
  // Numbers are already primitive
  return v == null ? null : typeof v === 'object' ? String(v) : v
}

// print first 10 rows
console.log('\nSample (first 10):')
const max = Math.min(10, table.numRows)
for (let r = 0; r < max; r++) {
  const obj: Record<string, unknown> = {}
  for (let i = 0; i < fields.length; i++) {
    obj[fields[i].name] = cell(i, r)
  }
  console.log(obj)
}

// summaries
const uniq = <T>(arr: T[]) => Array.from(new Set(arr))

// date ranges
const dateVals: string[] = []
const dateStartVals: string[] = []
const dateEndVals: string[] = []

for (let r = 0; r < table.numRows; r++) {
  if (idx.date >= 0) {
    const d = cell(idx.date, r)
    if (d != null) dateVals.push(String(d))
  }
  if (idx.date_start >= 0) {
    const ds = cell(idx.date_start, r)
    if (ds != null) dateStartVals.push(String(ds))
  }
  if (idx.date_end >= 0) {
    const de = cell(idx.date_end, r)
    if (de != null) dateEndVals.push(String(de))
  }
}

function sortedRange(xs: string[]) {
  if (!xs.length) return null
  const s = xs.slice().sort()
  return `${s[0]} → ${s[s.length - 1]}`
}

if (dateVals.length) {
  console.log('\nDate range (label=date):', sortedRange(uniq(dateVals))!)
}
if (dateStartVals.length) {
  console.log(
    'Date range (label=date_start):',
    sortedRange(uniq(dateStartVals))!,
  )
}
if (dateEndVals.length) {
  console.log('Date range (label=date_end):', sortedRange(uniq(dateEndVals))!)
}

// unique hotspots
if (idx.hotspot >= 0) {
  const hsVals: string[] = []
  for (let r = 0; r < table.numRows; r++) {
    const h = cell(idx.hotspot, r)
    if (h != null) hsVals.push(String(h))
  }
  console.log('Unique hotspots:', uniq(hsVals).length)
}

// simple totals (beacon/witness/dc)
function sumCol(i: number) {
  if (i < 0) return null
  let s = 0
  for (let r = 0; r < table.numRows; r++) {
    const v = cell(i, r)
    if (v != null) s += Number(v)
  }
  return s
}

const beaconSum = sumCol(idx.beacon)
const witnessSum = sumCol(idx.witness)
const dcSum = sumCol(idx.dc)

console.log('\nTotals:')
if (beaconSum != null) console.log('  beacon:', beaconSum)
if (witnessSum != null) console.log('  witness:', witnessSum)
if (dcSum != null) console.log('  dc:', dcSum)
