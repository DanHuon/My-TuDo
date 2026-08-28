'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Task, Tag } from '@/app/lib/types'
import { useAuth } from '@/app/lib/AuthContext'
import { useSync } from '@/app/lib/useSync'
import { usePWAInstall } from '@/app/lib/usePWAInstall'
import { 
  getTasks, getTags, addTask, editTask, deleteTask, 
  toggleTask, addTag, editTag, deleteTag, toggleTaskTag 
} from '@/app/lib/db'
import TaskForm from './TaskForm'
import TaskList from './TaskList'
import TagForm from './TagForm'
import TagList from './TagList'
import KanbanTemporal from './KanbanTemporal'
import KanbanCategorico from './KanbanCategorico'
import EventList from './EventList'
import Sidebar, { ActiveModule } from './Sidebar'
import Settings from './Settings'
import MemoryList from './MemoryList'
import EntertainmentList from './EntertainmentList'
import CalendarModule from './CalendarModule'
import styles from './TodoApp.module.css'

import { useCalendarSync } from '@/app/lib/useCalendarSync'

type Filter = 'all' | 'active' | 'completed'
type ViewMode = 'tasks' | 'tags' | 'kanban-temporal' | 'kanban-categorico' | 'events'

export default function TodoApp() {
  const router = useRouter()
  const { session, logout } = useAuth()
  const { sync, isSyncing, lastSync } = useSync(session?.accessToken)
  const calendarSync = useCalendarSync(session?.accessToken)
  const { isInstallable, promptInstall } = usePWAInstall()
  
  // Use Dexie live queries
  const tasks = useLiveQuery(() => getTasks()) || []
  const tags = useLiveQuery(() => getTags()) || []
  
  const [filter, setFilter] = useState<Filter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('tasks')
  const [activeModule, setActiveModule] = useState<ActiveModule>('tasks')
  const [autoTagEnabled, setAutoTagEnabled] = useState(false)
  const [toast, setToast] = useState<{ message: string; onUndo: () => void } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('auto-tag-new-tasks')
    if (saved !== null) {
      setAutoTagEnabled(saved === 'true')
    }
  }, [])

  const handleAutoTagToggle = (checked: boolean) => {
    setAutoTagEnabled(checked)
    localStorage.setItem('auto-tag-new-tasks', String(checked))
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const handleMoveTask = async (taskId: string, targetColumn: 'scheduled' | 'backlog' | 'completed') => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    let newCompleted = task.completed
    let newDueDate = task.dueDate

    if (targetColumn === 'completed') {
      newCompleted = true
    } else if (targetColumn === 'backlog') {
      newCompleted = false
      newDueDate = null
    } else if (targetColumn === 'scheduled') {
      newCompleted = false
    }

    await editTask(taskId, task.title, task.description || '', newDueDate || undefined)
    if (task.completed !== newCompleted) {
      await toggleTask(taskId)
    }

    if (targetColumn === 'backlog' && task.dueDate !== null) {
      const originalDueDate = task.dueDate
      const originalCompleted = task.completed
      setToast({
        message: `Prazo da tarefa "${task.title}" removido`,
        onUndo: async () => {
          await editTask(taskId, task.title, task.description || '', originalDueDate || undefined)
          if (originalCompleted !== newCompleted) await toggleTask(taskId)
          setToast(null)
        }
      })
      setTimeout(() => {
        setToast(prev => prev?.message.includes(`"${task.title}"`) ? null : prev)
      }, 5000)
    }
  }

  const handleUpdateDueDate = async (taskId: string, newDueDate: string | null) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const isoDate = newDueDate ? new Date(newDueDate).toISOString() : null
    await editTask(taskId, task.title, task.description || '', isoDate || undefined)
    if (task.completed) {
      await toggleTask(taskId)
    }
  }

  const handleCategoricalAddTag = async (taskId: string, tagId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const hasTag = task.tags?.some(t => t.id === tagId)
    if (!hasTag) await toggleTaskTag(taskId, tagId)
  }

  const handleCategoricalRemoveTag = async (taskId: string, tagId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const hasTag = task.tags?.some(t => t.id === tagId)
    if (hasTag) await toggleTaskTag(taskId, tagId)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const isTaskCompleted = (t: Task) => {
    if (t.rrule) return t.completedDates?.includes(todayStr) || false
    return t.completed
  }

  const filteredTasks = tasks.filter(t => {
    const done = isTaskCompleted(t)
    if (filter === 'active') return !done
    if (filter === 'completed') return done
    return true
  })

  const counts = {
    all: tasks.length,
    active: tasks.filter(t => !isTaskCompleted(t)).length,
    completed: tasks.filter(t => isTaskCompleted(t)).length,
  }

  return (
    <div className={styles.root}>
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      
      <div className={styles.mainWrapper}>
        <header className={`${styles.header} ${activeModule === 'calendar' ? styles.hideMobileCalendar : ''}`}>
          <div className={styles.headerInner}>
            <div className={styles.headerMeta}>
              {activeModule === 'tasks' && (
                <span className={styles.metaLabel}>
                  {counts.active === 0 && counts.all > 0
                    ? 'tudo feito'
                    : `${counts.active} pendente${counts.active !== 1 ? 's' : ''}`}
                </span>
              )}
              
              {isInstallable && (
                <button 
                  onClick={promptInstall} 
                  className={styles.logoutBtn}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#34A853', color: 'white' }}
                  title="Instalar App no dispositivo"
                >
                  📲 Instalar App
                </button>
              )}

              <button 
                onClick={() => {
                  if (!isSyncing) {
                    setTimeout(() => sync(false), 0)
                  }
                }} 
                disabled={isSyncing}
                className={styles.logoutBtn}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Sincronizar com Google Drive"
              >
                {isSyncing ? 'Sincronizando...' : '☁️ Sync'}
              </button>
              <span className={styles.userInfo}>{session?.user?.name}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Sair
              </button>
            </div>
          </div>
          <div className={styles.headerRule} />
        </header>

        {activeModule === 'tasks' && (
          <main className={styles.main}>
            <aside className={styles.subSidebar}>
              <div className={styles.subSidebarSticky}>
                <div className={styles.sidebarSection}>
                  <h2 className={styles.sectionLabel}>Visualizações</h2>
                  <nav className={styles.filters}>
                    <button
                      onClick={() => setViewMode('tasks')}
                      className={`${styles.filterBtn} ${viewMode === 'tasks' ? styles.filterBtnActive : ''}`}
                    >
                      <span className={styles.filterLabel}>Lista de Tarefas</span>
                    </button>
                    <button
                      onClick={() => setViewMode('events')}
                      className={`${styles.filterBtn} ${viewMode === 'events' ? styles.filterBtnActive : ''}`}
                    >
                      <span className={styles.filterLabel}>Lista de Eventos</span>
                    </button>
                    <button
                      onClick={() => setViewMode('kanban-temporal')}
                      className={`${styles.filterBtn} ${viewMode === 'kanban-temporal' ? styles.filterBtnActive : ''}`}
                    >
                      <span className={styles.filterLabel}>Kanban Prazos</span>
                    </button>
                    <button
                      onClick={() => setViewMode('kanban-categorico')}
                      className={`${styles.filterBtn} ${viewMode === 'kanban-categorico' ? styles.filterBtnActive : ''}`}
                    >
                      <span className={styles.filterLabel}>Kanban Tags</span>
                    </button>
                    <button
                      onClick={() => setViewMode('tags')}
                      className={`${styles.filterBtn} ${viewMode === 'tags' ? styles.filterBtnActive : ''}`}
                    >
                      <span className={styles.filterLabel}>Gerenciar Tags</span>
                    </button>
                  </nav>
                </div>

            {(viewMode === 'tasks' || viewMode === 'events') && (
              <div className={styles.sidebarSection}>
                <h2 className={styles.sectionLabel}>Nova Tarefa / Evento</h2>
                <TaskForm 
                  onAdd={addTask} 
                  onAddEvent={calendarSync.pushEventToGoogleCalendar}
                  calendars={calendarSync.calendars}
                />
              </div>
            )}

            {viewMode === 'tags' && (
              <div className={styles.sidebarSection}>
                <h2 className={styles.sectionLabel}>Nova Tag</h2>
                <TagForm onAdd={addTag} />
              </div>
            )}

            {viewMode === 'tasks' && (
              <div className={styles.sidebarSection}>
                <h2 className={styles.sectionLabel}>Filtrar Tarefas</h2>
                <nav className={styles.filters}>
                  {(['all', 'active', 'completed'] as Filter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                    >
                      <span className={styles.filterLabel}>
                        {f === 'all' ? 'Todas' : f === 'active' ? 'Pendentes' : 'Concluídas'}
                      </span>
                      <span className={styles.filterCount}>{counts[f] || 0}</span>
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {viewMode === 'tasks' && (
              <div className={styles.sidebarSection}>
                <h2 className={styles.sectionLabel}>Preferências</h2>
                <label className={styles.autoTagToggle}>
                  <input
                    type="checkbox"
                    className={styles.autoTagCheckbox}
                    checked={autoTagEnabled}
                    onChange={(e) => handleAutoTagToggle(e.target.checked)}
                  />
                  <span className={styles.autoTagLabel}>Vincular tags automaticamente (IA)</span>
                </label>
              </div>
            )}

            {counts.completed > 0 && viewMode === 'tasks' && (
              <div className={styles.sidebarSection}>
                <button
                  className={styles.clearBtn}
                  onClick={async () => {
                    const completed = tasks.filter(t => t.completed)
                    for (const t of completed) {
                      await deleteTask(t.id)
                    }
                  }}
                >
                  Limpar concluídas
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className={styles.content}>
          {viewMode === 'events' ? (
            <EventList calendars={calendarSync.calendars} onAddEvent={calendarSync.pushEventToGoogleCalendar} />
          ) : viewMode === 'tags' ? (
            <TagList tags={tags} onEdit={editTag} onDelete={deleteTag} />
          ) : viewMode === 'kanban-temporal' ? (
            <KanbanTemporal
              tasks={tasks}
              onMoveTask={handleMoveTask}
              onUpdateDueDate={handleUpdateDueDate}
            />
          ) : viewMode === 'kanban-categorico' ? (
            <KanbanCategorico
              tasks={tasks}
              tags={tags}
              onAddTagToTask={handleCategoricalAddTag}
              onRemoveTagFromTask={handleCategoricalRemoveTag}
            />
          ) : (
            <TaskList
              tasks={filteredTasks}
              filter={filter}
              tags={tags}
              onToggle={toggleTask}
              onEdit={editTask}
              onDelete={deleteTask}
              onRefresh={() => {}} 
            />
          )}
        </section>
      </main>
      )}

      {activeModule === 'settings' && (
        <div className={styles.mainFull}>
          <Settings />
        </div>
      )}

      {activeModule === 'memories' && (
        <div className={styles.mainFull}>
          <MemoryList />
        </div>
      )}

      {activeModule === 'entertainment' && (
        <div className={styles.mainFull}>
          <EntertainmentList />
        </div>
      )}

      {activeModule === 'calendar' && (
        <div className={styles.calendarFull}>
          <CalendarModule />
        </div>
      )}

      {activeModule === 'studies' && (
        <div className={styles.mainFull}>
          <h1 style={{ marginTop: '2rem', fontFamily: 'Cormorant Garamond', fontSize: '2.5rem', color: 'var(--ink)' }}>
            Em breve...
          </h1>
          <p style={{ color: 'var(--ink-muted)', marginTop: '1rem' }}>
            Este módulo está em desenvolvimento e estará disponível na próxima atualização.
          </p>
        </div>
      )}

      {toast && (
        <div className={styles.toastContainer}>
          <span>{toast.message}</span>
          <button onClick={toast.onUndo} className={styles.toastUndoBtn}>Desfazer</button>
        </div>
      )}

      <footer className={`${styles.footer} ${activeModule === 'calendar' ? styles.hideMobileCalendar : ''}`}>
        <div className={styles.footerRule} />
        <div className={styles.footerInner}>
          <span>Tarefas - {new Date().getFullYear()}</span>
          <span>Dexie (IndexedDB) | Next.js (Local-First)</span>
        </div>
      </footer>
      </div>
    </div>
  )
}
