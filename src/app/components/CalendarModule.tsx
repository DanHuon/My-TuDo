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

  // Fetch MyTuDo Tasks (that have due dates)
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

    // 1. Add GC Events
    if (gcEvents) {
      gcEvents.forEach((ev: GcEvent) => {
        events.push({
          id: `gc-${ev.id}`,
          title: ev.title,
          start: new Date(ev.start),
          end: new Date(ev.end),
          allDay: ev.allDay,
          source: 'google',
          originalEvent: ev,
          backgroundColor: ev.backgroundColor
        })
      })
    }

    // 2. Add MyTuDo Tasks (only active ones with dates)
    if (tasks) {
      tasks.forEach((item) => {
        const t = itemToTask(item)
        if (t.dueDate && !t.completed) {
          const start = new Date(t.dueDate)
          const isAllDay = !t.dueDate.includes('T')
          
          let end = new Date(t.dueDate)
          if (!isAllDay) {
            end.setHours(end.getHours() + 1)
          }

          events.push({
            id: `task-${t.id}`,
            title: t.completed ? `✓ ${t.title}` : t.title,
            start,
            end,
            allDay: isAllDay,
            source: 'mytudo',
            originalEvent: t,
            backgroundColor: t.completed ? 'var(--success-soft)' : 'var(--accent)',
            textColor: t.completed ? 'var(--success)' : '#fff'
          })
        }
      })
    }

    return events
  }, [tasks, gcEvents])

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
          <button onClick={() => fetchCalendarEvents()} className={styles.syncBtn}>
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
