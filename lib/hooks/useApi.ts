'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/api/errors'

type UseApiOptions<T> = {
  immediate?: boolean
  initialData?: T
}

export function useApi<T>(
  endpoint: string | null,
  options: UseApiOptions<T> = {}
) {
  const { immediate = true, initialData } = options
  const [data, setData] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(immediate && !!endpoint)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!endpoint) return

    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<{ data?: T } & T>(endpoint)
      const payload = (result as { data?: T }).data ?? (result as T)
      setData(payload)
      return payload
    } catch (err) {
      setError(getErrorMessage(err))
      setData(initialData)
      throw err
    } finally {
      setLoading(false)
    }
  }, [endpoint, initialData])

  useEffect(() => {
    if (immediate && endpoint) {
      void fetchData()
    }
  }, [endpoint, immediate, fetchData])

  return { data, loading, error, refetch: fetchData, setData }
}
