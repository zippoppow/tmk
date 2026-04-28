// API endpoint for DIY projects access check
export const DIY_PROJECTS_ENDPOINT = '/api/teachable-enrollment';
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
	access: {
		diyCourseId: String(process.env.NEXT_PUBLIC_TEACHABLE_DIY_COURSE_ID || process.env.TEACHABLE_DIY_COURSE_ID || '').trim(),
		diyCourseActiveEnrollment: true,
		enrollmentChecked: true,
		lessonActivities: true,
		lessonProjects: true,
	},
};

const DIY_COURSE_ID = String(process.env.NEXT_PUBLIC_TEACHABLE_DIY_COURSE_ID || process.env.TEACHABLE_DIY_COURSE_ID || '').trim();
const AUTH_HINT_COOKIE = 'tmk_auth_hint';
const DIY_ACCESS_HINT_COOKIE = 'tmk_diy_access_hint';
const AUTH_HINT_MAX_AGE_SECONDS = 60 * 60 * 12;
const TMK_API_AUTH_HEADER = 'x-api-key';
const AUTH_DEBUG_ENABLED = process.env.NODE_ENV !== 'production';

function authDebug(label, payload) {
	if (!AUTH_DEBUG_ENABLED) {
		return;
	}

	if (payload === undefined) {
		// eslint-disable-next-line no-console
		console.log(`[TMK auth debug] ${label}`);
		return;
	}

	// eslint-disable-next-line no-console
	console.log(`[TMK auth debug] ${label}`, payload);
}

function summarizeHeaders(headersLike) {
	const headers = new Headers(headersLike || {});
	const summary = {};
	headers.forEach((value, key) => {
		const normalized = key.toLowerCase();
		if (normalized === 'authorization') {
			summary[normalized] = value ? `Bearer ${String(value).slice(0, 16)}...` : '';
			return;
		}
		if (normalized === TMK_API_AUTH_HEADER) {
			summary[normalized] = value ? `${String(value).slice(0, 8)}...` : '';
			return;
		}
		summary[normalized] = value;
	});
	return summary;
}

function toIdString(value) {
	if (value === null || value === undefined) {
		return '';
	}
	return String(value).trim();
}

function getUserCourses(user) {
	if (Array.isArray(user?.teachableProfile?.courses)) {
		return user.teachableProfile.courses;
	}
	if (Array.isArray(user?.courses)) {
		return user.courses;
	}
	return [];
}

function trimOrigin(value) {
	if (typeof value !== 'string') {
		return '';
	}
	return value.trim().replace(/\/$/, '');
}

function isLocalDevHost(hostname) {
	if (!hostname) {
		return false;
	}

	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
}

function getTmkApiAuthKey() {
	if (typeof window === 'undefined') {
		return String(process.env.TMK_API_AUTH_KEY || '').trim();
	}

	return '';
}

