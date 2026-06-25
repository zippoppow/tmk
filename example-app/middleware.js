import { NextResponse } from 'next/server';

const AUTH_BYPASS_FLAG = String(process.env.NEXT_PUBLIC_AUTH_BYPASS || '').trim().toLowerCase();
const AUTH_BYPASS_REQUESTED = AUTH_BYPASS_FLAG === '1' || AUTH_BYPASS_FLAG === 'true' || AUTH_BYPASS_FLAG === 'yes' || AUTH_BYPASS_FLAG === 'on';
const AUTH_BYPASS_ENABLED = process.env.NODE_ENV !== 'production' && AUTH_BYPASS_REQUESTED;
const TEACHABLE_SESSION_PARAM = 'teachable_session';
const AUTH_STATUS_PARAM = 'auth';
const LOGIN_PATH = '/login';

function isInternalOrStaticPath(pathname) {
  if (!pathname) {
    return true;
  }

  if (pathname.startsWith('/_next/')) {
    return true;
  }

  if (pathname.startsWith('/api/')) {
    return true;
  }

  if (pathname === '/favicon.ico') {
    return true;
  }

  // Requests for public assets include a file extension in the pathname.
  return pathname.includes('.') && !pathname.endsWith('.well-known');
}

function extractAuthenticatedUser(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const root =
    data.data && typeof data.data === 'object' && !Array.isArray(data.data)
      ? data.data
      : data.result && typeof data.result === 'object' && !Array.isArray(data.result)
        ? data.result
        : data;

  const explicitAuth =
    typeof root.authenticated === 'boolean'
      ? root.authenticated
      : typeof root.isAuthenticated === 'boolean'
        ? root.isAuthenticated
        : typeof root.loggedIn === 'boolean'
          ? root.loggedIn
          : null;

  const user = root.user || root.member || root.currentUser || root.profile || null;
  const inferredUser = user || (root.email || root.id || root.name ? root : null);

  if (explicitAuth === false) {
    return null;
  }

  if (explicitAuth === true) {
    return inferredUser || {};
  }

  return inferredUser;
}

/**
 * Parse app session cookie and check if session is valid
 * Format: "isAppLoggedIn:true|false;expiresAt:<timestamp>"
 */
function hasValidAppSession(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {});

    const appSessionCookie = cookies['tmk_app_session'];
    
    if (!appSessionCookie) {
      return false;
    }

    // URL-decode the cookie value (browsers encode special chars like : and |)
    let decodedCookie;
    try {
      decodedCookie = decodeURIComponent(appSessionCookie);
    } catch (e) {
      return false;
    }

// Parse cookie value: format is "isAppLoggedIn:true|<expiresAtTimestamp>"
	const [loginState, expiryStr] = decodedCookie.split('|');

	if (!loginState || !loginState.startsWith('isAppLoggedIn:true')) {
		return false;
	}

	// Check expiry
	if (expiryStr) {
		const expiresAt = parseInt(expiryStr, 10);
      if (!Number.isFinite(expiresAt)) {
        return false;
      }
      if (Date.now() > expiresAt) {
        return false; // Session expired
      }
    }

    return true;
  } catch {
    return false;
  }
}

function isReturningFromAuth(request) {
  const session = (request.nextUrl.searchParams.get(TEACHABLE_SESSION_PARAM) || '').trim();
  const authStatus = (request.nextUrl.searchParams.get(AUTH_STATUS_PARAM) || '').trim().toLowerCase();
  return Boolean(session) || authStatus === 'success';
}

function buildLoginRedirect(request) {
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set('next', nextPath);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request) {
  if (AUTH_BYPASS_ENABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isInternalOrStaticPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  if (isReturningFromAuth(request)) {
    return NextResponse.next();
  }

  const isAuthenticated = hasValidAppSession(request);
  if (!isAuthenticated) {
    return buildLoginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
