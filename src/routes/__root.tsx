import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { init, user, username, signOut } = useAuthStore()

  useEffect(() => { init() }, [])

  return (
    <div className="app">
      <div className="grid-floor" aria-hidden="true" />
      <header className="header">
        <nav className="header__left">
          {user && (
            <Link to="/leaderboard" className="nav-icon-btn" title="Leaderboard">
              ▦
            </Link>
          )}
        </nav>

        <div className="header__center">
          <span className="header__star" aria-hidden="true">★</span>
          <Link to="/" className="header__title-link">
            <h1 className="header__title">LETTER PANIC</h1>
          </Link>
          <span className="header__star" aria-hidden="true">★</span>
        </div>

        <nav className="header__right">
          {user && (
            <>
              <span className="nav-username">{username}</span>
              <button className="nav-icon-btn" onClick={() => signOut()} title="Sign out">✕</button>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
