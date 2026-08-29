import { describe, expect, it } from 'vitest'
import { loadDeck } from './deck'

describe('loadDeck', () => {
  const deck = loadDeck()

  it('carries the HSK list plus the characters its words are built from', () => {
    expect(deck.filter((w) => w.origin === 'hsk')).toHaveLength(294)
    expect(deck.filter((w) => w.origin === 'component')).toHaveLength(111)
    expect(deck).toHaveLength(405)
  })

  it('gives every card an id, pinyin, meanings and a stroke count', () => {
    for (const word of deck) {
      expect(word.id).not.toBe('')
      expect(word.pinyin).not.toBe('')
      expect(word.meanings.length).toBeGreaterThan(0)
      expect(word.strokes).toBeGreaterThan(0)
    }
  })

  it('has unique ids', () => {
    expect(new Set(deck.map((w) => w.id)).size).toBe(deck.length)
  })

  it('teaches every character of every compound as a card of its own', () => {
    const cards = new Set(deck.map((w) => w.simplified))
    for (const word of deck) {
      for (const character of word.simplified) {
        expect(cards.has(character)).toBe(true)
      }
    }
  })

  it('puts every single character ahead of every compound', () => {
    const firstCompound = deck.findIndex((w) => w.simplified.length > 1)
    expect(deck.slice(0, firstCompound).every((w) => w.simplified.length === 1)).toBe(true)
    expect(deck.slice(firstCompound).every((w) => w.simplified.length > 1)).toBe(true)
  })

  it('orders single characters by ascending stroke count', () => {
    const strokes = deck.filter((w) => w.simplified.length === 1).map((w) => w.strokes)
    expect(strokes).toEqual([...strokes].sort((a, b) => a - b))
  })

  it('teaches a simple character before a more complex one that is reused more', () => {
    // The point of ordering by strokes: 们 appears in five compounds and 人 in
    // one, but 人 is two strokes and 们 is five, so 人 comes first.
    const singles = deck.filter((w) => w.simplified.length === 1).map((w) => w.simplified)
    expect(singles.indexOf('人')).toBeLessThan(singles.indexOf('们'))
    expect(singles.indexOf('一')).toBe(0)
  })

  it('breaks a stroke tie towards the character that unlocks more compounds', () => {
    // 儿 and 人 are both two strokes; 儿 appears in nine compounds, 人 in one.
    const singles = deck.filter((w) => w.simplified.length === 1).map((w) => w.simplified)
    expect(singles.indexOf('儿')).toBeLessThan(singles.indexOf('人'))
  })

  it('orders compounds shortest first', () => {
    const lengths = deck.filter((w) => w.simplified.length > 1).map((w) => w.simplified.length)
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b))
  })
})
