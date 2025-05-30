// src/lib/apiClient.ts
const API_BASE_URL = 'https://devnet-apis-auth.onrender.com';

interface RequestOptions extends RequestInit {
  useAuth?: boolean;
  isFormData?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = options.isFormData ? {} : { 'Content-Type': 'application/json' };
  
  if (options.useAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    } else if (endpoint !== '/api/signin' && endpoint !== '/api/signup' && !endpoint.startsWith('/api/auth/google')) {
      // Optionally, you could throw an error here or handle redirection if auth is required but no token found
      console.warn('Auth token not found for authenticated request to', endpoint);
    }
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  if (options.body && !options.isFormData) {
    config.body = JSON.stringify(options.body);
  }


  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }
    console.error('API Error:', response.status, errorData);
    throw new Error(errorData?.message || `API request failed: ${response.status}`);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") { // Handle No Content
    return undefined as T; 
  }
  
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options: Omit<RequestOptions, 'body' | 'method'> = {}) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: any, options: Omit<RequestOptions, 'body' | 'method'> = {}) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body: any, options: Omit<RequestOptions, 'body' | 'method'> = {}) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  delete: <T>(endpoint: string, options: Omit<RequestOptions, 'body' | 'method'> = {}) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
