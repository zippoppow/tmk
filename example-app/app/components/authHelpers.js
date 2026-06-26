import {
	AUTH_BYPASS_ENABLED,
	DEFAULT_API_ORIGINS,
	DIY_PROJECTS_ENDPOINT,
	OAUTH_ENDPOINTS,
	TEACHABLE_SESSION_PARAM,
	TEACHABLE_SESSION_STORAGE_KEY,
	USER_AUTH_ENDPOINTS,
} from './sharedHelperConstants';
import * as diySessionManager from '../lib/diySessionManager';
import * as diyJwtRefreshScheduler from '../lib/diyJwtRefreshScheduler';
import * as teachableReVerificationScheduler from '../lib/teachableReVerificationScheduler';

export {
	AUTH_BYPASS_ENABLED,
	DEFAULT_API_ORIGINS,
	DIY_PROJECTS_ENDPOINT,
	OAUTH_ENDPOINTS,
	TEACHABLE_SESSION_PARAM,
	TEACHABLE_SESSION_STORAGE_KEY,
	USER_AUTH_ENDPOINTS,
} from './sharedHelperConstants';

export const AUTH_BYPASS_USER = {
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
const DIY_ACCESS_STORAGE_KEY = 'tmk-diy-access-by-email';
const DIY_LAST_AUTH_USER_KEY = 'tmk-diy-last-auth-user';
const UTILITIES_TOKEN_STORAGE_KEY = 'tmk-utilities-api-access-token';
const LEGACY_AUTH_HINT_SESSION_KEY = 'tmk_teachable_auth_hint';
const LEGACY_AUTH_EMAIL_SESSION_KEY = 'tmk_teachable_user_email';
const AUTH_ME_TIMEOUT_MS = 10000;

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

const TMK_API_ACCESS_TOKEN_STORAGE_KEY = 'tmk-api-access-token';

function getStoredTmkApiAccessToken() {
	if (typeof window === 'undefined') {
		return '';
	}

	try {
		return window.localStorage.getItem(TMK_API_ACCESS_TOKEN_STORAGE_KEY) || '';
	} catch {
		return '';
	}
}

function setStoredTmkApiAccessToken(token) {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		if (token) {
			window.localStorage.setItem(TMK_API_ACCESS_TOKEN_STORAGE_KEY, token);
		} else {
			window.localStorage.removeItem(TMK_API_ACCESS_TOKEN_STORAGE_KEY);
		}
	} catch {
		// Ignore storage failures (private mode, quota exceeded)
	}
}

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

export function clearLocalAuthState() {
	userAccessToken = '';
	teachableSessionHandoff = '';
	clearAuthStateHints();

	// Clear DIY session manager
	diySessionManager.clearAppSession();

	// Stop background schedulers
	diyJwtRefreshScheduler.stopDiyJwtRefreshScheduler();
	teachableReVerificationScheduler.stopTeachableReVerificationScheduler();

	if (typeof window === 'undefined') {
		return;
	}

	try {
		window.localStorage.removeItem(TMK_API_ACCESS_TOKEN_STORAGE_KEY);
		window.localStorage.removeItem(DIY_LAST_AUTH_USER_KEY);
		window.localStorage.removeItem(DIY_ACCESS_STORAGE_KEY);
		window.localStorage.removeItem(UTILITIES_TOKEN_STORAGE_KEY);
	} catch {
		// Ignore storage failures (private mode, quota exceeded)
	}

	try {
		window.sessionStorage.removeItem(TEACHABLE_SESSION_STORAGE_KEY);
		window.sessionStorage.removeItem(LEGACY_AUTH_HINT_SESSION_KEY);
		window.sessionStorage.removeItem(LEGACY_AUTH_EMAIL_SESSION_KEY);
	} catch {
		// Ignore storage failures (private mode, quota exceeded)
	}
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
	const authUrl = new URL(
		OAUTH_ENDPOINTS.start,
		typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
	);
	authUrl.searchParams.set('redirectTo', resolvedRedirectTo || (typeof window !== 'undefined' ? window.location.href : '/'));
	return authUrl.toString();
}

