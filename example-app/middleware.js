import { NextResponse } from 'next/server';

const AUTH_BYPASS_FLAG = String(process.env.NEXT_PUBLIC_AUTH_BYPASS || '').trim().toLowerCase();
const AUTH_BYPASS_REQUESTED = AUTH_BYPASS_FLAG === '1' || AUTH_BYPASS_FLAG === 'true' || AUTH_BYPASS_FLAG === 'yes' || AUTH_BYPASS_FLAG === 'on';
const AUTH_BYPASS_ENABLED = process.env.NODE_ENV !== 'production' && AUTH_BYPASS_REQUESTED;
const ACCESS_TOKEN_COOKIE = 'tmk_teachable_access_token';
const REFRESH_TOKEN_COOKIE = 'tmk_teachable_refresh_token';
const OAUTH_CONTEXT_COOKIE = 'tmk_teachable_oauth_ctx';
const TEACHABLE_SESSION_PARAM = 'teachable_session';

function buildLoginRedirect(request) {
  const loginUrl = new URL('/login', request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('next', nextPath);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request) {
  if (AUTH_BYPASS_ENABLED) {
    return NextResponse.next();
  }

  // Allow OAuth/session handoff requests through so client/server auth checks can complete.
  if (request.nextUrl.searchParams.has(TEACHABLE_SESSION_PARAM)) {
    return NextResponse.next();
  }

  const oauthContext = request.cookies.get(OAUTH_CONTEXT_COOKIE)?.value;
  if (oauthContext) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return buildLoginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lesson-activities/:path*', '/dashboard/:path*'],
};
