'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { buildTeachableStartUrl, fetchAuthenticatedUser, resolveTmkApiOrigin } from '../components/authHelpers';

const DEFAULT_NEXT_PATH = '/';

function sanitizeNextPath(candidate) {
  if (!candidate || typeof candidate !== 'string') {
    return DEFAULT_NEXT_PATH;
  }

  if (!candidate.startsWith('/')) {
    return DEFAULT_NEXT_PATH;
  }

  if (candidate.startsWith('/login')) {
    return DEFAULT_NEXT_PATH;
  }

  return candidate;
}

function extractErrorMessageFromNext(nextPath) {
  try {
    const nextUrl = new URL(nextPath, 'https://tmk.local');
    if (nextUrl.searchParams.get('auth') !== 'error') {
      return '';
    }

    return nextUrl.searchParams.get('message') || 'Login failed. Please try again.';
  } catch {
    return '';
  }
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const nextPath = useMemo(() => {
    return sanitizeNextPath(searchParams.get('next'));
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const user = await fetchAuthenticatedUser(resolveTmkApiOrigin());
      if (!isMounted) {
        return;
      }

      if (user) {
        router.replace(nextPath);
        return;
      }

      setIsChecking(false);
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [nextPath, router]);

  useEffect(() => {
    const authFlag = searchParams.get('auth');
    const rawMessage = searchParams.get('message');
    if (authFlag === 'error') {
      setErrorMessage(rawMessage || 'Login failed. Please try again.');
      return;
    }

    const nestedErrorMessage = extractErrorMessageFromNext(nextPath);
    if (nestedErrorMessage) {
      setErrorMessage(nestedErrorMessage);
    }
  }, [nextPath, searchParams]);

  function handleLogin() {
    const apiOrigin = resolveTmkApiOrigin();
    window.location.href = buildTeachableStartUrl(apiOrigin, window.location.origin + nextPath);
  }

  if (isChecking) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'ui-sans-serif, system-ui' }}>
        <p>Checking session...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #f6f9fc 0%, #e9eff7 100%)',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 14px 40px rgba(18, 38, 63, 0.12)',
          padding: '28px',
          fontFamily: 'ui-sans-serif, system-ui',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '28px', lineHeight: 1.2, color: '#1c2b3a' }}>TMK Login</h1>
        <p style={{ marginTop: '10px', color: '#4b5d70', lineHeight: 1.5 }}>
          Sign in with your Teachable account to access lesson activities.
        </p>

        {errorMessage ? (
          <div
            style={{
              marginTop: '14px',
              background: '#fdecec',
              color: '#9f1c1c',
              border: '1px solid #f8b4b4',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleLogin}
          style={{
            marginTop: '18px',
            width: '100%',
            border: 'none',
            borderRadius: '10px',
            background: '#0f5d9c',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            padding: '12px 14px',
            cursor: 'pointer',
          }}
        >
          Continue With Teachable
        </button>
      </section>
    </main>
  );
}

function LoginFallback() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'ui-sans-serif, system-ui' }}>
      <p>Loading login...</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
