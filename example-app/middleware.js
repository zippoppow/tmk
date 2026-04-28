import { NextResponse } from 'next/server';

const AUTH_BYPASS_FLAG = String(process.env.NEXT_PUBLIC_AUTH_BYPASS || '').trim().toLowerCase();
const AUTH_BYPASS_REQUESTED = AUTH_BYPASS_FLAG === '1' || AUTH_BYPASS_FLAG === 'true' || AUTH_BYPASS_FLAG === 'yes' || AUTH_BYPASS_FLAG === 'on';
const AUTH_BYPASS_ENABLED = process.env.NODE_ENV !== 'production' && AUTH_BYPASS_REQUESTED;
const AUTH_HINT_COOKIE = 'tmk_auth_hint';
const TEACHABLE_SESSION_PARAM = 'teachable_session';
const AUTH_STATUS_PARAM = 'auth';

function hasAuthHint(request) {
  return request.cookies.get(AUTH_HINT_COOKIE)?.value === '1';
}

function isReturningFromAuth(request) {
  const session = (request.nextUrl.searchParams.get(TEACHABLE_SESSION_PARAM) || '').trim();
  const authStatus = (request.nextUrl.searchParams.get(AUTH_STATUS_PARAM) || '').trim().toLowerCase();
  return Boolean(session) || authStatus === 'success';
}

function buildLoginRedirect(request) {
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', nextPath);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request) {
  if (AUTH_BYPASS_ENABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isLessonActivitiesRoute = pathname.startsWith('/lesson-activities');
  const isLessonProjectsRoute = pathname.startsWith('/lesson-projects');

  if (!isDashboardRoute && !isLessonActivitiesRoute && !isLessonProjectsRoute) {
    return NextResponse.next();
  }

  if (isReturningFromAuth(request)) {
    return NextResponse.next();
  }

  if (!hasAuthHint(request)) {
    return buildLoginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lesson-activities/:path*', '/lesson-projects/:path*', '/dashboard/:path*'],
};
