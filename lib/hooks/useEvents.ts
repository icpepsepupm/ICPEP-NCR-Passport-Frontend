// React Hook: useEvents - Fetch events with optional filtering
'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

type EventFilter = 'all' | 'upcoming' | 'past' | 'type'

export function useEvents(filter: EventFilter = 'all', eventType?: string) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ filter })
        if (eventType) params.append('type', eventType)

        const result = await apiClient.get(`/events?${params.toString()}`)
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
