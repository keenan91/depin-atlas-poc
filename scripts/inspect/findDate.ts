import {tableFromIPC} from 'apache-arrow'
import fs from 'node:fs'

const t = tableFromIPC(fs.readFileSync('data/features/iot_daily_sample.arrow'))
const dateCol = t.getChild('date')
for (let i = 0; i < t.numRows; i++) {
  const d = String(dateCol?.get(i))
  if (d === '2025-07-18') {
    console.log('found', d, 'at row', i)
  }
}
