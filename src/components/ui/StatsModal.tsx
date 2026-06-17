import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Stats } from '../../lib/supabase'

interface Props {
  stats: Stats
  won: boolean
  word: string
  onClose: () => void
}

function getTimeUntilMidnight() {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function StatsModal({ stats, won, word, onClose }: Props) {
  const [countdown, setCountdown] = useState(getTimeUntilMidnight)
  const maxBar = Math.max(...stats.distribution, 1)

  useEffect(() => {
    const id = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="stats-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={e => e.stopPropagation()}>
        <button className="stats-close" onClick={onClose}>✕</button>

        <div className={`stats-result ${won ? 'stats-result--won' : 'stats-result--lost'}`}>
          {won ? '★ YOU WIN ★' : 'GAME OVER'}
        </div>
        {!won && <p className="stats-word">WORD: {word.toUpperCase()}</p>}

        <div className="stats-grid">
          <div className="stats-item">
            <span className="stats-num">{stats.played}</span>
            <span className="stats-label">PLAYED</span>
          </div>
          <div className="stats-item">
            <span className="stats-num">{stats.winPct}%</span>
            <span className="stats-label">WIN RATE</span>
          </div>
          <div className="stats-item">
            <span className="stats-num">{stats.currentStreak}</span>
            <span className="stats-label">STREAK</span>
          </div>
          <div className="stats-item">
            <span className="stats-num">{stats.maxStreak}</span>
            <span className="stats-label">BEST</span>
          </div>
        </div>

        <div className="stats-dist">
          <p className="stats-dist-title">GUESS DISTRIBUTION</p>
          {stats.distribution.map((count, i) => (
            <div key={i} className="dist-row">
              <span className="dist-label">{i + 1}</span>
              <div className="dist-track">
                <div
                  className="dist-fill"
                  style={{ width: `${Math.round((count / maxBar) * 100)}%` }}
                >
                  {count > 0 && <span>{count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="stats-next">
          <span className="stats-next-label">NEXT WORD IN</span>
          <span className="stats-countdown">{countdown}</span>
        </div>

        <Link to="/leaderboard" className="stats-lb-btn">VIEW LEADERBOARD →</Link>
      </div>
    </div>
  )
}
