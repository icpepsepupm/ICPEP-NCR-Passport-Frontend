const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

async function fetchWithConfig(endpoint: string, options: RequestOptions = {}) {
  const { token, headers: customHeaders, ...restOptions } = options;
  
  const headers = new Headers(customHeaders);
  
  // Default to JSON if not explicitly overridden
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Attach Bearer token if provided
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
      ...restOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred during the API request');
    }

    return data;
  } catch (error: any) {
    console.error(`[API Error] ${options.method || 'GET'} ${normalizedEndpoint}:`, error);
    throw error;
  }
}

export const apiClient = {
  get: (endpoint: string, token?: string) => 
    fetchWithConfig(endpoint, { method: 'GET', token }),
    
  post: (endpoint: string, body: any, token?: string) => 
    fetchWithConfig(endpoint, { method: 'POST', body: JSON.stringify(body), token }),
    
  delete: (endpoint: string, token?: string) => 
    fetchWithConfig(endpoint, { method: 'DELETE', token }),
};