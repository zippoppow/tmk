import { useEffect, useState } from 'react';
import { fetchAuthenticatedUser, resolveTmkApiOrigin } from './authHelpers';

const DIY_COURSE_ID = '2944218';

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

        // Step 2: check DIY course enrollment directly against TMK API
        const apiOrigin = resolveTmkApiOrigin();
        const email = encodeURIComponent(
          String(userData.email || userData?.profile?.email || '').trim()
        );
        const url = `${apiOrigin}/api/teachable-enrollment?email=${email}&courseNumber=${DIY_COURSE_ID}`;

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
