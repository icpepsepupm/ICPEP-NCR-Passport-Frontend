// React Hook: useEvents - Fetch events with optional filtering
'use client'

import { useState, useEffect } from 'react'
import { eventQueries } from '@/lib/supabase/events'

type EventFilter = 'all' | 'upcoming' | 'past' | 'type'

export function useEvents(filter: EventFilter = 'all', eventType?: string) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        let result

        switch (filter) {
          case 'upcoming':
            result = await eventQueries.getUpcomingEvents()
            break
          case 'past':
            result = await eventQueries.getPastEvents()
            break
          case 'type':
            if (!eventType) throw new Error('eventType required')
            result = await eventQueries.getEventsByType(eventType)
            break
          default:
            result = await eventQueries.getAllEvents()
        }

        if (result.error) throw result.error
        setEvents(result.data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch events'))
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [filter, eventType])

  return { events, loading, error }
}
