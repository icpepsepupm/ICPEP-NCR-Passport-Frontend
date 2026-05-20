// Auth utility functions for Supabase
import { createClient } from './client'

export const authClient = {
  // Sign up new user (admin-created or self-registration)
  async signUp(email: string, password: string) {
    const supabase = createClient()
    return supabase.auth.signUp({
      email,
      password,
    })
  },

  // Sign in user
  async signIn(email: string, password: string) {
    const supabase = createClient()
    return supabase.auth.signInWithPassword({
      email,
      password,
    })
  },

  // Get current session
  async getSession() {
    const supabase = createClient()
    return supabase.auth.getSession()
  },

  // Get current user
  async getUser() {
    const supabase = createClient()
    return supabase.auth.getUser()
  },

  // Sign out user
  async signOut() {
    const supabase = createClient()
    return supabase.auth.signOut()
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange(callback)
  },

  // Get refresh token
  async refreshSession() {
    const supabase = createClient()
    return supabase.auth.refreshSession()
  },
}
