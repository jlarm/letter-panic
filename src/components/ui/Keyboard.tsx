import { useGameStore } from '../../store/gameStore'
import type { EvaluatedLetter } from '../../lib/evaluate'

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
]

const STATE_CLASS: Record<EvaluatedLetter['state'], string> = {
  correct: 'key--correct',
  present: 'key--present',
  absent: 'key--absent',
}

interface Props {
  onKey: (key: string) => void
  wordReady?: boolean
}

export function Keyboard({ onKey, wordReady }: Props) {
  const letterStates = useGameStore(s => s.letterStates)

  return (
    <div className="keyboard">
      {ROWS.map((row, i) => (
        <div key={i} className="keyboard__row">
          {row.map(key => {
            const state = letterStates[key.toLowerCase()]
            const isEnter = key === 'Enter'
            return (
              <button
                key={key}
                className={[
                  'key',
                  key.length > 1 ? 'key--wide' : '',
                  state ? STATE_CLASS[state] : '',
                  isEnter && wordReady ? 'key--ready' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onKey(key)}
              >
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
