import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useCallback, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Board } from '../components/ui/Board'
import { Keyboard } from '../components/ui/Keyboard'
import { StatsModal } from '../components/ui/StatsModal'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import {
  getTodayResult,
  saveResult,
  getUserResults,
  calcStats,
  type GameResult,
  type Stats,
} from '../lib/supabase'
import { evaluate } from '../lib/evaluate'
import { WORD_LENGTH } from '../lib/words'

export const Route = createFileRoute('/')({
  component: GamePage,
})

// ── Already-played view ──────────────────────────────────────────────────────

const STATE_COLORS: Record<string, string> = {
  correct: 'var(--color-correct)',
  present: 'var(--color-present)',
  absent: '#444',
}

function AlreadyPlayed({ result, stats }: { result: GameResult; stats: Stats }) {
  const [countdown, setCountdown] = useState(getCountdown)

  function getCountdown() {
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const diff = midnight.getTime() - Date.now()
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="already-played">
      <p className={`already-status ${result.won ? 'already-status--won' : 'already-status--lost'}`}>
        {result.won ? '★ YOU WON TODAY ★' : 'YOU LOST TODAY'}
      </p>

      <div className="already-board">
        {result.guess_words.map((word, ri) => {
          const ev = evaluate(word, result.word)
          return (
            <div key={ri} className="already-row">
              {Array.from({ length: WORD_LENGTH }, (_, ci) => (
                <div
                  key={ci}
                  className="already-tile"
                  style={{ background: STATE_COLORS[ev[ci].state] }}
                >
                  {word[ci].toUpperCase()}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="already-stats">
        <span>{stats.played} played</span>
        <span>{stats.winPct}% win rate</span>
        <span>{stats.currentStreak} streak</span>
      </div>

      <div className="already-countdown">
        <span className="already-countdown-label">NEXT WORD</span>
        <span className="already-countdown-time">{countdown}</span>
      </div>

      <Link to="/leaderboard" className="already-lb-btn">VIEW LEADERBOARD →</Link>
    </div>
  )
}

// ── Game page ────────────────────────────────────────────────────────────────

function GamePage() {
  const { user, username, loading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const { status, currentInput, addLetter, deleteLetter, clearInput, submitGuess, resetGame } = useGameStore()

  const [toast, setToast] = useState<string | null>(null)
  const [shakingRow, setShakingRow] = useState<number | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [savedStats, setSavedStats] = useState<Stats | null>(null)
  const prevStatus = useRef(status)
  const resultSaved = useRef(false)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: '/auth' })
  }, [user, authLoading])

  // Fetch today's result (daily lock)
  const { data: todayResult, isLoading: checkingToday } = useQuery({
    queryKey: ['today-result', user?.id],
    queryFn: () => getTodayResult(user!.id),
    enabled: !!user,
    staleTime: Infinity,
  })

  // Fetch all personal results for stats
  const { data: allResults } = useQuery({
    queryKey: ['user-results', user?.id],
    queryFn: () => getUserResults(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  })

  // Save result + show stats when game ends
  useEffect(() => {
    const justEnded =
      prevStatus.current === 'playing' &&
      (status === 'won' || status === 'lost') &&
      !resultSaved.current

    if (justEnded && user) {
      resultSaved.current = true
      const { guesses, target } = useGameStore.getState()
      saveResult({
        userId: user.id,
        word: target,
        won: status === 'won',
        guessesUsed: guesses.length,
        guessWords: guesses.map(g => g.word),
      }).then(() => {
        getUserResults(user.id).then(results => {
          setSavedStats(calcStats(results))
          setShowStats(true)
        })
      })
    }
    prevStatus.current = status
  }, [status, user])

  const showToast = useCallback((msg: string) => {
    setToast(null)
    requestAnimationFrame(() => requestAnimationFrame(() => setToast(msg)))
    setTimeout(() => setToast(null), 2500)
  }, [])

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'Escape') { clearInput(); return }
      if (key === 'Enter') {
        const result = submitGuess()
        if (result.error) {
          showToast(result.error)
          setShakingRow(useGameStore.getState().guesses.length)
          setTimeout(() => setShakingRow(null), 600)
        }
        return
      }
      if (key === '⌫' || key === 'Backspace') { deleteLetter(); return }
      if (/^[a-zA-Z]$/.test(key)) addLetter(key)
    },
    [submitGuess, deleteLetter, clearInput, addLetter, showToast],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      handleKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  if (authLoading || !user || checkingToday) {
    return <div className="loading-screen">LOADING...</div>
  }

  const stats = savedStats ?? (allResults ? calcStats(allResults) : null)

  // Already played today
  if (todayResult) {
    return (
      <>
        {stats && <AlreadyPlayed result={todayResult} stats={stats} />}
        {!stats && <div className="loading-screen">LOADING...</div>}
      </>
    )
  }

  return (
    <div className="game">
      {toast && <div className="toast" key={toast}>{toast}</div>}

      <div className="instructions">
        <p>Type a 5-letter word, then tap <strong>ENTER</strong> to submit your guess. You have 6 tries.</p>
        <div className="instructions__legend">
          <span className="legend-item"><span className="legend-tile legend-tile--correct" />Correct letter &amp; position</span>
          <span className="legend-item"><span className="legend-tile legend-tile--present" />Right letter, wrong position</span>
          <span className="legend-item"><span className="legend-tile legend-tile--absent" />Not in the word</span>
        </div>
      </div>

      <Board shakingRow={shakingRow} />

      {status !== 'playing' && (
        <p className="game__status">
          {status === 'won' ? '★ YOU WIN ★' : `WORD: ${useGameStore.getState().target.toUpperCase()}`}
        </p>
      )}

      <Keyboard
        onKey={handleKey}
        wordReady={currentInput.length === 5 && status === 'playing'}
      />

      {status !== 'playing' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button className="new-game-btn" onClick={() => stats && setShowStats(true)}>
            STATS
          </button>
          <Link to="/leaderboard" className="new-game-btn" style={{ textDecoration: 'none' }}>
            BOARD
          </Link>
        </div>
      )}

      {showStats && stats && (
        <StatsModal
          stats={stats}
          won={status === 'won'}
          word={useGameStore.getState().target}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}
