export type LetterState = 'correct' | 'present' | 'absent'

export interface EvaluatedLetter {
  letter: string
  state: LetterState
}

/**
 * Evaluate a guess against the target using the standard Wordle algorithm:
 * 1. Mark exact matches (correct) first.
 * 2. For remaining letters, mark present if the letter appears in an unmatched
 *    target position; mark absent otherwise.
 * This ensures duplicate letters are handled correctly.
 */
export function evaluate(guess: string, target: string): EvaluatedLetter[] {
  const result: EvaluatedLetter[] = Array.from({ length: guess.length }, (_, i) => ({
    letter: guess[i],
    state: 'absent' as LetterState,
  }))

  // Track which target positions are still unmatched
  const unmatched = Array.from(target)

  // Pass 1: exact matches
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      result[i].state = 'correct'
      unmatched[i] = ''
    }
  }

  // Pass 2: present / absent
  for (let i = 0; i < guess.length; i++) {
    if (result[i].state === 'correct') continue
    const idx = unmatched.indexOf(guess[i])
    if (idx !== -1) {
      result[i].state = 'present'
      unmatched[idx] = ''
    }
  }

  return result
}
