import type { Word } from './types'

export type Component = {
  character: string
  /** The character's meaning, when the deck teaches it as a card of its own. */
  gloss: string | null
  /** Other multi-character deck words built from this character. */
  alsoIn: string[]
}

export type CharacterIndex = Map<string, { gloss: string | null; words: string[] }>

/**
 * Indexes the deck by character so a word can be shown as the parts it is
 * built from. Glosses come only from the deck's own single-character entries:
 * a character's meaning inside a compound often differs from the word sense a
 * dictionary lists for it, so an unglossed component is better than a wrong one.
 */
/**
 * The dataset's single-character entries sometimes carry only a proper-noun
 * sense — 国's only listed meaning is "surname Guo", which would gloss 中国 as
 * "middle + surname Guo". Prefer a real sense; show nothing rather than that.
 */
function glossFor(meanings: string[]): string | null {
  return meanings.find((m) => !/^surname\b/i.test(m)) ?? null
}

export function buildCharacterIndex(deck: Word[]): CharacterIndex {
  const index: CharacterIndex = new Map()
  for (const word of deck) {
    for (const character of word.simplified) {
      const entry = index.get(character) ?? { gloss: null, words: [] }
      if (word.simplified.length === 1) {
        entry.gloss = glossFor(word.meanings)
      } else {
        entry.words.push(word.simplified)
      }
      index.set(character, entry)
    }
  }
  return index
}

/**
 * Teaching order: the simplest, most reusable things first.
 *
 * Single characters lead, ordered by how many of the deck's compound words
 * they unlock — learning 电 pays off across 电话, 电脑, 电视, 电影 and 电影院.
 * Compounds follow, shorter before longer, each tier broken by frequency so
 * the commonest items still come first within it.
 */
export function sortForTeaching(deck: Word[]): Word[] {
  const index = buildCharacterIndex(deck)
  const unlocks = (word: Word) => index.get(word.simplified)?.words.length ?? 0
  return [...deck].sort((a, b) => {
    const aSingle = a.simplified.length === 1
    const bSingle = b.simplified.length === 1
    if (aSingle !== bSingle) return aSingle ? -1 : 1
    if (aSingle) {
      const byYield = unlocks(b) - unlocks(a)
      if (byYield !== 0) return byYield
    } else {
      const byLength = a.simplified.length - b.simplified.length
      if (byLength !== 0) return byLength
    }
    return a.frequency - b.frequency
  })
}

/** The parts a word is built from. Empty for single-character words. */
export function decomposeWord(word: Word, index: CharacterIndex): Component[] {
  if (word.simplified.length <= 1) return []
  return [...word.simplified].map((character) => {
    const entry = index.get(character)
    return {
      character,
      gloss: entry?.gloss ?? null,
      alsoIn: (entry?.words ?? []).filter((w) => w !== word.simplified),
    }
  })
}
