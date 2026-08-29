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

  it('puts every single character ahead of every compound', () => {
    const firstCompound = deck.findIndex((w) => w.simplified.length > 1)
    expect(deck.slice(0, firstCompound).every((w) => w.simplified.length === 1)).toBe(true)
    expect(deck.slice(firstCompound).every((w) => w.simplified.length > 1)).toBe(true)
  })

  it('leads with the characters that unlock the most compounds', () => {
    const singles = deck.filter((w) => w.simplified.length === 1).map((w) => w.simplified)
    // 学 appears in 11 compounds (大学, 同学, 学校, 上学 ...) — the most of any
    // character the deck actually teaches on its own.
    expect(singles[0]).toBe('学')
    // 爱 appears in no compound at all, so it must not outrank one that does.
    expect(singles.indexOf('学')).toBeLessThan(singles.indexOf('爱'))
  })

  it('breaks each tier by ascending frequency', () => {
    const compounds = deck.filter((w) => w.simplified.length === 2).map((w) => w.frequency)
    expect(compounds).toEqual([...compounds].sort((a, b) => a - b))
  })
})
