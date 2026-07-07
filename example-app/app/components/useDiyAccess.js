import { useEffect, useState } from 'react';
import { AUTH_BYPASS_ENABLED, AUTH_BYPASS_USER, clearLocalAuthState, exchangeTeachableSessionForTmkToken, fetchAuthenticatedUser, getTeachableSessionHandoff, initializeDiySession } from './authHelpers';

const DIY_COURSE_ID = '2944218';
const DIY_ACCESS_STORAGE_KEY = 'tmk-diy-access-by-email';
const DIY_LAST_AUTH_USER_KEY = 'tmk-diy-last-auth-user';
const DIY_AUTH_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function hasBrowserCookie(name) {
  if (typeof document === 'undefined' || !name) {
    return false;
  }

  const escapedName = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cookiePattern = new RegExp(`(?:^|;\\s*)${escapedName}=`);
  return cookiePattern.test(document.cookie || '');
}

function hasTeachableBootstrapContext() {
  if (typeof window === 'undefined') {
    return false;
  }

  const url = new URL(window.location.href);
  if ((url.searchParams.get('teachable_session') || '').trim()) {
    return true;
  }

  if (url.searchParams.get('auth') === 'success') {
    return true;
  }

  return Boolean(getTeachableSessionHandoff());
}

function isFreshTimestamp(value, now = Date.now()) {
  const checkedAt = Number(value);
  if (!Number.isFinite(checkedAt) || checkedAt <= 0) {
    return false;
  }
  return now - checkedAt < DIY_AUTH_CACHE_TTL_MS;
}

function readDiyAccessMap() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(DIY_ACCESS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function readStoredDiyAccess(email, now = Date.now()) {
  const key = normalizeEmail(email);
  if (!key) {
    return null;
  }

  const map = readDiyAccessMap();
  const entry = map[key];
  if (typeof entry === 'boolean') {
    return {
      value: entry,
      checkedAt: null,
      isFresh: false,
    };
  }

  if (entry && typeof entry === 'object' && !Array.isArray(entry) && typeof entry.value === 'boolean') {
    return {
      value: entry.value,
      checkedAt: Number(entry.checkedAt) || null,
      isFresh: isFreshTimestamp(entry.checkedAt, now),
    };
  }

  return null;
}

function writeStoredDiyAccess(email, hasAccess, checkedAt = Date.now()) {
  const key = normalizeEmail(email);
  if (!key || typeof window === 'undefined') {
    return;
  }

  try {
    const map = readDiyAccessMap();
    map[key] = {
      value: Boolean(hasAccess),
      checkedAt,
    };
    window.localStorage.setItem(DIY_ACCESS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage failures (private mode/quota) and continue.
  }
}

function readStoredAuthUser(now = Date.now()) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DIY_LAST_AUTH_USER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    // Backward-compatible with prior shape: plain user object.
    if (typeof parsed.email === 'string' || parsed?.profile?.email) {
      const legacyEmail = String(parsed.email || parsed?.profile?.email || '').trim();
      if (!legacyEmail) {
        return null;
      }

      return {
        user: parsed,
        checkedAt: null,
        isFresh: false,
      };
    }

    const userData = parsed?.user;
    const email = String(userData?.email || userData?.profile?.email || '').trim();
    if (!email) {
      return null;
    }

    return {
      user: userData,
      checkedAt: Number(parsed.checkedAt) || null,
      isFresh: isFreshTimestamp(parsed.checkedAt, now),
    };
  } catch {
    return null;
  }
}

function writeStoredAuthUser(userData, checkedAt = Date.now()) {
  if (typeof window === 'undefined' || !userData || typeof userData !== 'object') {
    return;
  }

  const email = String(userData.email || userData?.profile?.email || '').trim();
  if (!email) {
    return;
  }

  try {
    window.localStorage.setItem(
      DIY_LAST_AUTH_USER_KEY,
      JSON.stringify({
        user: userData,
        checkedAt,
      })
    );
  } catch {
    // Ignore storage failures (private mode/quota) and continue.
  }
}

function getInitialStoredState() {
  const now = Date.now();
  if (!hasBrowserCookie('tmk_api_refresh') && !hasTeachableBootstrapContext()) {
    return {
      storedUser: null,
      storedAccess: null,
      hasCachedState: false,
      hasFreshCache: false,
    };
  }

  const storedUserEntry = readStoredAuthUser(now);
  const storedUser = storedUserEntry?.user || null;
  const storedEmail = String(storedUser?.email || storedUser?.profile?.email || '').trim();
  const storedAccessEntry = readStoredDiyAccess(storedEmail, now);
  const storedAccess = storedAccessEntry?.value ?? null;
  const hasFreshCache = Boolean(storedUserEntry?.isFresh) && Boolean(storedAccessEntry?.isFresh);

  return {
    storedUser,
    storedAccess,
    hasCachedState: Boolean(storedUser) && storedAccess !== null,
    hasFreshCache,
  };
}

