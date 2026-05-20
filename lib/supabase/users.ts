// User data access functions
import { createClient } from './client'

export const userQueries = {
  // Get current user profile
  async getCurrentUserProfile() {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { data: null, error: authError }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return { data, error }
  },

  // Get user by ID
  async getUserById(userId: string) {
    const supabase = createClient()
    return supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
  },

  // Get user by username
  async getUserByUsername(username: string) {
    const supabase = createClient()
    return supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
  },

  // Get all users (admin only)
  async getAllUsers() {
    const supabase = createClient()
    return supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
  },

  // Get users by role
  async getUsersByRole(role: 'ADMIN' | 'SCANNER' | 'MEMBER') {
    const supabase = createClient()
    return supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false })
  },

  // Get users by school
  async getUsersBySchool(schoolId: number) {
    const supabase = createClient()
    return supabase
      .from('users')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Record<string, any>) {
    const supabase = createClient()
    return supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
  },

  // Search users
  async searchUsers(query: string) {
    const supabase = createClient()
    return supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
  },
}
