// Session management utilities
import { createClient } from './client'
import { createServerSupabaseClient } from './server'

export const sessionManager = {
  // Store session in localStorage with expiration
  async storeSession(
    accessToken: string,
    rememberMe: boolean = false
  ) {
    const expiresIn = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000 // 7 days or 6 hours
    const expiresAt = new Date().getTime() + expiresIn

    localStorage.setItem('auth_token', accessToken)
    localStorage.setItem('auth_expires_at', expiresAt.toString())
    localStorage.setItem('auth_remember_me', rememberMe.toString())
  },

  // Get stored session
  getStoredSession() {
    const token = localStorage.getItem('auth_token')
    const expiresAt = localStorage.getItem('auth_expires_at')
    const rememberMe = localStorage.getItem('auth_remember_me') === 'true'

    return { token, expiresAt, rememberMe }
  },

  // Check if session is valid (not expired)
  isSessionValid(): boolean {
    const { token, expiresAt } = this.getStoredSession()

    if (!token || !expiresAt) return false

    const now = new Date().getTime()
    const expiration = parseInt(expiresAt, 10)

    return now < expiration
  },

  // Get time remaining in milliseconds
  getTimeRemaining(): number {
    const { expiresAt } = this.getStoredSession()

    if (!expiresAt) return 0

    const now = new Date().getTime()
    const expiration = parseInt(expiresAt, 10)
    const remaining = expiration - now

    return Math.max(0, remaining)
  },

  // Get time remaining in readable format
  getTimeRemainingReadable(): string {
    const ms = this.getTimeRemaining()

    if (ms === 0) return 'Expired'

    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`

    return `${seconds}s`
  },

  // Refresh session (extends expiration)
  async refreshSession(rememberMe?: boolean) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()

    if (error || !data.session?.access_token) {
      return { error }
    }

    this.storeSession(
      data.session.access_token,
      rememberMe ?? (localStorage.getItem('auth_remember_me') === 'true')
    )

    return { data, error: null }
  },

  // Clear session
  clearSession() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_expires_at')
    localStorage.removeItem('auth_remember_me')
  },

  // Auto-refresh session before expiration (refresh at 80% of duration)
  startAutoRefresh() {
    const interval = setInterval(() => {
      if (!this.isSessionValid()) {
        clearInterval(interval)
        return
      }

      const timeRemaining = this.getTimeRemaining()
      const refreshThreshold = 20 * 60 * 1000 // Refresh when 20 min left

      if (timeRemaining < refreshThreshold) {
        this.refreshSession()
      }
    }, 60000) // Check every 1 minute

    return interval
  },
}
