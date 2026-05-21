import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AuthResult =
  | { ok: true; userId: string; role: string; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; admin: ReturnType<typeof createAdminClient> }
  | { ok: false; response: NextResponse }

export async function requireAuth(allowedRoles?: string[]): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized', message: 'Please sign in' }, { status: 401 }),
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
      response: NextResponse.json({ error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 }),
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
