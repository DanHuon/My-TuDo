'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/lib/AuthContext'
import { useSync } from '@/app/lib/useSync'
import styles from './Settings.module.css'

export default function Settings() {
  const { session } = useAuth()
  const { sync, isSyncing, lastSync } = useSync(session?.accessToken)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    const saved = localStorage.getItem('mytudo-theme')
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
    } else {
      setTheme('system')
    }
  }, [])

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    
    if (newTheme === 'system') {
      localStorage.removeItem('mytudo-theme')
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    } else {
      localStorage.setItem('mytudo-theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Configurações</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎨 Aparência</h2>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Tema do Aplicativo</span>
            <span className={styles.settingDesc}>Escolha entre modo claro, escuro ou siga o sistema.</span>
          </div>
          <div className={styles.themeSelector}>
            <button 
              className={`${styles.themeBtn} ${theme === 'light' ? styles.themeBtnActive : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              Claro
            </button>
            <button 
              className={`${styles.themeBtn} ${theme === 'dark' ? styles.themeBtnActive : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              Escuro
            </button>
            <button 
              className={`${styles.themeBtn} ${theme === 'system' ? styles.themeBtnActive : ''}`}
              onClick={() => handleThemeChange('system')}
            >
              Sistema
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>☁️ Sincronização & Nuvem</h2>
        
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Google Drive Sync</span>
            <span className={styles.settingDesc}>
              Última sincronização: {lastSync ? new Date(lastSync).toLocaleString() : 'Nunca'}
            </span>
            <span className={styles.settingDesc} style={{ color: 'var(--ink-muted)' }}>
              Arquivo ativo: {process.env.NEXT_PUBLIC_SYNC_FILE_NAME || 'sync.json'}
            </span>
          </div>
          <button 
            className={styles.syncBtn} 
            onClick={() => sync(false)} 
            disabled={isSyncing}
          >
            {isSyncing ? 'Sincronizando...' : 'Forçar Sincronização'}
          </button>
        </div>
        
        {/* Placeholder for Storage Quota in the future */}
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Armazenamento do Drive</span>
            <span className={styles.settingDesc}>
              Em breve: Visualização de uso de cota do Google Drive.
            </span>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.dangerZone}`}>
        <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>⚠️ Zona de Perigo</h2>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Limpar Cache Local</span>
            <span className={styles.settingDesc}>
              Apaga todos os dados locais do IndexedDB. Eles serão restaurados da nuvem no próximo Sync.
            </span>
          </div>
          <button 
            className={styles.dangerBtn}
            onClick={() => {
              if (confirm('Tem certeza? Isso apagará o banco local (IndexedDB) e recarregará a página.')) {
                indexedDB.deleteDatabase('MyTuDoDB')
                window.location.reload()
              }
            }}
          >
            Apagar IndexedDB
          </button>
        </div>
      </section>

    </div>
  )
}
