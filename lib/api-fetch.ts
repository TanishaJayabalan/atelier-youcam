/**
 * Centralized fetch helper for client components that automatically includes
 * user-entered YouCam API credentials from localStorage into request headers.
 */

export function getStoredApiHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('atelier_api_keys');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const headers: Record<string, string> = {};
    if (parsed?.clientId) headers['x-youcam-client-id'] = parsed.clientId.trim();
    if (parsed?.clientSecret) headers['x-youcam-client-secret'] = parsed.clientSecret.trim();
    return headers;
  } catch {
    return {};
  }
}

export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const customHeaders = getStoredApiHeaders();
  const headers = {
    ...(init?.headers || {}),
    ...customHeaders,
  };
  return fetch(input, {
    ...init,
    headers,
  });
}
