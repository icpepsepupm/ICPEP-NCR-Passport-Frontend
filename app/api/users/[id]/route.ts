import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api/server-auth'
import { mapClientUserToDb, mapDbUser } from '@/lib/api/mappers'
import { adminQueries } from '@/lib/supabase/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('users')
      .select('*, schools(id, name, code)')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    const user = mapDbUser(data as Record<string, unknown>)
    const school = (data as { schools?: { id: number; name: string; code: string } }).schools

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        school: school ?? null,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const body = await request.json()
    const updates = mapClientUserToDb(body)

    if (body.password) {
      await adminQueries.resetUserPassword(id, body.password)
    }

    const { data, error } = await auth.admin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: mapDbUser(data as Record<string, unknown>),
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const { error } = await adminQueries.deleteUser(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
