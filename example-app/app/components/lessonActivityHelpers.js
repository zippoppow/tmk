const DEFAULT_API_ORIGINS = {
	production: 'https://tmk-api.up.railway.app',
	staging: 'https://tmk-api.up.railway.app',
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

function getConfiguredApiOrigins(defaultOrigins) {
	const configuredDefault = trimOrigin(process.env.NEXT_PUBLIC_TMK_API_URL);
	const configuredProduction = trimOrigin(process.env.NEXT_PUBLIC_TMK_API_URL_PRODUCTION);

	return {
		staging: configuredDefault || defaultOrigins.staging,
		production: configuredProduction || configuredDefault || defaultOrigins.production,
	};
}

export const OAUTH_ENDPOINTS = {
	start: '/api/auth/teachable/start',
	me: '/api/auth/teachable/me',
	logout: '/api/auth/teachable/logout',
};

export const USER_AUTH_ENDPOINTS = {
	token: '/api/auth/user/token',
	refresh: '/api/auth/user/refresh',
};

export const TEACHABLE_SESSION_PARAM = 'teachable_session';
export const TEACHABLE_SESSION_STORAGE_KEY = 'tmk-teachable-session-handoff';
export const LESSON_ACTIVITIES_ENDPOINT = '/api/lesson-activities';

export const DIY_PROJECTS_ENDPOINT = '/api/diy-projects';
export const DEFAULT_SESSION_STORAGE_KEY = 'tmk-diy-sessions';
export const PROJECTS_STORAGE_KEY = 'tmk-diy-projects';
export const AUTH_BYPASS_ENABLED = false;
const AUTH_BYPASS_USER = {
	id: 'dev-user',
	name: 'Development User',
	email: 'dev@example.com',
};

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

	const { protocol, hostname } = window.location;
	const isLocalHost =
		protocol === 'file:' ||
		!hostname ||
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname.endsWith('.local') ||
		hostname.includes('railway.app') ||
		hostname.includes('staging');

	if (isLocalHost) {
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
	const origin = trimOrigin(apiOrigin) || resolveTmkApiOrigin();
	const authUrl = new URL(OAUTH_ENDPOINTS.start, origin);
	authUrl.searchParams.set('redirectTo', redirectTo || window.location.href);
	console.log('[TMK auth] start URL:', authUrl.toString());
	return authUrl.toString();
}

export function buildTeachableLogoutUrl(redirectTo, apiOrigin) {
	const origin = trimOrigin(apiOrigin) || resolveTmkApiOrigin();
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
	try {
		const origin = trimOrigin(apiOrigin) || resolveTmkApiOrigin();
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
	try {
		const origin = trimOrigin(apiOrigin) || resolveTmkApiOrigin();
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
	if (AUTH_BYPASS_ENABLED) {
		return AUTH_BYPASS_USER;
	}

	try {
		const origin = trimOrigin(apiOrigin) || resolveTmkApiOrigin();
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

export function readFormSessionData(formName, storageKey = DEFAULT_SESSION_STORAGE_KEY) {
	if (typeof window === 'undefined') {
		return null;
	}

	const allSessions = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
	return allSessions[formName] || null;
}

export function writeFormSessionData(formName, data, storageKey = DEFAULT_SESSION_STORAGE_KEY) {
	if (typeof window === 'undefined') {
		return;
	}

	const allSessions = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
	allSessions[formName] = {
		...data,
		timestamp: Date.now(),
	};
	window.localStorage.setItem(storageKey, JSON.stringify(allSessions));
}

export function clearFormSessionData(formName, storageKey = DEFAULT_SESSION_STORAGE_KEY) {
	if (typeof window === 'undefined') {
		return;
	}

	const allSessions = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
	delete allSessions[formName];
	window.localStorage.setItem(storageKey, JSON.stringify(allSessions));
}

export function getAllStoredProjects(storageKey = PROJECTS_STORAGE_KEY) {
	try {
		return JSON.parse(window.localStorage.getItem(storageKey) || '[]');
	} catch {
		return [];
	}
}

export function saveStoredProjects(projects, storageKey = PROJECTS_STORAGE_KEY) {
	window.localStorage.setItem(storageKey, JSON.stringify(projects));
}

export function createProjectId() {
	return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createLessonActivityId() {
	return `la_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeLessonActivityPayload(payload) {
	if (!payload || typeof payload !== 'object') {
		return [];
	}

	if (Array.isArray(payload)) {
		return payload;
	}

	if (Array.isArray(payload['lesson-activities'])) {
		return payload['lesson-activities'];
	}

	if (payload.data && Array.isArray(payload.data['lesson-activities'])) {
		return payload.data['lesson-activities'];
	}

	if (payload.data && Array.isArray(payload.data)) {
		return payload.data;
	}

	return [];
}

export async function upsertLessonActivity(apiOrigin, record) {
	return fetchWithUserToken(apiOrigin, LESSON_ACTIVITIES_ENDPOINT, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(record),
	});
}

export async function listLessonActivities(apiOrigin) {
	const response = await fetchWithUserToken(apiOrigin, LESSON_ACTIVITIES_ENDPOINT, {
		method: 'GET',
	});

	if (!response.ok) {
		return [];
	}

	const payload = await response.json().catch(() => ({}));
	return normalizeLessonActivityPayload(payload);
}

export async function deleteLessonActivityById(apiOrigin, id) {
	if (!id) {
		return new Response(null, { status: 400, statusText: 'Missing lesson activity id' });
	}

	return fetchWithUserToken(apiOrigin, LESSON_ACTIVITIES_ENDPOINT, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id }),
	});
}

export function extractDiyProjectsFromResponse(payload) {
	if (Array.isArray(payload)) {
		return payload.flatMap((item) => {
			if (item && Array.isArray(item['diy-projects'])) {
				return item['diy-projects'];
			}
			if (item && item['project-name']) {
				return [item];
			}
			return [];
		});
	}

	if (payload && typeof payload === 'object' && Array.isArray(payload['diy-projects'])) {
		return payload['diy-projects'];
	}

	return [];
}

export function formatProjectDate(iso) {
	try {
		return new Date(iso).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	} catch {
		return String(iso || '');
	}
}

export function formatActivityDate(ms) {
	try {
		if (Number.isFinite(Number(ms))) {
			return new Date(Number(ms)).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
			});
		}
		return '';
	} catch {
		return '';
	}
}
