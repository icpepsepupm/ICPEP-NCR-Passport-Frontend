// Authentication utilities - ID + Password only (no OAuth)
import { createClient } from './client'

export const authClient = {
  // Sign in with username/ID + password
  async signIn(username: string, password: string) {
    const supabase = createClient()
    
    // Get user by username first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('username', username)
      .single()

    if (userError || !userData?.email) {
      return { 
        data: null, 
        error: { message: 'User not found' } 
      }
    }

    // Sign in with email + password
    return supabase.auth.signInWithPassword({
      email: userData.email,
      password,
    })
  },

  // Sign out
  async signOut() {
    const supabase = createClient()
    return supabase.auth.signOut()
  },

  // Get current user
  async getUser() {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  // Get session
  async getSession() {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  // Refresh session
  async refreshSession() {
    const supabase = createClient()
    return supabase.auth.refreshSession()
  },

  // Check if password is valid (for validation)
  async verifyPassword(email: string, password: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return !error
  },
}
