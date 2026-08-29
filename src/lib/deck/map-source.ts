import type { SourceEntry, SourceForm, Word } from './types'

/** Senses that describe a character's use rather than teaching its meaning. */
const UNHELPFUL_SENSE = /^(surname|used in|variant of)\b/i

/**
 * The dataset lists a character's readings with proper nouns and rare or
 * technical senses first: 上's first form is shǎng "used in 上声", and the
 * shàng "up; above" a learner needs is second; 国's first form is the surname
 * Guo. Taking forms[0] would teach the wrong reading on about twenty cards,
 * so prefer the first form that carries a real sense.
 */
export function preferredForm(forms: SourceForm[]): SourceForm | undefined {
  const useful = forms.find((form) => {
    const first = form.meanings[0]
    return first !== undefined && !UNHELPFUL_SENSE.test(first)
  })
  return useful ?? forms[0]
}

export function mapSourceEntries(
  entries: SourceEntry[],
  strokesOf: (character: string) => number = () => 0,
): Word[] {
  const words: Word[] = []
  for (const entry of entries) {
    const form = preferredForm(entry.forms)
    if (!form) continue
    words.push({
      id: entry.simplified,
      simplified: entry.simplified,
      pinyin: form.transcriptions.pinyin,
      meanings: form.meanings,
      frequency: entry.frequency,
      pos: entry.pos,
      strokes: [...entry.simplified].reduce((sum, c) => sum + strokesOf(c), 0),
      origin: 'hsk',
    })
  }
  return words
}
