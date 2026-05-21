import { getAuthToken } from '@/app/lib/client-auth'
import { ApiError } from '@/lib/api/errors'

const API_BASE = '/api'
const DEFAULT_TIMEOUT_MS = 30_000

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  token?: string
  timeout?: number
  body?: unknown
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

async function fetchWithConfig<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, timeout = DEFAULT_TIMEOUT_MS, body, headers: customHeaders, ...rest } = options

  const headers = new Headers(customHeaders)
  if (!headers.has('Content-Type') && body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const authToken = token ?? getAuthToken()
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
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
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out', 408, 'TIMEOUT')
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK'
    )
  } finally {
    clearTimeout(timeoutId)
  }
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
}
