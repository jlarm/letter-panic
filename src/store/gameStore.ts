import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { evaluate, type EvaluatedLetter } from '../lib/evaluate'
import { MAX_GUESSES, WORD_LENGTH, getTodaysAnswer } from '../lib/words'

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GuessRow {
  word: string
  evaluation: EvaluatedLetter[]
}

interface GameState {
  target: string
  guesses: GuessRow[]
  currentInput: string
  status: GameStatus
  letterStates: Record<string, EvaluatedLetter['state']>
  // actions
  addLetter: (letter: string) => void
  deleteLetter: () => void
  clearInput: () => void
  submitGuess: () => { error?: string }
  resetGame: () => void
}

function buildInitialState() {
  return {
    target: getTodaysAnswer(),
    guesses: [] as GuessRow[],
    currentInput: '',
    status: 'playing' as GameStatus,
    letterStates: {} as Record<string, EvaluatedLetter['state']>,
  }
}

const STATE_PRIORITY: Record<EvaluatedLetter['state'], number> = {
  correct: 2,
  present: 1,
  absent: 0,
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      addLetter(letter) {
        const { currentInput, status } = get()
        if (status !== 'playing' || currentInput.length >= WORD_LENGTH) return
        set({ currentInput: currentInput + letter.toLowerCase() })
      },

      deleteLetter() {
        const { currentInput } = get()
        set({ currentInput: currentInput.slice(0, -1) })
      },

      clearInput() {
        if (get().status !== 'playing') return
        set({ currentInput: '' })
      },

      submitGuess() {
        const { target, guesses, currentInput, status } = get()
        if (status !== 'playing') return {}

        if (currentInput.length !== WORD_LENGTH)
          return { error: 'Not enough letters' }
        const evaluation = evaluate(currentInput, target)
        const newGuess: GuessRow = { word: currentInput, evaluation }
        const newGuesses = [...guesses, newGuess]

        const letterStates = { ...get().letterStates }
        for (const { letter, state } of evaluation) {
          const current = letterStates[letter]
          if (!current || STATE_PRIORITY[state] > STATE_PRIORITY[current]) {
            letterStates[letter] = state
          }
        }

        const won = evaluation.every(l => l.state === 'correct')
        const lost = !won && newGuesses.length >= MAX_GUESSES

        set({
          guesses: newGuesses,
          currentInput: '',
          status: won ? 'won' : lost ? 'lost' : 'playing',
          letterStates,
        })
        return {}
      },

      resetGame() {
        set(buildInitialState())
      },
    }),
    {
      name: 'words-game',
      partialize: (s) => ({
        target: s.target,
        guesses: s.guesses,
        status: s.status,
        letterStates: s.letterStates,
      }),
      onRehydrateStorage: () => (state) => {
        // New day → new game
        if (state && state.target !== getTodaysAnswer()) {
          Object.assign(state, buildInitialState())
        }
      },
    }
  )
)
