import { getAuthToken } from '@/app/lib/client-auth'
import { ApiError } from '@/lib/api/errors'

const API_BASE = '/api'
const DEFAULT_TIMEOUT_MS = 30_000
const MAX_RETRIES = 2
const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504])

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  token?: string
  timeout?: number
  body?: unknown
  retries?: number
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json()
  }
  const text = await response.text()
  return text ? { message: text } : {}
}

function normalizeError(status: number, body: unknown): ApiError {
  const data = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const message =
    (data.message as string) ||
    (data.error as string) ||
    `Request failed (${status})`
  const code = (data.error as string) || undefined
  return new ApiError(message, status, code)
}

function shouldRetry(error: unknown, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false
  if (error instanceof ApiError) {
    return error.status === 0 || RETRYABLE_STATUSES.has(error.status)
  }
  return true
}

async function fetchWithConfig<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    token,
    timeout = DEFAULT_TIMEOUT_MS,
    body,
    headers: customHeaders,
    retries = MAX_RETRIES,
    ...rest
  } = options

  const headers = new Headers(customHeaders)
  if (!headers.has('Content-Type') && body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const authToken = token ?? getAuthToken()
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    try {
      timeoutId = setTimeout(() => controller.abort(), timeout)
      const response = await fetch(`${API_BASE}${normalizedEndpoint}`, {
        ...rest,
        headers,
        credentials: 'include',
        signal: controller.signal,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })

      const data = await parseResponseBody(response)

      if (response.status === 401 && typeof window !== 'undefined') {
        const path = window.location.pathname
        if (!path.startsWith('/auth') && !path.startsWith('/login')) {
          window.location.href = '/auth/login'
        }
      }

      if (!response.ok) {
        throw normalizeError(response.status, data)
      }

      return data as T
    } catch (error) {
      lastError = error
      if (error instanceof ApiError) {
        if (!shouldRetry(error, attempt, retries)) throw error
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new ApiError('Request timed out', 408, 'TIMEOUT')
        if (!shouldRetry(timeoutError, attempt, retries)) throw timeoutError
        lastError = timeoutError
      } else if (!shouldRetry(error, attempt, retries)) {
        throw new ApiError(
          error instanceof Error ? error.message : 'Network error',
          0,
          'NETWORK'
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  if (lastError instanceof ApiError) throw lastError
  throw new ApiError(
    lastError instanceof Error ? lastError.message : 'Network error',
    0,
    'NETWORK'
  )
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    fetchWithConfig<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    fetchWithConfig<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    fetchWithConfig<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    fetchWithConfig<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    fetchWithConfig<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: async <T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: Omit<RequestOptions, 'body' | 'method'>
  ): Promise<T> => {
    const { token, timeout = DEFAULT_TIMEOUT_MS, headers: customHeaders, retries = MAX_RETRIES } =
      options ?? {}

    const headers = new Headers(customHeaders)
    const authToken = token ?? getAuthToken()
    if (authToken) headers.set('Authorization', `Bearer ${authToken}`)

    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    let lastError: unknown

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController()
      let timeoutId: ReturnType<typeof setTimeout> | undefined

      try {
        timeoutId = setTimeout(() => controller.abort(), timeout)
        const response = await fetch(`${API_BASE}${normalizedEndpoint}`, {
          method: 'POST',
          headers,
          credentials: 'include',
          signal: controller.signal,
          body: formData,
        })

        const data = await parseResponseBody(response)
        if (!response.ok) throw normalizeError(response.status, data)
        return data as T
      } catch (error) {
        lastError = error
        if (error instanceof ApiError && !shouldRetry(error, attempt, retries)) throw error
        if (!(error instanceof ApiError) && !shouldRetry(error, attempt, retries)) {
          throw new ApiError(
            error instanceof Error ? error.message : 'Network error',
            0,
            'NETWORK'
          )
        }
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    if (lastError instanceof ApiError) throw lastError
    throw new ApiError('Upload failed', 0, 'NETWORK')
  },
}
