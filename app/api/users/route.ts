import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/server-auth'
import { mapClientUserToDb, mapDbUser } from '@/lib/api/mappers'
import { adminQueries } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase()
    const role = request.nextUrl.searchParams.get('role')
    const status = request.nextUrl.searchParams.get('status')

    let query = auth.admin.from('users').select('*').order('created_at', { ascending: false })

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    if (status === 'APPROVED') {
      query = query.eq('is_active', true)
    } else if (status === 'PENDING') {
      query = query.eq('is_active', false)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let users = (data ?? []).map((row) => mapDbUser(row as Record<string, unknown>))

    if (q) {
      users = users.filter(
        (u) =>
          (u.firstName?.toLowerCase().includes(q) ?? false) ||
          (u.lastName?.toLowerCase().includes(q) ?? false) ||
          (u.username?.toLowerCase().includes(q) ?? false) ||
          (u.email?.toLowerCase().includes(q) ?? false)
      )
    }

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      username,
      password,
      email,
      role,
      schoolId,
      memberId,
      ecertificateUrl,
      certificateUrl,
    } = body

    if (!firstName || !lastName || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const resolvedEmail =
      email || `${(username || memberId || `user-${Date.now()}`).toString()}@icpep.local`

    const certUrl = ecertificateUrl ?? certificateUrl

    const { data, error } = await adminQueries.createUserWithAuth(
      resolvedEmail,
      password,
      {
        first_name: firstName,
        last_name: lastName,
        username,
        role,
        school_id: schoolId != null ? Number(schoolId) : undefined,
        member_id: memberId,
        ecertificate_url: certUrl,
      }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: mapDbUser(data as Record<string, unknown>),
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
