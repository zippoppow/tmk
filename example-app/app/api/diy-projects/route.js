import { NextResponse } from 'next/server';

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

async function forwardRequest(request, method) {
	try {
		const apiOrigin = resolveApiOrigin(request);
		const cookies = request.headers.get('cookie') || '';
		const authorization = request.headers.get('authorization') || '';

		const headers = {
			'Content-Type': 'application/json',
			Cookie: cookies,
		};

		if (authorization) {
			headers['Authorization'] = authorization;
		}

		const init = {
			method,
			headers,
			credentials: 'include',
		};

		if (method !== 'GET' && request.body) {
			init.body = JSON.stringify(await request.json().catch(() => ({})));
		}

		const response = await fetch(`${apiOrigin}/api/diy-projects`, init);

		const data = await response.json().catch(() => ({}));

		const result = NextResponse.json(data, { status: response.status });

		const setCookieHeaders = response.headers.getSetCookie();
		for (const setCookie of setCookieHeaders) {
			result.headers.append('Set-Cookie', setCookie);
		}

		return result;
	} catch (error) {
		return NextResponse.json(
			{ error: error?.message || 'DIY projects request failed' },
			{ status: 500 }
		);
	}
}

export async function GET(request) {
	return forwardRequest(request, 'GET');
}

export async function PUT(request) {
	return forwardRequest(request, 'PUT');
}

export async function POST(request) {
	return forwardRequest(request, 'POST');
}

export async function DELETE(request) {
	return forwardRequest(request, 'DELETE');
}
