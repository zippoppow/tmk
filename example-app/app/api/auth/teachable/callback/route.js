import {
  applyTokenCookies,
  clearOAuthContextCookie,
  decodeState,
  exchangeCodeForTokens,
  getTeachableOAuthConfig,
  readOAuthContextCookie,
  redirectWithAuthFlag,
  sanitizeRedirectTarget,
} from '../_lib.js';

export const dynamic = 'force-dynamic';

const DEFAULT_LESSON_REDIRECT = '/lesson-activities/intro';

function loginPathWithNext(nextPath) {
  const resolvedNext = nextPath && nextPath !== '/' ? nextPath : DEFAULT_LESSON_REDIRECT;
  return `/login?next=${encodeURIComponent(resolvedNext)}`;
}

function extractRedirectFromRawState(stateValue) {
  if (!stateValue || typeof stateValue !== 'string') {
    return null;
  }

  const payloadToken = stateValue.split('.')[0];
  if (!payloadToken) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadToken, 'base64url').toString('utf8'));
    return typeof payload?.redirectTo === 'string' ? payload.redirectTo : null;
  } catch {
    return null;
  }
}

function resolveCallbackRedirect(requestUrl, config, ...candidates) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const sanitized = sanitizeRedirectTarget(candidate, requestUrl.origin, '');
    if (sanitized && sanitized !== '/') {
      return sanitized;
    }
  }

  const configuredFallback = sanitizeRedirectTarget(
    config?.postLogoutRedirect,
    requestUrl.origin,
    ''
  );

  if (configuredFallback && configuredFallback !== '/') {
    return configuredFallback;
  }

  return DEFAULT_LESSON_REDIRECT;
}

export async function GET(request) {
  const requestUrl = new URL(request.url);

  try {
    const config = getTeachableOAuthConfig({
      requestUrl: request.url,
      requireRedirectUri: true,
    });
    const cookieContext = readOAuthContextCookie(request);
    const rawStateRedirect = extractRedirectFromRawState(requestUrl.searchParams.get('state'));
    console.log('[OAuth Callback] Received cookie context:', cookieContext);
    console.log('[OAuth Callback] Request cookies:', request.cookies.getSetCookie?.());
    console.log('[OAuth Callback] All cookies:', Object.fromEntries(request.cookies));

    const oauthError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
    if (oauthError) {
      const redirectPathFromCookie = resolveCallbackRedirect(
        requestUrl,
        config,
        cookieContext?.redirectTo,
        rawStateRedirect,
        requestUrl.searchParams.get('redirectTo')
      );
      console.log('[OAuth Callback] oauthError redirect path:', redirectPathFromCookie);
      const response = redirectWithAuthFlag(
        requestUrl,
        loginPathWithNext(redirectPathFromCookie),
        'error',
        oauthError
      );
      clearOAuthContextCookie(response);
      return response;
    }

    const statePayload = decodeState(
      requestUrl.searchParams.get('state'),
      config.stateSecret
    );
    console.log('[OAuth Callback] State param received:', requestUrl.searchParams.get('state'));
    console.log('[OAuth Callback] State decoded payload:', statePayload);

    const stateAgeMs = Date.now() - Number(statePayload?.ts || 0);
    const stateExpired = !statePayload?.ts || stateAgeMs > config.stateMaxAgeSeconds * 1000;
    console.log('[OAuth Callback] State age:', stateAgeMs, 'ms, max:', config.stateMaxAgeSeconds * 1000, 'ms, expired:', stateExpired);
      console.log('[OAuth Callback] State secret (first 20 chars):', config.stateSecret?.slice(0, 20));
      console.log('[OAuth Callback] Decoded redirectTo from state:', statePayload?.redirectTo);
    if (!statePayload || stateExpired) {
      const redirectPathFromCookie = resolveCallbackRedirect(
        requestUrl,
        config,
        cookieContext?.redirectTo,
        rawStateRedirect,
        requestUrl.searchParams.get('redirectTo')
      );
      console.log('[OAuth Callback] State invalid/expired. Using cookie redirectTo:', cookieContext?.redirectTo, '-> resolved to:', redirectPathFromCookie);
      const response = redirectWithAuthFlag(
        requestUrl,
        loginPathWithNext(redirectPathFromCookie),
        'error',
        stateExpired ? 'OAuth state is expired' : 'OAuth state is invalid'
      );
      clearOAuthContextCookie(response);
      return response;
    }

    const redirectPath = sanitizeRedirectTarget(
      statePayload?.redirectTo,
      requestUrl.origin,
      config.postLogoutRedirect
    );

    const code = requestUrl.searchParams.get('code');
    if (!code) {
      const response = redirectWithAuthFlag(
        requestUrl,
        loginPathWithNext(redirectPath),
        'error',
        'Missing authorization code'
      );
      clearOAuthContextCookie(response);
      return response;
    }

    const tokenPayload = await exchangeCodeForTokens(config, code);
    const response = redirectWithAuthFlag(requestUrl, redirectPath, 'success');
    applyTokenCookies(response, tokenPayload);
    clearOAuthContextCookie(response);
    return response;
  } catch (error) {
    const cookieContext = readOAuthContextCookie(request);
    const rawStateRedirect = extractRedirectFromRawState(requestUrl.searchParams.get('state'));
    const fallbackRedirect = resolveCallbackRedirect(
      requestUrl,
      { postLogoutRedirect: '/' },
      cookieContext?.redirectTo,
      rawStateRedirect,
      requestUrl.searchParams.get('redirectTo')
    );
    console.log('[OAuth Callback] Catch fallback redirect path:', fallbackRedirect);
    const response = redirectWithAuthFlag(
      requestUrl,
      loginPathWithNext(fallbackRedirect),
      'error',
      error?.message || 'OAuth callback failed'
    );
    clearOAuthContextCookie(response);
    response.headers.set('x-teachable-auth-error', error?.message || 'callback-failed');
    return response;
  }
}
