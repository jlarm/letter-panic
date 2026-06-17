import { useGameStore } from '../../store/gameStore'
import { WORD_LENGTH, MAX_GUESSES } from '../../lib/words'
import type { EvaluatedLetter } from '../../lib/evaluate'

const STATE_CLASS: Record<EvaluatedLetter['state'], string> = {
  correct: 'tile--correct',
  present: 'tile--present',
  absent: 'tile--absent',
}

interface Props {
  shakingRow: number | null
}

export function Board({ shakingRow }: Props) {
  const { guesses, currentInput, status } = useGameStore()
  const currentRow = guesses.length
  const winRowIdx = status === 'won' ? guesses.length - 1 : -1

  return (
    <div className="board">
      {Array.from({ length: MAX_GUESSES }, (_, rowIdx) => {
        const guess = guesses[rowIdx]
        const isActive = rowIdx === currentRow && status === 'playing'
        const isShaking = shakingRow === rowIdx
        const isWinRow = rowIdx === winRowIdx

        return (
          <div key={rowIdx} className={`board__row${isShaking ? ' board__row--shake' : ''}`}>
            {Array.from({ length: WORD_LENGTH }, (_, colIdx) => {
              const letter = guess
                ? guess.word[colIdx]
                : isActive
                ? currentInput[colIdx] ?? ''
                : ''

              const stateClass = guess ? STATE_CLASS[guess.evaluation[colIdx].state] : ''
              const filled = letter !== ''

              // Flip delay: each tile staggers 100ms
              // Bounce delay: starts as soon as that tile's flip finishes
              const flipDelay = colIdx * 0.1
              const bounceDelay = flipDelay + 0.55

              const tileStyle = guess
                ? isWinRow
                  ? {
                      animation: `flip 0.5s ease ${flipDelay}s both, bounce 0.8s ease ${bounceDelay}s both`,
                    }
                  : { animationDelay: `${flipDelay}s` }
                : undefined

              return (
                <div
                  key={colIdx}
                  className={[
                    'tile',
                    stateClass,
                    filled && !guess ? 'tile--filled' : '',
                    guess ? 'tile--revealed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={tileStyle}
                >
                  {letter.toUpperCase()}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
