'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
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

const translateRRule = (rruleStr: any) => {
  if (!rruleStr) return ''
  if (typeof rruleStr !== 'string') {
    if (Array.isArray(rruleStr)) rruleStr = rruleStr.find(r => typeof r === 'string' && r.startsWith('RRULE:'))?.replace('RRULE:', '') || ''
    if (typeof rruleStr !== 'string') return ''
  }
  const parts = rruleStr.split(';').reduce((acc: any, part: string) => {
    const [key, val] = part.split('=')
    acc[key] = val
    return acc
  }, {} as Record<string, string>)
  
  let result = ''
  if (parts['FREQ'] === 'DAILY') result = 'Diariamente'
  else if (parts['FREQ'] === 'WEEKLY') {
    if (parts['BYDAY']) {
      const days = parts['BYDAY'].split(',').map(d => {
        if (d === 'MO') return 'segunda-feira'
        if (d === 'TU') return 'terça-feira'
        if (d === 'WE') return 'quarta-feira'
        if (d === 'TH') return 'quinta-feira'
        if (d === 'FR') return 'sexta-feira'
        if (d === 'SA') return 'sábado'
        if (d === 'SU') return 'domingo'
        return d
      })
      result = `Semanal: cada ${days.join(', ')}`
    } else {
      result = 'Semanalmente'
    }
  }
  else if (parts['FREQ'] === 'MONTHLY') result = 'Mensalmente'
  else if (parts['FREQ'] === 'YEARLY') result = 'Anualmente'
  else result = 'Recorrente'
  
  if (parts['UNTIL']) {
    try {
      const until = parts['UNTIL']
      const year = until.substring(0, 4)
      const month = until.substring(4, 6)
      const day = until.substring(6, 8)
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      if (!isNaN(date.getTime())) {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
        const formattedDate = date.toLocaleDateString('en-GB', options)
        result += `, até ${formattedDate}`
      }
    } catch (e) {
      // ignore
    }
  } else if (parts['COUNT']) {
    result += `, ${parts['COUNT']} vezes`
  }
  
  return result
}

