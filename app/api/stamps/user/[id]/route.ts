import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mapDbStamp } from '@/lib/api/mappers'
import { resolveMemberUserId } from '@/lib/api/member-resolve'
import { requireSelfOrAdmin } from '@/lib/api/server-auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createServerSupabaseClient()
    const memberUuid = await resolveMemberUserId(supabase, id)

    if (!memberUuid) {
      return NextResponse.json({ success: true, data: [] })
    }

    const auth = await requireSelfOrAdmin(memberUuid)
    if (!auth.ok) return auth.response

    const { data: passport, error: passportError } = await supabase
      .from('passports')
      .select('id')
      .eq('member_id', memberUuid)
      .maybeSingle()

    if (passportError) {
      return NextResponse.json({ error: passportError.message }, { status: 500 })
    }

    if (!passport) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data: stamps, error } = await supabase
      .from('stamps')
      .select('*, events(*)')
      .eq('passport_id', passport.id)
      .order('stamp_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const mapped = (stamps ?? []).map((row) => {
      const event = (row as { events?: Record<string, unknown> }).events
      return mapDbStamp(row as Record<string, unknown>, event ?? null)
    })

    return NextResponse.json({ success: true, data: mapped })
  } catch (error) {
    console.error('User stamps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
