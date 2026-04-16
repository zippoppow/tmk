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

const DEFAULT_FALLBACK_REDIRECT = '/';

function loginPathWithNext(nextPath) {
  const resolvedNext = nextPath || DEFAULT_FALLBACK_REDIRECT;
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
    if (sanitized) {
      return sanitized;
    }
  }

  const configuredFallback = sanitizeRedirectTarget(
    config?.postLogoutRedirect,
    requestUrl.origin,
    ''
  );

  if (configuredFallback) {
    return configuredFallback;
  }

  return null;
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
    const queryRedirect = requestUrl.searchParams.get('redirectTo');
    const recoveredRedirect = resolveCallbackRedirect(
      requestUrl,
      config,
      cookieContext?.redirectTo,
      rawStateRedirect,
      queryRedirect
    );
    console.log('[OAuth Callback] Received cookie context:', cookieContext);
    console.log('[OAuth Callback] Request cookies:', request.cookies.getSetCookie?.());
    console.log('[OAuth Callback] All cookies:', Object.fromEntries(request.cookies));

    const oauthError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
    if (oauthError) {
      console.log('[OAuth Callback] oauthError redirect path:', recoveredRedirect);
      const response = redirectWithAuthFlag(
        requestUrl,
        loginPathWithNext(recoveredRedirect),
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
    const code = requestUrl.searchParams.get('code');
    console.log('[OAuth Callback] State param received:', requestUrl.searchParams.get('state'));
    console.log('[OAuth Callback] State decoded payload:', statePayload);

    const rawStateTs = Number(statePayload?.ts || 0);
    const issuedAtMs = rawStateTs > 0 && rawStateTs < 1e12 ? rawStateTs * 1000 : rawStateTs;
    const stateAgeMs = issuedAtMs > 0 ? Date.now() - issuedAtMs : Number.POSITIVE_INFINITY;
    const maxStateAgeMs = Math.max(300, Number(config.stateMaxAgeSeconds) || 900) * 1000;
    const stateExpired = stateAgeMs > maxStateAgeMs;
    console.log('[OAuth Callback] State age:', stateAgeMs, 'ms, max:', maxStateAgeMs, 'ms, expired:', stateExpired);
    console.log('[OAuth Callback] State secret (first 20 chars):', config.stateSecret?.slice(0, 20));
    console.log('[OAuth Callback] Decoded redirectTo from state:', statePayload?.redirectTo);

    const canProceedWithoutFreshState = Boolean(code);
    if (!statePayload || stateExpired) {
      console.log('[OAuth Callback] State invalid/expired. recoveredRedirect:', recoveredRedirect, 'canProceedWithoutFreshState:', canProceedWithoutFreshState);
      if (!canProceedWithoutFreshState) {
        const response = redirectWithAuthFlag(
          requestUrl,
          loginPathWithNext(recoveredRedirect),
          'error',
          stateExpired ? 'OAuth state is expired' : 'OAuth state is invalid'
        );
        clearOAuthContextCookie(response);
        return response;
      }
    }

    const redirectPath = resolveCallbackRedirect(
      requestUrl,
      config,
      statePayload?.redirectTo,
      recoveredRedirect,
      DEFAULT_FALLBACK_REDIRECT
    ) || DEFAULT_FALLBACK_REDIRECT;

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
      { postLogoutRedirect: null },
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
