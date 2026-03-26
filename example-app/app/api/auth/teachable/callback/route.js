import {
  applyTokenCookies,
  decodeState,
  exchangeCodeForTokens,
  getTeachableOAuthConfig,
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
    const statePayload = decodeState(
      requestUrl.searchParams.get('state'),
      config.stateSecret
    );
    const redirectPath = sanitizeRedirectTarget(
      statePayload?.redirectTo,
      requestUrl.origin,
      config.postLogoutRedirect
    );

    const code = requestUrl.searchParams.get('code');
    if (!code) {
      return redirectWithAuthFlag(requestUrl, redirectPath, 'error');
    }

    const tokenPayload = await exchangeCodeForTokens(config, code);
    const response = redirectWithAuthFlag(requestUrl, redirectPath, 'success');
    applyTokenCookies(response, tokenPayload);
    return response;
  } catch (error) {
    const fallbackRedirect = sanitizeRedirectTarget(
      requestUrl.searchParams.get('redirectTo'),
      requestUrl.origin,
      '/'
    );
    const response = redirectWithAuthFlag(requestUrl, fallbackRedirect, 'error');
    response.headers.set('x-teachable-auth-error', error?.message || 'callback-failed');
    return response;
  }
}
