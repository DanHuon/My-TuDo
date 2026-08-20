'use client'

import { useState, useRef } from 'react'
import styles from './TaskForm.module.css'

interface Props {
  onAdd: (title: string, description: string, dueDate?: string, rrule?: string, eventId?: string, reminders?: {method: 'email'|'popup', minutes: number}[]) => Promise<void>
}

export default function TaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDateStr, setDueDateStr] = useState('')
  const [rruleStr, setRruleStr] = useState('')
  const [reminders, setReminders] = useState<{method: 'email'|'popup', minutes: number}[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showDesc, setShowDesc] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2)
    if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5, 9)
    setDueDateStr(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || submitting) return

    setSubmitting(true)
    try {
      let isoDate = ''
      if (dueDateStr.length === 10) {
        const [day, month, year] = dueDateStr.split('/')
        isoDate = `${year}-${month}-${day}`
      }

      await onAdd(title.trim(), description.trim(), isoDate || undefined, rruleStr || undefined, undefined, reminders)
      setTitle('')
      setDescription('')
      setDueDateStr('')
      setRruleStr('')
      setReminders([])
      setShowDesc(false)
      titleRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="O que precisa ser feito?"
          className={styles.titleInput}
          maxLength={200}
          autoComplete="off"
          disabled={submitting}
        />
        <div className={styles.inputLine} />
      </div>

      {showDesc ? (
        <div className={styles.descGroup}>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Adicione detalhes (opcional)"
            className={styles.descInput}
            rows={3}
            maxLength={1000}
            disabled={submitting}
          />
          <div className={styles.inputLine} />
          <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>
            Data de conclusão (opcional):
          </div>
          <input
            type="text"
            value={dueDateStr}
            onChange={handleDateChange}
            placeholder="DD/MM/AAAA"
            className={styles.titleInput}
            style={{ marginTop: '4px' }}
            disabled={submitting}
            maxLength={10}
          />
          <div className={styles.inputLine} />
          
          <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>
            Recorrência (Opcional):
          </div>
          <select 
            value={rruleStr} 
            onChange={(e) => setRruleStr(e.target.value)} 
            className={styles.titleInput} 
            disabled={submitting}
            style={{ marginTop: '4px', background: 'transparent' }}
          >
            <option value="">Sem repetição</option>
            <option value="FREQ=DAILY">Diariamente</option>
            <option value="FREQ=WEEKLY">Semanalmente</option>
            <option value="FREQ=MONTHLY">Mensalmente</option>
            <option value="FREQ=YEARLY">Anualmente</option>
          </select>
          <div className={styles.inputLine} />

          <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>
            Lembretes (Sincronizados com o Google Calendar):
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button type="button" onClick={() => setReminders([...reminders, { method: 'popup', minutes: 10 }])} className={styles.addDescBtn}>+ Popup</button>
            <button type="button" onClick={() => setReminders([...reminders, { method: 'email', minutes: 60 }])} className={styles.addDescBtn}>+ E-mail</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {reminders.map((rem, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select value={rem.method} onChange={(e) => { const r = [...reminders]; r[idx].method = e.target.value as any; setReminders(r) }} className={styles.titleInput} style={{ width: '100px', padding: '2px', background: 'transparent' }}>
                  <option value="popup">Popup</option>
                  <option value="email">E-mail</option>
                </select>
                <input type="number" value={rem.minutes} onChange={(e) => { const r = [...reminders]; r[idx].minutes = parseInt(e.target.value) || 0; setReminders(r) }} className={styles.titleInput} style={{ width: '80px', padding: '2px' }} /> min antes
                <button type="button" onClick={() => { const r = [...reminders]; r.splice(idx, 1); setReminders(r) }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '16px' }}>×</button>
              </div>
            ))}
          </div>
          <div className={styles.inputLine} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDesc(true)}
          className={styles.addDescBtn}
        >
          + descrição
        </button>
      )}

      <button
        type="submit"
        disabled={!title.trim() || submitting}
        className={styles.submitBtn}
      >
        {submitting ? (
          <span className={styles.submitSpinner} />
        ) : (
          <>
            <span className={styles.submitIcon}>◆</span>
            Adicionar
          </>
        )}
      </button>
    </form>
  )
}
