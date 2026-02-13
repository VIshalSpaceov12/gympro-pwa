const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

interface FetchOptions extends RequestInit {
  token?: string;
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  try {
    // Check localStorage first, then sessionStorage (supports "remember me")
    const stored = localStorage.getItem('auth-storage') ?? sessionStorage.getItem('auth-storage');
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

function getAuthStorage(): Storage {
  if (typeof window === 'undefined') return localStorage;
  return localStorage.getItem('auth-remember') === 'false' ? sessionStorage : localStorage;
}

function updateStoredTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  try {
    const storage = getAuthStorage();
    const stored = storage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.state = {
        ...parsed.state,
        accessToken,
        refreshToken,
      };
      storage.setItem('auth-storage', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth-storage');
  sessionStorage.removeItem('auth-storage');
  localStorage.removeItem('auth-remember');
}

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

  // Use provided token, or auto-attach from store
  const authToken = token || getStoredTokens().accessToken;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      ...rest,
    });
  } catch {
    throw new Error('Unable to connect to server. Please check your internet connection and try again.');
  }

  // Handle 401 - attempt token refresh only if we sent an auth token
  if (response.status === 401 && authToken) {
    // Avoid concurrent refresh requests
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptTokenRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      // Retry the original request with the new token
      let retryResponse: Response;
      try {
        retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...headers,
          },
          ...rest,
        });
      } catch {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({ success: false, error: 'An error occurred' }));
        throw new Error(errorData.error || `HTTP ${retryResponse.status}`);
      }

      return retryResponse.json();
    }

    // Refresh failed, redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ success: false, error: 'An error occurred' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}
