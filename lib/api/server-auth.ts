import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AuthResult =
  | {
      ok: true
      userId: string
      role: string
      supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
      admin: ReturnType<typeof createAdminClient>
    }
  | { ok: false; response: NextResponse }

async function getAuthenticatedUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token) {
      const { data, error } = await supabase.auth.getUser(token)
      if (!error && data.user) return data.user
    }
  }

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

export async function requireAuth(allowedRoles?: string[]): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient()
  const user = await getAuthenticatedUser(supabase)

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in' },
        { status: 401 }
      ),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'User profile not found' }, { status: 404 }),
    }
  }

  const role = String(profile.role)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true,
    userId: user.id,
    role,
    supabase,
    admin: createAdminClient(),
  }
}

export async function requireAdmin(): Promise<AuthResult> {
  return requireAuth(['ADMIN'])
}

/** Authenticated user may access their own record; admins may access any. */
export async function requireSelfOrAdmin(targetUserId: string): Promise<AuthResult> {
  const auth = await requireAuth(['ADMIN', 'SCANNER', 'MEMBER'])
  if (!auth.ok) return auth

  if (auth.role === 'ADMIN' || auth.userId === targetUserId) {
    return auth
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: 'Forbidden', message: 'Insufficient permissions' },
      { status: 403 }
    ),
  }
}
