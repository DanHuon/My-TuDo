import { useState, useEffect } from 'react'
import styles from './Sidebar.module.css'

export type ActiveModule = 'tasks' | 'memories' | 'entertainment' | 'calendar' | 'studies' | 'settings'

interface SidebarProps {
  activeModule: ActiveModule
  onModuleChange: (module: ActiveModule) => void
  isSyncing?: boolean
}

export default function Sidebar({ activeModule, onModuleChange, isSyncing }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  
  // Draggable Hamburger State
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPointerDown, setInitialPointerDown] = useState({ x: 0, y: 0 })

  const clampToViewport = (x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y }
    const maxX = Math.max(8, window.innerWidth - 60)
    const maxY = Math.max(8, window.innerHeight - 60)
    return {
      x: Math.max(8, Math.min(x, maxX)),
      y: Math.max(8, Math.min(y, maxY)),
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const clamped = clampToViewport(prev.x, prev.y)
        if (clamped.x !== prev.x || clamped.y !== prev.y) {
          localStorage.setItem('mytudo-hamburger-pos', JSON.stringify(clamped))
          return clamped
        }
        return prev
      })
    }

    const savedPos = localStorage.getItem('mytudo-hamburger-pos')
    if (savedPos) {
      try {
        const parsed = JSON.parse(savedPos)
        const clamped = clampToViewport(parsed.x, parsed.y)
        setPosition(clamped)
      } catch(e){}
    } else {
      setPosition(clampToViewport(16, window.innerHeight - 80))
    }

    const savedCollapsed = localStorage.getItem('mytudo-sidebar-collapsed')
    if (savedCollapsed) {
      setIsDesktopCollapsed(savedCollapsed === 'true')
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsOpen(prev => !prev)
    } else {
      setIsDesktopCollapsed(prev => {
        const next = !prev
        localStorage.setItem('mytudo-sidebar-collapsed', String(next))
        return next
      })
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(false)
    setInitialPointerDown({ x: e.clientX, y: e.clientY })
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return // only drag on left click/touch
    
    // Check distance to distinguish click vs drag
    const dist = Math.abs(e.clientX - initialPointerDown.x) + Math.abs(e.clientY - initialPointerDown.y)
    if (dist > 5) {
      setIsDragging(true)
    }

    if (!isDragging && dist <= 5) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    setPosition(clampToViewport(newX, newY))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setPosition(prev => {
      const clamped = clampToViewport(prev.x, prev.y)
      localStorage.setItem('mytudo-hamburger-pos', JSON.stringify(clamped))
      return clamped
    })
    // We don't reset isDragging here immediately because onClick fires AFTER pointerup
    // It will be reset on the next pointerdown
    setTimeout(() => setIsDragging(false), 50)
  }

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
        className={`${styles.hamburgerBtn} ${isSyncing ? styles.syncingAnimation : ''}`}
        onClick={() => { if(!isDragging) toggleSidebar() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
        aria-label="Abrir ou recolher menu"
      >
        {isSyncing ? '↻' : '☰'}
      </button>

      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} 
        onClick={() => setIsOpen(false)} 
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${isDesktopCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.logoArea}>
          <span className={styles.logoMark}>@</span>
          <span className={styles.logoText}>MyTuDo</span>
        </div>

        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeModule === 'tasks' ? styles.navItemActive : ''}`}
            onClick={() => handleNavClick('tasks')}
          >
            ✓ Tarefas & Eventos
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
          
          <div className={styles.sidebarFooter}>
            <span>MyTuDo v9.3.0 · Local-First</span>
            <span>Dexie (IndexedDB) · {new Date().getFullYear()}</span>
          </div>
        </div>
      </aside>
    </>
  )
}
