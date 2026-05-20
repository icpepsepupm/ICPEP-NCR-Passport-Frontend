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

    // Get user by username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('username', username)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Sign in with email + password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: username,
        role: userData.role,
      },
      session: {
        access_token: data.session?.access_token,
        expires_in: rememberMe ? 7 * 24 * 60 * 60 : 6 * 60 * 60, // 7 days or 6 hours
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
