export type Word = {
  /** The simplified form; unique within the deck and the key for review state. */
  id: string
  simplified: string
  /** Tone-marked, e.g. "xuéxiào". */
  pinyin: string
  meanings: string[]
  frequency: number
  pos: string[]
  /** Total strokes across the word's characters; the ordering's measure of how
   * much there is to see and write. */
  strokes: number
  /** Whether this card comes from the HSK list, or is a character the list's
   * words are built from but never teaches on its own. */
  origin: 'hsk' | 'component'
}

export type SourceForm = {
  traditional: string
  transcriptions: { pinyin: string; numeric: string }
  meanings: string[]
}

export type SourceEntry = {
  simplified: string
  radical: string
  frequency: number
  pos: string[]
  forms: SourceForm[]
}
