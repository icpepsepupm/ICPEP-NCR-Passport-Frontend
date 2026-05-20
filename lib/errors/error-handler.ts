// Error handling utilities
export class SupabaseError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

export const errorHandler = {
  // Parse Supabase errors
  parseError(error: any): { code: string; message: string } {
    if (!error) return { code: 'UNKNOWN', message: 'Unknown error' }

    // Supabase API errors
    if (error.code === 'PGRST116') {
      return { code: 'NOT_FOUND', message: 'Resource not found' }
    }

    if (error.code === 'P0001') {
      return { code: 'BUSINESS_LOGIC', message: error.message || 'Business logic error' }
    }

    if (error.code === '23505') {
      return { code: 'DUPLICATE', message: 'Resource already exists' }
    }

    if (error.code === '23503') {
      return { code: 'FOREIGN_KEY', message: 'Invalid reference' }
    }

    if (error.code === 'PGRST201') {
      return { code: 'AUTH_REQUIRED', message: 'Authentication required' }
    }

    if (error.message?.includes('permission')) {
      return { code: 'PERMISSION_DENIED', message: 'Permission denied' }
    }

    return {
      code: error.code || 'ERROR',
      message: error.message || 'An error occurred',
    }
  },

  // Format error for API response
  formatApiError(error: any, statusCode = 500) {
    const parsed = this.parseError(error)
    return {
      error: parsed.code,
      message: parsed.message,
      status: statusCode,
    }
  },

  // Throw Supabase error
  throw(error: any) {
    const parsed = this.parseError(error)
    throw new SupabaseError(parsed.code, parsed.message, error)
  },
}

// HTTP status code mapping
export const statusCodeMap = {
  UNKNOWN: 500,
  NOT_FOUND: 404,
  BUSINESS_LOGIC: 422,
  DUPLICATE: 409,
  FOREIGN_KEY: 400,
  AUTH_REQUIRED: 401,
  PERMISSION_DENIED: 403,
  VALIDATION_ERROR: 400,
}
