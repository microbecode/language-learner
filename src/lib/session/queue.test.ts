import { describe, expect, it } from 'vitest'
import type { Word } from '../deck/types'
import { introduceCard } from '../scheduler/schedule'
import { defaultProgress } from '../storage/progress'
import type { Progress } from '../storage/types'
import {
  REQUEUE_GAP,
  buildQueue,
  dueCards,
  newAllowance,
  newCards,
  requeue,
  todayKey,
} from './queue'

const NOW = new Date('2026-08-28T10:00:00.000Z')

function word(id: string, frequency: number): Word {
  return { id, simplified: id, pinyin: 'x', meanings: ['x'], frequency, pos: [] }
}

const DECK: Word[] = [word('的', 1), word('我', 2), word('爱', 3), word('学校', 4)]

function progressWith(overrides: Partial<Progress> = {}): Progress {
  return { ...defaultProgress(), ...overrides }
}

describe('todayKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 7, 28, 13, 0, 0))).toBe('2026-08-28')
  })

  it('zero-pads single-digit months and days', () => {
    expect(todayKey(new Date(2026, 0, 5, 13, 0, 0))).toBe('2026-01-05')
  })
})

describe('newAllowance', () => {
  it('is the full daily quota on a fresh day', () => {
    const progress = progressWith({ newPerDay: 10, introduced: { date: '2020-01-01', count: 7 } })
    expect(newAllowance(progress, NOW)).toBe(10)
  })

  it('subtracts words already introduced today', () => {
    const progress = progressWith({
      newPerDay: 10,
      introduced: { date: todayKey(NOW), count: 4 },
    })
    expect(newAllowance(progress, NOW)).toBe(6)
  })

  it('never goes negative', () => {
    const progress = progressWith({
      newPerDay: 3,
      introduced: { date: todayKey(NOW), count: 9 },
    })
    expect(newAllowance(progress, NOW)).toBe(0)
  })
})

describe('newCards', () => {
  it('takes unseen words in ascending frequency order', () => {
    const progress = progressWith({ newPerDay: 2 })
    expect(newCards(DECK, progress, NOW).map((c) => c.word.id)).toEqual(['的', '我'])
  })

  it('skips words that already have a card', () => {
    const progress = progressWith({ newPerDay: 2, cards: { 的: introduceCard('的') } })
    expect(newCards(DECK, progress, NOW).map((c) => c.word.id)).toEqual(['我', '爱'])
  })

  it('returns nothing once the daily quota is spent', () => {
    const progress = progressWith({
      newPerDay: 5,
      introduced: { date: todayKey(NOW), count: 5 },
    })
    expect(newCards(DECK, progress, NOW)).toEqual([])
  })
})

describe('dueCards', () => {
  it('includes review cards whose due time has passed', () => {
    const past = { ...introduceCard('我'), status: 'review' as const, due: '2026-08-27T10:00:00.000Z' }
    const progress = progressWith({ cards: { 我: past } })
    expect(dueCards(DECK, progress, NOW).map((c) => c.word.id)).toEqual(['我'])
  })

  it('excludes review cards that are not yet due', () => {
    const future = { ...introduceCard('我'), status: 'review' as const, due: '2026-09-30T10:00:00.000Z' }
    const progress = progressWith({ cards: { 我: future } })
    expect(dueCards(DECK, progress, NOW)).toEqual([])
  })

  it('always includes learning cards, which carry no due time', () => {
    const progress = progressWith({ cards: { 爱: introduceCard('爱') } })
    expect(dueCards(DECK, progress, NOW).map((c) => c.word.id)).toEqual(['爱'])
  })
})

describe('buildQueue', () => {
  it('interleaves due cards with new words', () => {
    const past = { ...introduceCard('我'), status: 'review' as const, due: '2026-08-27T10:00:00.000Z' }
    const progress = progressWith({ newPerDay: 2, cards: { 我: past } })
    expect(buildQueue(DECK, progress, NOW).map((c) => c.word.id)).toEqual(['我', '的', '爱'])
  })

  it('is empty when nothing is due and the quota is spent', () => {
    const progress = progressWith({
      newPerDay: 1,
      introduced: { date: todayKey(NOW), count: 1 },
    })
    expect(buildQueue(DECK, progress, NOW)).toEqual([])
  })
})

describe('requeue', () => {
  it('reinserts a card after the configured gap', () => {
    const queue = DECK.map((w) => ({ word: w, state: introduceCard(w.id) }))
    const card = { word: word('新', 9), state: introduceCard('新') }
    expect(requeue(queue, card).map((c) => c.word.id)[REQUEUE_GAP]).toBe('新')
  })

  it('appends when the queue is shorter than the gap', () => {
    const queue = [{ word: word('我', 2), state: introduceCard('我') }]
    const card = { word: word('新', 9), state: introduceCard('新') }
    expect(requeue(queue, card).map((c) => c.word.id)).toEqual(['我', '新'])
  })
})
