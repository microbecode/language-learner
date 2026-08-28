import { describe, expect, it } from 'vitest'
import { mapSourceEntries } from './map-source'
import type { SourceEntry } from './types'

function entry(overrides: Partial<SourceEntry> = {}): SourceEntry {
  return {
    simplified: '爱',
    radical: '爫',
    frequency: 130,
    pos: ['v', 'vn'],
    forms: [
      {
        traditional: '愛',
        transcriptions: { pinyin: 'ài', numeric: 'ai4' },
        meanings: ['to love; to be fond of', 'affection'],
      },
    ],
    ...overrides,
  }
}

describe('mapSourceEntries', () => {
  it('maps a source entry to a Word using the first form', () => {
    expect(mapSourceEntries([entry()])).toEqual([
      {
        id: '爱',
        simplified: '爱',
        pinyin: 'ài',
        meanings: ['to love; to be fond of', 'affection'],
        frequency: 130,
        pos: ['v', 'vn'],
      },
    ])
  })

  it('uses the first form when several are present', () => {
    const multi = entry({
      forms: [
        { traditional: '長', transcriptions: { pinyin: 'cháng', numeric: 'chang2' }, meanings: ['long'] },
        { traditional: '長', transcriptions: { pinyin: 'zhǎng', numeric: 'zhang3' }, meanings: ['to grow'] },
      ],
    })
    expect(mapSourceEntries([multi])[0]?.pinyin).toBe('cháng')
  })

  it('drops entries with no forms', () => {
    expect(mapSourceEntries([entry({ forms: [] })])).toEqual([])
  })

  it('preserves input order', () => {
    const a = entry({ simplified: '八', frequency: 1362 })
    const b = entry({ simplified: '爸', frequency: 900 })
    expect(mapSourceEntries([a, b]).map((w) => w.id)).toEqual(['八', '爸'])
  })
})
