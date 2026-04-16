import {
	AUTH_BYPASS_ENABLED,
	DEFAULT_API_ORIGINS,
	OAUTH_ENDPOINTS,
	TEACHABLE_SESSION_PARAM,
	TEACHABLE_SESSION_STORAGE_KEY,
	USER_AUTH_ENDPOINTS,
} from './sharedHelperConstants';

export {
	AUTH_BYPASS_ENABLED,
	DEFAULT_API_ORIGINS,
	OAUTH_ENDPOINTS,
	TEACHABLE_SESSION_PARAM,
	TEACHABLE_SESSION_STORAGE_KEY,
	USER_AUTH_ENDPOINTS,
} from './sharedHelperConstants';

const AUTH_BYPASS_USER = {
	id: String(process.env.NEXT_PUBLIC_DEV_USER_ID || 'dev-user').trim() || 'dev-user',
	name: String(process.env.NEXT_PUBLIC_DEV_USER_NAME || 'Development User').trim() || 'Development User',
	email: String(process.env.NEXT_PUBLIC_DEV_USER_EMAIL || 'dev@example.com').trim() || 'dev@example.com',
};

function trimOrigin(value) {
	if (typeof value !== 'string') {
		return '';
	}
	return value.trim().replace(/\/$/, '');
}

function isLocalOrigin(origin) {
	if (!origin) {
		return false;
	}
	return (
		origin.includes('localhost') ||
		origin.includes('127.0.0.1') ||
		origin.startsWith('file:')
	);
}

function isLocalDevHost(hostname) {
	if (!hostname) {
		return false;
	}

	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
}

export function isAuthBypassMode() {
	if (!AUTH_BYPASS_ENABLED) {
		return false;
	}

	if (typeof window === 'undefined') {
		return process.env.NODE_ENV !== 'production';
	}

	return isLocalDevHost(window.location.hostname);
}

function getConfiguredApiOrigins(defaultOrigins) {
	const configuredDefault = trimOrigin(process.env.NEXT_PUBLIC_TMK_API_URL);
	const configuredProduction = trimOrigin(process.env.NEXT_PUBLIC_TMK_API_URL_PRODUCTION);

	return {
		staging: configuredDefault || defaultOrigins.staging,
		production: configuredProduction || configuredDefault || defaultOrigins.production,
	};
}

function resolveBrowserSameOriginFallback(apiOrigin) {
	if (typeof window !== 'undefined') {
		const browserOrigin = trimOrigin(window.location.origin);
		if (browserOrigin) {
			return browserOrigin;
		}
	}

	return trimOrigin(apiOrigin) || resolveTmkApiOrigin();
}

let userAccessToken = '';
let teachableSessionHandoff = '';

export function getUserAccessTokenDebugInfo() {
	const hasToken = Boolean(userAccessToken);
	return {
		hasToken,
		tokenPreview: hasToken ? `${userAccessToken.slice(0, 16)}...` : '',
	};
}

export function getTeachableSessionDebugInfo() {
	const session = getTeachableSessionHandoff();
	const hasSession = Boolean(session);
	return {
		hasSession,
		sessionPreview: hasSession ? `${session.slice(0, 12)}...` : '',
	};
}

export function getTeachableSessionHandoff() {
	if (teachableSessionHandoff) {
		return teachableSessionHandoff;
	}

	if (typeof window === 'undefined') {
		return '';
	}

	const stored = window.sessionStorage.getItem(TEACHABLE_SESSION_STORAGE_KEY) || '';
	if (stored) {
		teachableSessionHandoff = stored;
	}

	return teachableSessionHandoff;
}

export function setTeachableSessionHandoff(sessionId) {
	teachableSessionHandoff = typeof sessionId === 'string' ? sessionId.trim() : '';

	if (typeof window === 'undefined') {
		return;
	}

	if (teachableSessionHandoff) {
		window.sessionStorage.setItem(TEACHABLE_SESSION_STORAGE_KEY, teachableSessionHandoff);
		return;
	}

	window.sessionStorage.removeItem(TEACHABLE_SESSION_STORAGE_KEY);
}

