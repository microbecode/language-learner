import type { CardState, CardStatus } from '../scheduler/types'
import type { Progress } from './types'

export const STORAGE_KEY = 'language-learner.progress.v1'
export const PROGRESS_VERSION = 1
export const DEFAULT_NEW_PER_DAY = 10

const STATUSES: CardStatus[] = ['learning', 'review']

export class ProgressImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProgressImportError'
  }
}

export function defaultProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    cards: {},
    newPerDay: DEFAULT_NEW_PER_DAY,
    introduced: { date: '', count: 0 },
  }
}

function isCardState(value: unknown): value is CardState {
  if (typeof value !== 'object' || value === null) return false
  const card = value as Record<string, unknown>
  return (
    typeof card.wordId === 'string' &&
    typeof card.status === 'string' &&
    STATUSES.includes(card.status as CardStatus) &&
    typeof card.learningStep === 'number' &&
    typeof card.intervalDays === 'number' &&
    typeof card.ease === 'number' &&
    (card.due === null || typeof card.due === 'string') &&
    typeof card.reps === 'number' &&
    typeof card.lapses === 'number'
  )
}

function validate(value: unknown): Progress {
  if (typeof value !== 'object' || value === null) {
    throw new ProgressImportError('progress must be an object')
  }
  const progress = value as Record<string, unknown>
  if (progress.version !== PROGRESS_VERSION) {
    throw new ProgressImportError(`unsupported version: ${String(progress.version)}`)
  }
  if (
    typeof progress.cards !== 'object' ||
    progress.cards === null ||
    Array.isArray(progress.cards)
  ) {
    throw new ProgressImportError('cards must be an object')
  }
  for (const [wordId, card] of Object.entries(progress.cards)) {
    if (!isCardState(card)) {
      throw new ProgressImportError(`invalid card state for "${wordId}"`)
    }
  }
  if (typeof progress.newPerDay !== 'number') {
    throw new ProgressImportError('newPerDay must be a number')
  }
  const introduced = progress.introduced as Record<string, unknown> | undefined
  if (
    typeof introduced !== 'object' ||
    introduced === null ||
    typeof introduced.date !== 'string' ||
    typeof introduced.count !== 'number'
  ) {
    throw new ProgressImportError('introduced must be { date, count }')
  }
  return value as Progress
}

export function serializeProgress(progress: Progress): string {
  return JSON.stringify(progress, null, 2)
}

/** Throws ProgressImportError on anything it cannot fully validate. */
export function parseProgress(json: string): Progress {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new ProgressImportError('could not parse JSON')
  }
  return validate(parsed)
}

/** Never throws: unreadable state yields defaults so a bad value cannot brick the app. */
export function loadProgress(backend: Storage): Progress {
  const raw = backend.getItem(STORAGE_KEY)
  if (raw === null) return defaultProgress()
  try {
    return parseProgress(raw)
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(backend: Storage, progress: Progress): void {
  backend.setItem(STORAGE_KEY, JSON.stringify(progress))
}
