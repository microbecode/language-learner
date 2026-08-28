import { loadDeck } from '../deck/deck'
import type { Word } from '../deck/types'
import { schedule } from '../scheduler/schedule'
import type { Grade } from '../scheduler/types'
import {
  defaultProgress,
  loadProgress,
  parseProgress,
  saveProgress,
  serializeProgress,
} from '../storage/progress'
import type { Progress } from '../storage/types'
import {
  buildQueue,
  dueCards,
  newCards,
  requeue,
  todayKey,
  type SessionCard,
} from '../session/queue'

export type Screen = 'home' | 'review' | 'summary' | 'data'
export type Tally = Record<Grade, number>

function emptyTally(): Tally {
  return { again: 0, hard: 0, good: 0, easy: 0 }
}

export class AppStore {
  readonly deck: Word[] = loadDeck()
  progress = $state<Progress>(defaultProgress())
  screen = $state<Screen>('home')
  queue = $state<SessionCard[]>([])
  revealed = $state(false)
  tally = $state<Tally>(emptyTally())
  importError = $state<string | null>(null)

  #backend: Storage
  #now: () => Date

  constructor(backend: Storage = localStorage, now: () => Date = () => new Date()) {
    this.#backend = backend
    this.#now = now
    this.progress = loadProgress(backend)
  }

  get current(): SessionCard | null {
    return this.queue[0] ?? null
  }

  get dueCount(): number {
    return dueCards(this.deck, this.progress, this.#now()).length
  }

  get newCount(): number {
    return newCards(this.deck, this.progress, this.#now()).length
  }

  get learnedCount(): number {
    return Object.values(this.progress.cards).filter((c) => c.status === 'review').length
  }

  get remaining(): number {
    return this.queue.length
  }

  #persist(): void {
    saveProgress(this.#backend, this.progress)
  }

  startSession(): void {
    this.queue = buildQueue(this.deck, this.progress, this.#now())
    this.tally = emptyTally()
    this.revealed = false
    this.screen = this.queue.length > 0 ? 'review' : 'summary'
  }

  reveal(): void {
    this.revealed = true
  }

  grade(grade: Grade): void {
    const card = this.current
    if (!card) return

    const now = this.#now()
    const wasNew = this.progress.cards[card.word.id] === undefined
    const next = schedule(card.state, grade, now)

    this.progress.cards[card.word.id] = next
    if (wasNew) {
      const key = todayKey(now)
      const sameDay = this.progress.introduced.date === key
      this.progress.introduced = {
        date: key,
        count: sameDay ? this.progress.introduced.count + 1 : 1,
      }
    }
    this.tally[grade] += 1

    const rest = this.queue.slice(1)
    this.queue =
      next.status === 'learning' ? requeue(rest, { word: card.word, state: next }) : rest
    this.revealed = false
    this.#persist()

    if (this.queue.length === 0) this.screen = 'summary'
  }

  goHome(): void {
    this.screen = 'home'
  }

  goData(): void {
    this.importError = null
    this.screen = 'data'
  }

  setNewPerDay(value: number): void {
    this.progress.newPerDay = Math.max(0, Math.floor(value))
    this.#persist()
  }

  exportJson(): string {
    return serializeProgress(this.progress)
  }

  importJson(json: string): boolean {
    try {
      this.progress = parseProgress(json)
      this.#persist()
      this.importError = null
      return true
    } catch (error) {
      this.importError = error instanceof Error ? error.message : 'import failed'
      return false
    }
  }
}
