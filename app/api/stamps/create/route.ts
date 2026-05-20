// API Route: Scan QR and create stamp
// POST /api/stamps/create
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stampQueries } from '@/lib/supabase/passports'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verify user is authenticated and is SCANNER
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'SCANNER') {
      return NextResponse.json(
        { error: 'Only SCANNER role can create stamps' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { passportId, eventId } = body

    if (!passportId || !eventId) {
      return NextResponse.json(
        { error: 'passportId and eventId required' },
        { status: 400 }
      )
    }

    // Call PL/pgSQL function to create stamp safely
    const { data, error } = await stampQueries.createStamp(
      passportId,
      eventId,
      user.id
    )

    if (error) {
      console.error('Stamp creation error:', error)
      return NextResponse.json({ error: 'Failed to create stamp' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
