import { beforeEach, describe, expect, it } from 'vitest'
import { introduceCard } from '../scheduler/schedule'
import {
  CORRUPT_BACKUP_KEY,
  DEFAULT_NEW_PER_DAY,
  ProgressImportError,
  STORAGE_KEY,
  defaultProgress,
  loadProgress,
  parseProgress,
  saveProgress,
  serializeProgress,
} from './progress'

/** A Map-backed Storage so these tests need no DOM. */
function fakeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  }
}

let backend: Storage
beforeEach(() => {
  backend = fakeStorage()
})

describe('defaultProgress', () => {
  it('starts empty at the current version', () => {
    const progress = defaultProgress()
    expect(progress.version).toBe(1)
    expect(progress.cards).toEqual({})
    expect(progress.newPerDay).toBe(DEFAULT_NEW_PER_DAY)
    expect(progress.introduced.count).toBe(0)
  })
})

describe('loadProgress and saveProgress', () => {
  it('round-trips progress through the backend', () => {
    const progress = defaultProgress()
    progress.cards['爱'] = introduceCard('爱')
    progress.newPerDay = 25
    saveProgress(backend, progress)
    expect(loadProgress(backend)).toEqual(progress)
  })

  it('returns defaults when nothing is stored', () => {
    expect(loadProgress(backend)).toEqual(defaultProgress())
  })

  it('returns defaults rather than throwing on corrupt JSON', () => {
    backend.setItem(STORAGE_KEY, '{not json')
    expect(loadProgress(backend)).toEqual(defaultProgress())
  })

  it('returns defaults rather than throwing on a wrong version', () => {
    backend.setItem(STORAGE_KEY, JSON.stringify({ ...defaultProgress(), version: 99 }))
    expect(loadProgress(backend)).toEqual(defaultProgress())
  })
})

describe('loadProgress, corrupt payloads', () => {
  it('preserves the unreadable payload instead of letting it be overwritten', () => {
    // Without this the next grade persists over the only copy of a history
    // that a schema fix could otherwise have recovered.
    backend.setItem(STORAGE_KEY, '{"version":1,"newPerDay":null}')
    loadProgress(backend)
    expect(backend.getItem(CORRUPT_BACKUP_KEY)).toBe('{"version":1,"newPerDay":null}')
  })

  it('still returns usable defaults after backing the payload up', () => {
    backend.setItem(STORAGE_KEY, '{not json')
    expect(loadProgress(backend)).toEqual(defaultProgress())
  })
})

describe('parseProgress', () => {
  it('accepts progress it produced', () => {
    const progress = defaultProgress()
    progress.cards['爱'] = introduceCard('爱')
    expect(parseProgress(serializeProgress(progress))).toEqual(progress)
  })

  it('rejects malformed JSON', () => {
    expect(() => parseProgress('{not json')).toThrow(ProgressImportError)
  })

  it('rejects a wrong version', () => {
    const wrong = JSON.stringify({ ...defaultProgress(), version: 2 })
    expect(() => parseProgress(wrong)).toThrow(ProgressImportError)
  })

  it('rejects a non-finite newPerDay', () => {
    // Infinity serialises to null, which is what makes this reachable at all.
    const wrong = JSON.stringify({ ...defaultProgress(), newPerDay: null })
    expect(() => parseProgress(wrong)).toThrow(ProgressImportError)
  })

  it('rejects a negative newPerDay', () => {
    const wrong = JSON.stringify({ ...defaultProgress(), newPerDay: -1 })
    expect(() => parseProgress(wrong)).toThrow(ProgressImportError)
  })

  it('rejects a review card whose due is null', () => {
    // dueCards skips it forever, so accepting this drops the word silently.
    const card = { ...introduceCard('爱'), status: 'review' as const, due: null }
    const wrong = JSON.stringify({ ...defaultProgress(), cards: { 爱: card } })
    expect(() => parseProgress(wrong)).toThrow(ProgressImportError)
  })

  it('rejects a review card whose due is unparseable', () => {
    const card = { ...introduceCard('爱'), status: 'review' as const, due: 'whenever' }
    const wrong = JSON.stringify({ ...defaultProgress(), cards: { 爱: card } })
    expect(() => parseProgress(wrong)).toThrow(ProgressImportError)
  })

  it('rejects a learning card that carries a due time', () => {
    const card = { ...introduceCard('爱'), due: '2026-08-28T10:00:00.000Z' }
    const wrong = JSON.stringify({ ...defaultProgress(), cards: { 爱: card } })
    expect(() => parseProgress(wrong)).toThrow(ProgressImportError)
  })

  it('accepts a well-formed review card', () => {
    const card = { ...introduceCard('爱'), status: 'review' as const, due: '2026-08-28T10:00:00.000Z' }
    const good = JSON.stringify({ ...defaultProgress(), cards: { 爱: card } })
    expect(parseProgress(good).cards['爱']?.status).toBe('review')
  })

  it('rejects a non-object cards map', () => {
    const wrong = JSON.stringify({ ...defaultProgress(), cards: [] })
    expect(() => parseProgress(wrong)).toThrow(ProgressImportError)
  })

  it('rejects a card entry missing required fields', () => {
    const wrong = JSON.stringify({
      ...defaultProgress(),
      cards: { 爱: { wordId: '爱', status: 'learning' } },
    })
    expect(() => parseProgress(wrong)).toThrow(ProgressImportError)
  })

  it('rejects an unknown card status', () => {
    const wrong = JSON.stringify({
      ...defaultProgress(),
      cards: { 爱: { ...introduceCard('爱'), status: 'brand-new' } },
    })
    expect(() => parseProgress(wrong)).toThrow(ProgressImportError)
  })

  it('leaves stored state untouched when an import is rejected', () => {
    const good = defaultProgress()
    good.newPerDay = 42
    saveProgress(backend, good)
    expect(() => parseProgress('{not json')).toThrow(ProgressImportError)
    expect(loadProgress(backend).newPerDay).toBe(42)
  })
})
