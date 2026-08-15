'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag, Task } from '@/app/lib/types'
import { formatDate } from '@/app/lib/formatDate'
import styles from './TaskItem.module.css'

interface Props {
  tag: Tag
  onEdit: (id: string, name: string, description: string) => void
  onDelete: (id: string) => void
}

export default function TagItem({ tag, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(tag.name)
  const [editDesc, setEditDesc] = useState(tag.description || '')
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    if (editing) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [editing])

  const handleEdit = () => {
    setEditName(tag.name)
    setEditDesc(tag.description || '')
    setEditing(true)
  }

  const handleSave = () => {
    if (!editName.trim()) return
    onEdit(tag.id, editName.trim(), editDesc.trim())
    setEditing(false)
  }

  const handleCancel = () => {
    setEditName(tag.name)
    setEditDesc(tag.description || '')
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') handleCancel()
  }

  if (editing) {
    return (
      <div className={styles.editWrapper}>
        <input
          ref={nameInputRef}
          type="text"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.editTitle}
          maxLength={30}
        />
        <div className={styles.editLine} />
        <textarea
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.editDesc}
          placeholder="Descrição (opcional)"
          rows={2}
          maxLength={300}
        />
        <div className={styles.editActions}>
          <button onClick={handleSave} className={styles.saveBtn} disabled={!editName.trim()}>
            Salvar
          </button>
          <button onClick={handleCancel} className={styles.cancelBtn}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
    >
      <div style={{ width: '18px', display: 'flex', justifyContent: 'center', marginTop: '3px', color: 'var(--ink-faint)', fontSize: '14px' }}>
        #
      </div>
      <div className={styles.content} onClick={() => !editing && setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        <div className={styles.titleRow}>
          <span className={styles.title} style={{ background: '#e5e7eb', color: '#374151', padding: '4px 10px', borderRadius: '12px' }}>
            {tag.name}
          </span>
        </div>
        {tag.description && (
          <p className={styles.description}>{tag.description}</p>
        )}
        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
          <span className={styles.date}>CRIADO EM: {formatDate(tag.createdAt, 'display')}</span>
        </div>

        {expanded && tag.tasks && tag.tasks.length > 0 && (
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-dark)', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--ink-muted)', letterSpacing: '0.05em', fontFamily: "'DM Mono', monospace" }}>TAREFAS VINCULADAS:</span>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tag.tasks.map(task => (
                <li 
                  key={task.id} 
                  style={{ 
                    fontSize: '0.85rem', 
                    cursor: 'pointer', 
                    color: 'var(--ink)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    background: 'rgba(26, 23, 20, 0.02)',
                    border: '1px solid transparent',
                  }} 
                  onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(26, 23, 20, 0.05)';
                    e.currentTarget.style.borderColor = 'var(--border-dark)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(26, 23, 20, 0.02)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: task.completed ? 'var(--success)' : 'var(--accent)',
                    display: 'inline-block' 
                  }} />
                  <span style={{ 
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 400,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    textDecorationColor: 'var(--border-dark)'
                  }}>{task.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {expanded && (!tag.tasks || tag.tasks.length === 0) && (
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-dark)', paddingTop: '8px', fontSize: '12px', color: 'var(--ink-muted)' }}>
            Nenhuma tarefa vinculada a esta tag.
          </div>
        )}
      </div>

      <div className={`${styles.actions} ${hovered ? styles.actionsVisible : ''}`}>
        <button
          onClick={handleEdit}
          className={styles.actionBtn}
          title="Editar"
        >
          <EditIcon />
        </button>
        {confirmDelete ? (
          <button
            onClick={() => onDelete(tag.id)}
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            title="Confirmar remoção"
          >
            ✕
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className={styles.actionBtn}
            title="Remover"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      <div className={styles.divider} />

      {selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26, 23, 20, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={(e) => { e.stopPropagation(); setSelectedTask(null); }}>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '6px', minWidth: '320px', maxWidth: '500px', border: '1px solid var(--border-dark)', boxShadow: 'var(--shadow)', animation: 'editOpen 0.2s ease' }} onClick={e => e.stopPropagation()}>
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
                onClick={(e) => { e.stopPropagation(); setSelectedTask(null); }} 
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ink-muted)';
                  e.currentTarget.style.color = 'var(--ink)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--ink-muted)';
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

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M9.5 1.5L11.5 3.5L4.5 10.5H2.5V8.5L9.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 4H11M9.5 4V10.5C9.5 11 9 11.5 8.5 11.5H4.5C4 11.5 3.5 11 3.5 10.5V4M5 4V3C5 2.5 5.5 2 6 2H7C7.5 2 8 2.5 8 3V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
