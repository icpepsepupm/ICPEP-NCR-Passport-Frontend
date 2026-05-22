// API Route: Admin - Create user
// POST /api/admin/users/create
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { adminQueries } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verify ADMIN role
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
    const {
      password,
      first_name,
      last_name,
      email,
      role,
      school_id,
    } = body

    if (!password || !first_name || !last_name || !email || !role || !school_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch school code
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('code')
      .eq('id', school_id)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ error: 'Invalid school ID provided' }, { status: 400 })
    }

    // Get user count for this school to generate AUTOINCREMENTID
    const { count, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', school_id)

    if (countError) {
      return NextResponse.json({ error: 'Failed to calculate the next Member ID' }, { status: 500 })
    }

    const paddedId = String((count || 0) + 1).padStart(4, '0')
    const generatedMemberId = `ICPEPSE-NCR-${school.code.toUpperCase()}-${paddedId}`

    const { data, error } = await adminQueries.createUserWithAuth(email, password, {
      first_name,
      last_name,
      role,
      school_id,
      member_id: generatedMemberId,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