export function useDiyAccess() {
  const initialStoredState = AUTH_BYPASS_ENABLED
    ? null
    : getInitialStoredState();
  const [user, setUser] = useState(() => {
    if (AUTH_BYPASS_ENABLED) return AUTH_BYPASS_USER;
    return initialStoredState?.storedUser || null;
  });
  const [hasDiyAccess, setHasDiyAccess] = useState(() => {
    if (AUTH_BYPASS_ENABLED) return AUTH_BYPASS_USER?.access?.diyCourseActiveEnrollment === true;
    return Boolean(initialStoredState?.storedAccess);
  });
  const [loading, setLoading] = useState(() => {
    if (AUTH_BYPASS_ENABLED) return false;
    return true;
  });

  useEffect(() => {
    // In bypass mode the initial state is already correct — no network calls needed.
    if (AUTH_BYPASS_ENABLED) return;

    let cancelled = false;

    async function checkAccess() {
      if (!hasBrowserCookie('tmk_api_refresh') && !hasTeachableBootstrapContext()) {
        if (!cancelled) {
          clearLocalAuthState();
          setUser(null);
          setHasDiyAccess(false);
          setLoading(false);
        }
        return;
      }

      const { storedUser: cachedUser, storedAccess: cachedAccess, hasCachedState } = getInitialStoredState();

      if (!hasCachedState) {
        setLoading(true);
      }
      try {
        if (!cancelled && cachedUser) {
          setUser(cachedUser);
        }
        if (!cancelled && cachedAccess !== null) {
          // Keep access while we perform a fresh enrollment check.
          setHasDiyAccess(cachedAccess);
        }

        // Step 1: get the authenticated user's email from the Teachable OAuth /me endpoint
        const userData = await fetchAuthenticatedUser();

        if (!userData) {
          if (!cancelled) {
            clearLocalAuthState();
            setUser(null);
            setHasDiyAccess(false);
          }
          return;
        }

        if (!cancelled) setUser(userData);
        const now = Date.now();
        writeStoredAuthUser(userData, now);

        // Exchange Teachable session for TMK API token.
        // If the exchange fails, the user no longer has a valid TMK session,
        // even if /me still returned a Teachable identity.
        const exchangedToken = await exchangeTeachableSessionForTmkToken();
        if (!exchangedToken) {
          if (!cancelled) {
            clearLocalAuthState();
            setUser(null);
            setHasDiyAccess(false);
          }
          return;
        }

        const rawEmail = String(userData.email || userData?.profile?.email || '').trim();
        const storedAccessEntry = readStoredDiyAccess(rawEmail, now);
        const storedAccess = storedAccessEntry?.value ?? null;
        if (!cancelled && storedAccess !== null) {
          // Use cached access immediately for smoother navigation between pages.
          setHasDiyAccess(storedAccess);
        }

        if (storedAccessEntry?.isFresh) {
          if (!cancelled) {
            setHasDiyAccess(storedAccess);
          }
          return;
        }

        // Step 2: check DIY course enrollment via server-side route
        // The route at /api/teachable-enrollment calls the Teachable Admin API
        // with TEACHABLE_DEVELOPERS_API_KEY — the key stays server-side.
        const email = encodeURIComponent(
          rawEmail
        );
        const url = `/api/teachable-enrollment?email=${email}&courseNumber=${DIY_COURSE_ID}`;

        let diyAccess = storedAccess !== null ? storedAccess : false;
        let verifiedEnrollment = false;
        try {
          const resp = await fetch(url, { credentials: 'include' });
          if (resp.ok) {
            const data = await resp.json();
            diyAccess = data?.enrolled === true;
            verifiedEnrollment = true;
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[useDiyAccess] enrollment check failed:', err?.message || err);
          }
        }

        if (!cancelled) {
          setHasDiyAccess(diyAccess);
        }

        if (verifiedEnrollment) {
          writeStoredDiyAccess(rawEmail, diyAccess, Date.now());
        }

        // Initialize DIY session for ALL authenticated users (not just enrolled)
        // This sets the app session cookie so middleware allows them through
        // hasDiyAccess flag controls feature access; enrollment can be false
        if (userData) {
          await initializeDiySession(userData, diyAccess);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, authUser: user, hasDiyAccess, loading };
}
