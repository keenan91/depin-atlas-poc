const fs = require('fs')
const readline = require('readline')

async function convertJsonlToJson(inputFile, outputFile) {
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found at ${inputFile}`)
    process.exit(1)
  }

  const records = []
  const fileStream = fs.createReadStream(inputFile)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (line) {
      records.push(JSON.parse(line))
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(records, null, 2))
  console.log(
    `✅ Converted ${records.length} records from ${inputFile} to ${outputFile}`,
  )
}

const inputFile = process.argv[2]
const outputFile = process.argv[3]

if (!inputFile || !outputFile) {
  console.error(
    'Usage: node scripts/convert-jsonl.js <input.jsonl> <output.json>',
  )
  process.exit(1)
}

convertJsonlToJson(inputFile, outputFile)