export function buildTeachableLogoutUrl(redirectTo) {
	// Clear all local auth state and stop schedulers
	clearLocalAuthState();

	// Call logout API to clear the httpOnly session cookie
	if (typeof window !== 'undefined') {
		try {
			fetch('/api/session/logout', {
				method: 'POST',
				credentials: 'include',
			}).catch(() => {
				// Ignore errors, logout will proceed regardless
			});
		} catch {
			// Ignore errors
		}
	}

	if (isAuthBypassMode()) {
		if (typeof window === 'undefined') {
			return redirectTo || '/';
		}

		if (redirectTo && redirectTo.startsWith('/')) {
			return `${window.location.origin}${redirectTo}`;
		}

		return redirectTo || window.location.href;
	}

	const logoutUrl = new URL(
		OAUTH_ENDPOINTS.logout,
		typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
	);
	logoutUrl.searchParams.set('redirectTo', redirectTo || (typeof window !== 'undefined' ? window.location.href : '/'));
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

function parseJwtExp(token) {
	const raw = String(token || '').trim();
	if (!raw) {
		return null;
	}

	const parts = raw.split('.');
	if (parts.length < 2) {
		return null;
	}

	try {
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
		const decoded =
			typeof window !== 'undefined'
				? window.atob(padded)
				: Buffer.from(padded, 'base64').toString('utf8');
		const payload = JSON.parse(decoded);
		const exp = Number(payload?.exp);
		return Number.isFinite(exp) ? exp : null;
	} catch {
		return null;
	}
}

function isJwtExpired(token, clockSkewSeconds = 30) {
	const exp = parseJwtExp(token);
	if (!exp) {
		return false;
	}

	const now = Math.floor(Date.now() / 1000);
	return exp <= now + Math.max(0, Number(clockSkewSeconds) || 0);
}

export async function exchangeUserAccessToken() {
	if (isAuthBypassMode()) {
		userAccessToken = 'dev-bypass-token';
		return userAccessToken;
	}

	authDebug('exchangeUserAccessToken skipped: /api/auth/token is disabled');
	return '';
}

/**
 * Exchange Teachable session for TMK API access token.
 * Calls POST /api/auth/teachable/exchange on tmk-api.
 * Sets tmk_api_refresh cookie and returns access token.
 */
export async function exchangeTeachableSessionForTmkToken() {
	if (isAuthBypassMode()) {
		userAccessToken = 'dev-bypass-token';
		setStoredTmkApiAccessToken(userAccessToken);
		return userAccessToken;
	}

	try {
		const exchangePath = addTeachableSessionToPath('/api/auth/teachable/exchange');
		authDebug('exchangeTeachableSessionForTmkToken -> request', {
			url: exchangePath,
			method: 'POST',
		});

		const response = await fetch(exchangePath, {
			method: 'POST',
			credentials: 'include', // Send and receive cookies
		});

		authDebug('exchangeTeachableSessionForTmkToken <- response', {
			status: response.status,
			ok: response.ok,
		});

		if (!response.ok) {
			userAccessToken = '';
			setStoredTmkApiAccessToken('');
			return '';
		}

		const payload = await response.json().catch(() => ({}));
		const token = getAccessTokenFromPayload(payload);
		
		authDebug('exchangeTeachableSessionForTmkToken parsed payload', {
			hasToken: Boolean(token),
		});

		userAccessToken = token || '';
		setStoredTmkApiAccessToken(userAccessToken);
		return userAccessToken;
	} catch (error) {
		authDebug('exchangeTeachableSessionForTmkToken error', {
			message: error?.message || String(error),
		});
		userAccessToken = '';
		setStoredTmkApiAccessToken('');
		return '';
	}
}

export async function initializeDiySession(user, hasDiyAccess) {
	if (typeof window === 'undefined') {
		authDebug('initializeDiySession called on server-side, skipping');
		return false;
	}

	if (isAuthBypassMode()) {
		// In bypass mode, initialize session locally but don't call API
		const jwtExpiresAtMs = Date.now() + 7200 * 1000;
		diySessionManager.setAppSession(user, hasDiyAccess, userAccessToken, jwtExpiresAtMs);
		diyJwtRefreshScheduler.startDiyJwtRefreshScheduler();
		teachableReVerificationScheduler.startTeachableReVerificationScheduler(() => {
			authDebug('Enrollment loss detected, disabling DIY access');
		});
		return true;
	}

	try {
		// Calculate JWT expiry (7200 seconds from now)
		const jwtExpiresAtMs = Date.now() + 7200 * 1000;

		authDebug('initializeDiySession -> request', {
			userEmail: user?.email,
			hasDiyAccess,
		});

		// Call API to set httpOnly cookie
		const response = await fetch('/api/session/init', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				user,
				hasDiyAccess,
				jwtExpiresAtMs,
			}),
		});

		authDebug('initializeDiySession <- response', {
			status: response.status,
			ok: response.ok,
		});

		if (!response.ok) {
			authDebug('initializeDiySession failed');
			return false;
		}

		// Initialize DIY Session Manager (client-side state)
		diySessionManager.setAppSession(user, hasDiyAccess, userAccessToken, jwtExpiresAtMs);

		// Start background schedulers for JWT refresh and enrollment verification
		diyJwtRefreshScheduler.startDiyJwtRefreshScheduler();
		teachableReVerificationScheduler.startTeachableReVerificationScheduler(() => {
			authDebug('Enrollment status updated (checked via Teachable API)');
		});

		authDebug('DIY session initialized successfully');
		return true;
	} catch (error) {
		authDebug('initializeDiySession error', {
			message: error?.message || String(error),
		});
		return false;
	}
}