export default function CalendarModule() {
  const { session } = useAuth()
  const { fetchCalendarEvents, isSyncing, pushEventToGoogleCalendar, deleteEventFromGoogleCalendar, deleteTaskFromGoogleCalendar, calendars } = useCalendarSync(session?.accessToken)
  const [currentView, setCurrentView] = useState(Views.MONTH)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view')

    const tasks = useLiveQuery(
    () => db.items.where({ type: 'task', isDeleted: 0 }).toArray()
  )

  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.targetTouches[0].clientX
    touchEndX.current = currentX
    if (touchStartX.current !== null) {
      setSwipeOffset(currentX - touchStartX.current)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (!touchStartX.current || !touchEndX.current) {
      setSwipeOffset(0)
      return
    }
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe || isRightSwipe) {
      const newDate = new Date(currentDate)
      const amount = isLeftSwipe ? 1 : -1

      if (currentView === Views.MONTH) {
        newDate.setMonth(newDate.getMonth() + amount)
      } else if (currentView === Views.WEEK) {
        newDate.setDate(newDate.getDate() + amount * 7)
      } else if (currentView === Views.DAY) {
        newDate.setDate(newDate.getDate() + amount)
      }
      
      setCurrentDate(newDate)
      setSlideDirection(isLeftSwipe ? 'left' : 'right')
    }
    
    setSwipeOffset(0)
    touchStartX.current = null
    touchEndX.current = null
  }

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => toolbar.onNavigate('PREV')
    const goToNext = () => toolbar.onNavigate('NEXT')
    const goToCurrent = () => toolbar.onNavigate('TODAY')

    return (
      <div className={styles.customToolbar}>
        <div className={styles.toolbarNav}>
          <button onClick={goToCurrent} className={styles.toolbarBtn}>Hoje</button>
          <button onClick={goToBack} className={styles.toolbarBtn}>{'<'}</button>
          <button onClick={goToNext} className={styles.toolbarBtn}>{'>'}</button>
        </div>
        
        <div className={styles.toolbarLabel}>
          <span>{toolbar.label}</span>
          {isSyncing && (
            <span className={styles.syncBadgeInline}>↻ Sincronizando...</span>
          )}
        </div>

        <div className={styles.toolbarViews}>
          {toolbar.views.map((name: string) => (
            <button
              key={name}
              className={`${styles.toolbarBtn} ${toolbar.view === name ? styles.toolbarBtnActive : ''}`}
              onClick={() => toolbar.onView(name)}
            >
              {name === 'month' ? 'Mês' : name === 'week' ? 'Semana' : name === 'day' ? 'Dia' : 'Agenda'}
            </button>
          ))}
        </div>
      </div>
    )
  }

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
      if (itemProps.allDay) {
        if (itemProps.source === 'google') {
          itemProps.start = new Date(itemProps.start.getFullYear(), itemProps.start.getMonth(), itemProps.start.getDate(), 0, 0, 0);
          itemProps.end = new Date(itemProps.end.getFullYear(), itemProps.end.getMonth(), itemProps.end.getDate(), 0, 0, 0);
        } else {
          // MyTuDo tasks are already inclusive (start and end are the same day). Just zero out the times, but wait, if they are inclusive, we MUST add 1 day so RBC renders them correctly!
          // But let's just make both exclusive in DB? No, MyTuDo tasks are usually 1 day tasks. Let's add 1 day to make it exclusive for RBC.
          itemProps.start = new Date(itemProps.start.getFullYear(), itemProps.start.getMonth(), itemProps.start.getDate(), 0, 0, 0);
          itemProps.end = new Date(itemProps.end.getFullYear(), itemProps.end.getMonth(), itemProps.end.getDate() + 1, 0, 0, 0);
        }
      }

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
          let instEnd = new Date(instStart.getTime() + durMs)
          
          // durMs will be 24h for GC events, 0 for MyTuDo tasks.
          // instEnd naturally falls exactly on 00:00:00 (either next day or same day)

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
      <div 
        className={`${styles.calendarWrapper} ${slideDirection ? styles[`slideIn_${slideDirection}`] : ''}`}
        style={{ 
          transform: isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)',
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onAnimationEnd={() => setSlideDirection(null)}
      >
        <Calendar
          localizer={localizer}
          events={unifiedEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          components={{
            toolbar: CustomToolbar
          }}
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
          selectable={true}
          onSelectSlot={(slotInfo) => {
            const isAllDay = slotInfo.start.getHours() === 0 && slotInfo.start.getMinutes() === 0 && 
                             (slotInfo.end.getHours() === 0 || slotInfo.end.getHours() === 23)
                             
            const st = moment(slotInfo.start)
            
            let endStr = ''
            if (slotInfo.slots.length > 1) {
              if (isAllDay) {
                endStr = moment(slotInfo.end).subtract(1, 'days').format('YYYY-MM-DD')
              } else {
                endStr = moment(slotInfo.end).format('YYYY-MM-DDTHH:mm')
              }
            }

            const newEv = {
              title: '',
              start: st.format(isAllDay ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm'),
              end: endStr,
              dueDate: st.format(isAllDay ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm'),
              allDay: isAllDay,
              calendarId: 'primary'
            }
            setSelectedEvent({
              title: 'Novo Item',
              source: 'calendar_click',
              start: slotInfo.start,
              end: slotInfo.end,
              allDay: isAllDay,
              originalEvent: newEv,
              isNew: true
            })
            setModalMode('edit')
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
                      Início: {moment(selectedEvent.start).format(selectedEvent.allDay ? 'DD/MM/YYYY' : 'DD/MM/YYYY [às] HH:mm')}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px', color: 'var(--ink)' }}>
                      Fim: {moment(selectedEvent.allDay ? new Date(selectedEvent.end.getTime() - 86400000) : selectedEvent.end).format(selectedEvent.allDay ? 'DD/MM/YYYY' : 'DD/MM/YYYY [às] HH:mm')}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: selectedEvent.backgroundColor, padding: '4px 8px', borderRadius: '4px', color: selectedEvent.textColor || '#fff' }}>
                      Tipo: {selectedEvent.source === 'mytudo' ? 'Tarefa MyTuDo' : 'Evento Google'}
                    </span>
                  </div>

                  {selectedEvent.originalEvent.rrule && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                      ↻ Recorrência Ativa ({translateRRule(selectedEvent.originalEvent.rrule)})
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
                  {selectedEvent.source === 'calendar_click' ? (
                    <TaskForm
                      initialTab="event"
                      initialData={selectedEvent.originalEvent}
                      onAddEvent={async (payload: any) => {
                        await pushEventToGoogleCalendar(payload)
                        setSelectedEvent(null)
                      }}
                      onAdd={async (title, desc, dueDate, rrule, eventId, reminders) => {
                        const { addTask } = await import('@/app/lib/db')
                        await addTask(title, desc, dueDate, rrule, reminders)
                        setSelectedEvent(null)
                      }}
                      onCancel={() => setModalMode('view')}
                      calendars={calendars}
                    />
                  ) : selectedEvent.source === 'mytudo' ? (
                    <TaskForm
                      initialTab="task"
                      initialData={selectedEvent.originalEvent}
                      onAdd={handleEditSubmitTask}
                      onCancel={() => setModalMode('view')}
                      calendars={calendars}
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
                      calendars={calendars}
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
