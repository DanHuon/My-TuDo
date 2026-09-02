'use client'

import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/app/lib/db'
import { GcEvent } from '@/app/lib/types'
import moment from 'moment'
import 'moment/locale/pt-br'
import { rrulestr } from 'rrule'
import TaskForm from './TaskForm'

moment.locale('pt-br')

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

const getNextOccurrence = (start: string, rruleStr: any) => {
  try {
    let formattedRule = rruleStr
    if (typeof formattedRule !== 'string') {
      if (Array.isArray(formattedRule)) formattedRule = formattedRule.find(r => typeof r === 'string' && r.startsWith('RRULE:'))?.replace('RRULE:', '') || ''
      if (typeof formattedRule !== 'string') return null
    }
    if (!formattedRule.startsWith('RRULE:')) {
      formattedRule = `RRULE:${formattedRule}`
    }
    const dtStartStr = new Date(start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    if (!formattedRule.includes('DTSTART')) {
      formattedRule = `DTSTART:${dtStartStr}\n${formattedRule}`
    }
    const rule = rrulestr(formattedRule)
    const now = new Date()
    
    // We want the next occurrence from today. 
    // Wait, rrule returns UTC dates. We shift it just like in CalendarModule.
    const instances = rule.between(now, new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()), true)
    
    if (instances.length > 0) {
      const origStart = new Date(start)
      const instStart = new Date(instances[0])
      
      // Keep the original time, but use the instance date
      const nextDate = new Date(instStart.getFullYear(), instStart.getMonth(), instStart.getDate(), origStart.getHours(), origStart.getMinutes())
      
      return nextDate
    }
  } catch (e) {
    console.error('Failed to parse RRULE:', rruleStr, e)
    return null
  }
  return null
}

interface EventListProps {
  calendars?: { id: string, summary: string, backgroundColor: string }[]
  onAddEvent?: (payload: Partial<GcEvent> & { isNew?: boolean }) => Promise<any>
  onDeleteEvent?: (eventId: string, calendarId: string) => Promise<void>
}