export function captureTeachableSessionFromUrl() {
	if (typeof window === 'undefined') {
		return '';
	}

	const url = new URL(window.location.href);
	const sessionFromQuery = (url.searchParams.get(TEACHABLE_SESSION_PARAM) || '').trim();
	if (!sessionFromQuery) {
		return getTeachableSessionHandoff();
	}

	setTeachableSessionHandoff(sessionFromQuery);
	url.searchParams.delete(TEACHABLE_SESSION_PARAM);
	window.history.replaceState({}, '', url.toString());
	return sessionFromQuery;
}

function addTeachableSessionToPath(path) {
	const session = captureTeachableSessionFromUrl() || getTeachableSessionHandoff();
	if (!session) {
		return path;
	}

	const separator = path.includes('?') ? '&' : '?';
	return `${path}${separator}${TEACHABLE_SESSION_PARAM}=${encodeURIComponent(session)}`;
}

export function resolveTmkApiOrigin(origins = DEFAULT_API_ORIGINS) {
	const resolvedOrigins = getConfiguredApiOrigins(origins);

	if (typeof window === 'undefined') {
		return resolvedOrigins.production;
	}

	const { protocol, hostname, origin } = window.location;
	const browserOrigin = trimOrigin(origin);
	const isLocalHost =
		protocol === 'file:' ||
		!hostname ||
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname.endsWith('.local');

	const isTunnelHost =
		hostname.endsWith('.ngrok-free.app') ||
		hostname.endsWith('.ngrok.io') ||
		hostname.endsWith('.loca.lt');

	if ((isLocalHost || isTunnelHost) && browserOrigin) {
		return browserOrigin;
	}

	const isStagingLikeHost =
		hostname.includes('railway.app') ||
		hostname.includes('staging');

	if (isStagingLikeHost) {
		return resolvedOrigins.staging;
	}

	// Safety: never use localhost API origins on production hosts.
	if (isLocalOrigin(resolvedOrigins.production)) {
		return origins.production;
	}

	if (hostname === 'tmk.themorphologykit.com' || hostname.endsWith('.themorphologykit.com')) {
		return resolvedOrigins.production;
	}

	return resolvedOrigins.production;
}

export function buildTeachableStartUrl(apiOrigin, redirectTo) {
	if (isAuthBypassMode()) {
		return redirectTo || (typeof window !== 'undefined' ? window.location.href : '/');
	}

	const origin = resolveBrowserSameOriginFallback(apiOrigin);
	const authUrl = new URL(OAUTH_ENDPOINTS.start, origin);
	authUrl.searchParams.set('redirectTo', redirectTo || window.location.href);
	console.log('[TMK auth] start URL:', authUrl.toString());
	return authUrl.toString();
}

export function buildTeachableLogoutUrl(redirectTo, apiOrigin) {
	if (isAuthBypassMode()) {
		if (typeof window === 'undefined') {
			return redirectTo || '/';
		}

		if (redirectTo && redirectTo.startsWith('/')) {
			return `${window.location.origin}${redirectTo}`;
		}

		return redirectTo || window.location.href;
	}

	const origin = resolveBrowserSameOriginFallback(apiOrigin);
	const logoutUrl = new URL(OAUTH_ENDPOINTS.logout, origin);
	logoutUrl.searchParams.set('redirectTo', redirectTo || window.location.href);
	const session = getTeachableSessionHandoff();
	if (session) {
		logoutUrl.searchParams.set(TEACHABLE_SESSION_PARAM, session);
	}
	return logoutUrl.toString();
}

function getAccessTokenFromPayload(payload) {
	if (!payload || typeof payload !== 'object') {
		return '';
	}

	if (typeof payload.access_token === 'string' && payload.access_token.trim()) {
		return payload.access_token.trim();
	}

	if (payload.data && typeof payload.data === 'object') {
		const nested = payload.data;
		if (typeof nested.access_token === 'string' && nested.access_token.trim()) {
			return nested.access_token.trim();
		}
	}

	return '';
}

export async function exchangeUserAccessToken(apiOrigin) {
	if (isAuthBypassMode()) {
		userAccessToken = 'dev-bypass-token';
		return userAccessToken;
	}

	try {
		const origin = resolveBrowserSameOriginFallback(apiOrigin);
		const tokenPath = addTeachableSessionToPath(USER_AUTH_ENDPOINTS.token);
		const response = await fetch(`${origin}${tokenPath}`, {
			method: 'POST',
			credentials: 'include',
		});

		if (!response.ok) {
			return '';
		}

		const payload = await response.json().catch(() => ({}));
		const token = getAccessTokenFromPayload(payload);
		if (token) {
			userAccessToken = token;
		}

		return token;
	} catch {
		return '';
	}
}

