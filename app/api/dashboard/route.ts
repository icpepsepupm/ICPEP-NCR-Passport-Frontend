import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/server-auth'

export async function GET() {
  const auth = await requireAuth(['ADMIN', 'SCANNER', 'MEMBER'])
  if (!auth.ok) return auth.response

  try {
    const [{ count: userCount }, { count: eventCount }, { count: stampCount }] =
      await Promise.all([
        auth.admin.from('users').select('*', { count: 'exact', head: true }),
        auth.admin.from('events').select('*', { count: 'exact', head: true }),
        auth.admin.from('stamps').select('*', { count: 'exact', head: true }),
      ])

    const { data: upcoming } = await auth.admin
      .from('events')
      .select('id, name, schedule, venue_name')
      .gte('schedule', new Date().toISOString())
      .order('schedule', { ascending: true })
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          users: userCount ?? 0,
          events: eventCount ?? 0,
          stamps: stampCount ?? 0,
        },
        upcomingEvents: upcoming ?? [],
        role: auth.role,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
