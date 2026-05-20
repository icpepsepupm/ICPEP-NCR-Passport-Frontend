// API Route: Admin - Get event attendance report
// GET /api/admin/reports/event-attendance?eventId=X
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stampQueries } from '@/lib/supabase/passports'

export async function GET(request: NextRequest) {
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

    const eventId = request.nextUrl.searchParams.get('eventId')
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }

    // Get event attendance using PL/pgSQL function
    const { data: attendanceData, error } = await stampQueries.getEventStamps(
      parseInt(eventId)
    )

    if (error) {
      console.error('Event attendance error:', error)
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      eventId,
      attendance: attendanceData,
      total: attendanceData?.length || 0,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