export async function refreshUserAccessToken() {
	if (isAuthBypassMode()) {
		userAccessToken = 'dev-bypass-token';
		setStoredTmkApiAccessToken(userAccessToken);
		return userAccessToken;
	}

	try {
		authDebug('refreshUserAccessToken -> request', {
			url: USER_AUTH_ENDPOINTS.refresh,
			method: 'POST',
  			credentials: 'include',
		});
		const response = await fetch(USER_AUTH_ENDPOINTS.refresh, {
			method: 'POST',
			credentials: 'include',
		});
		authDebug('refreshUserAccessToken <- response', {
			status: response.status,
			ok: response.ok,
			statusText: response.statusText,
		});

		if (!response.ok) {
			userAccessToken = '';
			setStoredTmkApiAccessToken('');
			return '';
		}

		const payload = await response.json().catch(() => ({}));
		const token = getAccessTokenFromPayload(payload);
		authDebug('refreshUserAccessToken parsed payload', {
			hasToken: Boolean(token),
			payloadKeys: Object.keys(payload || {}),
		});
		userAccessToken = token || '';
		setStoredTmkApiAccessToken(userAccessToken);
		return userAccessToken;
	} catch {
		authDebug('refreshUserAccessToken failed');
		userAccessToken = '';
		setStoredTmkApiAccessToken('');
		return '';
	}
}

export async function getUserAccessToken(apiOrigin, forceRefresh = false) {
	// Check in-memory token first
	if (!forceRefresh && userAccessToken) {
		if (!isJwtExpired(userAccessToken)) {
			return userAccessToken;
		}
		userAccessToken = '';
		setStoredTmkApiAccessToken('');
	}

	// Check localStorage as fallback (e.g., page reload)
	if (!forceRefresh && !userAccessToken) {
		const stored = getStoredTmkApiAccessToken();
		if (stored) {
			if (isJwtExpired(stored)) {
				setStoredTmkApiAccessToken('');
			} else {
			userAccessToken = stored;
			return userAccessToken;
			}
		}
	}

	// If no cached token, try to refresh first, then exchange Teachable session.
	const refreshed = await refreshUserAccessToken();
	if (refreshed) {
		return refreshed;
	}

	return exchangeTeachableSessionForTmkToken();
}

/**
 * Fetch from a Vercel proxy endpoint with the user's TMK API access token.
 * @param {string} endpoint - Path like '/api/diy-projects' or '/api/lesson-activities/123'
 * @param {object} init - Fetch init options (method, body, etc.)
 * @returns {Promise<Response>}
 */
