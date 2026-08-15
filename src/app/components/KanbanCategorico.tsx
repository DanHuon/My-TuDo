'use client'

import { useState } from 'react'
import { Task, Tag } from '@/app/lib/types'
import { formatDate } from '@/app/lib/formatDate'
import styles from './Kanban.module.css'

interface Props {
  tasks: Task[]
  tags: Tag[]
  onAddTagToTask: (taskId: string, tagId: string) => void
  onRemoveTagFromTask: (taskId: string, tagId: string) => void
}

export default function KanbanCategorico({ tasks, tags, onAddTagToTask, onRemoveTagFromTask }: Props) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Get tasks matching a specific tag
  const getTasksForTag = (tagId: string) => {
    return tasks.filter(t => t.tags?.some(tag => tag.id === tagId))
  }

  // Sort columns: largest density of tasks first
  const sortedTags = [...tags].sort((a, b) => {
    const countA = getTasksForTag(a.id).length
    const countB = getTasksForTag(b.id).length
    return countB - countA
  })

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent, tagId: string) => {
    e.preventDefault()
    setDragOverCol(tagId)
  }

  const handleDragLeave = () => {
    setDragOverCol(null)
  }

  const handleDrop = (e: React.DragEvent, tagId: string) => {
    e.preventDefault()
    setDragOverCol(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    onAddTagToTask(taskId, tagId)
  }

  return (
    <div className={styles.boardCategorico}>
      {sortedTags.map(tag => {
        const tagTasks = getTasksForTag(tag.id)
        const isDraggingOver = dragOverCol === tag.id

        return (
          <div 
            key={tag.id}
            className={`${styles.column} ${isDraggingOver ? styles.columnDraggingOver : ''}`}
            style={{ flex: '0 0 300px' }} // dynamic width columns
            onDragOver={(e) => handleDragOver(e, tag.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, tag.id)}
          >
            <div className={styles.columnHeader}>
              <span className={styles.columnTitle}># {tag.name}</span>
              <span className={styles.columnCount}>{tagTasks.length}</span>
            </div>
            
            <div className={styles.taskList}>
              {tagTasks.map(task => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className={`${styles.card} ${task.completed ? styles.cardCompleted : ''}`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className={styles.cardTitle}>{task.title}</div>
                  {task.description && <div className={styles.cardDesc}>{task.description}</div>}
                  
                  <div className={styles.cardFooter}>
                    {task.dueDate && (
                      <div className={styles.cardDates}>
                        <span className={styles.cardDate}>Prazo: {formatDate(task.dueDate, 'display')}</span>
                      </div>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className={styles.cardBadges}>
                        {task.tags.map(t => (
                          <span key={t.id} className={styles.badge}>
                            {t.name}
                            <button 
                              className={styles.badgeRemove}
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemoveTagFromTask(task.id, t.id)
                              }}
                              title="Remover tag"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {tagTasks.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '4px', padding: '2rem', textAlign: 'center', minHeight: '120px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', fontFamily: 'DM Mono' }}>Arrastar tarefa para adicionar esta tag</span>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {sortedTags.length === 0 && (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '6px', padding: '4rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem', fontFamily: 'Cormorant Garamond', fontWeight: 500, color: 'var(--ink)' }}>Nenhuma tag criada</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'DM Mono', color: 'var(--ink-muted)' }}>Crie tags na barra lateral para começar a visualizar as colunas.</span>
          </div>
        </div>
      )}

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
