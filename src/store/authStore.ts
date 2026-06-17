import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Username-only auth: email is derived internally and never shown to the user.
function toEmail(username: string) {
  return `${username.toLowerCase().trim()}@letterpanic.game`
}

interface AuthState {
  user: User | null
  username: string | null
  loading: boolean
  init: () => Promise<void>
  signIn: (username: string, password: string) => Promise<string | null>
  signUp: (username: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  username: null,
  loading: true,

  async init() {
    const { data: { session } } = await supabase.auth.getSession()

    async function applySession(userId: string | undefined) {
      if (!userId) { set({ user: null, username: null, loading: false }); return }
      const { data } = await supabase.from('profiles').select('username').eq('id', userId).single()
      set({ username: data?.username ?? null, loading: false })
    }

    set({ user: session?.user ?? null })
    await applySession(session?.user?.id)

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      set({ user: newSession?.user ?? null })
      if (newSession?.user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', newSession.user.id).single()
        set({ username: data?.username ?? null })
      } else {
        set({ username: null })
      }
    })
  },

  async signIn(username, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    })
    return error?.message ?? null
  },

  async signUp(username, password) {
    if (username.length < 3) return 'Username must be at least 3 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Letters, numbers, and underscores only'

    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', username).maybeSingle()
    if (existing) return 'Username already taken'

    const { data, error } = await supabase.auth.signUp({
      email: toEmail(username),
      password,
      options: { emailRedirectTo: undefined },
    })
    if (error) return error.message
    if (!data.user) return 'Failed to create account'

    const { error: profileError } = await supabase
      .from('profiles').insert({ id: data.user.id, username })
    if (profileError) return profileError.message

    set({ username })
    return null
  },

  async signOut() {
    await supabase.auth.signOut()
    set({ user: null, username: null })
  },
}))
