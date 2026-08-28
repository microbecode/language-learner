import type { CardState } from '../scheduler/types'

export type Progress = {
  version: 1
  /** Keyed by word id. A word absent from this map has never been introduced. */
  cards: Record<string, CardState>
  newPerDay: number
  /** date is a local YYYY-MM-DD key; count is how many new words it covered. */
  introduced: { date: string; count: number }
}
