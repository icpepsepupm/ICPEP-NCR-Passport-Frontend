// Supabase admin utilities (server-only)
// Use only with SUPABASE_SERVICE_ROLE_KEY
import { createClient } from '@supabase/supabase-js'
import { idGenerator } from '@/lib/utils/id-generator'

export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
}

export const adminQueries = {
  // Create user with auth + profile
  async createUserWithAuth(
    email: string,
    password: string,
    userData: {
      first_name: string
      last_name: string
      username?: string
      role: 'ADMIN' | 'SCANNER' | 'MEMBER'
      school_id?: number
      member_id?: string
      ecertificate_url?: string
    }
  ) {
    const admin = createAdminClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return { data: null, error: authError }
    }

    // 2. Get school code for ID generation
    let schoolCode = 'DEFAULT'
    if (userData.school_id) {
      const { data: schoolData } = await admin
        .from('schools')
        .select('code')
        .eq('id', userData.school_id)
        .single()
      
      schoolCode = schoolData?.code || 'DEFAULT'
    }

    // 3. Generate full ID: ICPEPSE-NCR-{SCHOOLCODE}-{ID}
    const userId = idGenerator.generateUserId()
    const fullId = idGenerator.generateFullId(schoolCode, userId)

    // 4. Create user profile with generated ID
    const { data, error } = await admin
      .from('users')
      .insert([
        {
          ...userData,
          id: authData.user.id,
          email,
          username: userData.username || fullId,
          full_id: fullId,  // ICPEPSE-NCR-XXX-XXXXXX
        },
      ])
      .select()
      .single()

    return { data, error }
  },

  // Delete user (auth + profile)
  async deleteUser(userId: string) {
    const admin = createAdminClient()

    // Delete profile first
    const { error: profileError } = await admin
      .from('users')
      .delete()
      .eq('id', userId)

    if (profileError) return { error: profileError }

    // Delete auth user
    const { error: authError } = await admin.auth.admin.deleteUser(userId)

    return { error: authError }
  },

  // List all users with pagination
  async listUsers(page = 1, limit = 50) {
    const admin = createAdminClient()
    const offset = (page - 1) * limit

    const { data, count, error } = await admin
      .from('users')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    return { data, count, error, page, limit }
  },

  // Update user role
  async updateUserRole(userId: string, role: 'ADMIN' | 'SCANNER' | 'MEMBER') {
    const admin = createAdminClient()
    return admin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()
  },

  // Disable user
  async disableUser(userId: string) {
    const admin = createAdminClient()
    return admin
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
  },

  // Reset user password
  async resetUserPassword(userId: string, newPassword: string) {
    const admin = createAdminClient()
    return admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })
  },

  // Bulk create users
  async bulkCreateUsers(
    users: Array<{
      email: string
      password: string
      first_name: string
      last_name: string
      username?: string
      role: 'ADMIN' | 'SCANNER' | 'MEMBER'
      school_id?: number
      member_id?: string
    }>
  ) {
    const results = []

    for (const user of users) {
      const result = await this.createUserWithAuth(user.email, user.password, {
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        role: user.role,
        school_id: user.school_id,
        member_id: user.member_id,
      })
      results.push(result)
    }

    const successful = results.filter(r => !r.error).length
    const failed = results.filter(r => r.error).length

    return { successful, failed, results }
  },
}
