import { NextResponse } from 'next/server';
import { trimOrigin } from '../../teachable/_lib';

function trimOriginLocal(value) {
	if (typeof value !== 'string') {
		return '';
	}
	return value.trim().replace(/\/$/, '');
}

function getConfiguredApiOrigin() {
	const configuredDefault = trimOriginLocal(process.env.NEXT_PUBLIC_TMK_API_URL);
	const configuredProduction = trimOriginLocal(process.env.NEXT_PUBLIC_TMK_API_URL_PRODUCTION);

	const defaults = {
		staging: 'https://tmk-api.up.railway.app',
		production: 'https://tmk-api.up.railway.app',
	};

	return {
		staging: configuredDefault || defaults.staging,
		production: configuredProduction || configuredDefault || defaults.production,
	};
}

function resolveApiOrigin(request) {
	const origins = getConfiguredApiOrigin();
	const requestUrl = request.url;

	try {
		const { hostname } = new URL(requestUrl);
		const isProduction = hostname === 'themorphologykit.com' || hostname.endsWith('.themorphologykit.com') || hostname === 'themorphologykit.vercel.app';
		return isProduction ? origins.production : origins.staging;
	} catch {
		return origins.staging;
	}
}

export async function POST(request) {
	try {
		const apiOrigin = resolveApiOrigin(request);
		const cookies = request.headers.get('cookie') || '';

		const response = await fetch(`${apiOrigin}/api/auth/user/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: cookies,
			},
			credentials: 'include',
		});

		const data = await response.json().catch(() => ({}));

		const result = NextResponse.json(data, { status: response.status });

		const setCookieHeaders = response.headers.getSetCookie();
		for (const setCookie of setCookieHeaders) {
			result.headers.append('Set-Cookie', setCookie);
		}

		return result;
	} catch (error) {
		return NextResponse.json(
			{ error: error?.message || 'Token exchange failed' },
			{ status: 500 }
		);
	}
}
