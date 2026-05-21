import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('schools')
      .select('id, name, code')
      .eq('id', Number(id))
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Get school error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
