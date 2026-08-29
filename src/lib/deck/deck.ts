import { sortForTeaching } from './decompose'
import raw from './hsk3-level1.json'
import type { Word } from './types'

/**
 * The bundled HSK 3.0 Level 1 deck in teaching order: reusable single
 * characters first, then compounds. See sortForTeaching.
 */
export function loadDeck(): Word[] {
  return sortForTeaching(raw as Word[])
}
