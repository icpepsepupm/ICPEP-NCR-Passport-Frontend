// Password reset service - Send reset link via email
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const passwordResetService = {
  // Request password reset (send email)
  async requestPasswordReset(email: string, redirectUrl?: string) {
    const supabase = await createServerSupabaseClient()
    
    // Verify email exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      // Don't reveal if email exists (security)
      return { 
        data: null, 
        error: null, 
        message: 'If email exists, password reset link has been sent' 
      }
    }

    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      }
    )

    if (error) {
      console.error('Password reset error:', error)
      return { 
        data: null, 
        error: error.message,
        message: null 
      }
    }

    return { 
      data, 
      error: null, 
      message: 'Password reset link sent to email' 
    }
  },

  // Reset password with token
  async resetPasswordWithToken(token: string, newPassword: string) {
    const supabase = await createServerSupabaseClient()

    // Verify new password
    if (!newPassword || newPassword.length < 8) {
      return { 
        data: null, 
        error: 'Password must be at least 8 characters' 
      }
    }

    // Verify password complexity
    if (!/[A-Z]/.test(newPassword)) {
      return { 
        data: null, 
        error: 'Password must contain uppercase letter' 
      }
    }
    if (!/[a-z]/.test(newPassword)) {
      return { 
        data: null, 
        error: 'Password must contain lowercase letter' 
      }
    }
    if (!/[0-9]/.test(newPassword)) {
      return { 
        data: null, 
        error: 'Password must contain number' 
      }
    }
    if (!/[!@#$%^&*]/.test(newPassword)) {
      return { 
        data: null, 
        error: 'Password must contain special character' 
      }
    }

    // Update password with token
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { 
        data: null, 
        error: error.message 
      }
    }

    return { 
      data, 
      error: null, 
      message: 'Password reset successfully' 
    }
  },

  // Check if password reset token is valid
  async verifyResetToken(token: string) {
    const supabase = await createServerSupabaseClient()

    // Get user from token
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return { 
        valid: false, 
        error: 'Invalid or expired reset link' 
      }
    }

    return { 
      valid: true, 
      user: data.user,
      error: null 
    }
  },
}
