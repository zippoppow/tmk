import { NextResponse } from 'next/server';

const AUTH_BYPASS_FLAG = String(process.env.NEXT_PUBLIC_AUTH_BYPASS || '').trim().toLowerCase();
const AUTH_BYPASS_REQUESTED = AUTH_BYPASS_FLAG === '1' || AUTH_BYPASS_FLAG === 'true' || AUTH_BYPASS_FLAG === 'yes' || AUTH_BYPASS_FLAG === 'on';
const AUTH_BYPASS_ENABLED = process.env.NODE_ENV !== 'production' && AUTH_BYPASS_REQUESTED;

function hasLessonActivitiesAccess(authPayload) {
  if (!authPayload || typeof authPayload !== 'object') {
    return false;
  }

  if (authPayload.authenticated !== true) {
    return false;
  }

  const user = authPayload.user;
  if (!user || typeof user !== 'object') {
    return false;
  }

  const access = user.access;
  if (access && typeof access === 'object') {
    if (typeof access.lessonActivities === 'boolean') {
      return access.lessonActivities;
    }
    if (typeof access.diyCourseActiveEnrollment === 'boolean') {
      return access.diyCourseActiveEnrollment;
    }
  }

  return false;
}

async function fetchAuthStatus(request) {
  try {
    const meUrl = new URL('/api/auth/teachable/me', request.url);
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(meUrl, {
      method: 'GET',
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: 'no-store',
    });

    if (!response.ok) {
      return { authenticated: false, user: null };
    }

    const payload = await response.json().catch(() => ({}));
    if (!payload || typeof payload !== 'object') {
      return { authenticated: false, user: null };
    }

    return payload;
  } catch {
    return { authenticated: false, user: null };
  }
}

function buildLoginRedirect(request) {
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', nextPath);
  return NextResponse.redirect(loginUrl);
}

function buildEnrollmentRedirect(request) {
  const dashboardUrl = new URL('/dashboard', request.url);
  dashboardUrl.searchParams.set('enrollment', 'required');
  return NextResponse.redirect(dashboardUrl);
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

  const authPayload = await fetchAuthStatus(request);
  if (authPayload?.authenticated !== true) {
    return buildLoginRedirect(request);
  }

  if ((isLessonActivitiesRoute || isLessonProjectsRoute) && !hasLessonActivitiesAccess(authPayload)) {
    return buildEnrollmentRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lesson-activities/:path*', '/lesson-projects/:path*', '/dashboard/:path*'],
};
