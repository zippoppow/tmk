import { NextResponse } from 'next/server';

function parseAppSessionCookie(cookieHeader) {
	if (!cookieHeader) {
		return { authenticated: false, expiresAt: null };
	}

	const cookies = String(cookieHeader)
		.split(';')
		.reduce((accumulator, cookie) => {
			const [rawName, ...rawValueParts] = cookie.trim().split('=');
			if (!rawName) {
				return accumulator;
			}
			accumulator[rawName] = rawValueParts.join('=');
			return accumulator;
		}, {});

	const rawCookie = cookies.tmk_app_session;
	if (!rawCookie) {
		return { authenticated: false, expiresAt: null };
	}

	let decoded;
	try {
		decoded = decodeURIComponent(rawCookie);
	} catch {
		return { authenticated: false, expiresAt: null };
	}

	const [loginState, expiryValue] = decoded.split('|');
	if (!loginState || !loginState.startsWith('isAppLoggedIn:true')) {
		return { authenticated: false, expiresAt: null };
	}

	const expiresAt = Number.parseInt(expiryValue, 10);
	if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
		return { authenticated: false, expiresAt: Number.isFinite(expiresAt) ? expiresAt : null };
	}

	return {
		authenticated: true,
		expiresAt,
	};
}

export async function GET(request) {
	const { authenticated, expiresAt } = parseAppSessionCookie(request.headers.get('cookie') || '');
	return NextResponse.json(
		{
			authenticated,
			expiresAt,
		},
		{ status: 200 }
	);
}
