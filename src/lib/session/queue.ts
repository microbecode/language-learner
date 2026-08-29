import type { Word } from '../deck/types'
import type { CardState } from '../scheduler/types'
import { introduceCard } from '../scheduler/schedule'
import type { Progress } from '../storage/types'

export const REQUEUE_GAP = 3

export type SessionCard = { word: Word; state: CardState }

export function todayKey(now: Date): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function newAllowance(progress: Progress, now: Date): number {
  if (progress.introduced.date !== todayKey(now)) return progress.newPerDay
  return Math.max(0, progress.newPerDay - progress.introduced.count)
}

/**
 * Learning cards have no due time and are always included — otherwise a card
 * left mid-learning when a session ends would never resurface.
 */
export function dueCards(deck: Word[], progress: Progress, now: Date): SessionCard[] {
  const cards: SessionCard[] = []
  for (const word of deck) {
    const state = progress.cards[word.id]
    if (!state) continue
    if (state.status === 'learning') {
      cards.push({ word, state })
      continue
    }
    if (state.due !== null && new Date(state.due).getTime() <= now.getTime()) {
      cards.push({ word, state })
    }
  }
  return cards
}

export function newCards(deck: Word[], progress: Progress, now: Date): SessionCard[] {
  const allowance = newAllowance(progress, now)
  if (allowance === 0) return []
  const cards: SessionCard[] = []
  for (const word of deck) {
    if (cards.length >= allowance) break
    if (progress.cards[word.id]) continue
    cards.push({ word, state: introduceCard(word.id) })
  }
  return cards
}

/**
 * Fisher-Yates on a copy. Deterministic given `rng`, which is what keeps
 * buildQueue testable despite being randomised.
 */
export function shuffle<T>(items: T[], rng: () => number): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const a = next[i]!
    const b = next[j]!
    next[i] = b
    next[j] = a
  }
  return next
}

/**
 * Interleaves due cards with new words so neither is front-loaded, shuffling
 * each list first so a session does not replay the same sequence every time.
 *
 * Only the order is randomised. Which new words are introduced is still
 * decided by ascending frequency in newCards, so the most common unlearned
 * words are always the ones taught next.
 */
export function buildQueue(
  deck: Word[],
  progress: Progress,
  now: Date,
  rng: () => number = Math.random,
): SessionCard[] {
  const due = shuffle(dueCards(deck, progress, now), rng)
  const fresh = shuffle(newCards(deck, progress, now), rng)
  const queue: SessionCard[] = []
  for (let i = 0; i < Math.max(due.length, fresh.length); i += 1) {
    const dueCard = due[i]
    if (dueCard) queue.push(dueCard)
    const newCard = fresh[i]
    if (newCard) queue.push(newCard)
  }
  return queue
}

export function requeue(queue: SessionCard[], card: SessionCard): SessionCard[] {
  const next = [...queue]
  next.splice(Math.min(REQUEUE_GAP, next.length), 0, card)
  return next
}
