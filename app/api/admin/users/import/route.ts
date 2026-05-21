// API Route: Admin - Create or import users in bulk
// POST /api/admin/users/import
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { adminQueries } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verify user is authenticated and is ADMIN
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { users } = body

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'users array required' },
        { status: 400 }
      )
    }

    // Batch create users properly using auth and full_id generation
    const { successful, failed, results } = await adminQueries.bulkCreateUsers(
      users.map((u: any) => ({
        first_name: u.firstName,
        last_name: u.lastName,
        username: u.username,
        email: u.email,
        password: u.password || 'TempPassword123!@', // Default if not provided
        role: u.role || 'MEMBER',
        school_id: u.schoolId,
        member_id: u.memberId,
      }))
    )

    if (failed > 0 && successful === 0) {
      return NextResponse.json({ error: 'All user imports failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imported: successful,
      failed: failed,
      users: results.map(r => r.data || r.error),
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
