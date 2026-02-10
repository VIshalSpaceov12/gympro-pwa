const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const AUTH_STORAGE_KEY = 'admin-auth-storage';

interface FetchOptions extends RequestInit {
  token?: string;
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Auth endpoints where 401 means "bad credentials", not "session expired"
const PUBLIC_ENDPOINTS = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];

function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        accessToken: parsed.state?.accessToken || null,
        refreshToken: parsed.state?.refreshToken || null,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { accessToken: null, refreshToken: null };
}

function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function updateStoredTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.state = {
        ...parsed.state,
        accessToken,
        refreshToken,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearStoredAuth();
      return null;
    }

    const result: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();
    if (result.success && result.data) {
      updateStoredTokens(result.data.accessToken, result.data.refreshToken);
      return result.data.accessToken;
    }

    clearStoredAuth();
    return null;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
  const { token, headers, ...rest } = options;

  const isPublic = PUBLIC_ENDPOINTS.some(ep => endpoint.startsWith(ep));

  // Don't auto-attach tokens for public auth endpoints
  const authToken = isPublic ? undefined : (token || getStoredTokens().accessToken);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    ...rest,
  });

  // Handle 401 differently for public vs authenticated endpoints
  if (response.status === 401) {
    if (isPublic) {
      // For login/register: 401 means bad credentials — pass the API error through
      const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
      throw new Error(errorData.error || 'Invalid credentials');
    }

    // For authenticated endpoints: attempt token refresh
    if (!token) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = attemptTokenRefresh().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        // Retry the original request with new token
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...headers,
          },
          ...rest,
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({ error: 'An error occurred' }));
          throw new Error(errorData.error || `HTTP ${retryResponse.status}`);
        }

        return retryResponse.json();
      }
    }

    // Refresh failed or wasn't possible — redirect to login
    clearStoredAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ success: false, error: 'An error occurred' }));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}
