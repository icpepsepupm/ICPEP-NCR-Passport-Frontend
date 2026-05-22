'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/api/errors'
import type { ClientUser } from '@/lib/api/mappers'

type School = { id: number; name: string; code: string }

export function useUsers(options?: {
  search?: string
  role?: string
  status?: string
}) {
  const [users, setUsers] = useState<ClientUser[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (options?.search) params.set('q', options.search)
      if (options?.role) params.set('role', options.role)
      if (options?.status) params.set('status', options.status)

      const qs = params.toString()
      const result = await apiClient.get<{ data: ClientUser[] }>(
        `/users${qs ? `?${qs}` : ''}`
      )
      setUsers(result.data ?? [])
    } catch (err) {
      setError(getErrorMessage(err))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [options?.search, options?.role, options?.status])

  const fetchSchools = useCallback(async () => {
    try {
      const result = await apiClient.get<{ data: School[] }>('/schools')
      setSchools(result.data ?? [])
    } catch {
      setSchools([])
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
    void fetchSchools()
  }, [fetchUsers, fetchSchools])

  const createUser = async (payload: Record<string, unknown>) => {
    const result = await apiClient.post<{ user: any; data: any }>('/users', payload)
    await fetchUsers()
    return result.user || result.data || result
  }

  const updateUser = async (id: string, payload: Record<string, unknown>) => {
    await apiClient.put(`/users/${id}`, payload)
    await fetchUsers()
  }

  const deleteUser = async (id: string) => {
    await apiClient.delete(`/users/${id}`)
    await fetchUsers()
  }

  return {
    users,
    schools,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  }
}
