'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/pt-br'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, itemToTask } from '@/app/lib/db'
import { GcEvent, Task } from '@/app/lib/types'
import { useAuth } from '@/app/lib/AuthContext'
import { useCalendarSync } from '@/app/lib/useCalendarSync'
import TaskForm from '@/app/components/TaskForm'
import { rrulestr } from 'rrule'
import styles from './CalendarModule.module.css'

// Setup moment locale
moment.locale('pt-br')
const localizer = momentLocalizer(moment)

export default function CalendarModule() {
  const { session } = useAuth()
  const { fetchCalendarEvents, isSyncing, pushEventToGoogleCalendar, deleteEventFromGoogleCalendar, deleteTaskFromGoogleCalendar } = useCalendarSync(session?.accessToken)
  const [currentView, setCurrentView] = useState(Views.MONTH)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view')

    const tasks = useLiveQuery(
    () => db.items.where({ type: 'task', isDeleted: 0 }).toArray()
  )

  // Fetch Google Calendar Cache
  const gcEvents = useLiveQuery(
    () => db.gc_cache.toArray()
  )

  // Initial Sync
  useEffect(() => {
    fetchCalendarEvents()
  }, [fetchCalendarEvents])

  const unifiedEvents = useMemo(() => {
    const events: any[] = []

    // Define a window for expanding recurrences (e.g., current date +/- 2 months)
    const viewStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1)
    const viewEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0) // last day of +2 months

    const parseLocalDate = (dateStr: string) => {
      if (!dateStr.includes('T')) {
        const [y, m, d] = dateStr.split('-').map(Number)
        return new Date(y, m - 1, d)
      }
      return new Date(dateStr)
    }

    const processItem = (itemProps: any, rruleStr: string | null) => {
      if (!rruleStr) {
        events.push(itemProps)
        return
      }
      
      try {
        // Build a proper RRULE string if it doesn't have the prefix
        let formattedRule = rruleStr
        if (!formattedRule.startsWith('RRULE:')) {
          formattedRule = `RRULE:${formattedRule}`
        }
        
        // Ensure DTSTART is present so rrule.js knows when to start counting
        // Google Calendar rrule strings often don't have DTSTART in the rrule itself
        const dtStartStr = new Date(itemProps.start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        if (!formattedRule.includes('DTSTART')) {
          formattedRule = `DTSTART:${dtStartStr}\n${formattedRule}`
        }
        
        const rule = rrulestr(formattedRule)
        const instances = rule.between(viewStart, viewEnd, true)
        
        instances.forEach((instanceDate) => {
          // rrule.js returns dates in UTC. We need to preserve the original time but shift the date.
          const origStart = new Date(itemProps.start)
          const origEnd = new Date(itemProps.end)
          
          const durMs = origEnd.getTime() - origStart.getTime()
          
          const instStart = new Date(instanceDate)
          const instEnd = new Date(instStart.getTime() + durMs)

          events.push({
            ...itemProps,
            id: `${itemProps.id}-${instStart.getTime()}`,
            start: instStart,
            end: instEnd
          })
        })
      } catch (e) {
        console.error('Failed to parse RRULE:', rruleStr, e)
        events.push(itemProps) // Fallback to single event
      }
    }

    // 1. Add GC Events
    if (gcEvents) {
      gcEvents.forEach((ev: GcEvent) => {
        processItem({
          id: `gc-${ev.id}`,
          title: ev.title,
          start: parseLocalDate(ev.start),
          end: parseLocalDate(ev.end),
          allDay: ev.allDay,
          source: 'google',
          originalEvent: ev,
          backgroundColor: ev.backgroundColor
        }, ev.rrule || null)
      })
    }

    // 2. Add MyTuDo Tasks (only active ones with dates)
    if (tasks) {
      tasks.forEach((item) => {
        const t = itemToTask(item)
        // Check if it's completed on the specific generated dates later?
        // Actually, if it has RRULE, we might need to filter out instances that are in completedDates.
        if (t.dueDate && (!t.completed || t.rrule)) {
          const start = parseLocalDate(t.dueDate)
          const isAllDay = !t.dueDate.includes('T')
          
          let end = parseLocalDate(t.dueDate)
          if (!isAllDay) {
            end.setHours(end.getHours() + 1)
          } else {
            // For react-big-calendar, all-day events should end on the NEXT day at 00:00
            end.setDate(end.getDate() + 1)
          }

          processItem({
            id: `task-${t.id}`,
            title: t.completed ? `✓ ${t.title}` : t.title,
            start,
            end,
            allDay: isAllDay,
            source: 'mytudo',
            originalEvent: t,
            backgroundColor: t.completed ? 'var(--success-soft)' : 'var(--accent)',
            textColor: t.completed ? 'var(--success)' : '#fff'
          }, t.rrule || null)
        }
      })
    }

    // Filter out generated instances that were explicitly marked as completed in MyTuDo (for tasks)
    return events.filter(ev => {
      if (ev.source === 'mytudo' && ev.originalEvent.rrule && ev.originalEvent.completedDates) {
        const instDateStr = ev.start.toISOString().split('T')[0]
        if (ev.originalEvent.completedDates.includes(instDateStr)) {
          // You could return false to hide it, or we mark it as completed visually
          ev.title = `✓ ${ev.originalEvent.title}`
          ev.backgroundColor = 'var(--success-soft)'
          ev.textColor = 'var(--success)'
        }
      }
      return true
    })
  }, [tasks, gcEvents, currentDate])

  const eventStyleGetter = (event: any, start: any, end: any, isSelected: boolean) => {
    return {
      style: {
        backgroundColor: event.backgroundColor || 'var(--accent)',
        color: event.textColor || '#fff',
        borderRadius: '4px',
        border: 'none',
        opacity: 0.9,
        fontSize: '0.75rem',
        fontFamily: "'DM Mono', monospace",
      }
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return
    const isConfirm = window.confirm('Deseja realmente excluir este item?')
    if (!isConfirm) return

    if (selectedEvent.source === 'mytudo') {
      import('@/app/lib/db').then(({ deleteTask }) => deleteTask(selectedEvent.originalEvent.id))
      if (selectedEvent.originalEvent.eventId) {
        await deleteTaskFromGoogleCalendar(selectedEvent.originalEvent.eventId)
      }
    } else {
      await deleteEventFromGoogleCalendar(selectedEvent.originalEvent.id, selectedEvent.originalEvent.calendarId)
    }
    setSelectedEvent(null)
  }

  const handleEditSubmitTask = async (title: string, description: string, dueDate?: string, rrule?: string, eventId?: string, reminders?: any[]) => {
    const { editTask } = await import('@/app/lib/db')
    await editTask(selectedEvent.originalEvent.id, title, description, dueDate, rrule, eventId, reminders)
    setSelectedEvent(null)
  }

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Meu Calendário</h2>
        <div className={styles.actions}>
          {isSyncing && <span className={styles.syncBadge}>Sincronizando...</span>}
          <button onClick={() => {
            if (!isSyncing) {
              setTimeout(() => fetchCalendarEvents(), 0)
            }
          }} className={styles.syncBtn} disabled={isSyncing}>
            ↻ Atualizar
          </button>
        </div>
      </div>
      
      <div className={styles.calendarWrapper}>
        <Calendar
          localizer={localizer}
          events={unifiedEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day', 'agenda']}
          view={currentView}
          onView={(view: any) => setCurrentView(view)}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          eventPropGetter={eventStyleGetter}
          messages={{
            today: 'Hoje',
            previous: 'Anterior',
            next: 'Próximo',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'Não há eventos neste período.'
          }}
          onSelectEvent={(event) => {
            setSelectedEvent(event)
            setModalMode('view')
          }}
        />
      </div>

      {selectedEvent && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: 'var(--ink)' }}>
                {modalMode === 'view' ? selectedEvent.title : 'Editar Item'}
              </h3>
              <button onClick={() => setSelectedEvent(null)} className={styles.closeBtn}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              {modalMode === 'view' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedEvent.originalEvent.description && (
                    <div style={{ background: 'var(--bg-hover)', padding: '10px', borderRadius: '8px' }}>
                      <p style={{ color: 'var(--ink)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{selectedEvent.originalEvent.description}</p>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px', color: 'var(--ink)' }}>
                      Início: {moment(selectedEvent.start).format(selectedEvent.allDay ? 'LL' : 'LLL')}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px', color: 'var(--ink)' }}>
                      Fim: {moment(selectedEvent.end).format(selectedEvent.allDay ? 'LL' : 'LLL')}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: selectedEvent.backgroundColor, padding: '4px 8px', borderRadius: '4px', color: selectedEvent.textColor || '#fff' }}>
                      Tipo: {selectedEvent.source === 'mytudo' ? 'Tarefa MyTuDo' : 'Evento Google'}
                    </span>
                  </div>

                  {selectedEvent.originalEvent.rrule && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                      ↻ Recorrência Ativa ({selectedEvent.originalEvent.rrule})
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button onClick={() => setModalMode('edit')} className={styles.syncBtn} style={{ flex: 1, justifyContent: 'center' }}>
                      Editar
                    </button>
                    <button onClick={handleDelete} className={styles.syncBtn} style={{ flex: 1, justifyContent: 'center', backgroundColor: '#EA4335', color: 'white', border: 'none' }}>
                      Apagar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '16px' }}>
                  {selectedEvent.source === 'mytudo' ? (
                    <TaskForm
                      initialTab="task"
                      initialData={selectedEvent.originalEvent}
                      onAdd={handleEditSubmitTask}
                      onCancel={() => setModalMode('view')}
                    />
                  ) : (
                    <TaskForm
                      initialTab="event"
                      initialData={selectedEvent.originalEvent}
                      onAddEvent={async (payload: any) => {
                        await pushEventToGoogleCalendar(payload)
                        setSelectedEvent(null)
                      }}
                      onCancel={() => setModalMode('view')}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
