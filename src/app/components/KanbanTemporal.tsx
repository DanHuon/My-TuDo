'use client'

import { useState } from 'react'
import { Task } from '@/app/lib/types'
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
  onMoveTask: (taskId: string, targetColumn: 'scheduled' | 'backlog' | 'completed') => void
  onUpdateDueDate: (taskId: string, dueDate: string | null) => Promise<void>
}

// Draggable Task Card Component
function DraggableTaskCard({ task, schedulingTaskId, isOverdue, onClick, onSetTempDueDate, tempDueDate, onConfirmSchedule, onCancelSchedule }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: schedulingTaskId === task.id
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
      className={`${styles.card} ${isOverdue ? styles.cardOverdue : ''} ${task.completed ? styles.cardCompleted : ''}`}
      onClick={onClick}
    >
      {isOverdue && <span className={styles.overdueTag}>Atrasado</span>}
      <div className={styles.cardTitle}>{task.title}</div>
      {task.description && <div className={styles.cardDesc}>{task.description}</div>}
      
      {schedulingTaskId === task.id ? (
        <div className={styles.schedulingBox} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          <span className={styles.schedulingTitle}>Agendar Prazo:</span>
          <input 
            type="date"
            value={tempDueDate}
            onChange={(e) => onSetTempDueDate(e.target.value)}
            className={styles.schedulingInput}
          />
          <div className={styles.schedulingActions}>
            <button onClick={() => onConfirmSchedule(task.id)} className={styles.schedulingConfirm}>Salvar</button>
            <button onClick={() => onCancelSchedule()} className={styles.schedulingCancel}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className={styles.cardFooter}>
          <div className={styles.cardDates}>
            {task.completed ? (
              <span className={styles.cardDate}>Concluída em: {formatDate(task.updatedAt, 'display')}</span>
            ) : task.dueDate ? (
              <span className={styles.cardDate}>Prazo: {formatDate(task.dueDate, 'display')}</span>
            ) : (
              <span className={styles.cardDate}>Criado em: {formatDate(task.createdAt, 'display')}</span>
            )}
          </div>
          {task.tags && task.tags.length > 0 && (
            <div className={styles.cardBadges}>
              {task.tags.map((tag: any) => (
                <span key={tag.id} className={styles.badge}>{tag.name}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Droppable Column Component
function DroppableColumn({ id, title, count, children }: any) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnDraggingOver : ''}`}
    >
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>{title}</span>
        <span className={styles.columnCount}>{count}</span>
      </div>
      <div className={styles.taskList}>
        {children}
      </div>
    </div>
  )
}

export default function KanbanTemporal({ tasks, onMoveTask, onUpdateDueDate }: Props) {
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null)
  const [tempDueDate, setTempDueDate] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null) // For DragOverlay

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requires moving 8px before dragging starts, prevents accidental drags on click
      },
    }),
    useSensor(KeyboardSensor)
  )

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

  // Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveTask(active.data.current?.task as Task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    
    if (!over) return

    const taskId = active.id as string
    const col = over.id as 'scheduled' | 'backlog' | 'completed'
    
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const currentCol = task.completed ? 'completed' : task.dueDate ? 'scheduled' : 'backlog'
    if (currentCol === col) return

    if (col === 'scheduled') {
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.boardTemporal}>
        <DroppableColumn id="scheduled" title="Com Prazo" count={scheduledTasks.length}>
          {scheduledTasks.map(task => (
            <DraggableTaskCard 
              key={task.id} 
              task={task} 
              schedulingTaskId={schedulingTaskId}
              isOverdue={isOverdue(task)}
              onClick={() => schedulingTaskId !== task.id && setSelectedTask(task)}
              onSetTempDueDate={setTempDueDate}
              tempDueDate={tempDueDate}
              onConfirmSchedule={handleConfirmSchedule}
              onCancelSchedule={() => setSchedulingTaskId(null)}
            />
          ))}
        </DroppableColumn>

        <DroppableColumn id="backlog" title="Sem Prazo" count={backlogTasks.length}>
          {backlogTasks.map(task => (
            <DraggableTaskCard 
              key={task.id} 
              task={task} 
              schedulingTaskId={schedulingTaskId}
              isOverdue={false}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </DroppableColumn>

        <DroppableColumn id="completed" title="Completas" count={completedTasks.length}>
          {completedTasks.map(task => (
            <DraggableTaskCard 
              key={task.id} 
              task={task} 
              schedulingTaskId={schedulingTaskId}
              isOverdue={false}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </DroppableColumn>
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
