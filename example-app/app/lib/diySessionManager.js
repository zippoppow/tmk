'use client';

/**
 * DIY Session Manager
 *
 * Centralized state management for DIY user app sessions.
 * Handles app session state (independent of Teachable session),
 * DIY JWT tokens, and re-verification scheduling.
 *
 * State is persisted to localStorage.
 */

const STORAGE_KEY = 'TMK_DIY_SESSION';

// Constants for expiry/refresh calculations
const APP_SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ENROLLMENT_REVERIFICATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const JWT_REFRESH_MARGIN_MS = 5 * 60 * 1000; // Refresh if within 5 min of expiry

let sessionState = null;

/**
 * Internal debug logging
 */
function debug(message, data) {
	if (typeof window !== 'undefined' && window.__DIY_SESSION_DEBUG) {
		console.log(`[diySessionManager] ${message}`, data || '');
	}
}

/**
 * Load session from localStorage
 */
function loadFromStorage() {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return null;
		}
		return JSON.parse(stored);
	} catch (error) {
		debug('Failed to load session from storage', error?.message);
		return null;
	}
}

/**
 * Save session to localStorage
 */
function saveToStorage(state) {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		debug('Session saved to storage');
	} catch (error) {
		debug('Failed to save session to storage', error?.message);
	}
}

/**
 * Get current session state (or load from storage if needed)
 */
function getState() {
	if (!sessionState) {
		sessionState = loadFromStorage();
	}
	return sessionState;
}

/**
 * Check if current session state is valid (not expired)
 */
function isSessionValid(state) {
	if (!state || !state.isAppLoggedIn) {
		return false;
	}

	const now = Date.now();
	if (state.appSessionExpiresAt && now > state.appSessionExpiresAt) {
		debug('Session expired', { expiresAt: new Date(state.appSessionExpiresAt) });
		return false;
	}

	return true;
}

/**
 * Check if JWT should be refreshed (within 5 min of expiry)
 */
function shouldRefreshJwt(state) {
	if (!state || !state.jwtExpiresAt) {
		return false;
	}

	const now = Date.now();
	const timeUntilExpiry = state.jwtExpiresAt - now;
	const shouldRefresh = timeUntilExpiry < JWT_REFRESH_MARGIN_MS;

	if (shouldRefresh) {
		debug('JWT should refresh', {
			expiresAt: new Date(state.jwtExpiresAt),
			timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)}s`,
		});
	}

	return shouldRefresh;
}

/**
 * Check if enrollment re-verification is due (every 7 days)
 */
function shouldReVerifyEnrollment(state) {
	if (!state || !state.lastEnrollmentVerification) {
		return true; // First check after login
	}

	const now = Date.now();
	const timeSinceVerification = now - state.lastEnrollmentVerification;
	const shouldReVerify = timeSinceVerification > ENROLLMENT_REVERIFICATION_INTERVAL_MS;

	if (shouldReVerify) {
		debug('Enrollment should re-verify', {
			lastVerified: new Date(state.lastEnrollmentVerification),
			daysSinceVerification: Math.round(timeSinceVerification / (1000 * 60 * 60 * 24)),
		});
	}

	return shouldReVerify;
}

/**
 * Check if app session is logged in
 * @returns {boolean}
 */
export function isAppLoggedIn() {
	const state = getState();
	return isSessionValid(state);
}

/**
 * Get current user object
 * @returns {object|null}
 */
export function getUser() {
	const state = getState();
	if (!isSessionValid(state)) {
		return null;
	}
	return state.user || null;
}

/**
 * Get current DIY JWT
 * @returns {string}
 */
export function getDiyJwt() {
	const state = getState();
	if (!isSessionValid(state)) {
		return '';
	}
	return state.diyJwt || '';
}

/**
 * Get hasDiyAccess boolean
 * @returns {boolean}
 */
export function getHasDiyAccess() {
	const state = getState();
	if (!isSessionValid(state)) {
		return false;
	}
	return state.hasDiyAccess || false;
}

/**
 * Set app session (called after successful Teachable login + exchange)
 * @param {object} user - User object from Teachable
 * @param {boolean} hasDiyAccess - Enrollment verification result
 * @param {string} diyJwt - JWT for API calls
 * @param {number} jwtExpiresAtMs - JWT expiry timestamp (milliseconds)
 */
export function setAppSession(user, hasDiyAccess, diyJwt, jwtExpiresAtMs) {
	if (typeof window === 'undefined') {
		debug('setAppSession called on server-side, skipping');
		return;
	}

	const now = Date.now();
	const appSessionExpiresAt = now + APP_SESSION_LIFETIME_MS;

	sessionState = {
		isAppLoggedIn: true,
		user: user || {},
		hasDiyAccess: hasDiyAccess || false,
		diyJwt: diyJwt || '',
		jwtExpiresAt: jwtExpiresAtMs || now + 7200 * 1000, // Default to 2 hours
		appSessionExpiresAt,
		lastEnrollmentVerification: now,
	};

	saveToStorage(sessionState);
	debug('App session set', {
		user: user?.email,
		hasDiyAccess,
		appSessionExpiresAt: new Date(appSessionExpiresAt),
		jwtExpiresAt: new Date(sessionState.jwtExpiresAt),
	});
}

/**
 * Update DIY JWT (called after token refresh)
 * @param {string} diyJwt - New JWT
 * @param {number} jwtExpiresAtMs - New expiry timestamp (milliseconds)
 */
export function updateDiyJwt(diyJwt, jwtExpiresAtMs) {
	const state = getState();
	if (!state || !isSessionValid(state)) {
		debug('Cannot update JWT: session not valid');
		return;
	}

	sessionState = {
		...state,
		diyJwt: diyJwt || '',
		jwtExpiresAt: jwtExpiresAtMs,
	};

	saveToStorage(sessionState);
	debug('JWT updated', {
		jwtExpiresAt: new Date(jwtExpiresAtMs),
	});
}

/**
 * Update enrollment status (called after re-verification)
 * @param {boolean} hasDiyAccess - New enrollment status
 */
export function updateEnrollmentStatus(hasDiyAccess) {
	const state = getState();
	if (!state || !isSessionValid(state)) {
		debug('Cannot update enrollment: session not valid');
		return;
	}

	sessionState = {
		...state,
		hasDiyAccess: hasDiyAccess || false,
		lastEnrollmentVerification: Date.now(),
	};

	saveToStorage(sessionState);
	debug('Enrollment status updated', { hasDiyAccess });
}

/**
 * Clear app session (called on logout)
 */
export function clearAppSession() {
	if (typeof window !== 'undefined') {
		localStorage.removeItem(STORAGE_KEY);
	}
	sessionState = null;
	debug('App session cleared');
}

/**
 * Check if JWT should be refreshed
 * @returns {boolean}
 */
export function shouldRefresh() {
	const state = getState();
	return shouldRefreshJwt(state);
}

/**
 * Check if enrollment re-verification is due
 * @returns {boolean}
 */
export function shouldReVerify() {
	const state = getState();
	return shouldReVerifyEnrollment(state);
}

/**
 * Get session expiry time (for debugging/display)
 * @returns {number|null} Timestamp in milliseconds
 */
export function getAppSessionExpiresAt() {
	const state = getState();
	if (!state) {
		return null;
	}
	return state.appSessionExpiresAt || null;
}

/**
 * Get JWT expiry time (for debugging/display)
 * @returns {number|null} Timestamp in milliseconds
 */
export function getJwtExpiresAt() {
	const state = getState();
	if (!state) {
		return null;
	}
	return state.jwtExpiresAt || null;
}
