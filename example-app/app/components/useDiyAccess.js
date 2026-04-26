import { useEffect, useState } from 'react';
import { applyTmkApiAuthKeyHeader, fetchAuthenticatedUser, resolveTmkApiOrigin } from './authHelpers';

const DIY_COURSE_ID = '2944218';
const DIY_DEBUG_ENABLED = process.env.NODE_ENV !== 'production';

function diyDebug(label, payload) {
  if (!DIY_DEBUG_ENABLED || typeof window === 'undefined') {
    return;
  }

  if (payload === undefined) {
    // eslint-disable-next-line no-console
    console.log(`[useDiyAccess] ${label}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[useDiyAccess] ${label}`, payload);
}

function summarizeUser(userData) {
  if (!userData || typeof userData !== 'object') {
    return { hasUser: false };
  }

  return {
    hasUser: true,
    id: String(userData.id || userData.user_id || '').trim() || null,
    email: String(userData.email || userData?.profile?.email || '').trim() || null,
    keys: Object.keys(userData),
  };
}

export function useDiyAccess() {
  const [user, setUser] = useState(null);
  const [hasDiyAccess, setHasDiyAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    diyDebug('checkAccess mount', { traceId, diyCourseId: DIY_COURSE_ID });

    async function checkAccess() {
      setLoading(true);
      diyDebug('checkAccess start', { traceId });
      try {
        const userData = await fetchAuthenticatedUser();
        diyDebug('fetchAuthenticatedUser result', { traceId, summary: summarizeUser(userData) });

        if (!userData) {
          diyDebug('no authenticated user; forcing hasDiyAccess=false', { traceId });
          setUser(null);
          setHasDiyAccess(false);
          return;
        }

        setUser(userData);
        let diyAccess = false;

        try {
          const apiOrigin = resolveTmkApiOrigin();
          const rawEmail = String(userData.email || userData?.profile?.email || '').trim();
          const email = encodeURIComponent(rawEmail);
          const url = `${apiOrigin}/api/teachable-enrollment?email=${email}&courseNumber=${DIY_COURSE_ID}`;
          const headers = applyTmkApiAuthKeyHeader();

          diyDebug('enrollment request ->', {
            traceId,
            url,
            method: 'GET',
            hasEmail: Boolean(rawEmail),
            emailPreview: rawEmail ? `${rawEmail.slice(0, 3)}***` : '',
            headerKeys: [...headers.keys()],
          });

          const resp = await fetch(url, {
            credentials: 'include',
            headers,
          });

          const responseText = await resp.clone().text().catch(() => '');
          diyDebug('enrollment response <-', {
            traceId,
            status: resp.status,
            ok: resp.ok,
            statusText: resp.statusText,
            bodyPreview: responseText.slice(0, 400),
          });

          if (resp.ok) {
            const data = await resp.json();
            diyDebug('enrollment parsed JSON', {
              traceId,
              keys: Object.keys(data || {}),
              enrolled: data?.enrolled,
            });
            if (data && data.enrolled === true) {
              diyAccess = true;
            }
          }
        } catch (err) {
          diyDebug('enrollment request failed', {
            traceId,
            message: err?.message || String(err),
          });
          diyAccess = false;
        }

        if (!cancelled) {
          diyDebug('final decision', { traceId, diyAccess });
          setHasDiyAccess(diyAccess);
        }
      } finally {
        if (!cancelled) {
          diyDebug('checkAccess done', { traceId });
          setLoading(false);
        }
      }
    }

    checkAccess();
    return () => {
      diyDebug('checkAccess unmount/cancel', { traceId });
      cancelled = true;
    };
  }, []);

  return { user, authUser: user, hasDiyAccess, loading };
}
