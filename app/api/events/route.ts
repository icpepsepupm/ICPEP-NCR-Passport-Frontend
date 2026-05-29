import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api/server-auth'
import { mapClientEventToDb, mapDbEvent } from '@/lib/api/mappers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const search = request.nextUrl.searchParams
    const q = search.get('q')?.trim().toLowerCase()
    const filter = search.get('filter') ?? 'all'
    const eventType = search.get('type')

    let query = supabase.from('events').select('*').order('schedule', { ascending: false })

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const today = new Date().toISOString()
    if (filter === 'upcoming') {
      query = query.gte('schedule', today)
    } else if (filter === 'past') {
      query = query.lt('schedule', today)
    }

    const { data: events, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: stats } = await supabase.from('event_stats').select('id, total_stamps')

    const statsMap = new Map(
      (stats ?? []).map((s: { id: number; total_stamps: number }) => [s.id, s.total_stamps])
    )

    let mapped = (events ?? []).map((row) =>
      mapDbEvent(row as Record<string, unknown>, statsMap.get(row.id) ?? 0)
    )

    if (q) {
      mapped = mapped.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({ success: true, data: mapped })
  } catch (error) {
    console.error('List events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const payload = mapClientEventToDb(body)

    if (!payload.name) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    const { data, error } = await auth.admin
      .from('events')
      .insert([{ ...payload, created_by: auth.userId }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: mapDbEvent(data as Record<string, unknown>, 0),
    })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

