import { NextResponse } from 'next/server';
import {
  buildTeachableAuthorizeUrl,
  encodeState,
  getTeachableOAuthConfig,
  sanitizeRedirectTarget,
} from '../_lib.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const config = getTeachableOAuthConfig();
    const requestUrl = new URL(request.url);
    const redirectTo = sanitizeRedirectTarget(
      requestUrl.searchParams.get('redirectTo'),
      requestUrl.origin,
      '/'
    );

    const state = encodeState({
      redirectTo,
      ts: Date.now(),
    });

    const authorizationUrl = buildTeachableAuthorizeUrl(config, state);
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Unable to start Teachable OAuth flow.' },
      { status: 500 }
    );
  }
}
