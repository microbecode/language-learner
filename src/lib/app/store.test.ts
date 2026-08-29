import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../storage/progress'
import { AppStore } from './store.svelte'

const NOW = new Date('2026-08-28T10:00:00.000Z')

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
let app: AppStore
beforeEach(() => {
  backend = fakeStorage()
  app = new AppStore(backend, () => NOW)
})

function stored(): { newPerDay: number; introduced: { count: number } } {
  return JSON.parse(backend.getItem(STORAGE_KEY)!)
}

describe('setNewPerDay', () => {
  it('stores a sane value', () => {
    app.setNewPerDay(7)
    expect(app.progress.newPerDay).toBe(7)
    expect(stored().newPerDay).toBe(7)
  })

  it('ignores a non-finite value instead of persisting it', () => {
    // A number input accepts "1e999". Persisting the resulting Infinity writes
    // null, which fails validation on the next load, which resets progress,
    // which the next grade writes over the top of — the whole history, gone.
    app.setNewPerDay(7)
    app.setNewPerDay(Number('1e999'))
    expect(app.progress.newPerDay).toBe(7)
    expect(stored().newPerDay).toBe(7)
  })

  it('never stores a negative value', () => {
    app.setNewPerDay(-5)
    expect(app.progress.newPerDay).toBe(0)
  })

  it('caps the value at the deck size', () => {
    app.setNewPerDay(10_000)
    expect(app.progress.newPerDay).toBe(app.deck.length)
  })

  it('survives a reload through the same backend', () => {
    app.setNewPerDay(7)
    expect(new AppStore(backend, () => NOW).progress.newPerDay).toBe(7)
  })
})

describe('grade', () => {
  beforeEach(() => {
    app.setNewPerDay(1)
    app.startSession()
  })

  it('requeues a card that is still learning', () => {
    expect(app.remaining).toBe(1)
    app.grade('good')
    expect(app.remaining).toBe(1)
    expect(app.current?.state.status).toBe('learning')
  })

  it('drops a card once it graduates', () => {
    app.grade('good')
    app.grade('good')
    expect(app.remaining).toBe(0)
    expect(app.screen).toBe('summary')
  })

  it('counts a new word once however many times it is graded', () => {
    app.grade('good')
    app.grade('good')
    expect(app.progress.introduced.count).toBe(1)
    expect(stored().introduced.count).toBe(1)
  })

  it('persists after every grading', () => {
    app.grade('good')
    expect(Object.keys(JSON.parse(backend.getItem(STORAGE_KEY)!).cards)).toHaveLength(1)
  })
})