export async function refreshUserAccessToken(apiOrigin) {
	if (isAuthBypassMode()) {
		userAccessToken = 'dev-bypass-token';
		return userAccessToken;
	}

	try {
		const origin = resolveBrowserSameOriginFallback(apiOrigin);
		const response = await fetch(`${origin}${USER_AUTH_ENDPOINTS.refresh}`, {
			method: 'POST',
			credentials: 'include',
		});

		if (!response.ok) {
			userAccessToken = '';
			return '';
		}

		const payload = await response.json().catch(() => ({}));
		const token = getAccessTokenFromPayload(payload);
		userAccessToken = token || '';
		return userAccessToken;
	} catch {
		userAccessToken = '';
		return '';
	}
}

export async function getUserAccessToken(apiOrigin, forceRefresh = false) {
	if (!forceRefresh && userAccessToken) {
		return userAccessToken;
	}

	if (forceRefresh) {
		return refreshUserAccessToken(apiOrigin);
	}

	return exchangeUserAccessToken(apiOrigin);
}

export async function fetchWithUserToken(apiOrigin, endpoint, init = {}) {
	try {
		const origin = trimOrigin(apiOrigin) || resolveTmkApiOrigin();

		if (isAuthBypassMode()) {
			const endpointPath = addTeachableSessionToPath(endpoint);
			return fetch(`${origin}${endpointPath}`, {
				...init,
				credentials: 'include',
			});
		}

		const token = await getUserAccessToken(apiOrigin);
		if (!token) {
			return new Response(null, { status: 401, statusText: 'Unauthorized' });
		}

		const headers = new Headers(init.headers || {});
		headers.set('Authorization', `Bearer ${token}`);

		const requestInit = {
			...init,
			headers,
			credentials: 'include',
		};

		const endpointPath = addTeachableSessionToPath(endpoint);
		let response = await fetch(`${origin}${endpointPath}`, requestInit);
		if (response.status !== 401) {
			return response;
		}

		const refreshed = await refreshUserAccessToken(apiOrigin);
		if (!refreshed) {
			const exchanged = await exchangeUserAccessToken(apiOrigin);
			if (!exchanged) {
				return response;
			}
			headers.set('Authorization', `Bearer ${exchanged}`);
			response = await fetch(`${origin}${endpoint}`, {
				...requestInit,
				headers,
			});
			return response;
		}

		headers.set('Authorization', `Bearer ${refreshed}`);
		response = await fetch(`${origin}${endpointPath}`, {
			...requestInit,
			headers,
		});

		return response;
	} catch {
		return new Response(null, { status: 503, statusText: 'Service unavailable' });
	}
}

export function extractAuthenticatedUser(data) {
	if (!data || typeof data !== 'object') {
		return null;
	}

	// Unwrap common Railway/Express envelope shapes: { data: {...} } or { result: {...} }
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

export async function fetchAuthenticatedUser(apiOrigin) {
	if (isAuthBypassMode()) {
		return AUTH_BYPASS_USER;
	}

	try {
		const origin = resolveBrowserSameOriginFallback(apiOrigin);
		const mePath = addTeachableSessionToPath(OAUTH_ENDPOINTS.me);
		const response = await fetch(`${origin}${mePath}`, {
			method: 'GET',
			credentials: 'include',
		});

		if (!response.ok) {
		//	if (process.env.NODE_ENV !== 'production') {
				console.warn('[TMK auth] /me returned', response.status, response.statusText);
		//	}
			return null;
		}

		const data = await response.json();
		const user = extractAuthenticatedUser(data);
		if (user) {
			await exchangeUserAccessToken(origin);
		}
		//if (!user && process.env.NODE_ENV !== 'production') {
			console.warn('[TMK auth] /me returned 200 but could not extract user. Raw response:', data);
		//}
		return user;
	} catch (err) {
		//if (process.env.NODE_ENV !== 'production') {
			console.error('[TMK auth] /me fetch failed (possible CORS or network error):', err?.message || err);
		//}
		return null;
	}
}