import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getLeaderboard } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const { username } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    staleTime: 60_000,
  })

  return (
    <div className="lb-page">
      <div className="lb-card">
        <Link to="/" className="lb-back">← BACK</Link>
        <h2 className="lb-title">★ TOP PLAYERS ★</h2>

        {isLoading && <p className="lb-loading">LOADING...</p>}

        {!isLoading && data && (
          <div className="lb-table">
            <div className="lb-header-row">
              <span>#</span>
              <span>PLAYER</span>
              <span>WINS</span>
              <span>WIN%</span>
            </div>
            {data.length === 0 && (
              <p className="lb-empty">No scores yet. Be the first!</p>
            )}
            {data.map((entry, i) => (
              <div
                key={entry.username}
                className={`lb-row${entry.username === username ? ' lb-row--me' : ''}`}
              >
                <span className="lb-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span className="lb-name">{entry.username}</span>
                <span className="lb-wins">{entry.wins}</span>
                <span className="lb-pct">{entry.win_pct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