export default function EventList({ calendars = [], onAddEvent, onDeleteEvent }: EventListProps) {
  const events = useLiveQuery(() => db.gc_cache.toArray()) || []
  
  const [filterType, setFilterType] = useState<'todos' | 'recorrentes' | 'unicos'>('todos')
  const [filterCalendarId, setFilterCalendarId] = useState<string | null>(null)
  const [filterVirtual, setFilterVirtual] = useState<'aniversarios' | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<GcEvent | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view')

  const isAnniversary = (title: string) => {
    const t = title.toLowerCase()
    return t.includes('aniversário') || t.includes('birthday') || t.includes('parabéns')
  }

  const filteredEvents = useMemo(() => {
    let result = events
    if (filterType === 'recorrentes') result = result.filter(e => !!e.rrule)
    if (filterType === 'unicos') result = result.filter(e => !e.rrule && !(e.calendarId && e.calendarId.includes('holiday')) && !isAnniversary(e.title || ''))
    if (filterCalendarId) result = result.filter(e => e.calendarId === filterCalendarId)
    if (filterVirtual === 'aniversarios') result = result.filter(e => isAnniversary(e.title || ''))
    return result
  }, [events, filterType, filterCalendarId, filterVirtual])

  const availableCalendars = calendars && calendars.length > 0 
    ? calendars 
    : Array.from(new Set(events.map(e => e.calendarId))).map(id => ({ id, summary: id, backgroundColor: '#c8442f' }))

  const handleFilterCalendar = (id: string) => {
    if (filterCalendarId === id) {
      setFilterCalendarId(null)
    } else {
      setFilterCalendarId(id)
      setFilterVirtual(null)
    }
  }

  const handleFilterVirtual = (type: 'aniversarios') => {
    if (filterVirtual === type) {
      setFilterVirtual(null)
    } else {
      setFilterVirtual(type)
      setFilterCalendarId(null)
    }
  }

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let dateA = new Date(a.start as string)
    let dateB = new Date(b.start as string)
    
    if (a.rrule) {
      const nextA = getNextOccurrence(a.start as string, a.rrule)
      if (nextA) dateA = nextA
    }
    if (b.rrule) {
      const nextB = getNextOccurrence(b.start as string, b.rrule)
      if (nextB) dateB = nextB
    }
    
    const now = new Date().getTime()
    const diffA = dateA.getTime() - now
    const diffB = dateB.getTime() - now
    
    if (diffA >= 0 && diffB >= 0) return diffA - diffB
    if (diffA < 0 && diffB < 0) return diffB - diffA
    return diffA >= 0 ? -1 : 1
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px', width: '100%', minWidth: 0 }}>
      <div style={{ padding: '0 8px', maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch' }}>
          <button 
            onClick={() => { setFilterType('todos'); setFilterCalendarId(null); setFilterVirtual(null); }} 
            style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: filterType === 'todos' && !filterCalendarId && !filterVirtual ? 'var(--accent)' : 'transparent', color: filterType === 'todos' && !filterCalendarId && !filterVirtual ? '#fff' : 'var(--ink)', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            Todos
          </button>
          <button 
            onClick={() => { setFilterType('recorrentes'); setFilterCalendarId(null); setFilterVirtual(null); }} 
            style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: filterType === 'recorrentes' ? 'var(--accent)' : 'transparent', color: filterType === 'recorrentes' ? '#fff' : 'var(--ink)', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            Recorrentes
          </button>
          <button 
            onClick={() => { setFilterType('unicos'); setFilterCalendarId(null); setFilterVirtual(null); }} 
            style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: filterType === 'unicos' ? 'var(--accent)' : 'transparent', color: filterType === 'unicos' ? '#fff' : 'var(--ink)', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            Únicos
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px', flexShrink: 0 }} />
          <button 
            onClick={() => handleFilterVirtual('aniversarios')} 
            style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #92e1c0', background: filterVirtual === 'aniversarios' ? '#92e1c0' : 'transparent', color: filterVirtual === 'aniversarios' ? '#000' : 'var(--ink)', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            Aniversários
          </button>
          {availableCalendars.map(cal => (
            <button 
              key={cal.id}
              onClick={() => handleFilterCalendar(cal.id)} 
              style={{ padding: '6px 16px', borderRadius: '20px', border: `1px solid ${cal.backgroundColor}`, background: filterCalendarId === cal.id ? cal.backgroundColor : 'transparent', color: filterCalendarId === cal.id ? '#fff' : 'var(--ink)', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            >
              {cal.summary === 'primary' ? 'Principal' : cal.summary}
            </button>
          ))}
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>
          Nenhum evento encontrado para estes filtros.
        </div>
      ) : (
        sortedEvents.map(event => {
          const startDate = moment(event.start as string)
          let displayDate = startDate
          let isNext = false

          if (event.rrule) {
            const nextOcc = getNextOccurrence(event.start as string, event.rrule)
            if (nextOcc) {
              displayDate = moment(nextOcc)
              isNext = true
            }
          }

          const isPast = displayDate.isBefore(moment())

          return (
            <div 
              key={event.id}
              onClick={() => { setSelectedEvent(event); setModalMode('view'); }}
              style={{ 
                padding: '16px', 
                borderRadius: '8px', 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)',
                opacity: isPast ? 0.6 : 1,
                borderLeft: `4px solid ${event.backgroundColor || 'var(--accent)'}`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--ink)' }}>
                  {event.title || '(Sem Título)'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                  {event.allDay ? 'Dia Inteiro' : startDate.format('LT')}
                </div>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{displayDate.format('LL')}</span>
                {isNext && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: '4px' }}>Próxima</span>}
              </div>

              {event.description && (
                <div style={{ fontSize: '0.85rem', color: 'var(--ink)', marginTop: '12px', whiteSpace: 'pre-wrap', background: 'var(--bg-hover, rgba(0,0,0,0.05))', padding: '8px', borderRadius: '4px' }}>
                  {event.description}
                </div>
              )}
              
              {event.rrule && (
                <div style={{ fontSize: '0.8rem', color: '#c8442f', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>↻</span> {(() => {
                    try {
                      return translateRRule(event.rrule)
                    } catch {
                      return 'Recorrência'
                    }
                  })()}
                </div>
              )}
            </div>
          )
        })
      )}

      {selectedEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} onClick={() => setSelectedEvent(null)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', width: '100%', maxWidth: '600px', padding: '24px', boxShadow: 'var(--shadow-hover)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: 'var(--ink)' }}>
                {modalMode === 'view' ? selectedEvent.title : 'Editar Evento'}
              </h3>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            {modalMode === 'view' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedEvent.description && (
                  <div style={{ background: 'var(--bg-hover)', padding: '10px', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--ink)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{selectedEvent.description}</p>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px', color: 'var(--ink)' }}>
                    Início: {moment(selectedEvent.start).format(selectedEvent.allDay ? 'DD/MM/YYYY' : 'DD/MM/YYYY [às] HH:mm')}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px', color: 'var(--ink)' }}>
                    Fim: {moment(selectedEvent.allDay ? new Date(new Date(selectedEvent.end).getTime() - 86400000) : selectedEvent.end).format(selectedEvent.allDay ? 'DD/MM/YYYY' : 'DD/MM/YYYY [às] HH:mm')}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: selectedEvent.backgroundColor || 'var(--accent)', padding: '4px 8px', borderRadius: '4px', color: '#fff' }}>
                    Tipo: Evento Google
                  </span>
                </div>

                {selectedEvent.rrule && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                    ↻ Recorrência Ativa ({(() => {
                      try {
                        const { translateRRule } = require('./CalendarModule')
                        // Wait, translateRRule is defined in CalendarModule, I should just recreate a simple one or use includes.
                        if (selectedEvent.rrule.includes('YEARLY')) return 'Anualmente'
                        if (selectedEvent.rrule.includes('MONTHLY')) return 'Mensalmente'
                        if (selectedEvent.rrule.includes('WEEKLY')) return 'Semanalmente'
                        return 'Diariamente'
                      } catch {
                        return 'Recorrência'
                      }
                    })()})
                  </div>
                )}

                {selectedEvent.reminders && selectedEvent.reminders.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--ink)' }}>Notificações:</span>
                    {selectedEvent.reminders.map((r: any, idx: number) => {
                      let label = `${r.minutes} minutos antes`;
                      if (r.minutes % 10080 === 0) label = `${r.minutes / 10080} semanas antes`;
                      else if (r.minutes % 1440 === 0) label = `${r.minutes / 1440} dias antes`;
                      else if (r.minutes % 60 === 0) label = `${r.minutes / 60} horas antes`;
                      return (
                        <span key={idx} style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                          🔔 {r.method === 'email' ? 'E-mail' : 'Pop-up'} - {label}
                        </span>
                      )
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button onClick={() => setModalMode('edit')} style={{ flex: 1, padding: '8px 16px', borderRadius: '4px', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                    Editar
                  </button>
                  {onDeleteEvent && (
                    <button onClick={async () => {
                      if (confirm('Deseja realmente apagar este evento?')) {
                        await onDeleteEvent(selectedEvent.id, selectedEvent.calendarId)
                        setSelectedEvent(null)
                      }
                    }} style={{ flex: 1, padding: '8px 16px', borderRadius: '4px', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      Apagar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <TaskForm
                initialTab="event"
                initialData={selectedEvent}
                onAddEvent={async (payload) => {
                  if (onAddEvent) await onAddEvent(payload)
                  setSelectedEvent(null)
                }}
                onCancel={() => setSelectedEvent(null)}
                calendars={calendars}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
