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

  it('skips a leading surname reading', () => {
    // 国's first listed form is the surname Guo; the country sense is second.
    const guo = entry({
      simplified: '国',
      forms: [
        { traditional: '國', transcriptions: { pinyin: 'Guó', numeric: 'Guo2' }, meanings: ['surname Guo'] },
        { traditional: '國', transcriptions: { pinyin: 'guó', numeric: 'guo2' }, meanings: ['country; nation; state'] },
      ],
    })
    expect(mapSourceEntries([guo])[0]?.meanings).toEqual(['country; nation; state'])
  })

  it('skips a leading "used in" reading', () => {
    // 上's first form is shǎng, a tone name; learners need shàng.
    const shang = entry({
      simplified: '上',
      forms: [
        { traditional: '上', transcriptions: { pinyin: 'shǎng', numeric: 'shang3' }, meanings: ['used in 上声'] },
        { traditional: '上', transcriptions: { pinyin: 'shàng', numeric: 'shang4' }, meanings: ['up; upper; above'] },
      ],
    })
    expect(mapSourceEntries([shang])[0]?.pinyin).toBe('shàng')
  })

  it('skips past several unhelpful readings in a row', () => {
    // 那 lists two surnames and a variant before the pronoun sense.
    const na = entry({
      simplified: '那',
      forms: [
        { traditional: '那', transcriptions: { pinyin: 'Nā', numeric: 'Na1' }, meanings: ['surname Na'] },
        { traditional: '那', transcriptions: { pinyin: 'Nuó', numeric: 'Nuo2' }, meanings: ['surname Nuo'] },
        { traditional: '那', transcriptions: { pinyin: 'nǎ', numeric: 'na3' }, meanings: ['variant of 哪'] },
        { traditional: '那', transcriptions: { pinyin: 'nà', numeric: 'na4' }, meanings: ['that; those'] },
      ],
    })
    expect(mapSourceEntries([na])[0]?.pinyin).toBe('nà')
  })

  it('falls back to the first form when every reading is unhelpful', () => {
    const only = entry({
      simplified: '某',
      forms: [{ traditional: '某', transcriptions: { pinyin: 'Mǒu', numeric: 'Mou3' }, meanings: ['surname Mou'] }],
    })
    expect(mapSourceEntries([only])[0]?.meanings).toEqual(['surname Mou'])
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
