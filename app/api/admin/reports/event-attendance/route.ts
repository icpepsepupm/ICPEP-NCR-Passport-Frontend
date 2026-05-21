import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('member_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is not found, which is fine
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || null })
  } catch (error) {
    console.error('Passport fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}