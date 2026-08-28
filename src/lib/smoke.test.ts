import { describe, expect, it } from 'vitest'
import { harnessWorks } from './smoke'

describe('test harness', () => {
  it('runs TypeScript tests', () => {
    expect(harnessWorks()).toBe(true)
  })
})
