'use client'

import { useState } from 'react'
import { Task } from '@/app/lib/types'
import { formatDate } from '@/app/lib/formatDate'
import styles from './Kanban.module.css'

interface Props {
  tasks: Task[]
  onMoveTask: (taskId: string, targetColumn: 'scheduled' | 'backlog' | 'completed') => void
  onUpdateDueDate: (taskId: string, dueDate: string | null) => Promise<void>
}

export default function KanbanTemporal({ tasks, onMoveTask, onUpdateDueDate }: Props) {
  const [dragOverCol, setDragOverCol] = useState<'scheduled' | 'backlog' | 'completed' | null>(null)
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null)
  const [tempDueDate, setTempDueDate] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(task.dueDate)
    return due < today
  }

  // Filter & Sort Columns
  const scheduledTasks = tasks
    .filter(t => (t.dueDate || schedulingTaskId === t.id) && !(t.completed && schedulingTaskId !== t.id))
    .sort((a, b) => {
      const overA = isOverdue(a)
      const overB = isOverdue(b)
      if (overA && !overB) return -1
      if (!overA && overB) return 1
      const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Date.now()
      const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Date.now()
      return timeA - timeB
    })

  const backlogTasks = tasks
    .filter(t => !t.dueDate && schedulingTaskId !== t.id && !t.completed)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const completedTasks = tasks
    .filter(t => t.completed && schedulingTaskId !== t.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, col: 'scheduled' | 'backlog' | 'completed') => {
    e.preventDefault()
    setDragOverCol(col)
  }

  const handleDragLeave = () => {
    setDragOverCol(null)
  }

  const handleDrop = (e: React.DragEvent, col: 'scheduled' | 'backlog' | 'completed') => {
    e.preventDefault()
    setDragOverCol(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // If dropped in the column it's already in, do nothing
    const currentCol = task.completed ? 'completed' : task.dueDate ? 'scheduled' : 'backlog'
    if (currentCol === col) return

    if (col === 'scheduled') {
      // Começar o agendamento localmente sem mover imediatamente na API (prazo está nulo)
      setSchedulingTaskId(taskId)
      setTempDueDate(task.dueDate ? formatDate(task.dueDate, 'input') : new Date().toISOString().split('T')[0])
    } else {
      onMoveTask(taskId, col)
    }
  }

  const handleConfirmSchedule = async (taskId: string) => {
    if (!tempDueDate) return
    await onUpdateDueDate(taskId, tempDueDate)
    setSchedulingTaskId(null)
  }

  return (
    <div className={styles.boardTemporal}>
      {/* COLUMN 1: COM PRAZO */}
      <div 
        className={`${styles.column} ${dragOverCol === 'scheduled' ? styles.columnDraggingOver : ''}`}
        onDragOver={(e) => handleDragOver(e, 'scheduled')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'scheduled')}
      >
        <div className={styles.columnHeader}>
          <span className={styles.columnTitle}>Com Prazo (Agendadas)</span>
          <span className={styles.columnCount}>{scheduledTasks.length}</span>
        </div>
        <div className={styles.taskList}>
          {scheduledTasks.map(task => (
            <div 
              key={task.id}
              draggable={schedulingTaskId !== task.id}
              onDragStart={(e) => handleDragStart(e, task.id)}
              className={`${styles.card} ${isOverdue(task) ? styles.cardOverdue : ''}`}
              onClick={() => schedulingTaskId !== task.id && setSelectedTask(task)}
            >
              {isOverdue(task) && <span className={styles.overdueTag}>Atrasado</span>}
              <div className={styles.cardTitle}>{task.title}</div>
              {task.description && <div className={styles.cardDesc}>{task.description}</div>}
              
              {schedulingTaskId === task.id ? (
                <div className={styles.schedulingBox} onClick={(e) => e.stopPropagation()}>
                  <span className={styles.schedulingTitle}>Agendar Prazo:</span>
                  <input 
                    type="date"
                    value={tempDueDate}
                    onChange={(e) => setTempDueDate(e.target.value)}
                    className={styles.schedulingInput}
                  />
                  <div className={styles.schedulingActions}>
                    <button onClick={() => handleConfirmSchedule(task.id)} className={styles.schedulingConfirm}>Salvar</button>
                    <button onClick={() => setSchedulingTaskId(null)} className={styles.schedulingCancel}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className={styles.cardFooter}>
                  <div className={styles.cardDates}>
                    <span className={styles.cardDate}>Prazo: {formatDate(task.dueDate, 'display')}</span>
                  </div>
                  {task.tags && task.tags.length > 0 && (
                    <div className={styles.cardBadges}>
                      {task.tags.map(tag => (
                        <span key={tag.id} className={styles.badge}>{tag.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 2: SEM PRAZO */}
      <div 
        className={`${styles.column} ${dragOverCol === 'backlog' ? styles.columnDraggingOver : ''}`}
        onDragOver={(e) => handleDragOver(e, 'backlog')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'backlog')}
      >
        <div className={styles.columnHeader}>
          <span className={styles.columnTitle}>Sem Prazo (Backlog)</span>
          <span className={styles.columnCount}>{backlogTasks.length}</span>
        </div>
        <div className={styles.taskList}>
          {backlogTasks.map(task => (
            <div 
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              className={styles.card}
              onClick={() => setSelectedTask(task)}
            >
              <div className={styles.cardTitle}>{task.title}</div>
              {task.description && <div className={styles.cardDesc}>{task.description}</div>}
              <div className={styles.cardFooter}>
                <div className={styles.cardDates}>
                  <span className={styles.cardDate}>Criado em: {formatDate(task.createdAt, 'display')}</span>
                </div>
                {task.tags && task.tags.length > 0 && (
                  <div className={styles.cardBadges}>
                    {task.tags.map(tag => (
                      <span key={tag.id} className={styles.badge}>{tag.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 3: COMPLETAS */}
      <div 
        className={`${styles.column} ${dragOverCol === 'completed' ? styles.columnDraggingOver : ''}`}
        onDragOver={(e) => handleDragOver(e, 'completed')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'completed')}
      >
        <div className={styles.columnHeader}>
          <span className={styles.columnTitle}>Completas (Histórico)</span>
          <span className={styles.columnCount}>{completedTasks.length}</span>
        </div>
        <div className={styles.taskList}>
          {completedTasks.map(task => (
            <div 
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              className={`${styles.card} ${styles.cardCompleted}`}
              onClick={() => setSelectedTask(task)}
            >
              <div className={styles.cardTitle}>{task.title}</div>
              {task.description && <div className={styles.cardDesc}>{task.description}</div>}
              <div className={styles.cardFooter}>
                <div className={styles.cardDates}>
                  <span className={styles.cardDate}>Concluída em: {formatDate(task.updatedAt, 'display')}</span>
                </div>
                {task.tags && task.tags.length > 0 && (
                  <div className={styles.cardBadges}>
                    {task.tags.map(tag => (
                      <span key={tag.id} className={styles.badge}>{tag.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de visualização da tarefa */}
      {selectedTask && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26, 23, 20, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} 
          onClick={() => setSelectedTask(null)}
        >
          <div 
            style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '6px', minWidth: '320px', maxWidth: '500px', border: '1px solid var(--border-dark)', boxShadow: 'var(--shadow)', animation: 'editOpen 0.2s ease' }} 
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--ink)', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>{selectedTask.title}</h3>
            <p style={{ fontSize: '0.85rem', margin: '0 0 16px 0', color: 'var(--ink-muted)', lineHeight: '1.6', fontFamily: "'DM Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedTask.description || 'Sem descrição'}</p>
            <div style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>CRIADO EM: {formatDate(selectedTask.createdAt, 'display')}</span>
              {selectedTask.dueDate && <span>PRAZO DE CONCLUSÃO: {formatDate(selectedTask.dueDate, 'display')}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                STATUS: 
                <span style={{ 
                  color: selectedTask.completed ? 'var(--success)' : 'var(--accent)', 
                  background: selectedTask.completed ? 'var(--success-soft)' : 'var(--accent-soft)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  fontSize: '0.55rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}>{selectedTask.completed ? 'Concluída' : 'Pendente'}</span>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setSelectedTask(null)} 
                style={{ 
                  padding: '0.45rem 0.9rem', 
                  cursor: 'pointer', 
                  background: 'none', 
                  border: '1px solid var(--border)', 
                  borderRadius: '3px', 
                  color: 'var(--ink-muted)',
                  fontSize: '0.68rem',
                  fontFamily: "'DM Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  transition: 'all 0.15s'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
