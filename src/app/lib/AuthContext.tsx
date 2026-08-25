'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'

export interface AuthSession {
  user: {
    name: string;
    email: string;
    picture?: string;
  };
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface AuthContextType {
  session: AuthSession | null
  loading: boolean
  setSession: (session: AuthSession | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const isRefreshing = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem('authSession')
    if (saved) {
      try {
        const parsed: AuthSession = JSON.parse(saved)
        setSessionState(parsed)
      } catch (e) {
        localStorage.removeItem('authSession')
      }
    }
    setLoading(false)
  }, [])

  const setSession = (newSession: AuthSession | null) => {
    setSessionState(newSession)
    if (newSession) {
      localStorage.setItem('authSession', JSON.stringify(newSession))
    } else {
      localStorage.removeItem('authSession')
    }
  }

  const logout = () => {
    setSession(null)
  }

  // Token refresh logic
  useEffect(() => {
    if (!session || !session.refreshToken || !session.expiresAt) return

    const checkToken = async () => {
      // Refresh 5 minutes before expiration
      const TIME_MARGIN = 5 * 60 * 1000
      const now = Date.now()
      
      if (session.expiresAt! - now < TIME_MARGIN && !isRefreshing.current) {
        isRefreshing.current = true
        try {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: session.refreshToken })
          })

          const data = await res.json()

          if (!res.ok) {
            console.error('Failed to refresh token:', data.error)
            logout()
            return
          }

          setSession({
            ...session,
            accessToken: data.access_token,
            expiresAt: Date.now() + data.expires_in * 1000,
          })
        } catch (error) {
          console.error('Error in refresh loop:', error)
          // Network errors shouldn't necessarily logout, just try again later
        } finally {
          isRefreshing.current = false
        }
      }
    }

    // Check immediately and then every minute
    checkToken()
    const interval = setInterval(checkToken, 60 * 1000)

    return () => clearInterval(interval)
  }, [session]) // Note: depending on session might cause interval reset when session updates (e.g. on refresh), which is desired.

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <AuthContext.Provider value={{ session, loading, setSession, logout }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
