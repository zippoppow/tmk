/**
 * GET /api/auth/callback
 *
 * Handles redirect from TMK API's Teachable OAuth callback.
 * 
 * The TMK API's /api/auth/teachable/callback endpoint:
 * 1. Receives OAuth code from Teachable
 * 2. Exchanges it for Teachable session token
 * 3. Sets tmk_teachable_session cookie (httpOnly)
 * 4. Redirects to this endpoint (/api/auth/callback)
 *
 * This endpoint then:
 * 1. Gets user info via /api/auth/teachable/me (using the Teachable session cookie)
 * 2. Checks DIY enrollment
 * 3. Sets app session cookie (tmk_app_session)
 * 4. Redirects to destination
 *
 * Query params:
 * - redirectTo: Where to redirect after session is initialized (default: /)
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const DIY_COURSE_ID = '2944218';
const TEACHABLE_ENROLLMENT_ENDPOINT = '/api/teachable-enrollment';

async function getUserInfo(apiOrigin, teachableSession) {
	try {
		const url = new URL(`${apiOrigin}/api/auth/teachable/me`);
		// Pass teachable_session as query param so it gets forwarded to TMK API
		if (teachableSession) {
			url.searchParams.set('teachable_session', teachableSession);
		}

		console.log('[callback.getUserInfo] calling:', url.toString());

		const response = await fetch(url.toString(), {
			method: 'GET',
		});

		console.log('[callback.getUserInfo] response status:', response.status);

		if (!response.ok) {
			console.error('[callback.getUserInfo] failed with status:', response.status);
			const errorText = await response.text();
			console.error('[callback.getUserInfo] error body:', errorText);
			return null;
		}

		const data = await response.json();
		console.log('[callback.getUserInfo] got data:', !!data, 'email:', data?.data?.email || data?.email);
		return data?.data || data || null;
	} catch (error) {
		console.error('[callback.getUserInfo] error:', error?.message || error);
		return null;
	}
}

async function checkEnrollment(apiOrigin, userEmail) {
	try {
		const email = encodeURIComponent(userEmail);
		const url = new URL(`${apiOrigin}${TEACHABLE_ENROLLMENT_ENDPOINT}`);
		url.searchParams.set('email', email);
		url.searchParams.set('courseNumber', DIY_COURSE_ID);

		const response = await fetch(url.toString(), {
			method: 'GET',
		});

		if (!response.ok) {
			console.error('[callback] enrollment check failed:', response.status);
			return false;
		}

		const data = await response.json();
		return data?.enrolled === true;
	} catch (error) {
		console.error('[callback] enrollment check error:', error?.message || error);
		return false;
	}
}

export async function GET(request) {
	try {
		const { searchParams } = request.nextUrl;
		const redirectTo = searchParams.get('redirectTo') || '/';
		const teachableSession = searchParams.get('teachable_session');

		console.log('[callback] Starting OAuth callback handler');
		console.log('[callback] redirectTo:', redirectTo);
		console.log('[callback] teachableSession present:', !!teachableSession);

		// Determine API origin (from env or default)
		const apiOrigin = process.env.NEXT_PUBLIC_TMK_API_URL || 
			(process.env.NODE_ENV === 'production' 
				? 'https://tmk-api.up.railway.app' 
				: 'http://localhost:3000');

		console.log('[callback] apiOrigin:', apiOrigin);

		// Get user info using the teachable_session passed by TMK API
		const userInfo = await getUserInfo(apiOrigin, teachableSession);
		console.log('[callback] userInfo retrieved:', !!userInfo, userInfo?.email);
		
		if (!userInfo) {
			// User not authenticated via Teachable session
			console.log('[callback] Failed to get user info, redirecting to login');
			const errorResponse = NextResponse.redirect(new URL('/login?auth=error&message=' + encodeURIComponent('Failed to fetch user info'), request.url));
			errorResponse.headers.set('X-TMK-CALLBACK-ERROR', 'no-user-info');
			return errorResponse;
		}

		// Check DIY enrollment
		const userEmail = userInfo.email || userInfo?.profile?.email || '';
		const hasDiyAccess = await checkEnrollment(apiOrigin, userEmail);

		console.log('[callback] enrollment check:', hasDiyAccess, 'for', userEmail);

		// Prepare app session
		const APP_SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
		const appSessionExpiresAt = Date.now() + APP_SESSION_LIFETIME_MS;
		const cookieValue = `isAppLoggedIn:true|${appSessionExpiresAt}`;

		console.log('[callback] setting cookie with expiry:', appSessionExpiresAt);

		// Create redirect response
		const redirectUrl = new URL(redirectTo, request.url);
		const response = NextResponse.redirect(redirectUrl);

		// Set httpOnly app session cookie
		response.cookies.set('tmk_app_session', cookieValue, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: APP_SESSION_LIFETIME_MS / 1000, // Max-Age in seconds
			path: '/',
		});

		// Store user and enrollment info in separate cookies for client access
		// (note: these are NOT httpOnly so client can read them)
		response.cookies.set('tmk_user_email', userEmail, {
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: APP_SESSION_LIFETIME_MS / 1000,
			path: '/',
		});

		response.cookies.set('tmk_has_diy_access', String(hasDiyAccess), {
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: APP_SESSION_LIFETIME_MS / 1000,
			path: '/',
		});

		// Store headers for client to read if needed
		response.headers.set('X-TMK-USER-EMAIL', userEmail);
		response.headers.set('X-TMK-HAS-DIY-ACCESS', String(hasDiyAccess));
		response.headers.set('X-TMK-CALLBACK-SUCCESS', 'true');
		response.headers.set('X-TMK-COOKIE-EXPIRY', String(appSessionExpiresAt));

		console.log('[callback] OAuth flow complete, redirecting to:', redirectTo);

		return response;
	} catch (error) {
		console.error('[callback] error:', error?.message || error);
		const errorResponse = NextResponse.redirect(new URL('/login?auth=error&message=' + encodeURIComponent('Authentication failed'), request.url));
		errorResponse.headers.set('X-TMK-CALLBACK-ERROR', error?.message || 'unknown');
		return errorResponse;
	}
}
