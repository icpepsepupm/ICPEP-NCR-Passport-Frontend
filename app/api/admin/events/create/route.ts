// API Route: Admin - Create event
// POST /api/admin/events/create
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
    const { name, schedule, venue_name, venue_image, description, badge, event_type } =
      body

    if (!name || !event_type) {
      return NextResponse.json(
        { error: 'name and event_type required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        name,
        schedule: schedule || new Date().toISOString(),
        venue_name: venue_name || '',
        venue_image,
        description,
        badge,
        event_type,
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, event: data })
  } catch (error) {
    console.error('Event creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
