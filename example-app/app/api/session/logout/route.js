import { NextResponse } from 'next/server';

/**
 * POST /api/session/logout
 *
 * Clear app session and associated cookies.
 */
export async function POST(request) {
	const response = NextResponse.json(
		{
			success: true,
		},
		{ status: 200 }
	);

	// Clear app session cookie
	response.cookies.set('tmk_app_session', '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 0, // Expire immediately
		path: '/',
	});

	return response;
}
