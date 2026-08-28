import raw from './hsk3-level1.json'
import type { Word } from './types'

/** The bundled HSK 3.0 Level 1 deck, ordered so the most common words come first. */
export function loadDeck(): Word[] {
  return [...(raw as Word[])].sort((a, b) => a.frequency - b.frequency)
}
