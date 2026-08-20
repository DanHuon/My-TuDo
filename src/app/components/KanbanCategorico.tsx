'use client'

import { useState } from 'react'
import { Task, Tag } from '@/app/lib/types'
import { formatDate } from '@/app/lib/formatDate'
import styles from './Kanban.module.css'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core'

interface Props {
  tasks: Task[]
  tags: Tag[]
  onAddTagToTask: (taskId: string, tagId: string) => void
  onRemoveTagFromTask: (taskId: string, tagId: string) => void
}

function DraggableCategoricoCard({ task, onClick, onRemoveTagFromTask }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `categorico-${task.id}`,
    data: { task }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  } : undefined

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${styles.card} ${task.completed ? styles.cardCompleted : ''}`}
      onClick={onClick}
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
            {task.tags.map((t: any) => (
              <span key={t.id} className={styles.badge}>
                {t.name}
                <button 
                  className={styles.badgeRemove}
                  onPointerDown={(e) => e.stopPropagation()}
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
  )
}

function DroppableCategoricoColumn({ id, title, count, children }: any) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnDraggingOver : ''}`}
      style={{ flex: '0 0 300px' }}
    >
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}># {title}</span>
        <span className={styles.columnCount}>{count}</span>
      </div>
      <div className={styles.taskList}>
        {children}
        {count === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '4px', padding: '2rem', textAlign: 'center', minHeight: '120px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', fontFamily: 'DM Mono' }}>Arrastar tarefa para adicionar esta tag</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanCategorico({ tasks, tags, onAddTagToTask, onRemoveTagFromTask }: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const getTasksForTag = (tagId: string) => {
    return tasks.filter(t => t.tags?.some(tag => tag.id === tagId))
  }

  const sortedTags = [...tags].sort((a, b) => {
    const countA = getTasksForTag(a.id).length
    const countB = getTasksForTag(b.id).length
    return countB - countA
  })

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveTask(active.data.current?.task as Task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    
    if (!over) return

    const taskId = (active.id as string).replace('categorico-', '')
    const tagId = over.id as string
    
    // Check if task already has this tag
    const task = tasks.find(t => t.id === taskId)
    if (task && !task.tags?.some(t => t.id === tagId)) {
      onAddTagToTask(taskId, tagId)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.boardCategorico}>
        {sortedTags.map(tag => {
          const tagTasks = getTasksForTag(tag.id)

          return (
            <DroppableCategoricoColumn key={tag.id} id={tag.id} title={tag.name} count={tagTasks.length}>
              {tagTasks.map(task => (
                <DraggableCategoricoCard 
                  key={`${tag.id}-${task.id}`} 
                  task={task} 
                  onClick={() => setSelectedTask(task)}
                  onRemoveTagFromTask={onRemoveTagFromTask}
                />
              ))}
            </DroppableCategoricoColumn>
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
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className={`${styles.card} ${activeTask.completed ? styles.cardCompleted : ''}`} style={{ cursor: 'grabbing', opacity: 0.8, transform: 'scale(1.02)' }}>
            <div className={styles.cardTitle}>{activeTask.title}</div>
            {activeTask.description && <div className={styles.cardDesc}>{activeTask.description}</div>}
          </div>
        ) : null}
      </DragOverlay>

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
    </DndContext>
  )
}
