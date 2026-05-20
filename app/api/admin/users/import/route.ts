// API Route: Admin - Create or import users in bulk
// POST /api/admin/users/import
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

    // Prepare users data for insertion
    const usersToInsert = users.map((u: any) => ({
      first_name: u.firstName,
      last_name: u.lastName,
      username: u.username,
      email: u.email,
      role: u.role || 'MEMBER',
      school_id: u.schoolId,
      member_id: u.memberId,
    }))

    // Batch insert users
    const { data, error } = await supabase
      .from('users')
      .insert(usersToInsert)
      .select()

    if (error) {
      console.error('Bulk user import error:', error)
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imported: data?.length || 0,
      users: data,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
