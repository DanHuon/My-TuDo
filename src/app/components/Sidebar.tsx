import { useState, useEffect } from 'react'
import styles from './Sidebar.module.css'

export type ActiveModule = 'tasks' | 'memories' | 'entertainment' | 'calendar' | 'studies' | 'settings'

interface SidebarProps {
  activeModule: ActiveModule
  onModuleChange: (module: ActiveModule) => void
}

export default function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar on module change on mobile
  const handleNavClick = (module: ActiveModule) => {
    onModuleChange(module)
    setIsOpen(false)
  }

  // Prevent scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <button 
        className={styles.hamburgerBtn}
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} 
        onClick={() => setIsOpen(false)} 
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoArea}>
          <span className={styles.logoMark}>@</span>
          <span className={styles.logoText}>MyTuDo</span>
        </div>

        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeModule === 'tasks' ? styles.navItemActive : ''}`}
            onClick={() => handleNavClick('tasks')}
          >
            ✓ Tarefas
          </button>
          
          <button 
            className={`${styles.navItem} ${activeModule === 'calendar' ? styles.navItemActive : ''}`}
            onClick={() => handleNavClick('calendar')}
          >
            📅 Calendário
          </button>

          <button 
            className={`${styles.navItem} ${activeModule === 'memories' ? styles.navItemActive : ''}`}
            onClick={() => handleNavClick('memories')}
          >
            🧠 Memórias
          </button>

          <button 
            className={`${styles.navItem} ${activeModule === 'entertainment' ? styles.navItemActive : ''}`}
            onClick={() => handleNavClick('entertainment')}
          >
            🍿 Entretenimento
          </button>

          <button 
            className={`${styles.navItem} ${activeModule === 'studies' ? styles.navItemActive : ''}`}
            onClick={() => handleNavClick('studies')}
          >
            📚 Estudos & Faculdade
          </button>
        </nav>

        <div className={styles.bottomNav}>
          <button 
            className={`${styles.navItem} ${activeModule === 'settings' ? styles.navItemActive : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            ⚙️ Configurações
          </button>
        </div>
      </aside>
    </>
  )
}
