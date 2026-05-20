// React Hook: useUserProfile - Fetch current user profile
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { userQueries } from '@/lib/supabase/users'

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const { data, error: queryError } = await userQueries.getUserById(user.id)
        if (queryError) throw queryError
        setProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'))
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  return { profile, loading, error }
}
