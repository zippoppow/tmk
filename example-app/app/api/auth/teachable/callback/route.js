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

export async function GET(request) {
  const requestUrl = new URL(request.url);

  try {
    const config = getTeachableOAuthConfig({
      requestUrl: request.url,
      requireRedirectUri: true,
    });
    const cookieContext = readOAuthContextCookie(request);

    const oauthError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
    if (oauthError) {
      const redirectPathFromCookie = sanitizeRedirectTarget(
        cookieContext?.redirectTo,
        requestUrl.origin,
        config.postLogoutRedirect
      );
      const response = redirectWithAuthFlag(requestUrl, redirectPathFromCookie, 'error', oauthError);
      clearOAuthContextCookie(response);
      return response;
    }

    const statePayload = decodeState(
      requestUrl.searchParams.get('state'),
      config.stateSecret
    );

    const stateAgeMs = Date.now() - Number(statePayload?.ts || 0);
    const stateExpired = !statePayload?.ts || stateAgeMs > config.stateMaxAgeSeconds * 1000;
    if (!statePayload || stateExpired) {
      const redirectPathFromCookie = sanitizeRedirectTarget(
        cookieContext?.redirectTo,
        requestUrl.origin,
        config.postLogoutRedirect
      );
      const response = redirectWithAuthFlag(
        requestUrl,
        redirectPathFromCookie,
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
      const response = redirectWithAuthFlag(requestUrl, redirectPath, 'error', 'Missing authorization code');
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
    const fallbackRedirect = sanitizeRedirectTarget(
      cookieContext?.redirectTo || requestUrl.searchParams.get('redirectTo'),
      requestUrl.origin,
      '/'
    );
    const response = redirectWithAuthFlag(
      requestUrl,
      fallbackRedirect,
      'error',
      error?.message || 'OAuth callback failed'
    );
    clearOAuthContextCookie(response);
    response.headers.set('x-teachable-auth-error', error?.message || 'callback-failed');
    return response;
  }
}
