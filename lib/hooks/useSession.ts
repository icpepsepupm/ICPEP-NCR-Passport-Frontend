// React hook for session management
'use client'
import { useEffect, useState } from 'react'
import { sessionManager } from '@/lib/supabase/session'

export function useSession() {
  const [isValid, setIsValid] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('Loading...')
  const [rememberMe, setRememberMe] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Initialize session state
  useEffect(() => {
    const { token, rememberMe: savedRememberMe } = sessionManager.getStoredSession()

    if (token) {
      setIsValid(sessionManager.isSessionValid())
      setTimeRemaining(sessionManager.getTimeRemainingReadable())
      setRememberMe(savedRememberMe)

      // Start auto-refresh
      const interval = sessionManager.startAutoRefresh()
      setAutoRefreshInterval(interval)
    }

    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
      }
    }
  }, [autoRefreshInterval])

  // Update time remaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(sessionManager.getTimeRemainingReadable())
      setIsValid(sessionManager.isSessionValid())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    isValid,
    timeRemaining,
    rememberMe,
    getTimeRemaining: () => sessionManager.getTimeRemaining(),
    refreshSession: () => sessionManager.refreshSession(rememberMe),
    clearSession: () => sessionManager.clearSession(),
  }
}
