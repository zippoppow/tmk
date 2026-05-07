'use client';

const UTILITIES_TOKEN_STORAGE_KEY = 'tmk-utilities-api-access-token';

let utilitiesAccessToken = '';
let pendingTokenPromise = null;

function isJwtExpired(token) {
  if (!token || typeof token !== 'string') {
    return true;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return false;
  }

  try {
    const payloadSegment = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadSegment + '='.repeat((4 - (payloadSegment.length % 4 || 4)) % 4);
    const payload = JSON.parse(atob(padded));
    const exp = Number(payload?.exp || 0);
    if (!exp) {
      return false;
    }
    return Date.now() >= exp * 1000 - 5000;
  } catch {
    return false;
  }
}

function getStoredToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return window.localStorage.getItem(UTILITIES_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function setStoredToken(token) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (token) {
      window.localStorage.setItem(UTILITIES_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(UTILITIES_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

async function requestUtilitiesAccessToken() {
  const response = await fetch('/api/utilities/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    let details = '';
    try {
      const payload = await response.json();
      details = payload?.error || payload?.details || JSON.stringify(payload);
    } catch {
      details = response.statusText;
    }
    throw new Error(details || `Token request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const token = String(payload?.access_token || '').trim();
  if (!token) {
    throw new Error('Token response missing access_token');
  }

  utilitiesAccessToken = token;
  setStoredToken(token);
  return token;
}

export async function getUtilitiesAccessToken(forceRefresh = false) {
  if (!forceRefresh && utilitiesAccessToken && !isJwtExpired(utilitiesAccessToken)) {
    return utilitiesAccessToken;
  }

  if (!forceRefresh && !utilitiesAccessToken) {
    const stored = getStoredToken();
    if (stored && !isJwtExpired(stored)) {
      utilitiesAccessToken = stored;
      return utilitiesAccessToken;
    }
    if (stored && isJwtExpired(stored)) {
      setStoredToken('');
    }
  }

  if (!pendingTokenPromise) {
    pendingTokenPromise = requestUtilitiesAccessToken().finally(() => {
      pendingTokenPromise = null;
    });
  }

  return pendingTokenPromise;
}

export async function fetchWithTmkToken(endpoint, init = {}) {
  const headers = new Headers(init.headers || {});
  const token = await getUtilitiesAccessToken(false);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(endpoint, {
    ...init,
    headers,
    credentials: init.credentials || 'include',
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await getUtilitiesAccessToken(true);
  if (!refreshedToken) {
    return response;
  }

  headers.set('Authorization', `Bearer ${refreshedToken}`);
  response = await fetch(endpoint, {
    ...init,
    headers,
    credentials: init.credentials || 'include',
  });

  return response;
}
