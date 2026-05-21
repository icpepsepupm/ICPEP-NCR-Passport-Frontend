import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/server-auth'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['SCANNER', 'ADMIN'])
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { passportId, eventId, memberId } = body

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    let resolvedPassportId = passportId

    if (!resolvedPassportId && memberId) {
      const { data: userRow } = await auth.admin
        .from('users')
        .select('id')
        .or(`id.eq.${memberId},member_id.eq.${memberId},username.eq.${memberId}`)
        .maybeSingle()

      const memberUuid = userRow?.id ?? memberId

      const { data: passport } = await auth.admin
        .from('passports')
        .select('id')
        .eq('member_id', memberUuid)
        .maybeSingle()

      if (!passport) {
        const { data: createdPassport, error: createPassportError } = await auth.admin
          .from('passports')
          .insert([{ member_id: memberUuid }])
          .select('id')
          .single()

        if (createPassportError || !createdPassport) {
          return NextResponse.json(
            { error: 'Passport not found for member' },
            { status: 404 }
          )
        }
        resolvedPassportId = createdPassport.id
      } else {
        resolvedPassportId = passport.id
      }
    }

    if (!resolvedPassportId) {
      return NextResponse.json(
        { error: 'passportId or memberId required' },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase.rpc('create_stamp', {
      p_passport_id: resolvedPassportId,
      p_event_id: eventId,
      p_scanner_id: auth.userId,
    })

    if (error) {
      console.error('Stamp creation error:', error)
      return NextResponse.json({ error: 'Failed to create stamp' }, { status: 500 })
    }

    const result = data as { success?: boolean; error?: string; message?: string }

    if (result?.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'STAMP_ALREADY_EXISTS',
          message: 'Member already checked in for this event',
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result?.message ?? 'Stamp created successfully',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
