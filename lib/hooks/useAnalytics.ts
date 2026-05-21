'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/api/errors'

export type AnalyticsData = {
  totalUsers: number
  usersPerRole: Record<string, number>
  rolePercentages: Record<string, number>
  pendingMembers: number
  stampsPerEvent: Record<string, number>
  totalStamps: number
  avgStampsPerEvent: number
  mostPopularEvent?: Record<string, number>
  leastPopularEvent?: Record<string, number>
}

export function useAnalytics() {
  const [reports, setReports] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<{ data: AnalyticsData }>('/analytics')
      setReports(result.data ?? null)
    } catch (err) {
      setError(getErrorMessage(err))
      setReports(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAnalytics()
  }, [fetchAnalytics])

  return { reports, loading, error, refetch: fetchAnalytics }
}
