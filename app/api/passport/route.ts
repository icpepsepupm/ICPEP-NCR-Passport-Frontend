import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/server-auth'

export async function GET() {
  const auth = await requireAuth(['MEMBER', 'ADMIN'])
  if (!auth.ok) return auth.response

  try {
    const { data, error } = await auth.supabase.rpc('get_member_passport_summary', {
      p_member_id: auth.userId,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Passport error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
