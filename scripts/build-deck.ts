import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mapSourceEntries } from '../src/lib/deck/map-source.ts'
import type { SourceEntry, Word } from '../src/lib/deck/types.ts'

const PINNED_SHA = '7ac65bf1a6387d35f1ade478906172a19311c7f9'
const SOURCE_URL =
  `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/${PINNED_SHA}/wordlists/exclusive/newest/1.json`
const UNIHAN_URL = 'https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip'
const OUT_PATH = new URL('../src/lib/deck/hsk3-level1.json', import.meta.url)
const MIN_WORDS = 290

async function fetchOrThrow(url: string): Promise<Response> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`fetch failed: ${url} — ${response.status}`)
  return response
}

/**
 * Unihan ships only as a zip, so this shells out to `unzip`. It is a manual
 * maintenance step, not part of the app build.
 */
async function loadUnihan(): Promise<{
  strokes: Map<string, number>
  definition: Map<string, string>
  reading: Map<string, string>
}> {
  const dir = mkdtempSync(join(tmpdir(), 'unihan-'))
  const zip = join(dir, 'Unihan.zip')
  writeFileSync(zip, Buffer.from(await (await fetchOrThrow(UNIHAN_URL)).arrayBuffer()))

  const strokes = new Map<string, number>()
  const definition = new Map<string, string>()
  const reading = new Map<string, string>()

  for (const file of ['Unihan_IRGSources.txt', 'Unihan_Readings.txt']) {
    const text = execFileSync('unzip', ['-p', zip, file], {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    })
    for (const line of text.split('\n')) {
      if (!line.startsWith('U+')) continue
      const [code, field, value] = line.split('\t')
      if (!code || !field || !value) continue
      const character = String.fromCodePoint(Number.parseInt(code.slice(2), 16))
      if (field === 'kTotalStrokes') strokes.set(character, Number.parseInt(value, 10))
      else if (field === 'kDefinition') definition.set(character, value)
      else if (field === 'kMandarin') reading.set(character, value.split(' ')[0]!)
    }
  }
  return { strokes, definition, reading }
}

const unihan = await loadUnihan()
const strokesOf = (character: string) => unihan.strokes.get(character) ?? 0

const entries = (await (await fetchOrThrow(SOURCE_URL)).json()) as SourceEntry[]
const words = mapSourceEntries(entries, strokesOf)
if (words.length < MIN_WORDS) {
  throw new Error(`expected at least ${MIN_WORDS} words, got ${words.length}`)
}

/**
 * Characters the list's compounds are built from but never teaches on their
 * own — 电 appears in five words and has no card of its own. Without these the
 * deck cannot teach the parts before the wholes.
 */
const taught = new Set(words.filter((w) => w.simplified.length === 1).map((w) => w.simplified))
const needed = new Set<string>()
for (const word of words) {
  if (word.simplified.length === 1) continue
  for (const character of word.simplified) {
    if (!taught.has(character)) needed.add(character)
  }
}

const components: Word[] = []
for (const character of needed) {
  const gloss = unihan.definition.get(character)
  const pinyin = unihan.reading.get(character)
  if (!gloss || !pinyin) {
    throw new Error(`no Unihan definition or reading for component ${character}`)
  }
  components.push({
    id: character,
    simplified: character,
    pinyin,
    meanings: gloss.split(';').map((m) => m.trim()).filter(Boolean),
    frequency: 99_999,
    pos: [],
    strokes: strokesOf(character),
    origin: 'component',
  })
}

const deck = [...words, ...components]
writeFileSync(OUT_PATH, `${JSON.stringify(deck, null, 2)}\n`, 'utf8')
console.log(
  `wrote ${deck.length} cards: ${words.length} HSK words + ${components.length} component characters`,
)