export function applyTmkApiAuthKeyHeader(headersLike) {
	const headers = new Headers(headersLike || {});
	const apiAuthKey = getTmkApiAuthKey();
	if (apiAuthKey && !headers.has(TMK_API_AUTH_HEADER)) {
		headers.set(TMK_API_AUTH_HEADER, apiAuthKey);
	}
	return headers;
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

function resolveProductionApiOrigin(origins = DEFAULT_API_ORIGINS) {
	const configured = getConfiguredApiOrigins(origins);
	const fallback = trimOrigin(origins?.production) || DEFAULT_API_ORIGINS.production;
	const candidate = trimOrigin(configured.production) || fallback;

	if (typeof window !== 'undefined') {
		const browserOrigin = trimOrigin(window.location.origin);
		if (candidate && browserOrigin && candidate === browserOrigin) {
			return fallback;
		}
	}

	return candidate;
}

export function resolveTmkAuthOrigin(origins = DEFAULT_API_ORIGINS) {
	return resolveProductionApiOrigin(origins);
}

function writeBrowserCookie(name, value, maxAgeSeconds = AUTH_HINT_MAX_AGE_SECONDS) {
	if (typeof document === 'undefined' || !name) {
		return;
	}

	const secureAttribute = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${Math.max(0, Number(maxAgeSeconds) || 0)}; SameSite=Lax${secureAttribute}`;
}

export function clearAuthStateHints() {
	if (typeof document === 'undefined') {
		return;
	}

	writeBrowserCookie(AUTH_HINT_COOKIE, '', 0);
	writeBrowserCookie(DIY_ACCESS_HINT_COOKIE, '', 0);
}

export function syncAuthStateHints(user) {
	if (typeof document === 'undefined') {
		return;
	}

	if (!user || typeof user !== 'object') {
		clearAuthStateHints();
		return;
	}

	writeBrowserCookie(AUTH_HINT_COOKIE, '1');
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
	return resolveProductionApiOrigin(origins);
}

export function buildTeachableStartUrl(apiOriginOrRedirectTo, redirectTo) {
	if (isAuthBypassMode()) {
		return (redirectTo || apiOriginOrRedirectTo) || (typeof window !== 'undefined' ? window.location.href : '/');
	}

	const resolvedRedirectTo = redirectTo || apiOriginOrRedirectTo;
	const origin = resolveTmkAuthOrigin();
	const authUrl = new URL(OAUTH_ENDPOINTS.start, origin);
	authUrl.searchParams.set('redirectTo', resolvedRedirectTo || window.location.href);
	return authUrl.toString();
}

export function buildTeachableLogoutUrl(redirectTo) {
	clearAuthStateHints();

	if (isAuthBypassMode()) {
		if (typeof window === 'undefined') {
			return redirectTo || '/';
		}

		if (redirectTo && redirectTo.startsWith('/')) {
			return `${window.location.origin}${redirectTo}`;
		}

		return redirectTo || window.location.href;
	}

	const origin = resolveTmkAuthOrigin();
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

export async function exchangeUserAccessToken() {
	if (isAuthBypassMode()) {
		userAccessToken = 'dev-bypass-token';
		return userAccessToken;
	}

	try {
		const origin = resolveTmkAuthOrigin();
		const tokenPath = addTeachableSessionToPath(USER_AUTH_ENDPOINTS.token);
		const headers = applyTmkApiAuthKeyHeader();
		authDebug('exchangeUserAccessToken -> request', {
			url: `${origin}${tokenPath}`,
			method: 'GET',
			headers: summarizeHeaders(headers),
		});

		const response = await fetch(`${origin}${tokenPath}`, {
			method: 'GET',
			headers,
			credentials: 'include',
		});

		authDebug('exchangeUserAccessToken <- response', {
			method: 'GET',
			status: response.status,
			ok: response.ok,
			statusText: response.statusText,
		});

		if (!response.ok) {
			return '';
		}

		const payload = await response.json().catch(() => ({}));
		const token = getAccessTokenFromPayload(payload);
		authDebug('exchangeUserAccessToken parsed payload', {
			method: 'GET',
			hasToken: Boolean(token),
			payloadKeys: Object.keys(payload || {}),
		});
		if (token) {
			userAccessToken = token;
		}

		return token;
	} catch {
		authDebug('exchangeUserAccessToken failed');
		return '';
	}
}

export async function refreshUserAccessToken() {
	if (isAuthBypassMode()) {
		userAccessToken = 'dev-bypass-token';
		return userAccessToken;
	}

	try {
		const origin = resolveTmkAuthOrigin();
		authDebug('refreshUserAccessToken -> request', {
			url: `${origin}${USER_AUTH_ENDPOINTS.refresh}`,
			method: 'POST',
			headers: summarizeHeaders(applyTmkApiAuthKeyHeader()),
		});
		const response = await fetch(`${origin}${USER_AUTH_ENDPOINTS.refresh}`, {
			method: 'POST',
			headers: applyTmkApiAuthKeyHeader(),
			credentials: 'include',
		});
		authDebug('refreshUserAccessToken <- response', {
			status: response.status,
			ok: response.ok,
			statusText: response.statusText,
		});

		if (!response.ok) {
			userAccessToken = '';
			return '';
		}

		const payload = await response.json().catch(() => ({}));
		const token = getAccessTokenFromPayload(payload);
		authDebug('refreshUserAccessToken parsed payload', {
			hasToken: Boolean(token),
			payloadKeys: Object.keys(payload || {}),
		});
		userAccessToken = token || '';
		return userAccessToken;
	} catch {
		authDebug('refreshUserAccessToken failed');
		userAccessToken = '';
		return '';
	}
}

export async function getUserAccessToken(apiOrigin, forceRefresh = false) {
	if (!forceRefresh && userAccessToken) {
		return userAccessToken;
	}

	if (forceRefresh) {
		return refreshUserAccessToken();
	}

	return exchangeUserAccessToken();
}

export async function fetchWithUserToken(apiOrigin, endpoint, init = {}) {
	try {
		const origin = trimOrigin(apiOrigin) || resolveTmkApiOrigin();
		authDebug('fetchWithUserToken start', {
			origin,
			endpoint,
			method: init.method || 'GET',
		});

		if (isAuthBypassMode()) {
			const endpointPath = addTeachableSessionToPath(endpoint);
			const headers = applyTmkApiAuthKeyHeader(init.headers);
			authDebug('fetchWithUserToken bypass -> request', {
				url: `${origin}${endpointPath}`,
				method: init.method || 'GET',
				headers: summarizeHeaders(headers),
			});
			return fetch(`${origin}${endpointPath}`, {
				...init,
				headers,
				credentials: 'include',
			});
		}

		const token = await getUserAccessToken(apiOrigin);
		if (!token) {
			return new Response(null, { status: 401, statusText: 'Unauthorized' });
		}

		const headers = applyTmkApiAuthKeyHeader(init.headers);
		headers.set('Authorization', `Bearer ${token}`);

		const requestInit = {
			...init,
			headers,
			credentials: 'include',
		};

		const endpointPath = addTeachableSessionToPath(endpoint);
		authDebug('fetchWithUserToken -> request', {
			url: `${origin}${endpointPath}`,
			method: requestInit.method || 'GET',
			headers: summarizeHeaders(requestInit.headers),
		});
		let response = await fetch(`${origin}${endpointPath}`, requestInit);
		authDebug('fetchWithUserToken <- response', {
			status: response.status,
			ok: response.ok,
			statusText: response.statusText,
		});
		if (response.status !== 401) {
			return response;
		}

		const refreshed = await refreshUserAccessToken();
		if (!refreshed) {
			const exchanged = await exchangeUserAccessToken();
			if (!exchanged) {
				return response;
			}
			headers.set('Authorization', `Bearer ${exchanged}`);
			authDebug('fetchWithUserToken retry after exchange -> request', {
				url: `${origin}${endpointPath}`,
				method: requestInit.method || 'GET',
				headers: summarizeHeaders(headers),
			});
			response = await fetch(`${origin}${endpointPath}`, {
				...requestInit,
				headers,
			});
			authDebug('fetchWithUserToken retry after exchange <- response', {
				status: response.status,
				ok: response.ok,
				statusText: response.statusText,
			});
			return response;
		}

		headers.set('Authorization', `Bearer ${refreshed}`);
		authDebug('fetchWithUserToken retry after refresh -> request', {
			url: `${origin}${endpointPath}`,
			method: requestInit.method || 'GET',
			headers: summarizeHeaders(headers),
		});
		response = await fetch(`${origin}${endpointPath}`, {
			...requestInit,
			headers,
		});
		authDebug('fetchWithUserToken retry after refresh <- response', {
			status: response.status,
			ok: response.ok,
			statusText: response.statusText,
		});

		return response;
	} catch (error) {
		authDebug('fetchWithUserToken failed', error?.message || error);
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

export async function fetchAuthenticatedUser() {
	if (isAuthBypassMode()) {
		syncAuthStateHints(AUTH_BYPASS_USER);
		return AUTH_BYPASS_USER;
	}

	try {
		const origin = resolveTmkAuthOrigin();
		const mePath = addTeachableSessionToPath(OAUTH_ENDPOINTS.me);
		authDebug('fetchAuthenticatedUser -> request', {
			url: `${origin}${mePath}`,
			method: 'GET',
			headers: summarizeHeaders(applyTmkApiAuthKeyHeader()),
		});
		const response = await fetch(`${origin}${mePath}`, {
			method: 'GET',
			headers: applyTmkApiAuthKeyHeader(),
			credentials: 'include',
		});
		authDebug('fetchAuthenticatedUser <- response', {
			status: response.status,
			ok: response.ok,
			statusText: response.statusText,
		});

		if (!response.ok) {
			clearAuthStateHints();
		//	if (process.env.NODE_ENV !== 'production') {
				console.warn('[TMK auth] /me returned', response.status, response.statusText);
		//	}
			return null;
		}

		const data = await response.json();
		authDebug('fetchAuthenticatedUser payload', {
			payloadKeys: Object.keys(data || {}),
			hasUserCandidate: Boolean(data?.user || data?.data || data?.result || data?.email),
		});
		const user = extractAuthenticatedUser(data);
		if (user) {
			syncAuthStateHints(user);
			return user;
		}
		clearAuthStateHints();
		if (process.env.NODE_ENV !== 'production') {
			console.warn('[TMK auth] /me returned 200 but could not extract user. Raw response:', data);
		}
		return null;
	} catch (err) {
		clearAuthStateHints();
		if (process.env.NODE_ENV !== 'production') {
			console.error('[TMK auth] /me fetch failed (possible CORS or network error):', err?.message || err);
		}
		return null;
	}
}