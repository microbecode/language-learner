import { describe, expect, it } from 'vitest'
import { loadDeck } from './deck'

describe('loadDeck', () => {
  const deck = loadDeck()

  it('contains the full HSK 3.0 Level 1 list', () => {
    expect(deck.length).toBe(294)
  })

  it('gives every word an id, pinyin, and at least one meaning', () => {
    for (const word of deck) {
      expect(word.id).not.toBe('')
      expect(word.pinyin).not.toBe('')
      expect(word.meanings.length).toBeGreaterThan(0)
    }
  })

  it('has unique ids', () => {
    expect(new Set(deck.map((w) => w.id)).size).toBe(deck.length)
  })

  it('is sorted by ascending frequency', () => {
    const frequencies = deck.map((w) => w.frequency)
    expect(frequencies).toEqual([...frequencies].sort((a, b) => a - b))
  })
})
