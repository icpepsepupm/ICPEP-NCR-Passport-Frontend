import type { SupabaseClient } from '@supabase/supabase-js'

/** Resolve a route param (UUID, member_id, or username) to the users.id UUID. */
export async function resolveMemberUserId(
  client: SupabaseClient,
  identifier: string
): Promise<string | null> {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  const { data } = await client
    .from('users')
    .select('id')
    .or(`id.eq.${trimmed},member_id.eq.${trimmed},username.eq.${trimmed}`)
    .maybeSingle()

  if (data?.id) return data.id

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidPattern.test(trimmed) ? trimmed : null
}
