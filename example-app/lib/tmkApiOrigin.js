const TMK_SERVER_API_BASE_URL =
  process.env.TMK_API_BASE_URL ||
  process.env.NEXT_PUBLIC_TMK_API_URL_PRODUCTION ||
  process.env.NEXT_PUBLIC_TMK_API_URL ||
  'https://tmk-api.up.railway.app';

export const TMK_API_BASE_URL = TMK_SERVER_API_BASE_URL;

export function resolveTmkApiBaseUrl() {
  return TMK_API_BASE_URL;
}

export function resolveServerTmkApiBaseUrl() {
  return TMK_SERVER_API_BASE_URL;
}

export function getTmkApiAuthKey() {
  if (typeof window !== 'undefined') {
    return '';
  }

  return String(process.env.TMK_API_AUTH_KEY || '').trim();
}

export function withTmkApiAuthHeader(headersLike) {
  const headers = new Headers(headersLike || {});
  const apiAuthKey = getTmkApiAuthKey();
  if (apiAuthKey && !headers.has('x-api-key')) {
    headers.set('x-api-key', apiAuthKey);
  }
  return headers;
}
