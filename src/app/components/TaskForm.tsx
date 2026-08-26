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
  calendars?: { id: string, summary: string, backgroundColor: string }[]
}

type ReminderUnit = 'minutes' | 'hours' | 'days' | 'weeks';
interface LocalReminder { method: 'email'|'popup', value: number, unit: ReminderUnit }

export default function TaskForm({ onAdd, onAddEvent, onCancel, initialTab = 'task', initialData = null, calendars = [] }: Props) {
  const [tab, setTab] = useState<'task' | 'event'>(initialTab)
  const [submitting, setSubmitting] = useState(false)

  // Shared
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [rruleStr, setRruleStr] = useState(initialData?.rrule || '')
  
  // Visual Formatting
  const [taskInputType, setTaskInputType] = useState('text')
  const [startInputType, setStartInputType] = useState('text')
  const [endInputType, setEndInputType] = useState('text')

  const formatForDisplay = (val: string, allDay: boolean) => {
    if (!val) return ''
    const parts = val.split('T')
    const datePart = parts[0]
    const [y, m, d] = datePart.split('-')
    if (allDay || parts.length === 1) return `${d}/${m}/${y}`
    const timePart = parts[1].substring(0, 5)
    return `${d}/${m}/${y} ${timePart}`
  }

  // Custom RRULE State
  const [showCustomRrule, setShowCustomRrule] = useState(false)
  const [customRruleFreq, setCustomRruleFreq] = useState('DAILY')
  const [customRruleInterval, setCustomRruleInterval] = useState(1)
  const [customRruleEndType, setCustomRruleEndType] = useState('never')
  const [customRruleUntil, setCustomRruleUntil] = useState('')
  const [customRruleCount, setCustomRruleCount] = useState(1)

  const handleCustomRruleSave = () => {
    let rule = `FREQ=${customRruleFreq};INTERVAL=${customRruleInterval}`
    if (customRruleEndType === 'until' && customRruleUntil) {
      const formattedUntil = customRruleUntil.replace(/-/g, '') + 'T235959Z'
      rule += `;UNTIL=${formattedUntil}`
    } else if (customRruleEndType === 'count' && customRruleCount > 0) {
      rule += `;COUNT=${customRruleCount}`
    }
    setRruleStr(rule)
    setShowCustomRrule(false)
  }

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
              type={taskInputType}
              value={taskInputType === 'text' ? formatForDisplay(taskDateTime, false) : taskDateTime}
              onFocus={() => setTaskInputType('datetime-local')}
              onBlur={() => setTaskInputType('text')}
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
                  type={startInputType}
                  value={startInputType === 'text' ? formatForDisplay(eventStart, eventAllDay) : eventStart}
                  onFocus={() => setStartInputType(eventAllDay ? "date" : "datetime-local")}
                  onBlur={() => setStartInputType('text')}
                  onChange={(e) => setEventStart(e.target.value)}
                  className={styles.titleInput}
                  disabled={submitting}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>Fim (opcional):</div>
                <input
                  type={endInputType}
                  value={endInputType === 'text' ? formatForDisplay(eventEnd, eventAllDay) : eventEnd}
                  onFocus={() => setEndInputType(eventAllDay ? "date" : "datetime-local")}
                  onBlur={() => setEndInputType('text')}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className={styles.titleInput}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className={styles.inputLine} />

            <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>Calendário (Google):</div>
            <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)} className={styles.titleInput} disabled={submitting}>
              {calendars && calendars.length > 0 ? (
                calendars.map(cal => (
                  <option key={cal.id} value={cal.id} style={{ color: cal.backgroundColor, fontWeight: 'bold' }}>
                    {cal.summary}
                  </option>
                ))
              ) : (
                <option value="primary">Principal (My calendar)</option>
              )}
            </select>
            <div className={styles.inputLine} />
          </>
        )}

        <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>Recorrência:</div>
        <select value={rruleStr} onChange={(e) => {
          if (e.target.value === 'CUSTOM') setShowCustomRrule(true)
          else setRruleStr(e.target.value)
        }} className={styles.titleInput} disabled={submitting} style={{ padding: '4px', background: 'var(--bg)', color: 'var(--ink)' }}>
          <option value="">Sem repetição</option>
          <option value="FREQ=DAILY">Diariamente</option>
          <option value="FREQ=WEEKLY">Semanalmente</option>
          <option value="FREQ=MONTHLY">Mensalmente</option>
          <option value="FREQ=YEARLY">Anualmente</option>
          <option value="CUSTOM">Personalizado...</option>
          {rruleStr && !['', 'FREQ=DAILY', 'FREQ=WEEKLY', 'FREQ=MONTHLY', 'FREQ=YEARLY', 'CUSTOM'].includes(rruleStr) && (
            <option value={rruleStr}>Recorrência Personalizada Ativa</option>
          )}
        </select>
        <div className={styles.inputLine} />

        {(tab === 'event' || (tab === 'task' && taskDateTime)) && (
          <>
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
          </>
        )}
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

      {showCustomRrule && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontFamily: 'Cormorant Garamond', color: 'var(--ink)' }}>Recorrência Personalizada</h4>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>Repetir a cada:</span>
              <input type="number" min="1" value={customRruleInterval} onChange={e => setCustomRruleInterval(parseInt(e.target.value) || 1)} className={styles.titleInput} style={{ width: '60px', background: 'var(--bg-card)', padding: '6px' }} />
              <select value={customRruleFreq} onChange={e => setCustomRruleFreq(e.target.value)} className={styles.titleInput} style={{ width: '120px', background: 'var(--bg-card)', padding: '6px' }}>
                <option value="DAILY">dia(s)</option>
                <option value="WEEKLY">semana(s)</option>
                <option value="MONTHLY">mês(es)</option>
                <option value="YEARLY">ano(s)</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--ink-muted)' }}>Termina:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <input type="radio" name="endType" checked={customRruleEndType === 'never'} onChange={() => setCustomRruleEndType('never')} /> Nunca
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <input type="radio" name="endType" checked={customRruleEndType === 'until'} onChange={() => setCustomRruleEndType('until')} /> Em 
                  <input type="date" value={customRruleUntil} onChange={e => setCustomRruleUntil(e.target.value)} disabled={customRruleEndType !== 'until'} className={styles.titleInput} style={{ background: 'var(--bg-card)', padding: '4px' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <input type="radio" name="endType" checked={customRruleEndType === 'count'} onChange={() => setCustomRruleEndType('count')} /> Após 
                  <input type="number" min="1" value={customRruleCount} onChange={e => setCustomRruleCount(parseInt(e.target.value) || 1)} disabled={customRruleEndType !== 'count'} className={styles.titleInput} style={{ width: '60px', background: 'var(--bg-card)', padding: '4px' }} /> ocorrências
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowCustomRrule(false); setRruleStr(''); }} className={styles.submitBtn} style={{ background: 'var(--bg-card)', color: 'var(--ink)' }}>Cancelar</button>
              <button type="button" onClick={handleCustomRruleSave} className={styles.submitBtn}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
