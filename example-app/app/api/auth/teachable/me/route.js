import { NextResponse } from 'next/server';
import {
  applyTokenCookies,
  clearTokenCookies,
  fetchCurrentUser,
  getTeachableOAuthConfig,
  OAUTH_COOKIE_KEYS,
  refreshTokens,
} from '../_lib.js';

export const dynamic = 'force-dynamic';

const TEACHABLE_USERS_BASE = 'https://developers.teachable.com/v1';
const DIY_COURSE_ID = String(process.env.TEACHABLE_DIY_COURSE_ID || process.env.NEXT_PUBLIC_TEACHABLE_DIY_COURSE_ID || '').trim();

function toIdString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function extractTeachableUserId(currentUserData) {
  if (!currentUserData || typeof currentUserData !== 'object') {
    return '';
  }

  const candidates = [
    currentUserData.id,
    currentUserData.user?.id,
    currentUserData.current_user?.id,
    currentUserData.data?.id,
    currentUserData.member?.id,
  ];

  for (const value of candidates) {
    const id = toIdString(value);
    if (id) {
      return id;
    }
  }

  return '';
}

async function fetchTeachableUserProfile(accessToken, userId) {
  if (!accessToken || !userId) {
    return { ok: false, data: null };
  }

  const response = await fetch(`${TEACHABLE_USERS_BASE}/users/${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      Authorization: `bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return { ok: false, data: null };
  }

  const payload = await response.json().catch(() => null);
  return { ok: Boolean(payload), data: payload };
}

function buildUserWithAccess(currentUserData, teachableProfile) {
  const courses = Array.isArray(teachableProfile?.courses)
    ? teachableProfile.courses
    : Array.isArray(currentUserData?.courses)
      ? currentUserData.courses
      : [];

  const enrollment = DIY_COURSE_ID
    ? courses.find((course) => toIdString(course?.course_id) === DIY_COURSE_ID)
    : null;

  const enrollmentChecked = Boolean(DIY_COURSE_ID);
  const diyCourseActiveEnrollment = enrollmentChecked
    ? Boolean(enrollment?.is_active_enrollment)
    : true;

  const access = {
    diyCourseId: DIY_COURSE_ID,
    diyCourseActiveEnrollment,
    enrollmentChecked,
    lessonActivities: diyCourseActiveEnrollment,
    lessonProjects: diyCourseActiveEnrollment,
  };

  return {
    ...currentUserData,
    teachableProfile: teachableProfile || null,
    access,
  };
}

function unauthenticatedResponse() {
  return NextResponse.json({ authenticated: false }, { status: 200 });
}

export async function GET(request) {
  const accessToken = request.cookies.get(OAUTH_COOKIE_KEYS.accessToken)?.value;
  const refreshToken = request.cookies.get(OAUTH_COOKIE_KEYS.refreshToken)?.value;

  if (!accessToken && !refreshToken) {
    return unauthenticatedResponse();
  }

  if (!accessToken && refreshToken) {
    try {
      const config = getTeachableOAuthConfig();
      const tokenPayload = await refreshTokens(config, refreshToken);

      if (!tokenPayload?.access_token) {
        const response = unauthenticatedResponse();
        clearTokenCookies(response);
        return response;
      }

      const currentUserResult = await fetchCurrentUser(tokenPayload.access_token);
      if (!currentUserResult.ok) {
        const response = unauthenticatedResponse();
        clearTokenCookies(response);
        return response;
      }

      const userId = extractTeachableUserId(currentUserResult.data);
      const teachableProfileResult = await fetchTeachableUserProfile(tokenPayload.access_token, userId);
      const enrichedUser = buildUserWithAccess(currentUserResult.data, teachableProfileResult.data);

      const response = NextResponse.json(
        {
          authenticated: true,
          user: enrichedUser,
        },
        { status: 200 }
      );
      applyTokenCookies(response, tokenPayload);
      return response;
    } catch {
      const response = unauthenticatedResponse();
      clearTokenCookies(response);
      return response;
    }
  }

  let currentUserResult = await fetchCurrentUser(accessToken);
  if (currentUserResult.ok) {
    const userId = extractTeachableUserId(currentUserResult.data);
    const teachableProfileResult = await fetchTeachableUserProfile(accessToken, userId);
    const enrichedUser = buildUserWithAccess(currentUserResult.data, teachableProfileResult.data);

    return NextResponse.json(
      {
        authenticated: true,
        user: enrichedUser,
      },
      { status: 200 }
    );
  }

  if (currentUserResult.status !== 401 || !refreshToken) {
    const response = unauthenticatedResponse();
    clearTokenCookies(response);
    return response;
  }

  try {
    const config = getTeachableOAuthConfig();
    const tokenPayload = await refreshTokens(config, refreshToken);

    if (!tokenPayload?.access_token) {
      const response = unauthenticatedResponse();
      clearTokenCookies(response);
      return response;
    }

    currentUserResult = await fetchCurrentUser(tokenPayload.access_token);
    if (!currentUserResult.ok) {
      const response = unauthenticatedResponse();
      clearTokenCookies(response);
      return response;
    }

    const userId = extractTeachableUserId(currentUserResult.data);
    const teachableProfileResult = await fetchTeachableUserProfile(tokenPayload.access_token, userId);
    const enrichedUser = buildUserWithAccess(currentUserResult.data, teachableProfileResult.data);

    const response = NextResponse.json(
      {
        authenticated: true,
        user: enrichedUser,
      },
      { status: 200 }
    );
    applyTokenCookies(response, tokenPayload);
    return response;
  } catch {
    const response = unauthenticatedResponse();
    clearTokenCookies(response);
    return response;
  }
}
