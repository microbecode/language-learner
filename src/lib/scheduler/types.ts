export type Grade = 'again' | 'hard' | 'good' | 'easy'

/** A word with no entry in Progress.cards is new; there is no 'new' status. */
export type CardStatus = 'learning' | 'review'

export type CardState = {
  wordId: string
  status: CardStatus
  /** 0-based index into the learning steps; meaningless once status is 'review'. */
  learningStep: number
  /** Days until the next review; 0 while learning. */
  intervalDays: number
  ease: number
  /** ISO 8601 timestamp, or null while learning. */
  due: string | null
  reps: number
  lapses: number
}
