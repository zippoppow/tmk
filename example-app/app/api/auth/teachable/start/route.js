import { NextResponse } from 'next/server';
import {
  buildTeachableAuthorizeUrl,
  encodeSignedState,
  getTeachableOAuthConfig,
  sanitizeRedirectTarget,
  setOAuthContextCookie,
} from '../_lib.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const config = getTeachableOAuthConfig({
      requestUrl: request.url,
      requireRedirectUri: true,
    });
    const requestUrl = new URL(request.url);
    const redirectTo = sanitizeRedirectTarget(
      requestUrl.searchParams.get('redirectTo'),
      requestUrl.origin,
      '/'
    );
    console.log('[OAuth Start] Query params:', Object.fromEntries(requestUrl.searchParams));
    console.log('[OAuth Start] Raw redirectTo param:', requestUrl.searchParams.get('redirectTo'));
    console.log('[OAuth Start] Sanitized redirectTo:', redirectTo);

    const state = encodeSignedState(
      {
      redirectTo,
      ts: Date.now(),
      },
      config.stateSecret
    );
      console.log('[OAuth Start] State secret (first 20 chars):', config.stateSecret?.slice(0, 20));
      console.log('[OAuth Start] State max age seconds:', config.stateMaxAgeSeconds);
      console.log('[OAuth Start] Generated state:', state);

    const authorizationUrl = buildTeachableAuthorizeUrl(config, state);
    const response = NextResponse.redirect(authorizationUrl);
    console.log('[OAuth Start] Setting context cookie with redirectTo:', redirectTo);
    setOAuthContextCookie(
      response,
      {
        redirectTo,
        ts: Date.now(),
      },
      config.stateMaxAgeSeconds
    );
    console.log('[OAuth Start] Redirecting to:', authorizationUrl);
    console.log('[OAuth Start] Response cookies:', response.cookies.getSetCookieHeader?.());
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Unable to start Teachable OAuth flow.' },
      { status: 500 }
    );
  }
}
