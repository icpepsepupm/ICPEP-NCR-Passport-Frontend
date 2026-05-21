import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/server-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { data: users, error: usersError } = await auth.admin
      .from('users')
      .select('role, is_active')

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    const totalUsers = users?.length ?? 0
    const usersPerRole: Record<string, number> = {}
    let pendingMembers = 0

    for (const u of users ?? []) {
      const role = String(u.role ?? 'MEMBER')
      usersPerRole[role] = (usersPerRole[role] ?? 0) + 1
      if (u.role === 'MEMBER' && u.is_active === false) {
        pendingMembers += 1
      }
    }

    const rolePercentages: Record<string, number> = {}
    for (const [role, count] of Object.entries(usersPerRole)) {
      rolePercentages[role] = totalUsers > 0 ? (count / totalUsers) * 100 : 0
    }

    const { data: eventStats, error: statsError } = await auth.admin
      .from('event_stats')
      .select('name, total_stamps')

    if (statsError) {
      return NextResponse.json({ error: statsError.message }, { status: 500 })
    }

    const stampsPerEvent: Record<string, number> = {}
    let totalStamps = 0
    let mostPopularEvent: Record<string, number> | undefined
    let leastPopularEvent: Record<string, number> | undefined

    for (const stat of eventStats ?? []) {
      const name = String(stat.name)
      const count = Number(stat.total_stamps ?? 0)
      stampsPerEvent[name] = count
      totalStamps += count

      if (!mostPopularEvent || count > Object.values(mostPopularEvent)[0]) {
        mostPopularEvent = { [name]: count }
      }
      if (!leastPopularEvent || count < Object.values(leastPopularEvent)[0]) {
        leastPopularEvent = { [name]: count }
      }
    }

    const eventCount = eventStats?.length ?? 0
    const avgStampsPerEvent = eventCount > 0 ? totalStamps / eventCount : 0

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        usersPerRole,
        rolePercentages,
        pendingMembers,
        stampsPerEvent,
        totalStamps,
        avgStampsPerEvent,
        mostPopularEvent,
        leastPopularEvent,
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
