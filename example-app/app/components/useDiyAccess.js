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
        const userData = await fetchAuthenticatedUser();
        if (!userData) {
          setUser(null);
          setHasDiyAccess(false);
          return;
        }
        setUser(userData);
        let diyAccess = false;
        try {
          const apiOrigin = resolveTmkApiOrigin();
          const email = encodeURIComponent(userData.email || '');
          const url = `${apiOrigin}/api/teachable-enrollment?email=${email}&courseNumber=${DIY_COURSE_ID}`;
          const resp = await fetch(url, { credentials: 'include' });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.enrolled === true) {
              diyAccess = true;
            }
          }
        } catch (err) {
          diyAccess = false;
        }
        if (!cancelled) {
          setHasDiyAccess(diyAccess);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    checkAccess();
    return () => { cancelled = true; };
  }, []);

  return { user, hasDiyAccess, loading };
}
