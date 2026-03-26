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

    const state = encodeSignedState(
      {
      redirectTo,
      ts: Date.now(),
      },
      config.stateSecret
    );

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
