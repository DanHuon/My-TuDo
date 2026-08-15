'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'

export interface AuthSession {
  user: {
    name: string;
    email: string;
    picture?: string;
  };
  accessToken: string;
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

  useEffect(() => {
    const saved = localStorage.getItem('authSession')
    if (saved) {
      setSessionState(JSON.parse(saved))
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
