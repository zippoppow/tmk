import { NextResponse } from 'next/server';

/**
 * POST /api/session/init
 *
 * Initialize app session after successful Teachable login + exchange.
 * Sets httpOnly cookie for app session state.
 *
 * Expected body:
 * {
 *   user: { email, id, name, ... },
 *   hasDiyAccess: boolean,
 *   jwtExpiresAtMs: number (timestamp)
 * }
 */
export async function POST(request) {
	try {
		const body = await request.json().catch(() => ({}));

		if (!body.user || typeof body.user !== 'object') {
			return NextResponse.json({ error: 'Missing or invalid user object' }, { status: 400 });
		}

		const hasDiyAccess = Boolean(body.hasDiyAccess);
		const jwtExpiresAtMs = Number(body.jwtExpiresAtMs) || Date.now() + 7200 * 1000;

		// App session lifetime: 7 days
		const APP_SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
		const appSessionExpiresAt = Date.now() + APP_SESSION_LIFETIME_MS;

		// Set httpOnly cookie for app session
		// Format: isAppLoggedIn:true|<expiresAtTimestamp>
		const cookieValue = `isAppLoggedIn:true|${appSessionExpiresAt}`;

		const response = NextResponse.json(
			{
				success: true,
				appSessionExpiresAt,
				jwtExpiresAtMs,
			},
			{ status: 200 }
		);

		// Set secure httpOnly cookie
		response.cookies.set('tmk_app_session', cookieValue, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: APP_SESSION_LIFETIME_MS / 1000, // Max-Age in seconds
			path: '/',
		});

		return response;
	} catch (error) {
		return NextResponse.json({ error: 'Failed to initialize session' }, { status: 500 });
	}
}
