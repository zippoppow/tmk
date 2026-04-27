'use client';

import { useMemo, useState } from 'react';
import { resolveTmkAuthOrigin } from '../../components/authHelpers';

const AUTH_ENDPOINTS = {
  start: '/api/auth/teachable/start',
  me: '/api/auth/teachable/me',
  logout: '/api/auth/teachable/logout',
};

function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function TeachableAuthDebugPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [result, setResult] = useState(null);
  const authOrigin = useMemo(() => resolveTmkAuthOrigin(), []);

  const redirectTarget = useMemo(() => {
    if (typeof window === 'undefined') {
      return '/api-test/teachable-auth';
    }
    return window.location.href;
  }, []);

  const runMeCheck = async () => {
    setIsLoading(true);
    setStatus('Checking /me...');

    try {
      const response = await fetch(`${authOrigin}${AUTH_ENDPOINTS.me}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setResult({
        ok: response.ok,
        status: response.status,
        data,
      });
      setStatus('Finished /me check.');
    } catch (error) {
      setResult({
        ok: false,
        status: 'network-error',
        data: { message: error?.message || 'Unknown error' },
      });
      setStatus('Request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const startLogin = () => {
    const url = new URL(AUTH_ENDPOINTS.start, authOrigin);
    url.searchParams.set('redirectTo', redirectTarget);
    window.location.href = url.toString();
  };

  const runLogout = () => {
    const url = new URL(AUTH_ENDPOINTS.logout, authOrigin);
    url.searchParams.set('redirectTo', redirectTarget);
    window.location.href = url.toString();
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '900px' }}>
      <h1>Teachable OAuth Debug</h1>
      <p>Use this page to verify the TMK API auth routes and current session state.</p>

      <div style={{ marginBottom: '12px', padding: '10px', background: '#f4f6f8', borderRadius: '6px' }}>
        <div><strong>Auth origin:</strong> {authOrigin}</div>
        <div><strong>Start:</strong> {AUTH_ENDPOINTS.start}</div>
        <div><strong>Me:</strong> {AUTH_ENDPOINTS.me}</div>
        <div><strong>Logout:</strong> {AUTH_ENDPOINTS.logout}</div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button
          onClick={runMeCheck}
          disabled={isLoading}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #bbb', cursor: 'pointer' }}
        >
          {isLoading ? 'Checking...' : 'Check Auth Status (/me)'}
        </button>

        <button
          onClick={startLogin}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #bbb', cursor: 'pointer' }}
        >
          Start Login
        </button>

        <button
          onClick={runLogout}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #bbb', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong>Redirect target:</strong> {redirectTarget}
      </div>

      <pre
        style={{
          background: '#111827',
          color: '#e5e7eb',
          padding: '12px',
          borderRadius: '8px',
          overflowX: 'auto',
          minHeight: '120px',
        }}
      >
        {result ? prettyJson(result) : 'No result yet.'}
      </pre>
    </div>
  );
}
