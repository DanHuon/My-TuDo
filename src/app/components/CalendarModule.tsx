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
import styles from './CalendarModule.module.css'

// Setup moment locale
moment.locale('pt-br')
const localizer = momentLocalizer(moment)

export default function CalendarModule() {
  const { session } = useAuth()
  const { fetchCalendarEvents, isSyncing } = useCalendarSync(session?.accessToken)
  const [currentView, setCurrentView] = useState(Views.MONTH)
  const [currentDate, setCurrentDate] = useState(new Date())

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
        if (t.dueDate && !t.completed) { // or should we show completed? Let's show completed with different style later
          const start = new Date(t.dueDate)
          const isAllDay = !t.dueDate.includes('T')
          
          let end = new Date(t.dueDate)
          if (!isAllDay) {
            end.setHours(end.getHours() + 1) // default 1 hour block
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
            // TODO: Open modal to edit task/event
            console.log('Selected Event:', event)
          }}
        />
      </div>
    </div>
  )
}
