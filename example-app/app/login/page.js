'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { buildTeachableStartUrl, fetchAuthenticatedUser, initializeDiySession, exchangeTeachableSessionForTmkToken } from '../components/authHelpers';
import { Box, Container, Paper, Typography, Button, Alert, CircularProgress } from '@mui/material';
import TmkLogo from '../components/TmkLogo';

const DEFAULT_NEXT_PATH = '/';
const SESSION_CHECK_FALLBACK_MS = 12000;
const DIY_COURSE_ID = '2944218';

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
  const [sessionCheckTimedOut, setSessionCheckTimedOut] = useState(false);
  const [sessionCheckAttempt, setSessionCheckAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const nextPath = useMemo(() => {
    return sanitizeNextPath(searchParams.get('next'));
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    setSessionCheckTimedOut(false);

    const fallbackTimerId = setTimeout(() => {
      if (isMounted) {
        setSessionCheckTimedOut(true);
        setIsChecking(false);
      }
    }, SESSION_CHECK_FALLBACK_MS);

    async function checkSession() {
      const user = await fetchAuthenticatedUser();
      if (!isMounted) {
        return;
      }

      if (user) {
        // Exchange Teachable session for TMK JWT
        await exchangeTeachableSessionForTmkToken();
        
        // Initialize app session (sets httpOnly cookie) before redirecting
        // Check enrollment via API to determine DIY access
        let hasDiyAccess = false;
        try {
          const DIY_COURSE_ID = '2944218';
          const email = encodeURIComponent(user.email || user?.profile?.email || '');
          const resp = await fetch(`/api/teachable-enrollment?email=${email}&courseNumber=${DIY_COURSE_ID}`, { credentials: 'include' });
          if (resp.ok) {
            const data = await resp.json();
            hasDiyAccess = data?.enrolled === true;
          }
        } catch (err) {
          console.error('[login] enrollment check failed:', err?.message || err);
        }
        
        // Initialize session with DIY access status
        await initializeDiySession(user, hasDiyAccess);
        
        // Now redirect to next page
        if (isMounted) {
          router.replace(nextPath);
        }
        return;
      }

      setSessionCheckTimedOut(false);
      setIsChecking(false);
    }

    checkSession();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimerId);
    };
  }, [nextPath, router, sessionCheckAttempt]);

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
    window.location.href = buildTeachableStartUrl(window.location.origin + nextPath);
  }

  function handleRetrySessionCheck() {
    setSessionCheckTimedOut(false);
    setIsChecking(true);
    setSessionCheckAttempt((value) => value + 1);
  }

  if (isChecking) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.86)), url('/branding/tmk_diy_cat.png')",
          backgroundSize: '65% auto',
          backgroundPosition: 'center calc(10%)',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: { xs: 'scroll', md: 'fixed' },
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage:
          "linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.86)), url('/branding/tmk_diy_cat.png')",
        backgroundSize: '65% auto',
        backgroundPosition: 'center calc(10%)',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        display: 'grid',
        placeItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <TmkLogo priority routeToHome />
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid #224c88',
          }}
        >
          <Typography variant="h5" component="h1" sx={{ mb: 1, fontWeight: 600, color: '#1c2b3a' }}>
            TMK Login
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Sign in with your Teachable account to access lesson activities.
          </Typography>

          {errorMessage ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          ) : null}

          {sessionCheckTimedOut ? (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Session check timed out. Please retry, or continue to sign in.
              </Alert>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleRetrySessionCheck}
                sx={{ mb: 2 }}
              >
                Retry Session Check
              </Button>
            </>
          ) : null}

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Continue With Teachable
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

function LoginFallback() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage:
          "linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.86)), url('/branding/tmk_diy_cat.png')",
        backgroundSize: '65% auto',
        backgroundPosition: 'center calc(10%)',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
