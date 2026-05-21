// React Hook: usePassport - Fetch member passport and attendance
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { apiClient } from '@/lib/api/client'

export function usePassport() {
  const { user } = useAuth()
  const [passport, setPassport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setPassport(null)
      setLoading(false)
      return
    }

    const fetchPassport = async () => {
      try {
        setLoading(true)
        const result = await apiClient.get('/passport')
        setPassport(result.data)
      } catch (err) {
        // Passport might not exist yet, which is fine
        setPassport(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPassport()
  }, [user])

  return { passport, loading, error }
}
