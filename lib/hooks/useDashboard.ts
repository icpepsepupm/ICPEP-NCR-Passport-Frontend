'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/api/errors'

export type DashboardData = {
  totals: { users: number; events: number; stamps: number }
  upcomingEvents: Array<{
    id: number
    name: string
    schedule: string | null
    venue_name: string | null
  }>
  role: string
}

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<{ data: DashboardData }>('/dashboard')
      setDashboard(result.data ?? null)
    } catch (err) {
      setError(getErrorMessage(err))
      setDashboard(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDashboard()
  }, [fetchDashboard])

  return { dashboard, loading, error, refetch: fetchDashboard }
}
