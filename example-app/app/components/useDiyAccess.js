import { useEffect, useState } from 'react';
import { exchangeTeachableSessionForTmkToken, fetchAuthenticatedUser } from './authHelpers';

const DIY_COURSE_ID = '2944218';
const DIY_ACCESS_STORAGE_KEY = 'tmk-diy-access-by-email';
const DIY_LAST_AUTH_USER_KEY = 'tmk-diy-last-auth-user';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
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

function readStoredDiyAccess(email) {
  const key = normalizeEmail(email);
  if (!key) {
    return null;
  }

  const map = readDiyAccessMap();
  if (typeof map[key] === 'boolean') {
    return map[key];
  }

  return null;
}

function writeStoredDiyAccess(email, hasAccess) {
  const key = normalizeEmail(email);
  if (!key || typeof window === 'undefined') {
    return;
  }

  try {
    const map = readDiyAccessMap();
    map[key] = Boolean(hasAccess);
    window.localStorage.setItem(DIY_ACCESS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage failures (private mode/quota) and continue.
  }
}

function readStoredAuthUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DIY_LAST_AUTH_USER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const email = String(parsed.email || parsed?.profile?.email || '').trim();
    if (!email) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStoredAuthUser(userData) {
  if (typeof window === 'undefined' || !userData || typeof userData !== 'object') {
    return;
  }

  const email = String(userData.email || userData?.profile?.email || '').trim();
  if (!email) {
    return;
  }

  try {
    window.localStorage.setItem(DIY_LAST_AUTH_USER_KEY, JSON.stringify(userData));
  } catch {
    // Ignore storage failures (private mode/quota) and continue.
  }
}

function getInitialStoredState() {
  const storedUser = readStoredAuthUser();
  const storedEmail = String(storedUser?.email || storedUser?.profile?.email || '').trim();
  const storedAccess = readStoredDiyAccess(storedEmail);

  return {
    storedUser,
    storedAccess,
    hasCachedState: Boolean(storedUser) && storedAccess !== null,
  };
}

export function useDiyAccess() {
  const [user, setUser] = useState(() => getInitialStoredState().storedUser);
  const [hasDiyAccess, setHasDiyAccess] = useState(() => {
    const { storedAccess } = getInitialStoredState();
    return storedAccess !== null ? storedAccess : false;
  });
  const [loading, setLoading] = useState(() => !getInitialStoredState().hasCachedState);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
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
            // If we have no live session but do have cached access from a prior
            // successful login, keep the cached state so navigation still works.
            if (!cachedUser) {
              setUser(null);
            }
            if (cachedAccess === null) {
              setHasDiyAccess(false);
            }
          }
          return;
        }

        if (!cancelled) setUser(userData);
        writeStoredAuthUser(userData);

        // Exchange Teachable session for TMK API token
        await exchangeTeachableSessionForTmkToken();

        const rawEmail = String(userData.email || userData?.profile?.email || '').trim();
        const storedAccess = readStoredDiyAccess(rawEmail);
        if (!cancelled && storedAccess !== null) {
          // Use cached access immediately for smoother navigation between pages.
          setHasDiyAccess(storedAccess);
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
          writeStoredDiyAccess(rawEmail, diyAccess);
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
