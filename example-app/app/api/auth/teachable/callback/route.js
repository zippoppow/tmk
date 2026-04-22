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

    const oauthError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
    if (oauthError) {
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

    const rawStateTs = Number(statePayload?.ts || 0);
    const issuedAtMs = rawStateTs > 0 && rawStateTs < 1e12 ? rawStateTs * 1000 : rawStateTs;
    const stateAgeMs = issuedAtMs > 0 ? Date.now() - issuedAtMs : Number.POSITIVE_INFINITY;
    const maxStateAgeMs = Math.max(300, Number(config.stateMaxAgeSeconds) || 900) * 1000;
    const stateExpired = stateAgeMs > maxStateAgeMs;

    const canProceedWithoutFreshState = Boolean(code);
    if (!statePayload || stateExpired) {
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
