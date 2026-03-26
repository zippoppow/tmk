import { NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'tmk_teachable_access_token';
const REFRESH_TOKEN_COOKIE = 'tmk_teachable_refresh_token';

function buildLoginRedirect(request) {
  const loginUrl = new URL('/login', request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('next', nextPath);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return buildLoginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lesson-activities/:path*'],
};
