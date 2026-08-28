export type Word = {
  /** The simplified form; unique within the deck and the key for review state. */
  id: string
  simplified: string
  /** Tone-marked, e.g. "xuéxiào". */
  pinyin: string
  meanings: string[]
  frequency: number
  pos: string[]
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
