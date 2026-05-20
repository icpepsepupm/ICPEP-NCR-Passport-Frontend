// Validation utilities for API requests
export const validators = {
  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Validate password strength
  isValidPassword(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain number')
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain special character (!@#$%^&*)')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  // Validate username format
  isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    return usernameRegex.test(username)
  },

  // Validate member ID format
  isValidMemberId(memberId: string): boolean {
    return memberId ? memberId.length > 0 && memberId.length <= 50 : false
  },

  // Validate event type
  isValidEventType(
    eventType: string
  ): eventType is 'GENERAL_ASSEMBLY' | 'COMPETITION' | 'WEBINAR' | 'OTHERS' {
    return ['GENERAL_ASSEMBLY', 'COMPETITION', 'WEBINAR', 'OTHERS'].includes(eventType)
  },

  // Validate user role
  isValidRole(role: string): role is 'ADMIN' | 'SCANNER' | 'MEMBER' {
    return ['ADMIN', 'SCANNER', 'MEMBER'].includes(role)
  },

  // Validate required fields in object
  validateRequired(
    obj: Record<string, any>,
    requiredFields: string[]
  ): { valid: boolean; missingFields: string[] } {
    const missingFields = requiredFields.filter(field => !obj[field])
    return {
      valid: missingFields.length === 0,
      missingFields,
    }
  },

  // Sanitize string input
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .slice(0, 1000)
  },
}
