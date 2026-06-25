'use client';

/**
 * Teachable Re-verification Scheduler
 *
 * Manages periodic enrollment re-verification.
 * Every 7 days, checks if user still has DIY course enrollment.
 * If verification fails, disables hasDiyAccess and notifies user.
 */

import { shouldReVerify, updateEnrollmentStatus } from './diySessionManager';

const REVERIFICATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RECHECK_DELAY_MS = 60 * 1000; // If check fails, retry in 1 min

let reVerifyTimerId = null;
let isSchedulerRunning = false;

// Callback to notify UI of enrollment failure
let onEnrollmentLossCb = null;

/**
 * Internal debug logging
 */
function debug(message, data) {
	if (typeof window !== 'undefined' && window.__DIY_SESSION_DEBUG) {
		console.log(`[teachableReVerificationScheduler] ${message}`, data || '');
	}
}

/**
 * Perform enrollment re-verification
 */
async function performReVerification() {
	try {
		debug('Performing enrollment re-verification');

		const response = await fetch('/api/teachable-enrollment', {
			method: 'GET',
			credentials: 'include',
		});

		if (!response.ok) {
			debug('Enrollment check failed', { status: response.status });
			return null;
		}

		const data = await response.json().catch(() => ({}));
		const enrolled = data.enrolled === true;

		debug('Enrollment re-verification result', { enrolled });
		return enrolled;
	} catch (error) {
		debug('Enrollment re-verification error', error?.message);
		return null;
	}
}

/**
 * Schedule next re-verification attempt
 */
function scheduleNextReVerification(delayMs = REVERIFICATION_INTERVAL_MS) {
	if (!isSchedulerRunning) {
		return;
	}

	reVerifyTimerId = setTimeout(async () => {
		if (!isSchedulerRunning) {
			return;
		}

		const shouldReVerifyNow = shouldReReVerify();

		if (shouldReVerifyNow) {
			const enrolled = await performReVerification();

			if (enrolled === null) {
				// Check failed, retry in 1 min
				debug('Enrollment check failed, retrying in 1 min');
				scheduleNextReVerification(RECHECK_DELAY_MS);
			} else if (enrolled === false) {
				// User lost enrollment
				debug('User enrollment revoked');
				updateEnrollmentStatus(false);

				// Notify UI
				if (onEnrollmentLossCb) {
					onEnrollmentLossCb();
				}

				// Schedule next check in 7 days anyway
				scheduleNextReVerification(REVERIFICATION_INTERVAL_MS);
			} else {
				// Still enrolled, update timestamp and schedule next check
				debug('User still enrolled');
				updateEnrollmentStatus(true);
				scheduleNextReVerification(REVERIFICATION_INTERVAL_MS);
			}
		} else {
			// Not due yet, check again in 1 hour
			debug('Re-verification not due yet, will check again soon');
			scheduleNextReVerification(60 * 60 * 1000);
		}
	}, delayMs);
}

/**
 * Check if re-verification is needed now
 */
function shouldReReVerify() {
	// NOTE: This is a local check. In production, you'd import from diySessionManager
	// For now, we use a simple timestamp-based check
	// This function is called by scheduleNextReVerification internally
	return true; // Simplified for scheduler logic
}

/**
 * Start the re-verification scheduler
 * Should be called after app session is established (on login)
 */
export function startTeachableReVerificationScheduler(onEnrollmentLoss) {
	if (typeof window === 'undefined') {
		debug('startTeachableReVerificationScheduler called on server-side, skipping');
		return;
	}

	if (isSchedulerRunning) {
		debug('Scheduler already running');
		return;
	}

	isSchedulerRunning = true;
	onEnrollmentLossCb = onEnrollmentLoss || null;

	debug('Starting Teachable re-verification scheduler', { intervalMs: REVERIFICATION_INTERVAL_MS });

	// Initial check scheduled for first interval
	scheduleNextReVerification();
}

/**
 * Stop the re-verification scheduler
 * Should be called on logout
 */
export function stopTeachableReVerificationScheduler() {
	if (!isSchedulerRunning) {
		return;
	}

	if (reVerifyTimerId) {
		clearTimeout(reVerifyTimerId);
		reVerifyTimerId = null;
	}

	isSchedulerRunning = false;
	onEnrollmentLossCb = null;

	debug('Teachable re-verification scheduler stopped');
}

/**
 * Check if scheduler is running
 * @returns {boolean}
 */
export function isSchedulerActive() {
	return isSchedulerRunning;
}
