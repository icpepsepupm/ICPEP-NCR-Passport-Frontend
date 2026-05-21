// API Route: Sign in with ID/Username + Password
// POST /api/auth/signin
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { username, password, rememberMe } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'username and password required' },
        { status: 400 }
      )
    }

    const login = String(username).trim()

    const { data: byUsername } = await supabase
      .from('users')
      .select('id, email, role, username, first_name, last_name, school_id, member_id')
      .ilike('username', login)
      .maybeSingle()

    let userData = byUsername
    if (!userData) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('id, email, role, username, first_name, last_name, school_id, member_id')
        .ilike('email', login)
        .maybeSingle()
      userData = byEmail
    }

    const userError = userData ? null : { message: 'User not found in DB' }

    if (userError || !userData) {
      console.error('User lookup error:', userError?.message || 'User not found in DB');
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Sign in with the actual mapped email + password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password,
    })

    if (error) {
      console.error('Supabase Auth error:', error.message);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        school_id: userData.school_id,
        member_id: userData.member_id,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_in: rememberMe ? 7 * 24 * 60 * 60 : 6 * 60 * 60,
        remember_me: rememberMe,
      },
    })
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
