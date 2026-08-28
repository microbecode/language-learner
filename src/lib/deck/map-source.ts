import type { SourceEntry, Word } from './types'

export function mapSourceEntries(entries: SourceEntry[]): Word[] {
  const words: Word[] = []
  for (const entry of entries) {
    const form = entry.forms[0]
    if (!form) continue
    words.push({
      id: entry.simplified,
      simplified: entry.simplified,
      pinyin: form.transcriptions.pinyin,
      meanings: form.meanings,
      frequency: entry.frequency,
      pos: entry.pos,
    })
  }
  return words
}
