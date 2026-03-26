import { NextResponse } from 'next/server';
import {
  clearTokenCookies,
  getTeachableOAuthConfig,
  sanitizeRedirectTarget,
} from '../_lib.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);

  let fallbackRedirect = '/';
  try {
    const config = getTeachableOAuthConfig();
    fallbackRedirect = config.postLogoutRedirect;
  } catch {
    // Continue with default when env is not configured.
  }

  const redirectPath = sanitizeRedirectTarget(
    requestUrl.searchParams.get('redirectTo'),
    requestUrl.origin,
    fallbackRedirect
  );

  const response = NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
  clearTokenCookies(response);
  return response;
}
