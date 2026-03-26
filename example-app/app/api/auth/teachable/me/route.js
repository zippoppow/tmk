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

      const response = NextResponse.json(
        {
          authenticated: true,
          user: currentUserResult.data,
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
    return NextResponse.json(
      {
        authenticated: true,
        user: currentUserResult.data,
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

    const response = NextResponse.json(
      {
        authenticated: true,
        user: currentUserResult.data,
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
