import { useEffect, useState } from 'react';
import { fetchAuthenticatedUser } from './authHelpers';

const DIY_COURSE_ID = '2944218';
const DIY_ACCESS_STORAGE_KEY = 'tmk-diy-access-by-email';

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

export function useDiyAccess() {
  const [user, setUser] = useState(null);
  const [hasDiyAccess, setHasDiyAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      setLoading(true);
      try {
        // Step 1: get the authenticated user's email from the Teachable OAuth /me endpoint
        const userData = await fetchAuthenticatedUser();

        if (!userData) {
          if (!cancelled) {
            setUser(null);
            setHasDiyAccess(false);
          }
          return;
        }

        if (!cancelled) setUser(userData);

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

        let diyAccess = false;
        try {
          const resp = await fetch(url, { credentials: 'include' });
          if (resp.ok) {
            const data = await resp.json();
            diyAccess = data?.enrolled === true;
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[useDiyAccess] enrollment check failed:', err?.message || err);
          }
        }

        if (!cancelled) {
          setHasDiyAccess(diyAccess);
        }

        writeStoredDiyAccess(rawEmail, diyAccess);
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
