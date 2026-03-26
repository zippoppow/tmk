import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

const TEACHABLE_AUTHORIZE_BASE = 'https://sso.teachable.com';
const TEACHABLE_API_BASE = 'https://developers.teachable.com/v1/current_user';

export const OAUTH_COOKIE_KEYS = {
  accessToken: 'tmk_teachable_access_token',
  refreshToken: 'tmk_teachable_refresh_token',
  expiresAt: 'tmk_teachable_expires_at',
};

function normalizeScopes(value, fallback) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source) {
    return fallback;
  }
  return source.split(/[\s,]+/).filter(Boolean).join(' ');
}

function firstNonEmptyEnv(keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function signStatePayload(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function resolveRedirectUri(requestUrl) {
  const explicit = firstNonEmptyEnv([
    'TEACHABLE_OAUTH_CALLBACK_URL',
    'TEACHABLE_REDIRECT_URI',
    'NEXT_PUBLIC_TEACHABLE_REDIRECT_URI',
  ]);
  if (explicit) {
    return explicit;
  }

  if (!requestUrl) {
    return '';
  }

  try {
    const url = new URL(requestUrl);
    return `${url.origin}/api/auth/teachable/callback`;
  } catch {
    return '';
  }
}

export function getTeachableOAuthConfig(options = {}) {
  const { requestUrl, requireRedirectUri = false } = options;

  const authorizeUrl = firstNonEmptyEnv(['TEACHABLE_OAUTH_AUTHORIZE_URL']);
  const tokenUrl = firstNonEmptyEnv(['TEACHABLE_OAUTH_TOKEN_URL']);
  const stateSecret = firstNonEmptyEnv(['TEACHABLE_OAUTH_STATE_SECRET']);

  const schoolId = firstNonEmptyEnv([
    'TEACHABLE_SCHOOL_ID',
    'NEXT_PUBLIC_TEACHABLE_SCHOOL_ID',
  ]);
  const clientId = firstNonEmptyEnv([
    'TEACHABLE_OAUTH_CLIENT_ID',
    'TEACHABLE_CLIENT_ID',
    'NEXT_PUBLIC_TEACHABLE_CLIENT_ID',
  ]);
  const clientSecret = firstNonEmptyEnv([
    'TEACHABLE_OAUTH_CLIENT_SECRET',
    'TEACHABLE_CLIENT_SECRET',
    'TEACHABLE_OAUTH_CLIENT_SECRET',
  ]);
  const redirectUri = resolveRedirectUri(requestUrl);

  const missing = [
    ['TEACHABLE_CLIENT_ID', clientId],
    ['TEACHABLE_CLIENT_SECRET', clientSecret],
  ]
    .filter((entry) => !entry[1])
    .map((entry) => entry[0]);

  if (requireRedirectUri && !redirectUri) {
    missing.push('TEACHABLE_REDIRECT_URI');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required Teachable OAuth env vars: ${missing.join(', ')}`);
  }

  return {
    schoolId,
    authorizeUrl,
    tokenUrl,
    stateSecret,
    clientId,
    clientSecret,
    redirectUri,
    requiredScopes: normalizeScopes(
      firstNonEmptyEnv(['TEACHABLE_REQUIRED_SCOPES', 'NEXT_PUBLIC_TEACHABLE_REQUIRED_SCOPES']),
      'name:read email:read'
    ),
    optionalScopes: normalizeScopes(
      firstNonEmptyEnv(['TEACHABLE_OPTIONAL_SCOPES', 'NEXT_PUBLIC_TEACHABLE_OPTIONAL_SCOPES']),
      ''
    ),
    postLogoutRedirect: firstNonEmptyEnv([
      'TEACHABLE_POST_LOGOUT_REDIRECT',
      'NEXT_PUBLIC_TEACHABLE_POST_LOGOUT_REDIRECT',
    ]) || '/',
  };
}

function encodeBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function encodeState(payload) {
  return encodeBase64Url(JSON.stringify(payload));
}

export function encodeSignedState(payload, secret) {
  const encodedPayload = encodeState(payload);
  if (!secret) {
    return encodedPayload;
  }

  const signature = signStatePayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function decodeState(stateValue, secret) {
  if (!stateValue || typeof stateValue !== 'string') {
    return null;
  }

  const [encodedPayload, signature] = stateValue.split('.');
  const payloadToken = encodedPayload || '';

  if (secret) {
    if (!signature) {
      return null;
    }

    const expectedSignature = signStatePayload(payloadToken, secret);
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== receivedBuffer.length) {
      return null;
    }
    if (!timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payloadToken));
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function sanitizeRedirectTarget(rawValue, requestOrigin, fallback = '/') {
  if (!rawValue || typeof rawValue !== 'string') {
    return fallback;
  }

  try {
    const parsed = new URL(rawValue, requestOrigin);
    if (parsed.origin !== requestOrigin) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function applyTokenCookies(response, tokenPayload) {
  const cookieOptions = buildCookieOptions();
  const expiresIn = Number(tokenPayload?.expires_in || 7200);
  const expiresAt = String(Date.now() + Math.max(expiresIn, 1) * 1000);

  if (tokenPayload?.access_token) {
    response.cookies.set(OAUTH_COOKIE_KEYS.accessToken, tokenPayload.access_token, {
      ...cookieOptions,
      maxAge: expiresIn,
    });
  }

  if (tokenPayload?.refresh_token) {
    response.cookies.set(OAUTH_COOKIE_KEYS.refreshToken, tokenPayload.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  response.cookies.set(OAUTH_COOKIE_KEYS.expiresAt, expiresAt, {
    ...cookieOptions,
    maxAge: expiresIn,
  });
}

export function clearTokenCookies(response) {
  const cookieOptions = buildCookieOptions();
  response.cookies.set(OAUTH_COOKIE_KEYS.accessToken, '', { ...cookieOptions, maxAge: 0 });
  response.cookies.set(OAUTH_COOKIE_KEYS.refreshToken, '', { ...cookieOptions, maxAge: 0 });
  response.cookies.set(OAUTH_COOKIE_KEYS.expiresAt, '', { ...cookieOptions, maxAge: 0 });
}

export function buildTeachableAuthorizeUrl(config, stateValue) {
  const url = config.authorizeUrl
    ? new URL(config.authorizeUrl)
    : new URL(`/secure/${config.schoolId}/identity/oauth_provider/authorize`, TEACHABLE_AUTHORIZE_BASE);

  if (!config.authorizeUrl && !config.schoolId) {
    throw new Error('Missing TEACHABLE_SCHOOL_ID or TEACHABLE_OAUTH_AUTHORIZE_URL');
  }

  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('required_scopes', config.requiredScopes);
  if (config.optionalScopes) {
    url.searchParams.set('optional_scopes', config.optionalScopes);
  }
  if (stateValue) {
    url.searchParams.set('state', stateValue);
  }
  return url.toString();
}

export async function exchangeCodeForTokens(config, code) {
  const payload = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  const tokenEndpoint = config.tokenUrl || `${TEACHABLE_API_BASE}/oauth2/token`;

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Teachable code exchange failed (${response.status}): ${detail || response.statusText}`);
  }

  return response.json();
}

export async function refreshTokens(config, refreshToken) {
  const payload = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
  });

  const tokenEndpoint = config.tokenUrl || `${TEACHABLE_API_BASE}/oauth2/token`;

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function fetchCurrentUser(accessToken) {
  const response = await fetch(`${TEACHABLE_API_BASE}/me`, {
    method: 'GET',
    headers: {
      Authorization: `bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: null,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: await response.json(),
  };
}

export function redirectWithAuthFlag(requestUrl, redirectPath, flagValue) {
  const redirectUrl = new URL(redirectPath, requestUrl.origin);
  redirectUrl.searchParams.set('auth', flagValue);
  return NextResponse.redirect(redirectUrl);
}
