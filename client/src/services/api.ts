const API_BASE = '/api/v1';

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: any;

  constructor(message: string, status: number, code: string = 'ERROR', details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('krishisetu_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle Token Expiry
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('krishisetu_refresh_token');
    if (refreshToken && !endpoint.includes('/auth/refresh-token')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data?.accessToken) {
          localStorage.setItem('krishisetu_token', refreshData.data.accessToken);
          localStorage.setItem('krishisetu_refresh_token', refreshData.data.refreshToken);

          // Retry original request with new token
          headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
          const retryRes = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
          });
          const retryData = await retryRes.json();
          if (!retryRes.ok) throw new ApiError(retryData.error?.message || 'Error', retryRes.status, retryData.error?.code);
          return retryData.data;
        }
      } catch (err) {
        localStorage.removeItem('krishisetu_token');
        localStorage.removeItem('krishisetu_refresh_token');
      }
    }
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await res.text()) as any;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      data?.error?.message || 'Request failed',
      res.status,
      data?.error?.code,
      data?.error?.details
    );
  }

  return data.data !== undefined ? data.data : data;
}
