'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/AuthContext'
import { useGoogleLogin } from '@react-oauth/google'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: async (codeResponse) => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeResponse.code })
        })
        
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to exchange token')

        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        const userInfo = await userRes.json()
        
        setSession({
          user: {
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
          },
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + (data.expires_in * 1000),
        })
        router.push('/')
      } catch (err) {
        console.error(err)
        setError('Falha ao obter o perfil do usuário e validar token.')
      } finally {
        setLoading(false)
      }
    },
    onError: (err) => {
      console.error(err)
      setError('Erro durante o login com o Google.')
    }
  })

  return (
    <div className={styles.root}>
      <div className={styles.decorBg1} />
      <div className={styles.decorBg2} />

      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.logo}>
            <span className={styles.logoDot}>●</span>
            <span className={styles.logoText}>MyTuDo</span>
          </div>
          <h1 className={styles.title}>
            Sincronize sua vida
          </h1>
          <p className={styles.subtitle}>
            Acesse usando a sua conta Google e mantenha tudo salvo no seu Google Drive (App Data). Nenhuma informação é enviada para nós.
          </p>
        </div>

        <div className={styles.form}>
          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorIcon}>⚠</span>
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={() => loginWithGoogle()}
            disabled={loading}
            className={styles.submitButton}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
