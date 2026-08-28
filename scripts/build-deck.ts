import { writeFile } from 'node:fs/promises'
import { mapSourceEntries } from '../src/lib/deck/map-source.ts'
import type { SourceEntry } from '../src/lib/deck/types.ts'

const PINNED_SHA = '7ac65bf1a6387d35f1ade478906172a19311c7f9'
const SOURCE_URL =
  `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/${PINNED_SHA}/wordlists/exclusive/newest/1.json`
const OUT_PATH = new URL('../src/lib/deck/hsk3-level1.json', import.meta.url)
const MIN_WORDS = 290

const response = await fetch(SOURCE_URL)
if (!response.ok) {
  throw new Error(`fetch failed: ${response.status} ${response.statusText}`)
}

const entries = (await response.json()) as SourceEntry[]
const words = mapSourceEntries(entries)

if (words.length < MIN_WORDS) {
  throw new Error(`expected at least ${MIN_WORDS} words, got ${words.length}`)
}

await writeFile(OUT_PATH, `${JSON.stringify(words, null, 2)}\n`, 'utf8')
console.log(`wrote ${words.length} words to src/lib/deck/hsk3-level1.json`)
