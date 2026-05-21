import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/server-auth'
import { mapDbUser } from '@/lib/api/mappers'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const { data, error } = await auth.supabase
      .from('users')
      .select('*, schools(id, name, code)')
      .eq('id', auth.userId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    const user = mapDbUser(data as Record<string, unknown>)
    const school = (data as { schools?: { id: number; name: string; code: string } }).schools

    return NextResponse.json({
      success: true,
      data: { ...user, school: school ?? null },
    })
  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
