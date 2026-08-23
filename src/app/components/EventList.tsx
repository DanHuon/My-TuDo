import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/app/lib/db'
import moment from 'moment'
import 'moment/locale/pt-br'

moment.locale('pt-br')

export default function EventList() {
  const events = useLiveQuery(() => db.gc_cache.toArray()) || []

  // Sort events by start date, showing future events first or closest
  const sortedEvents = [...events].sort((a, b) => new Date(a.start as string).getTime() - new Date(b.start as string).getTime())

  if (sortedEvents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>
        Nenhum evento encontrado no cache. Sincronize com o Google Calendar.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' }}>
      <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', color: 'var(--ink)', marginBottom: '16px' }}>
        Lista de Eventos (Cache Local)
      </h2>
      {sortedEvents.map(event => {
        const startDate = moment(event.start as string)
        const isPast = startDate.isBefore(moment())
        return (
          <div 
            key={event.id}
            style={{ 
              padding: '16px', 
              borderRadius: '8px', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border)',
              opacity: isPast ? 0.6 : 1,
              borderLeft: `4px solid ${event.backgroundColor || 'var(--accent)'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--ink)' }}>
                {event.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                {event.allDay ? 'Dia Inteiro' : startDate.format('LT')}
              </div>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '8px' }}>
              {startDate.format('LL')} {event.end && !event.allDay && `- ${moment(event.end as string).format('LT')}`}
            </div>

            {event.description && (
              <div style={{ fontSize: '0.85rem', color: 'var(--ink)', marginTop: '12px', whiteSpace: 'pre-wrap', background: 'var(--bg-hover)', padding: '8px', borderRadius: '4px' }}>
                {event.description}
              </div>
            )}
            
            {event.rrule && (
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '8px' }}>
                ↻ Recorrente ({event.rrule})
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
