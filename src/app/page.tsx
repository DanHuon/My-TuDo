'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/AuthContext'
import TodoApp from './components/TodoApp'
import AdminDashboard from './admin/dashboard/page'

export default function Home() {
  const router = useRouter()
  const { session, loading, isAdmin } = useAuth()

  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/login')
    }
  }, [session, loading, router])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: 'var(--ink-muted)' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return isAdmin ? <AdminDashboard /> : <TodoApp />
}
