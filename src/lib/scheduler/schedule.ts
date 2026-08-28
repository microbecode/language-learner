import type { CardState, Grade } from './types'

export const LEARNING_STEPS = 2
export const STARTING_EASE = 2.5
export const MIN_EASE = 1.3
export const MAX_INTERVAL_DAYS = 365
const GRADUATED_INTERVAL_DAYS = 1
const EASY_GRADUATED_INTERVAL_DAYS = 4
const MS_PER_DAY = 86_400_000

function clampInterval(days: number): number {
  return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(days)))
}

function clampEase(ease: number): number {
  return Math.max(MIN_EASE, ease)
}

function dueAfter(now: Date, days: number): string {
  return new Date(now.getTime() + days * MS_PER_DAY).toISOString()
}

export function introduceCard(wordId: string): CardState {
  return {
    wordId,
    status: 'learning',
    learningStep: 0,
    intervalDays: 0,
    ease: STARTING_EASE,
    due: null,
    reps: 0,
    lapses: 0,
  }
}

function graduate(state: CardState, now: Date, intervalDays: number, ease: number): CardState {
  return {
    ...state,
    status: 'review',
    learningStep: 0,
    intervalDays,
    ease,
    due: dueAfter(now, intervalDays),
    reps: state.reps + 1,
  }
}

function scheduleLearning(state: CardState, grade: Grade, now: Date): CardState {
  const reps = state.reps + 1

  if (grade === 'easy') {
    return graduate(state, now, EASY_GRADUATED_INTERVAL_DAYS, state.ease)
  }
  if (grade === 'again') {
    return { ...state, learningStep: 0, reps }
  }
  if (grade === 'hard') {
    return { ...state, reps }
  }

  const nextStep = state.learningStep + 1
  if (nextStep >= LEARNING_STEPS) {
    return graduate(state, now, GRADUATED_INTERVAL_DAYS, state.ease)
  }
  return { ...state, learningStep: nextStep, reps }
}

function scheduleReview(state: CardState, grade: Grade, now: Date): CardState {
  const reps = state.reps + 1

  if (grade === 'again') {
    return {
      ...state,
      status: 'learning',
      learningStep: 0,
      intervalDays: 0,
      ease: clampEase(state.ease - 0.2),
      due: null,
      reps,
      lapses: state.lapses + 1,
    }
  }

  if (grade === 'hard') {
    const ease = clampEase(state.ease - 0.15)
    const intervalDays = clampInterval(state.intervalDays * 1.2)
    return { ...state, ease, intervalDays, due: dueAfter(now, intervalDays), reps }
  }

  if (grade === 'easy') {
    const ease = state.ease + 0.15
    const intervalDays = clampInterval(state.intervalDays * ease * 1.3)
    return { ...state, ease, intervalDays, due: dueAfter(now, intervalDays), reps }
  }

  const intervalDays = clampInterval(state.intervalDays * state.ease)
  return { ...state, intervalDays, due: dueAfter(now, intervalDays), reps }
}

/** Pure: takes the current time as an argument and never reads the clock itself. */
export function schedule(state: CardState, grade: Grade, now: Date): CardState {
  return state.status === 'learning'
    ? scheduleLearning(state, grade, now)
    : scheduleReview(state, grade, now)
}