export async function fetchWithTmkToken(endpoint, init = {}) {
	try {
		const headers = applyTmkApiAuthKeyHeader(init.headers);
		const token = await getUserAccessToken();
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}

		const requestInit = {
			...init,
			headers,
		};

		authDebug('fetchWithTmkToken -> request', {
			endpoint,
			method: requestInit.method || 'GET',
			hasToken: Boolean(token),
		});

		let response = await fetch(endpoint, requestInit);
		authDebug('fetchWithTmkToken <- response', {
			endpoint,
			status: response.status,
			ok: response.ok,
		});

		if (response.status !== 401) {
			return response;
		}

		// Token expired, force refresh and retry
		authDebug('fetchWithTmkToken: got 401, attempting token refresh', {
			endpoint,
		});
		const refreshed = await refreshUserAccessToken();
		const recoveredToken = refreshed || (await exchangeTeachableSessionForTmkToken());
		if (!recoveredToken) {
			authDebug('fetchWithTmkToken: refresh failed', {
				endpoint,
			});
			// Return the original auth failure instead of retrying unauthenticated,
			// which can surface as misleading 404s on user-scoped routes.
			return response;
		}

		headers.set('Authorization', `Bearer ${recoveredToken}`);
		authDebug('fetchWithTmkToken: retrying with refreshed token', {
			endpoint,
		});
		return fetch(endpoint, {
			...init,
			headers,
		});
	} catch (error) {
		authDebug('fetchWithTmkToken error', {
			endpoint,
			message: error?.message || String(error),
		});
		throw error;
	}
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

		const headers = applyTmkApiAuthKeyHeader(init.headers);
		const token = await getUserAccessToken(apiOrigin);
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}

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
			if (headers.has('Authorization')) {
				headers.delete('Authorization');
				authDebug('fetchWithUserToken retry without bearer -> request', {
					url: `${origin}${endpointPath}`,
					method: requestInit.method || 'GET',
					headers: summarizeHeaders(headers),
				});
				response = await fetch(`${origin}${endpointPath}`, {
					...requestInit,
					headers,
				});
				authDebug('fetchWithUserToken retry without bearer <- response', {
					status: response.status,
					ok: response.ok,
					statusText: response.statusText,
				});
			}
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

	const canAbort = typeof AbortController !== 'undefined';
	const controller = canAbort ? new AbortController() : null;
	const timeoutId = controller
		? setTimeout(() => {
			controller.abort();
		}, AUTH_ME_TIMEOUT_MS)
		: null;

	try {
		// Build full TMK API URL directly (not through example-app proxy)
		const apiOrigin = resolveTmkApiOrigin();
		const meUrl = new URL(OAUTH_ENDPOINTS.me, apiOrigin);
		const mePath = addTeachableSessionToPath(meUrl.toString());
		authDebug('fetchAuthenticatedUser -> request', {
			url: mePath,
			method: 'GET',
			timeoutMs: AUTH_ME_TIMEOUT_MS,
		});
		const response = await fetch(mePath, {
			method: 'GET',
			credentials: 'include',
			cache: 'no-store',
			signal: controller?.signal,
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
			const isTimeoutError = err?.name === 'AbortError';
			console.error(
				`[TMK auth] /me fetch failed (${isTimeoutError ? 'request timeout' : 'possible CORS or network error'}):`,
				err?.message || err
			);
		}
		return null;
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}

/**
 * Fetch from a Vercel proxy endpoint with the user's access token.
 * The server-side proxy will forward this token to the TMK API.
 * @param {string} endpoint - Path like '/api/diy-projects' or '/api/lesson-activities/123'
 * @param {object} init - Fetch init options (method, body, etc.)
 * @returns {Promise<Response>}
 */
export async function fetchProxyWithUserToken(endpoint, init = {}) {
	try {
		if (isAuthBypassMode()) {
			const headers = applyTmkApiAuthKeyHeader(init.headers);
			authDebug('fetchProxyWithUserToken (bypass mode)', {
				endpoint,
				method: init.method || 'GET',
				headers: summarizeHeaders(headers),
			});
			return fetch(endpoint, {
				...init,
				headers,
			});
		}

		const headers = applyTmkApiAuthKeyHeader(init.headers);
		let token = userAccessToken; // Check cached token first
		
		// If no cached token, try to refresh
		if (!token) {
			authDebug('fetchProxyWithUserToken: no cached token, attempting refresh', {
				endpoint,
			});
			token = await refreshUserAccessToken();
		}

		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		} else {
			authDebug('fetchProxyWithUserToken: token refresh failed or no token available', {
				endpoint,
			});
		}

		const requestInit = {
			...init,
			headers,
		};

		authDebug('fetchProxyWithUserToken -> request', {
			endpoint,
			method: requestInit.method || 'GET',
			headers: summarizeHeaders(headers),
			hasToken: Boolean(token),
		});

		let response = await fetch(endpoint, requestInit);
		authDebug('fetchProxyWithUserToken <- response', {
			endpoint,
			status: response.status,
			ok: response.ok,
		});

		if (response.status !== 401) {
			return response;
		}

		// Token expired, force refresh and retry
		authDebug('fetchProxyWithUserToken: got 401, attempting forced token refresh', {
			endpoint,
		});
		const refreshed = await refreshUserAccessToken();
		if (!refreshed) {
			authDebug('fetchProxyWithUserToken: forced refresh failed', {
				endpoint,
			});
			if (headers.has('Authorization')) {
				headers.delete('Authorization');
			}
			return fetch(endpoint, {
				...init,
				headers,
			});
		}

		headers.set('Authorization', `Bearer ${refreshed}`);
		authDebug('fetchProxyWithUserToken: retrying with refreshed token', {
			endpoint,
		});
		return fetch(endpoint, {
			...init,
			headers,
		});
	} catch (error) {
		authDebug('fetchProxyWithUserToken error', {
			endpoint,
			message: error?.message || String(error),
		});
		throw error;
	}
}