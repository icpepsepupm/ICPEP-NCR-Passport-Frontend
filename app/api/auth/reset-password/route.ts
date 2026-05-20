// API Route: Reset password with token
// POST /api/auth/reset-password
import { NextRequest, NextResponse } from 'next/server'
import { passwordResetService } from '@/lib/services/password-reset'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword, confirmPassword } = body

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    const { error, message } = await passwordResetService.resetPasswordWithToken(
      token,
      newPassword
    )

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: message || 'Password reset successfully',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
