/**
 * teachableSessionValidityScheduler.js
 *
 * Background scheduler for periodic Teachable session validity checks.
 * Verifies that the user's Teachable session is still active.
 * If session is lost, triggers logout callback immediately.
 *
 * Purpose: Ensure app session terminates quickly if user logs out of Teachable
 * without waiting for app session to naturally expire (7 days).
 *
 * Check interval: 1 hour (3600000 ms)
 * Retry on failure: 1 minute (60000 ms)
 */

let schedulerTimerId = null;
const CHECK_INTERVAL_MS = 3600000; // 1 hour
const RETRY_ON_FAILURE_MS = 60000; // 1 minute

/**
 * Check if Teachable session is still valid by calling /api/auth/teachable/me
 * @returns {Promise<boolean>} True if session valid, false if not
 */
async function checkTeachableSessionValidity() {
  try {
    const response = await fetch('/api/auth/teachable/me', {
      method: 'GET',
      credentials: 'include', // Include cookies
    });

    // If 401/403/404: session invalid
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      return false;
    }

    // If other error: assume valid (retry next interval)
    if (!response.ok) {
      return true;
    }

    // If 200: session valid
    return true;
  } catch (error) {
    // Network error: assume valid, retry next interval
    console.error('[teachableSessionValidityScheduler] Session check error:', error);
    return true;
  }
}

/**
 * Start periodic Teachable session validity checks
 * @param {Function} onSessionLost - Callback when Teachable session is lost
 */
export function startTeachableSessionValidityScheduler(onSessionLost) {
  if (schedulerTimerId !== null) {
    console.warn('[teachableSessionValidityScheduler] Scheduler already running');
    return;
  }

  if (typeof onSessionLost !== 'function') {
    console.error('[teachableSessionValidityScheduler] onSessionLost callback must be a function');
    return;
  }

  let isFirstCheck = true;

  async function performCheck() {
    const isValid = await checkTeachableSessionValidity();

    if (!isValid) {
      console.warn('[teachableSessionValidityScheduler] Teachable session lost');
      // Session lost: fire callback to logout
      onSessionLost();
      // Stop scheduler (logout will stop it anyway, but be explicit)
      stopTeachableSessionValidityScheduler();
      return;
    }

    // Session valid: reschedule check
    if (isFirstCheck) {
      console.debug('[teachableSessionValidityScheduler] Teachable session validity verified');
      isFirstCheck = false;
    }

    schedulerTimerId = setTimeout(performCheck, CHECK_INTERVAL_MS);
  }

  // Perform first check immediately, then schedule recurring checks
  performCheck();
}

/**
 * Stop periodic Teachable session validity checks
 */
export function stopTeachableSessionValidityScheduler() {
  if (schedulerTimerId !== null) {
    clearTimeout(schedulerTimerId);
    schedulerTimerId = null;
    console.debug('[teachableSessionValidityScheduler] Scheduler stopped');
  }
}

/**
 * Check if scheduler is currently active
 * @returns {boolean}
 */
export function isSchedulerActive() {
  return schedulerTimerId !== null;
}
