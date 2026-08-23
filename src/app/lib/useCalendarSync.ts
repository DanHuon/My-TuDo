import { useCallback, useState } from 'react'
import { getGcEvents, putGcEvents, clearGcEvents, getTasks, editTask } from './db'
import { GcEvent, Task } from './types'

export function useCalendarSync(accessToken: string | undefined) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const fetchCalendarEvents = useCallback(async () => {
    if (!accessToken) return

    setIsSyncing(true)
    try {
      // 1. Fetch calendar list
      const calendarListRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!calendarListRes.ok) throw new Error('Failed to fetch calendar list')
      const calendarList = await calendarListRes.json()

      const allEvents: GcEvent[] = []
      
      // Fetch events from last 3 months to next 1 year to keep cache manageable
      const timeMin = new Date()
      timeMin.setMonth(timeMin.getMonth() - 3)
      const timeMax = new Date()
      timeMax.setFullYear(timeMax.getFullYear() + 1)

      // 2. Fetch events for each calendar
      for (const calendar of calendarList.items) {
        const eventsRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=false`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        if (!eventsRes.ok) continue
        
        const eventsData = await eventsRes.json()
        
        eventsData.items.forEach((item: any) => {
          if (item.status === 'cancelled') return

          // Google Calendar events can have start.dateTime or start.date (for all-day)
          const start = item.start?.dateTime || item.start?.date
          const end = item.end?.dateTime || item.end?.date
          if (!start || !end) return

          allEvents.push({
            id: item.id,
            calendarId: calendar.id,
            title: item.summary || '(Sem Título)',
            description: item.description || null,
            start,
            end,
            allDay: !!item.start?.date,
            rrule: item.recurrence ? item.recurrence.find((r: string) => r.startsWith('RRULE:'))?.replace('RRULE:', '') : null,
            backgroundColor: calendar.backgroundColor || '#4285F4',
            updatedAt: item.updated || new Date().toISOString()
          })
        })
      }

      // 3. Update local cache
      await clearGcEvents()
      await putGcEvents(allEvents)
      setLastSync(new Date())

    } catch (error) {
      console.error('Error syncing Google Calendar:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [accessToken])

  const pushTaskToGoogleCalendar = useCallback(async (task: Task) => {
    if (!accessToken) return null

    // We push tasks to the primary calendar
    const calendarId = 'primary'
    const isNew = !task.eventId

    // Build Event Body
    const eventBody: any = {
      summary: task.title,
      description: task.description || '',
      colorId: '5' // 5 is yellow in Google Calendar, distinguish tasks visually
    }

    if (task.dueDate) {
      if (task.dueDate.includes('T')) {
        eventBody.start = { dateTime: new Date(task.dueDate).toISOString() }
        const endDate = new Date(task.dueDate)
        endDate.setHours(endDate.getHours() + 1)
        eventBody.end = { dateTime: endDate.toISOString() }
      } else {
        eventBody.start = { date: task.dueDate }
        const endDate = new Date(task.dueDate)
        endDate.setDate(endDate.getDate() + 1)
        eventBody.end = { date: endDate.toISOString().split('T')[0] }
      }
    } else {
      return null // No due date, shouldn't be in calendar
    }

    if (task.rrule) eventBody.recurrence = [`RRULE:${task.rrule}`]
    if (task.reminders && task.reminders.length > 0) {
      eventBody.reminders = { useDefault: false, overrides: task.reminders }
    }

    try {
      const url = isNew 
        ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
        : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${task.eventId}`
      const method = isNew ? 'POST' : 'PATCH'
      
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody)
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('GC Error:', errText)
        throw new Error('Failed to push task to Google Calendar')
      }
      const data = await res.json()
      
      if (isNew) {
        await editTask(task.id, task.title, task.description || '', task.dueDate, task.rrule || undefined, data.id, task.reminders)
      }
      await fetchCalendarEvents()
      return data.id
    } catch (error) {
      console.error('Error pushing task to GC:', error)
      return null
    }
  }, [accessToken, fetchCalendarEvents])

  const deleteTaskFromGoogleCalendar = useCallback(async (eventId: string) => {
    if (!accessToken) return
    try {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      await fetchCalendarEvents()
    } catch (error) {
      console.error('Error deleting task from GC:', error)
    }
  }, [accessToken, fetchCalendarEvents])

  // --- Events CRUD ---
  const pushEventToGoogleCalendar = useCallback(async (event: Partial<GcEvent> & { isNew?: boolean }) => {
    if (!accessToken) return null

    const calendarId = event.calendarId || 'primary'
    const isNew = event.isNew

    const eventBody: any = {
      summary: event.title,
      description: event.description || '',
    }

    if (event.allDay) {
      eventBody.start = { date: event.start?.split('T')[0] }
      const endDate = new Date(event.end as string)
      endDate.setDate(endDate.getDate() + 1)
      eventBody.end = { date: endDate.toISOString().split('T')[0] }
    } else {
      eventBody.start = { dateTime: new Date(event.start as string).toISOString() }
      eventBody.end = { dateTime: new Date(event.end as string).toISOString() }
    }

    if (event.rrule) eventBody.recurrence = [`RRULE:${event.rrule}`]

    try {
      const url = isNew 
        ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
        : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.id}`
      const method = isNew ? 'POST' : 'PATCH'
      
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody)
      })

      if (!res.ok) throw new Error('Failed to push event to Google Calendar')
      await fetchCalendarEvents()
      const data = await res.json()
      return data.id
    } catch (error) {
      console.error('Error pushing event to GC:', error)
      return null
    }
  }, [accessToken, fetchCalendarEvents])

  const deleteEventFromGoogleCalendar = useCallback(async (eventId: string, calendarId: string = 'primary') => {
    if (!accessToken) return
    try {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      await fetchCalendarEvents()
    } catch (error) {
      console.error('Error deleting event from GC:', error)
    }
  }, [accessToken, fetchCalendarEvents])

  return {
    isSyncing,
    lastSync,
    fetchCalendarEvents,
    pushTaskToGoogleCalendar,
    deleteTaskFromGoogleCalendar,
    pushEventToGoogleCalendar,
    deleteEventFromGoogleCalendar
  }
}
