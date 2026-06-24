'use client';

/**
 * DIY JWT Refresh Scheduler
 *
 * Manages background token refresh for DIY JWT tokens.
 * Proactively refreshes JWT before expiry (every 7200 seconds).
 */

import { shouldRefresh, updateDiyJwt } from './diySessionManager';
import { refreshUserAccessToken } from '../components/authHelpers';

const JWT_REFRESH_INTERVAL_MS = 7200 * 1000; // 7200 seconds (JWT lifetime)
const REFRESH_ERROR_RETRY_DELAY_MS = 60 * 1000; // Retry after 1 min if refresh fails

let refreshTimerId = null;
let isSchedulerRunning = false;

/**
 * Internal debug logging
 */
function debug(message, data) {
	if (typeof window !== 'undefined' && window.__DIY_SESSION_DEBUG) {
		console.log(`[diyJwtRefreshScheduler] ${message}`, data || '');
	}
}

/**
 * Perform JWT refresh
 */
async function performRefresh() {
	try {
		debug('Performing JWT refresh');
		const newToken = await refreshUserAccessToken();

		if (newToken) {
			// Calculate expiry: 7200 seconds from now
			const expiresAtMs = Date.now() + JWT_REFRESH_INTERVAL_MS;
			updateDiyJwt(newToken, expiresAtMs);
			debug('JWT refreshed successfully', { expiresAt: new Date(expiresAtMs) });
			return true;
		} else {
			debug('JWT refresh returned empty token');
			return false;
		}
	} catch (error) {
		debug('JWT refresh error', error?.message);
		return false;
	}
}

/**
 * Schedule next refresh attempt
 */
function scheduleNextRefresh(delayMs = JWT_REFRESH_INTERVAL_MS) {
	if (!isSchedulerRunning) {
		return;
	}

	refreshTimerId = setTimeout(async () => {
		if (!isSchedulerRunning) {
			return;
		}

		const shouldRefreshNow = shouldRefresh();

		if (shouldRefreshNow) {
			const success = await performRefresh();
			// Whether success or fail, schedule next refresh
			scheduleNextRefresh(JWT_REFRESH_INTERVAL_MS);
		} else {
			// Not due yet, check again in 1 minute
			debug('JWT not due for refresh yet, will check again soon');
			scheduleNextRefresh(60 * 1000);
		}
	}, delayMs);
}

/**
 * Start the JWT refresh scheduler
 * Should be called after app session is established (on login)
 */
export function startDiyJwtRefreshScheduler() {
	if (typeof window === 'undefined') {
		debug('startDiyJwtRefreshScheduler called on server-side, skipping');
		return;
	}

	if (isSchedulerRunning) {
		debug('Scheduler already running');
		return;
	}

	isSchedulerRunning = true;
	debug('Starting JWT refresh scheduler', { intervalMs: JWT_REFRESH_INTERVAL_MS });

	// Initial refresh check
	scheduleNextRefresh();
}

/**
 * Stop the JWT refresh scheduler
 * Should be called on logout
 */
export function stopDiyJwtRefreshScheduler() {
	if (!isSchedulerRunning) {
		return;
	}

	if (refreshTimerId) {
		clearTimeout(refreshTimerId);
		refreshTimerId = null;
	}

	isSchedulerRunning = false;
	debug('JWT refresh scheduler stopped');
}

/**
 * Check if scheduler is running
 * @returns {boolean}
 */
export function isSchedulerActive() {
	return isSchedulerRunning;
}
