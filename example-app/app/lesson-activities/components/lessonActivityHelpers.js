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

export const DIY_PROJECTS_ENDPOINT = '/api/diy-projects';
export const DEFAULT_SESSION_STORAGE_KEY = 'tmk-diy-sessions';
export const PROJECTS_STORAGE_KEY = 'tmk-diy-projects';

export function resolveTmkApiOrigin(origins = DEFAULT_API_ORIGINS) {
	const resolvedOrigins = getConfiguredApiOrigins(origins);

	if (typeof window === 'undefined') {
		return resolvedOrigins.production;
	}

	const { protocol, hostname } = window.location;
	if (
		protocol === 'file:' ||
		!hostname ||
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname.endsWith('.local') ||
		hostname.includes('railway.app') ||
		hostname.includes('staging')
	) {
		return resolvedOrigins.staging;
	}

	if (hostname === 'tmk.themorphologykit.com' || hostname.endsWith('.themorphologykit.com')) {
		return resolvedOrigins.production;
	}

	return resolvedOrigins.production;
}

export function buildTeachableStartUrl(apiOrigin, redirectTo) {
	const authUrl = new URL(`${apiOrigin}${OAUTH_ENDPOINTS.start}`);
	authUrl.searchParams.set('redirectTo', redirectTo || window.location.href);
	console.log(`auth start, authUrl: {authUrl.toString()}`)
	return authUrl.toString();
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

	const user = root.user || root.member || root.currentUser || null;
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
	try {
		const response = await fetch(`${apiOrigin}${OAUTH_ENDPOINTS.me}`, {
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
