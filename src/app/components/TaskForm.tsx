'use client'

import { useState, useRef } from 'react'
import styles from './TaskForm.module.css'
import { GcEvent } from '../lib/types'

interface Props {
  onAdd?: (title: string, description: string, dueDate?: string, rrule?: string, eventId?: string, reminders?: {method: 'email'|'popup', minutes: number}[]) => Promise<void>
  onAddEvent?: (payload: Partial<GcEvent> & { isNew?: boolean }) => Promise<any>
  onCancel?: () => void
  initialTab?: 'task' | 'event'
  initialData?: any
}

type ReminderUnit = 'minutes' | 'hours' | 'days' | 'weeks';
interface LocalReminder { method: 'email'|'popup', value: number, unit: ReminderUnit }

export default function TaskForm({ onAdd, onAddEvent, onCancel, initialTab = 'task', initialData = null }: Props) {
  const [tab, setTab] = useState<'task' | 'event'>(initialTab)
  const [submitting, setSubmitting] = useState(false)

  // Shared
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [rruleStr, setRruleStr] = useState(initialData?.rrule || '')

  const initialLocalReminders: LocalReminder[] = (initialData?.reminders || []).map((r: any) => {
    if (r.minutes > 0) {
      if (r.minutes % 10080 === 0) return { method: r.method, value: r.minutes / 10080, unit: 'weeks' };
      if (r.minutes % 1440 === 0) return { method: r.method, value: r.minutes / 1440, unit: 'days' };
      if (r.minutes % 60 === 0) return { method: r.method, value: r.minutes / 60, unit: 'hours' };
    }
    return { method: r.method, value: r.minutes, unit: 'minutes' };
  });
  const [reminders, setReminders] = useState<LocalReminder[]>(initialLocalReminders)
  const titleRef = useRef<HTMLInputElement>(null)

  // Task specific
  const [taskDateTime, setTaskDateTime] = useState(initialData?.dueDate || '')

  // Event specific
  const [eventAllDay, setEventAllDay] = useState(initialData ? initialData.allDay : false)
  const [eventStart, setEventStart] = useState(initialData?.start || '')
  const [eventEnd, setEventEnd] = useState(initialData?.end || '')
  const [calendarId, setCalendarId] = useState(initialData?.calendarId || 'primary')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || submitting) return

    setSubmitting(true)
    try {
      const finalReminders = reminders.map(r => {
        let multiplier = 1;
        if (r.unit === 'hours') multiplier = 60;
        if (r.unit === 'days') multiplier = 1440;
        if (r.unit === 'weeks') multiplier = 10080;
        return { method: r.method, minutes: r.value * multiplier };
      });

      if (tab === 'task') {
        if (onAdd) {
          await onAdd(title.trim(), description.trim(), taskDateTime || undefined, rruleStr || undefined, undefined, finalReminders)
        }
      } else {
        if (onAddEvent) {
          const payload: Partial<GcEvent> & { isNew?: boolean } = {
            id: initialData?.id,
            isNew: !initialData?.id,
            title: title.trim(),
            description: description.trim(),
            start: eventStart,
            end: eventEnd,
            allDay: eventAllDay,
            rrule: rruleStr || undefined,
            calendarId: calendarId,
            reminders: finalReminders
          }
          await onAddEvent(payload)
        }
      }

      if (onCancel) {
        onCancel()
      } else {
        setTitle('')
        setDescription('')
        setTaskDateTime('')
        setEventStart('')
        setEventEnd('')
        setRruleStr('')
        setReminders([])
        titleRef.current?.focus()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button type="button" onClick={() => setTab('task')} className={styles.addDescBtn} style={{ fontWeight: tab === 'task' ? 'bold' : 'normal', opacity: tab === 'task' ? 1 : 0.6 }}>
          Tarefa
        </button>
        <button type="button" onClick={() => setTab('event')} className={styles.addDescBtn} style={{ fontWeight: tab === 'event' ? 'bold' : 'normal', opacity: tab === 'event' ? 1 : 0.6 }}>
          Evento
        </button>
      </div>

      <div className={styles.inputGroup}>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={tab === 'task' ? "O que precisa ser feito?" : "Título do evento"}
          className={styles.titleInput}
          maxLength={200}
          autoComplete="off"
          disabled={submitting}
        />
        <div className={styles.inputLine} />
      </div>

      <div className={styles.descGroup}>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Adicione detalhes (opcional)"
          className={styles.descInput}
          rows={2}
          maxLength={1000}
          disabled={submitting}
        />
        <div className={styles.inputLine} />
        
        {tab === 'task' && (
          <>
            <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>Data e Hora (opcional):</div>
            <input
              type="datetime-local"
              value={taskDateTime}
              onChange={(e) => setTaskDateTime(e.target.value)}
              className={styles.titleInput}
              style={{ marginTop: '4px' }}
              disabled={submitting}
            />
            <div className={styles.inputLine} />
          </>
        )}

        {tab === 'event' && (
          <>
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={eventAllDay} onChange={e => setEventAllDay(e.target.checked)} disabled={submitting} />
              <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>Dia Inteiro</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>Início:</div>
                <input
                  type={eventAllDay ? "date" : "datetime-local"}
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className={styles.titleInput}
                  disabled={submitting}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>Fim (opcional):</div>
                <input
                  type={eventAllDay ? "date" : "datetime-local"}
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className={styles.titleInput}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className={styles.inputLine} />

            <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>Calendário (Google):</div>
            <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)} className={styles.titleInput} disabled={submitting}>
              <option value="primary">Principal (My calendar)</option>
            </select>
            <div className={styles.inputLine} />
          </>
        )}

        <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>Recorrência:</div>
        <select value={rruleStr} onChange={(e) => setRruleStr(e.target.value)} className={styles.titleInput} disabled={submitting} style={{ background: 'transparent' }}>
          <option value="">Sem repetição</option>
          <option value="FREQ=DAILY">Diariamente</option>
          <option value="FREQ=WEEKLY">Semanalmente</option>
          <option value="FREQ=MONTHLY">Mensalmente</option>
          <option value="FREQ=YEARLY">Anualmente</option>
        </select>
        <div className={styles.inputLine} />

        <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>Lembretes (Google):</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button type="button" onClick={() => setReminders([...reminders, { method: 'popup', value: 10, unit: 'minutes' }])} className={styles.addDescBtn}>+ Popup</button>
          <button type="button" onClick={() => setReminders([...reminders, { method: 'email', value: 1, unit: 'hours' }])} className={styles.addDescBtn}>+ E-mail</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
          {reminders.map((rem, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select value={rem.method} onChange={(e) => { const r = [...reminders]; r[idx].method = e.target.value as any; setReminders(r) }} className={styles.titleInput} style={{ width: '100px', padding: '4px', background: 'var(--bg)', color: 'var(--ink)' }}>
                <option value="popup">Popup</option>
                <option value="email">E-mail</option>
              </select>
              <input type="number" min="0" value={rem.value} onChange={(e) => { const r = [...reminders]; r[idx].value = parseInt(e.target.value) || 0; setReminders(r) }} className={styles.titleInput} style={{ width: '70px', padding: '4px', background: 'var(--bg)', color: 'var(--ink)' }} />
              <select value={rem.unit} onChange={(e) => { const r = [...reminders]; r[idx].unit = e.target.value as any; setReminders(r) }} className={styles.titleInput} style={{ width: '110px', padding: '4px', background: 'var(--bg)', color: 'var(--ink)' }}>
                <option value="minutes">Minutos</option>
                <option value="hours">Horas</option>
                <option value="days">Dias</option>
                <option value="weeks">Semanas</option>
              </select>
              <button type="button" onClick={() => { const r = [...reminders]; r.splice(idx, 1); setReminders(r) }} style={{ background: 'none', border: 'none', color: '#EA4335', cursor: 'pointer', fontSize: '20px', padding: '0 4px' }}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
        <button type="submit" disabled={!title.trim() || submitting || (tab === 'event' && !eventStart)} className={styles.submitBtn} style={{ flex: 1 }}>
          {submitting ? <span className={styles.submitSpinner} /> : <><span className={styles.submitIcon}>◆</span> Salvar</>}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={styles.submitBtn} style={{ background: 'var(--bg-card)', color: 'var(--ink)' }}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
