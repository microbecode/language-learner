import { describe, expect, it } from 'vitest'
import { buildCharacterIndex, decomposeWord } from './decompose'
import type { Word } from './types'

function word(simplified: string, meanings: string[], frequency = 1): Word {
  return { id: simplified, simplified, pinyin: 'x', meanings, frequency, pos: [] }
}

const DECK: Word[] = [
  word('电', ['electric']),
  word('话', ['speech']),
  word('电话', ['telephone']),
  word('电脑', ['computer']),
  word('电视', ['television']),
  word('朋友', ['friend']),
]

const INDEX = buildCharacterIndex(DECK)

describe('decomposeWord', () => {
  it('returns nothing for a single-character word', () => {
    expect(decomposeWord(word('电', ['electric']), INDEX)).toEqual([])
  })

  it('glosses a component the deck teaches on its own', () => {
    const parts = decomposeWord(word('电话', ['telephone']), INDEX)
    expect(parts.map((p) => p.character)).toEqual(['电', '话'])
    expect(parts[0]?.gloss).toBe('electric')
    expect(parts[1]?.gloss).toBe('speech')
  })

  it('leaves the gloss null for a character the deck never teaches alone', () => {
    // 朋 and 友 are bound morphemes: neither stands alone in modern Chinese,
    // which is exactly why the word list teaches 朋友 as a unit.
    const parts = decomposeWord(word('朋友', ['friend']), INDEX)
    expect(parts.map((p) => p.gloss)).toEqual([null, null])
  })

  it('lists the other deck words sharing a component', () => {
    const parts = decomposeWord(word('电话', ['telephone']), INDEX)
    expect(parts[0]?.alsoIn).toEqual(['电脑', '电视'])
  })

  it('never lists the word itself among its own siblings', () => {
    for (const part of decomposeWord(word('电话', ['telephone']), INDEX)) {
      expect(part.alsoIn).not.toContain('电话')
    }
  })

  it('omits the standalone character entry from the sibling list', () => {
    // 电 is itself a card; showing it as a sibling of 电话 would be noise.
    const parts = decomposeWord(word('电话', ['telephone']), INDEX)
    expect(parts[0]?.alsoIn).not.toContain('电')
  })

  it('handles a three-character word', () => {
    const deck = [...DECK, word('不客气', ['you are welcome'])]
    const parts = decomposeWord(word('不客气', ['you are welcome']), buildCharacterIndex(deck))
    expect(parts.map((p) => p.character)).toEqual(['不', '客', '气'])
  })
})
