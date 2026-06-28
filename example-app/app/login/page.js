'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { buildTeachableStartUrl } from '../components/authHelpers';
import { Box, Container, Paper, Typography, Button, Alert } from '@mui/material';
import TmkLogo from '../components/TmkLogo';

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

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');

  const nextPath = sanitizeNextPath(searchParams.get('next'));

  // Extract error message from URL if present
  useEffect(() => {
    const authFlag = searchParams.get('auth');
    const rawMessage = searchParams.get('message');
    if (authFlag === 'error') {
      setErrorMessage(rawMessage || 'Login failed. Please try again.');
    }
  }, [searchParams]);

  function handleLogin() {
    // Pass callback URL so Teachable knows where to redirect after OAuth
    // /api/auth/callback will set the httpOnly cookie and redirect to nextPath
    const callbackUrl = `${window.location.origin}/api/auth/callback?redirectTo=${encodeURIComponent(nextPath)}`;
    window.location.href = buildTeachableStartUrl(callbackUrl);
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
            The Morphology Kit® DIY Login
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Sign in with your Teachable account to access the app.
          </Typography>

          {errorMessage ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
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
      <Typography>Loading...</Typography>
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
