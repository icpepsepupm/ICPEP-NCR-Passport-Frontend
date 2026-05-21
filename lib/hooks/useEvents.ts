'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/api/errors'
import type { ClientEvent } from '@/lib/api/mappers'

type EventFilter = 'all' | 'upcoming' | 'past'

export function useEvents(
  filter: EventFilter = 'all',
  options?: { search?: string; eventType?: string; enabled?: boolean }
) {
  const [events, setEvents] = useState<ClientEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ filter })
      if (options?.search) params.set('q', options.search)
      if (options?.eventType) params.set('type', options.eventType)

      const result = await apiClient.get<{ data: ClientEvent[] }>(
        `/events?${params.toString()}`
      )
      setEvents(result.data ?? [])
    } catch (err) {
      setError(getErrorMessage(err))
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [filter, options?.search, options?.eventType])

  useEffect(() => {
    if (options?.enabled === false) return
    void fetchEvents()
  }, [fetchEvents, options?.enabled])

  const createEvent = async (payload: Partial<ClientEvent>) => {
    const result = await apiClient.post<{ data: ClientEvent }>('/events', payload)
    await fetchEvents()
    return result.data
  }

  const updateEvent = async (id: number, payload: Partial<ClientEvent>) => {
    const result = await apiClient.put<{ data: ClientEvent }>(`/events/${id}`, payload)
    await fetchEvents()
    return result.data
  }

  const deleteEvent = async (id: number) => {
    await apiClient.delete(`/events/${id}`)
    await fetchEvents()
  }

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
