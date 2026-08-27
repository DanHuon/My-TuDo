'use client'

import { useState, useRef, useEffect } from 'react'
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

const timeOptions: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = h.toString().padStart(2, '0')
    const mm = m.toString().padStart(2, '0')
    timeOptions.push(`${hh}:${mm}`)
  }
}

const getDurationLabel = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let diffMin = (eh * 60 + em) - (sh * 60 + sm)
  if (diffMin <= 0) return '' // Do not show duration if end <= start (same or crosses midnight but for simplicity empty)
  
  const h = Math.floor(diffMin / 60)
  const m = diffMin % 60
  
  if (h === 0 && m === 0) return '(0 min)'
  if (h === 0) return `(${m} min)`
  if (m === 0) return `(${h} h)`
  return `(${h} h ${m} min)`
}

// Formats YYYY-MM-DD into string like "Sexta-feira, 28 de agosto"
const formatDateText = (dateStr: string) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
  const formatted = date.toLocaleDateString('pt-BR', options)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export default function TaskForm({ onAdd, onAddEvent, onCancel, initialTab = 'task', initialData = null, calendars = [] }: Props) {
  const [tab, setTab] = useState<'task' | 'event'>(initialTab)
  const [submitting, setSubmitting] = useState(false)

  // Shared
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [rruleStr, setRruleStr] = useState(initialData?.rrule || '')
  
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

  // -- Task specific Date/Time logic --
  const taskHasTimeInitial = initialData?.dueDate?.includes('T') || false
  const [taskDate, setTaskDate] = useState(initialData?.dueDate ? initialData.dueDate.split('T')[0] : '')
  const [taskHasTime, setTaskHasTime] = useState(taskHasTimeInitial)
  const [taskStart, setTaskStart] = useState(taskHasTimeInitial ? initialData.dueDate.split('T')[1].substring(0, 5) : '00:00')
  const [taskHasEnd, setTaskHasEnd] = useState(false)
  const [taskEnd, setTaskEnd] = useState(taskStart)
  
  const [taskDateInputType, setTaskDateInputType] = useState('text')

  // -- Event specific Date/Time logic --
  const eventHasTimeInitial = !initialData?.allDay
  const [eventAllDay, setEventAllDay] = useState(initialData ? initialData.allDay : false)
  const [eventDate, setEventDate] = useState(initialData?.start ? initialData.start.split('T')[0] : '')
  const [eventEndDate, setEventEndDate] = useState(initialData?.end ? initialData.end.split('T')[0] : '')
  const [eventStart, setEventStart] = useState(initialData?.start?.includes('T') ? initialData.start.split('T')[1].substring(0, 5) : '00:00')
  const [eventEnd, setEventEnd] = useState(initialData?.end?.includes('T') ? initialData.end.split('T')[1].substring(0, 5) : '01:00')
  const [calendarId, setCalendarId] = useState(initialData?.calendarId || 'primary')

  const [eventDateInputType, setEventDateInputType] = useState('text')

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
          // Construct due date for task
          let finalDueDate = ''
          if (taskDate) {
            if (taskHasTime) {
              finalDueDate = `${taskDate}T${taskStart}:00` 
            } else {
              finalDueDate = taskDate
            }
          }
          await onAdd(title.trim(), description.trim(), finalDueDate || undefined, rruleStr || undefined, undefined, finalReminders)
        }
      } else {
        if (onAddEvent) {
          let startStr = eventDate
          let endStr = eventEndDate || eventDate
          
          if (!eventAllDay) {
            startStr = `${eventDate}T${eventStart}:00`
            endStr = `${eventEndDate || eventDate}T${eventEnd}:00`
          }

          const payload: Partial<GcEvent> & { isNew?: boolean } = {
            id: initialData?.id,
            isNew: !initialData?.id,
            title: title.trim(),
            description: description.trim(),
            start: startStr,
            end: endStr,
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
        setTaskDate('')
        setTaskHasTime(false)
        setEventDate('')
        setEventEndDate('')
        setEventAllDay(true)
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
        <button type="button" onClick={() => setTab('task')} className={styles.addDescBtn} style={{ fontWeight: tab === 'task' ? 'bold' : 'normal', opacity: tab === 'task' ? 1 : 0.6, fontSize: '0.9rem', padding: '6px 16px', borderRadius: '20px', background: tab === 'task' ? 'var(--accent)' : 'transparent', color: tab === 'task' ? '#fff' : 'var(--ink)' }}>
          Tarefa
        </button>
        <button type="button" onClick={() => setTab('event')} className={styles.addDescBtn} style={{ fontWeight: tab === 'event' ? 'bold' : 'normal', opacity: tab === 'event' ? 1 : 0.6, fontSize: '0.9rem', padding: '6px 16px', borderRadius: '20px', background: tab === 'event' ? 'var(--accent)' : 'transparent', color: tab === 'event' ? '#fff' : 'var(--ink)' }}>
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
          style={{ fontSize: '1.2rem', padding: '8px 0' }}
        />
        <div className={styles.inputLine} style={{ marginBottom: '16px' }} />
      </div>

      <div className={styles.descGroup}>
        
        {/* --- DATETIME SECTION --- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '18px', color: 'var(--ink-muted)' }}>🕒</span>
          
          {tab === 'task' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type={taskDateInputType}
                value={taskDateInputType === 'text' ? (taskDate ? formatDateText(taskDate) : 'Adicionar data') : taskDate}
                onFocus={() => setTaskDateInputType('date')}
                onBlur={() => setTaskDateInputType('text')}
                onChange={(e) => setTaskDate(e.target.value)}
                className={styles.titleInput}
                style={{ width: taskDateInputType === 'text' && !taskDate ? '120px' : 'auto', padding: '4px 8px', background: 'var(--bg-card)', borderRadius: '4px' }}
                disabled={submitting}
              />

              {!taskHasTime && taskDate && (
                <button type="button" onClick={() => setTaskHasTime(true)} className={styles.addDescBtn} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  Adicionar horário
                </button>
              )}

              {taskHasTime && (
                <>
                  <select value={taskStart} onChange={e => { setTaskStart(e.target.value); if(!taskHasEnd) setTaskEnd(e.target.value); }} className={styles.titleInput} style={{ width: '80px', padding: '4px', background: 'var(--bg-card)' }}>
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>

                  {(!taskHasEnd && taskStart === taskEnd) ? (
                    <button type="button" onClick={() => setTaskHasEnd(true)} className={styles.addDescBtn} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      Adicionar horário de término
                    </button>
                  ) : (
                    <>
                      <span>-</span>
                      <select value={taskEnd} onChange={e => setTaskEnd(e.target.value)} className={styles.titleInput} style={{ width: '130px', padding: '4px', background: 'var(--bg-card)' }}>
                        {timeOptions.map(t => <option key={t} value={t}>{t} {getDurationLabel(taskStart, t)}</option>)}
                      </select>
                      <button type="button" onClick={() => { setTaskHasEnd(false); setTaskEnd(taskStart); }} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                    </>
                  )}
                  
                  <button type="button" onClick={() => { setTaskHasTime(false); setTaskHasEnd(false); }} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '18px', marginLeft: '4px' }}>×</button>
                </>
              )}
            </div>
          )}

          {tab === 'event' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type={eventDateInputType}
                value={eventDateInputType === 'text' ? (eventDate ? formatDateText(eventDate) : 'Data início') : eventDate}
                onFocus={() => setEventDateInputType('date')}
                onBlur={() => setEventDateInputType('text')}
                onChange={(e) => setEventDate(e.target.value)}
                className={styles.titleInput}
                style={{ width: 'auto', padding: '4px 8px', background: 'var(--bg-card)', borderRadius: '4px' }}
                disabled={submitting}
                required
              />

              {eventAllDay ? (
                <>
                  <button type="button" onClick={() => setEventAllDay(false)} className={styles.addDescBtn} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    Adicionar horário
                  </button>
                </>
              ) : (
                <>
                  <select value={eventStart} onChange={e => setEventStart(e.target.value)} className={styles.titleInput} style={{ width: '80px', padding: '4px', background: 'var(--bg-card)' }}>
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span>-</span>
                  <select value={eventEnd} onChange={e => setEventEnd(e.target.value)} className={styles.titleInput} style={{ width: '130px', padding: '4px', background: 'var(--bg-card)' }}>
                    {timeOptions.map(t => <option key={t} value={t}>{t} {getDurationLabel(eventStart, t)}</option>)}
                  </select>
                  <button type="button" onClick={() => setEventAllDay(true)} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '18px', marginLeft: '4px' }}>×</button>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
           <span style={{ fontSize: '18px', color: 'var(--ink-muted)' }}>↻</span>
           <select value={rruleStr} onChange={(e) => {
             if (e.target.value === 'CUSTOM') setShowCustomRrule(true)
             else setRruleStr(e.target.value)
           }} className={styles.titleInput} disabled={submitting} style={{ padding: '6px', background: 'transparent', width: 'auto' }}>
             <option value="">Não se repete</option>
             <option value="FREQ=DAILY">Diariamente</option>
             <option value="FREQ=WEEKLY">Semanalmente</option>
             <option value="FREQ=MONTHLY">Mensalmente</option>
             <option value="FREQ=YEARLY">Anualmente</option>
             <option value="CUSTOM">Personalizar...</option>
             {rruleStr && !['', 'FREQ=DAILY', 'FREQ=WEEKLY', 'FREQ=MONTHLY', 'FREQ=YEARLY', 'CUSTOM'].includes(rruleStr) && (
               <option value={rruleStr}>Recorrência ativa</option>
             )}
           </select>
        </div>

        {tab === 'event' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', color: 'var(--ink-muted)' }}>📅</span>
            <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)} className={styles.titleInput} disabled={submitting} style={{ padding: '6px', background: 'transparent', width: 'auto' }}>
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
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
           <span style={{ fontSize: '18px', color: 'var(--ink-muted)', marginTop: '4px' }}>≡</span>
           <textarea
             value={description}
             onChange={e => setDescription(e.target.value)}
             placeholder="Adicionar descrição"
             className={styles.descInput}
             rows={2}
             maxLength={1000}
             disabled={submitting}
             style={{ background: 'transparent', padding: '6px', width: '100%', border: 'none', resize: 'none' }}
           />
        </div>

        {(tab === 'event' || (tab === 'task' && taskDate)) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', color: 'var(--ink-muted)' }}>🔔</span>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button type="button" onClick={() => setReminders([...reminders, { method: 'popup', value: 10, unit: 'minutes' }])} className={styles.addDescBtn} style={{ padding: '4px 12px', border: '1px solid var(--border)', borderRadius: '4px' }}>Adicionar notificação</button>
                <button type="button" onClick={() => setReminders([...reminders, { method: 'email', value: 1, unit: 'hours' }])} className={styles.addDescBtn} style={{ padding: '4px 12px', border: '1px solid var(--border)', borderRadius: '4px' }}>Adicionar e-mail</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {reminders.map((rem, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select value={rem.method} onChange={(e) => { const r = [...reminders]; r[idx].method = e.target.value as any; setReminders(r) }} className={styles.titleInput} style={{ width: '100px', padding: '4px', background: 'var(--bg-card)' }}>
                      <option value="popup">Notificação</option>
                      <option value="email">E-mail</option>
                    </select>
                    <input type="number" min="0" value={rem.value} onChange={(e) => { const r = [...reminders]; r[idx].value = parseInt(e.target.value) || 0; setReminders(r) }} className={styles.titleInput} style={{ width: '60px', padding: '4px', background: 'var(--bg-card)' }} />
                    <select value={rem.unit} onChange={(e) => { const r = [...reminders]; r[idx].unit = e.target.value as any; setReminders(r) }} className={styles.titleInput} style={{ width: '100px', padding: '4px', background: 'var(--bg-card)' }}>
                      <option value="minutes">Minutos</option>
                      <option value="hours">Horas</option>
                      <option value="days">Dias</option>
                      <option value="weeks">Semanas</option>
                    </select>
                    <button type="button" onClick={() => { const r = [...reminders]; r.splice(idx, 1); setReminders(r) }} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '20px', padding: '0 4px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', padding: '16px 0 0 0', borderTop: '1px solid var(--border)' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} className={styles.submitBtn} style={{ background: 'transparent', color: 'var(--ink)', padding: '8px 24px', border: 'none' }}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={!title.trim() || submitting || (tab === 'event' && !eventDate)} className={styles.submitBtn} style={{ padding: '8px 24px', borderRadius: '24px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold' }}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </button>
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
