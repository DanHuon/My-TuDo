'use client'

import { useState, useRef, useEffect } from 'react'
import { Task, Tag } from '@/app/lib/types'
import { formatDate } from '@/app/lib/formatDate'
import { toggleTaskTag, autoTagTask } from '@/app/lib/db'
import styles from './TaskItem.module.css'

interface Props {
  task: Task
  availableTags: Tag[]
  onToggle: (id: string) => void
  onEdit: (id: string, title: string, description: string, dueDate?: string) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export default function TaskItem({ task, availableTags, onToggle, onEdit, onDelete, onRefresh }: Props) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description || '')
  const [editDueDateStr, setEditDueDateStr] = useState(formatDate(task.dueDate, 'display'))
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loadingIA, setLoadingIA] = useState(false)
  const [showTagMenu, setShowTagMenu] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [editing])

  const handleEdit = () => {
    if (task.completed) return
    setEditTitle(task.title)
    setEditDesc(task.description || '')
    setEditDueDateStr(formatDate(task.dueDate, 'display'))
    setEditing(true)
  }

  const handleSave = () => {
    if (!editTitle.trim()) return
    let isoDate = ''
    if (editDueDateStr && editDueDateStr.length === 10) {
      const [day, month, year] = editDueDateStr.split('/')
      isoDate = `${year}-${month}-${day}`
    }
    onEdit(task.id, editTitle.trim(), editDesc.trim(), isoDate)
    setEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDesc(task.description || '')
    setEditDueDateStr(formatDate(task.dueDate, 'display'))
    setEditing(false)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2)
    if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5, 9)
    setEditDueDateStr(val)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') handleCancel()
  }

  const handleAutoTag = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingIA(true)
    try {
      const success = await autoTagTask(task.id)
      if (success) {
        onRefresh()
      } else {
        alert('A IA não encontrou nenhuma tag compatível com esta tarefa')
      }
    } catch (error) {
      alert('A IA não encontrou nenhuma tag compatível com esta tarefa')
    } finally {
      setLoadingIA(false)
    }
  }

  const handleManualTagToggle = async (tagId: string) => {
    await toggleTaskTag(task.id, tagId)
    onRefresh()
  }

  if (editing) {
    return (
      <div className={styles.editWrapper}>
        <input
          ref={titleInputRef}
          type="text"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.editTitle}
          maxLength={200}
        />
        <div className={styles.editLine} />
        <textarea
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.editDesc}
          placeholder="Descrição (opcional)"
          rows={2}
          maxLength={1000}
        />
        <input
          type="text"
          value={editDueDateStr}
          onChange={handleDateChange}
          onKeyDown={handleKeyDown}
          className={styles.editTitle}
          placeholder="Data de conclusão (DD/MM/AAAA)"
          maxLength={10}
          style={{ marginTop: '8px' }}
        />
        <div className={styles.editActions}>
          <button onClick={handleSave} className={styles.saveBtn} disabled={!editTitle.trim()}>
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
      className={`${styles.wrapper} ${task.completed ? styles.wrapperCompleted : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
    >
      {/* Left: checkbox + index line */}
      <button
        onClick={() => onToggle(task.id)}
        className={`${styles.checkBtn} ${task.completed ? styles.checkBtnDone : ''}`}
        aria-label={task.completed ? 'Desmarcar' : 'Concluir'}
      >
        {task.completed ? (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : null}
      </button>

      {/* Content */}
      <div className={styles.content} onClick={!task.completed ? handleEdit : undefined}>
        <div className={styles.titleRow}>
          <span className={`${styles.title} ${task.completed ? styles.titleDone : ''}`}>
            {task.title}
          </span>
          {task.completed && (
            <span className={styles.doneTag}>concluída</span>
          )}
        </div>
        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}
        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
          <span className={styles.date}>CRIADO EM: {formatDate(task.createdAt, 'display')}</span>
          {task.dueDate && (
            <span className={styles.date}>
              DATA DE CONCLUSÀO: {formatDate(task.dueDate, 'display')}
            </span>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
            <span className={styles.date}>Tags:</span>
            {task.tags.map(tag => (
              <span key={tag.id} style={{ fontSize: '0.75rem', background: '#e5e7eb', color: '#374151', padding: '2px 8px', borderRadius: '12px' }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleAutoTag}
            disabled={loadingIA}
            style={{
              background: 'none',
              border: '1px solid var(--border-dark)',
              color: 'var(--ink-muted)',
              padding: '0.35rem 0.7rem',
              borderRadius: '3px',
              cursor: loadingIA ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem',
              transition: 'all 0.3s ease',
              fontFamily: "'DM Mono', monospace",
              letterSpacing: '0.05em'
            }}
          >
            {loadingIA ? 'Analisando...' : 'Tags IA'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowTagMenu(!showTagMenu) }}
              style={{
                background: 'none',
                border: '1px solid var(--border-dark)',
                color: 'var(--ink-muted)',
                padding: '0.35rem 0.7rem',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.3s ease',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.05em'
              }}
            >
              Tags Manual
            </button>
            {showTagMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: '8px',
                background: '#fff',
                border: '1px solid var(--border-dark)',
                borderRadius: '4px',
                padding: '8px',
                zIndex: 10,
                minWidth: '160px',
                maxHeight: '180px',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(26, 23, 20, 0.15)'
              }}>
                {availableTags.length === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>Nenhuma tag criada</span>
                ) : (
                  availableTags.map(t => {
                    const isSelected = task.tags?.some(tt => tt.id === t.id)
                    return (
                      <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, color: '#333' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected || false} onChange={() => handleManualTagToggle(t.id)} />
                        <span style={{ fontSize: '0.75rem' }}>{t.name}</span>
                      </label>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`${styles.actions} ${hovered ? styles.actionsVisible : ''}`}>
        {!task.completed && (
          <button
            onClick={handleEdit}
            className={styles.actionBtn}
            title="Editar"
          >
            <EditIcon />
          </button>
        )}
        {confirmDelete ? (
          <button
            onClick={() => onDelete(task.id)}
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
