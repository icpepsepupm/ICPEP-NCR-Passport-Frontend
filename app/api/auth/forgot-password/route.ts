// API Route: Request password reset
// POST /api/auth/forgot-password
import { NextRequest, NextResponse } from 'next/server'
import { passwordResetService } from '@/lib/services/password-reset'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const { error } = await passwordResetService.requestPasswordReset(
      email,
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
    )

    // Don't reveal if email exists (security)
    return NextResponse.json({
      success: true,
      message: 'If email exists in system, password reset link has been sent',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
