import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api/server-auth'
import { mapClientEventToDb, mapDbEvent } from '@/lib/api/mappers'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', Number(id))
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    const { data: stat } = await supabase
      .from('event_stats')
      .select('total_stamps')
      .eq('id', Number(id))
      .maybeSingle()

    return NextResponse.json({
      success: true,
      data: mapDbEvent(data as Record<string, unknown>, stat?.total_stamps ?? 0),
    })
  } catch (error) {
    console.error('Get event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const body = await request.json()
    const payload = mapClientEventToDb(body)

    const { data, error } = await auth.admin
      .from('events')
      .update(payload)
      .eq('id', Number(id))
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
    console.error('Update event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const { error } = await auth.admin.from('events').delete().eq('id', Number(id))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
