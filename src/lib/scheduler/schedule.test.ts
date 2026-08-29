import { describe, expect, it } from 'vitest'
import {
  introduceCard,
  schedule,
  LEARNING_STEPS,
  MAX_INTERVAL_DAYS,
  MIN_EASE,
  STARTING_EASE,
} from './schedule'
import type { CardState, Grade } from './types'

const GRADES: Grade[] = ['again', 'hard', 'good', 'easy']

const NOW = new Date('2026-08-28T10:00:00.000Z')

function daysBetween(from: Date, iso: string): number {
  return Math.round((new Date(iso).getTime() - from.getTime()) / 86_400_000)
}

function reviewCard(overrides: Partial<CardState> = {}): CardState {
  return {
    wordId: '学校',
    status: 'review',
    learningStep: 0,
    intervalDays: 10,
    ease: 2.5,
    due: NOW.toISOString(),
    reps: 5,
    lapses: 0,
    ...overrides,
  }
}

describe('scheduler constants', () => {
  it('pins the values the scheduling rules are stated in terms of', () => {
    expect(STARTING_EASE).toBe(2.5)
    expect(MIN_EASE).toBe(1.3)
    expect(MAX_INTERVAL_DAYS).toBe(365)
    expect(LEARNING_STEPS).toBe(2)
  })
})

describe('introduceCard', () => {
  it('starts a word in learning at step 0 with no due date', () => {
    expect(introduceCard('爱')).toEqual({
      wordId: '爱',
      status: 'learning',
      learningStep: 0,
      intervalDays: 0,
      ease: STARTING_EASE,
      due: null,
      reps: 0,
      lapses: 0,
    })
  })
})

describe('schedule, while learning', () => {
  const learning = introduceCard('爱')

  it('sends "again" back to step 0', () => {
    const advanced = schedule(learning, 'good', NOW)
    expect(schedule(advanced, 'again', NOW).learningStep).toBe(0)
  })

  it('leaves the step unchanged on "hard"', () => {
    const advanced = schedule(learning, 'good', NOW)
    const hard = schedule(advanced, 'hard', NOW)
    expect(hard.learningStep).toBe(advanced.learningStep)
    expect(hard.status).toBe('learning')
  })

  it('advances one step on "good"', () => {
    expect(schedule(learning, 'good', NOW).learningStep).toBe(1)
  })

  it('graduates past the last step with a 1 day interval', () => {
    const atLastStep = schedule(learning, 'good', NOW)
    const graduated = schedule(atLastStep, 'good', NOW)
    expect(graduated.status).toBe('review')
    expect(graduated.intervalDays).toBe(1)
    expect(graduated.due).not.toBeNull()
    expect(daysBetween(NOW, graduated.due!)).toBe(1)
  })

  it('graduates immediately on "easy" with a 4 day interval', () => {
    const graduated = schedule(learning, 'easy', NOW)
    expect(graduated.status).toBe('review')
    expect(graduated.intervalDays).toBe(4)
    expect(daysBetween(NOW, graduated.due!)).toBe(4)
  })

  it('keeps due null while still learning', () => {
    expect(schedule(learning, 'good', NOW).due).toBeNull()
  })
})

describe('schedule, while reviewing', () => {
  it('multiplies the interval by ease on "good"', () => {
    const next = schedule(reviewCard({ intervalDays: 10, ease: 2.5 }), 'good', NOW)
    expect(next.intervalDays).toBe(25)
    expect(next.ease).toBe(2.5)
  })

  it('lowers ease and grows the interval gently on "hard"', () => {
    const next = schedule(reviewCard({ intervalDays: 10, ease: 2.5 }), 'hard', NOW)
    expect(next.ease).toBeCloseTo(2.35, 10)
    expect(next.intervalDays).toBe(12)
  })

  it('raises ease and boosts the interval on "easy"', () => {
    const next = schedule(reviewCard({ intervalDays: 10, ease: 2.5 }), 'easy', NOW)
    expect(next.ease).toBeCloseTo(2.65, 10)
    expect(next.intervalDays).toBe(34)
  })

  it('sends "again" back to learning as a lapse', () => {
    const next = schedule(reviewCard({ intervalDays: 40, ease: 2.5, lapses: 1 }), 'again', NOW)
    expect(next.status).toBe('learning')
    expect(next.learningStep).toBe(0)
    expect(next.lapses).toBe(2)
    expect(next.ease).toBeCloseTo(2.3, 10)
    expect(next.due).toBeNull()
    expect(next.intervalDays).toBe(0)
  })

  it('re-graduates a lapsed card at a 1 day interval', () => {
    const lapsed = schedule(reviewCard({ intervalDays: 40 }), 'again', NOW)
    const step2 = schedule(lapsed, 'good', NOW)
    const regraduated = schedule(step2, 'good', NOW)
    expect(regraduated.intervalDays).toBe(1)
  })

  it('sets due to now plus the new interval', () => {
    const next = schedule(reviewCard({ intervalDays: 10, ease: 2.5 }), 'good', NOW)
    expect(daysBetween(NOW, next.due!)).toBe(25)
  })
})

describe('schedule, bounds', () => {
  it('never lets ease fall below the floor', () => {
    let card = reviewCard({ ease: 1.4, intervalDays: 5 })
    for (let i = 0; i < 10; i += 1) {
      card = schedule(card, 'hard', NOW)
    }
    expect(card.ease).toBe(MIN_EASE)
  })

  it('caps the interval', () => {
    const next = schedule(reviewCard({ intervalDays: 300, ease: 2.5 }), 'good', NOW)
    expect(next.intervalDays).toBe(MAX_INTERVAL_DAYS)
  })

  it('floors a zero interval at one day', () => {
    // Unreachable through this module's own transitions; the floor exists to
    // contain an intervalDays of 0 loaded from corrupted storage.
    const next = schedule(reviewCard({ intervalDays: 0, ease: MIN_EASE }), 'hard', NOW)
    expect(next.intervalDays).toBe(1)
  })

  it.each(GRADES)('increments reps when a review card is graded "%s"', (grade) => {
    expect(schedule(reviewCard({ reps: 7 }), grade, NOW).reps).toBe(8)
  })

  it.each(GRADES)('increments reps when a learning card is graded "%s"', (grade) => {
    const learning = { ...introduceCard('爱'), reps: 3 }
    expect(schedule(learning, grade, NOW).reps).toBe(4)
  })

  it.each(GRADES)('does not mutate a review card graded "%s"', (grade) => {
    const original = reviewCard({ intervalDays: 10 })
    const snapshot = structuredClone(original)
    schedule(original, grade, NOW)
    expect(original).toEqual(snapshot)
  })

  it.each(GRADES)('does not mutate a learning card graded "%s"', (grade) => {
    const original = introduceCard('爱')
    const snapshot = structuredClone(original)
    schedule(original, grade, NOW)
    expect(original).toEqual(snapshot)
  })
})
