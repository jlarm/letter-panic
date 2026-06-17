import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseKey) {
  // Visible in browser DevTools → Console
  console.error(
    '[Letter Panic] Missing env vars — URL:',
    supabaseUrl,
    'KEY:',
    supabaseKey ? '(set)' : '(missing)',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '')

export interface GameResult {
  id: string
  user_id: string
  played_date: string
  word: string
  won: boolean
  guesses_used: number
  guess_words: string[]
  completed_at: string
}

export interface LeaderboardEntry {
  username: string
  wins: number
  played: number
  win_pct: number
}

export interface Stats {
  played: number
  wins: number
  winPct: number
  currentStreak: number
  maxStreak: number
  distribution: number[] // index 0 = guessed in 1, ..., 5 = guessed in 6
}

export async function getTodayResult(userId: string): Promise<GameResult | null> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', userId)
    .eq('played_date', today)
    .maybeSingle()
  return data
}

export async function saveResult(params: {
  userId: string
  word: string
  won: boolean
  guessesUsed: number
  guessWords: string[]
}): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('game_results').insert({
    user_id: params.userId,
    played_date: today,
    word: params.word,
    won: params.won,
    guesses_used: params.guessesUsed,
    guess_words: params.guessWords,
  })
  return error?.message ?? null
}

export async function getUserResults(userId: string): Promise<GameResult[]> {
  const { data } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', userId)
    .order('played_date', { ascending: true })
  return data ?? []
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await supabase.rpc('get_leaderboard')
  return data ?? []
}

export function calcStats(results: GameResult[]): Stats {
  const played = results.length
  const wins = results.filter(r => r.won).length
  const winPct = played > 0 ? Math.round((wins / played) * 100) : 0

  const distribution = Array(6).fill(0)
  for (const r of results) {
    if (r.won && r.guesses_used >= 1 && r.guesses_used <= 6) {
      distribution[r.guesses_used - 1]++
    }
  }

  // Sort ascending by date for streak calculation
  const sorted = [...results].sort(
    (a, b) => new Date(a.played_date).getTime() - new Date(b.played_date).getTime(),
  )

  let maxStreak = 0
  let runStreak = 0
  let lastWonDate: Date | null = null

  for (const r of sorted) {
    const d = new Date(r.played_date)
    d.setHours(0, 0, 0, 0)
    if (r.won) {
      if (lastWonDate === null) {
        runStreak = 1
      } else {
        const diff = Math.round((d.getTime() - lastWonDate.getTime()) / 86_400_000)
        runStreak = diff === 1 ? runStreak + 1 : 1
      }
      maxStreak = Math.max(maxStreak, runStreak)
      lastWonDate = d
    } else {
      runStreak = 0
      lastWonDate = null
    }
  }

  // Current streak only counts if last result was today or yesterday
  let currentStreak = 0
  if (sorted.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const last = sorted[sorted.length - 1]
    const lastDate = new Date(last.played_date)
    lastDate.setHours(0, 0, 0, 0)
    const diff = Math.round((today.getTime() - lastDate.getTime()) / 86_400_000)
    if (diff <= 1) currentStreak = runStreak
  }

  return { played, wins, winPct, currentStreak, maxStreak, distribution }
}
