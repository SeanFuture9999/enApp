/**
 * Parse TOEIC vocabulary TXT file into wordBank.json
 * Handles two formats:
 * - Lines 1-283: one word per line (e.g., "1. abandon v 拋棄；遺棄")
 * - Lines 284+: multiple words compressed per line with letter prefix
 */
const fs = require('fs')
const path = require('path')

const inputPath = path.join(__dirname, '..', 'TOEIC 全新制 多益必考單字 3,000.txt')
const outputPath = path.join(__dirname, '..', 'src', 'data', 'wordBank.json')

const POS_TAGS = ['v', 'n', 'a', 'ad', 'prep', 'conj', 'aux', 'pron', 'Ph']
const POS_PATTERN = new RegExp(`\\b(${POS_TAGS.join('|')})\\b`)

function parseLine(text) {
  const entries = []
  // First, find all positions where "N. word" patterns start
  const starts = []
  const startRegex = /(?:^|\s)(\d+)\.\s+/g
  let m
  while ((m = startRegex.exec(text)) !== null) {
    starts.push({ pos: m.index, id: parseInt(m[1]), matchLen: m[0].length })
  }

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i]
    const contentStart = start.pos + start.matchLen
    const contentEnd = i + 1 < starts.length ? starts[i + 1].pos : text.length
    const segment = text.slice(contentStart, contentEnd).trim()

    // First token is the word, rest is POS + meaning
    const spaceIdx = segment.indexOf(' ')
    if (spaceIdx === -1) continue

    const word = segment.slice(0, spaceIdx)
    const rest = segment.slice(spaceIdx + 1).trim()
    if (!rest) continue

    // Sanity check: valid IDs are 1-3100
    if (start.id < 1 || start.id > 3100) continue

    const { pos, meaning } = parsePosAndMeaning(rest)
    entries.push({ id: start.id, word, pos, meaning })
  }

  return entries
}

function parsePosAndMeaning(text) {
  const pos = []
  const meaningParts = []

  // Strategy: Use a regex to find all "POS chineseMeaning" segments
  // A POS tag appears either at start of string or after Chinese text,
  // followed by a space and Chinese characters
  // e.g., "a 破產的 v 使破產 n 破產者"
  // e.g., "v 拋棄；遺棄"
  // e.g., "n 工作；職業"

  // Match: (POS_TAG) (space) (Chinese text until next POS or end)
  const posTagPattern = /\b(ad|Ph|prep|conj|aux|pron|v|n|a)\s+/g
  const posPositions = []
  let match

  while ((match = posTagPattern.exec(text)) !== null) {
    // Verify this is actually a POS tag: the character before should be
    // start of string, a space, or a Chinese/punctuation character
    const before = match.index > 0 ? text[match.index - 1] : ''
    const isValidPos = match.index === 0 || /[\s，、；。）\)]/.test(before) ||
      // Chinese character before (high byte)
      before.charCodeAt(0) > 127

    if (isValidPos) {
      posPositions.push({
        pos: match[1],
        meaningStart: match.index + match[0].length,
        tagStart: match.index
      })
    }
  }

  if (posPositions.length === 0) {
    // No POS found, return everything as meaning
    return { pos: [], meaning: text }
  }

  for (let i = 0; i < posPositions.length; i++) {
    const p = posPositions[i]
    const meaningEnd = i + 1 < posPositions.length
      ? posPositions[i + 1].tagStart
      : text.length

    const m = text.slice(p.meaningStart, meaningEnd).trim()
      .replace(/[；;，,]\s*$/, '') // Remove trailing punctuation

    if (!pos.includes(p.pos)) pos.push(p.pos)
    if (m) meaningParts.push(m)
  }

  const meaning = meaningParts.join('；').trim()
  return { pos, meaning: meaning || text }
}

function main() {
  const raw = fs.readFileSync(inputPath, 'utf-8')
  const lines = raw.split(/\r?\n/)

  const allEntries = []
  const seenIds = new Set()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    // Skip title line and single letter headers
    if (trimmed === 'TOEIC 全新制 多益必考單字 3,000') continue
    if (/^[A-Z]$/.test(trimmed)) continue

    // Remove leading single letter prefix (e.g., "B 282. bachelor...")
    const cleaned = trimmed.replace(/^[A-Z]\s+(?=\d+\.)/, '')

    const entries = parseLine(cleaned)
    for (const entry of entries) {
      if (!seenIds.has(entry.id)) {
        seenIds.add(entry.id)
        allEntries.push(entry)
      }
    }
  }

  // Sort by id
  allEntries.sort((a, b) => a.id - b.id)

  console.log(`Parsed ${allEntries.length} unique words`)
  console.log(`ID range: ${allEntries[0]?.id} - ${allEntries[allEntries.length - 1]?.id}`)

  // Verify some samples
  const sample = allEntries.slice(0, 5)
  console.log('\nSample entries:')
  sample.forEach(e => console.log(`  ${e.id}. ${e.word} [${e.pos.join(', ')}] ${e.meaning}`))

  fs.writeFileSync(outputPath, JSON.stringify(allEntries, null, 2), 'utf-8')
  console.log(`\nWritten to ${outputPath}`)
}

main()
