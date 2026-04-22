'use client';

import { useMemo, useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import {
  captureTeachableSessionFromUrl,
  DIY_PROJECTS_ENDPOINT,
  OAUTH_ENDPOINTS,
  exchangeUserAccessToken,
  fetchWithUserToken,
  getTeachableSessionDebugInfo,
  getUserAccessTokenDebugInfo,
  refreshUserAccessToken,
  resolveTmkAuthOrigin,
  resolveTmkApiOrigin,
} from './authHelpers';

const isDev = process.env.NODE_ENV !== 'production';

function summarizeJson(payload) {
  try {
    return JSON.stringify(payload, null, 2).slice(0, 500);
  } catch {
    return '';
  }
}

export default function AuthDebugPanel() {
  const apiOrigin = useMemo(() => resolveTmkApiOrigin(), []);
  const authOrigin = useMemo(() => resolveTmkAuthOrigin(), []);
  const appOrigin = useMemo(() => (typeof window === 'undefined' ? '' : window.location.origin), []);
  const [status, setStatus] = useState('Idle');
  const [details, setDetails] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(getUserAccessTokenDebugInfo());
  const [sessionInfo, setSessionInfo] = useState(getTeachableSessionDebugInfo());

  if (!isDev) {
    return null;
  }

  const updateTokenInfo = () => {
    setTokenInfo(getUserAccessTokenDebugInfo());
    setSessionInfo(getTeachableSessionDebugInfo());
  };

  const runAction = async (label, action) => {
    setIsBusy(true);
    setStatus(`${label}...`);
    setDetails('');

    try {
      await action();
    } catch (error) {
      setStatus(`${label}: failed`);
      setDetails(error?.message || 'Unknown error');
    } finally {
      updateTokenInfo();
      setIsBusy(false);
    }
  };

  const handleCheckSession = () =>
    runAction('Session check', async () => {
      captureTeachableSessionFromUrl();
      const response = await fetch(`${authOrigin}${OAUTH_ENDPOINTS.me}`, {
        method: 'GET',
        credentials: 'include',
      });

      const text = await response.text();
      let payload = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { raw: text.slice(0, 500) };
      }

      setStatus(`Session check: ${response.status}`);
      setDetails(summarizeJson(payload));
    });

  const handleExchangeToken = () =>
    runAction('Token exchange', async () => {
      captureTeachableSessionFromUrl();
      const token = await exchangeUserAccessToken();
      setStatus(token ? 'Token exchange: success' : 'Token exchange: no token returned');
      setDetails(token ? `access_token preview: ${token.slice(0, 16)}...` : 'Verify Teachable session exists first.');
    });

  const handleRefreshToken = () =>
    runAction('Token refresh', async () => {
      captureTeachableSessionFromUrl();
      const token = await refreshUserAccessToken();
      setStatus(token ? 'Token refresh: success' : 'Token refresh: failed');
      setDetails(token ? `access_token preview: ${token.slice(0, 16)}...` : 'Refresh cookie may be missing or expired.');
    });

  const handleDiyProbe = () =>
    runAction('DIY probe', async () => {
      captureTeachableSessionFromUrl();
      const response = await fetchWithUserToken(apiOrigin, DIY_PROJECTS_ENDPOINT, {
        method: 'GET',
      });

      const text = await response.text();
      let payload = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { raw: text.slice(0, 500) };
      }

      setStatus(`DIY probe: ${response.status}`);
      setDetails(summarizeJson(payload));
    });

  const handleCaptureSession = () =>
    runAction('Capture handoff', async () => {
      const captured = captureTeachableSessionFromUrl();
      setStatus(captured ? 'Captured teachable_session handoff.' : 'No teachable_session found in URL.');
      setDetails(captured ? `teachable_session preview: ${captured.slice(0, 12)}...` : 'If login just redirected, check URL before any hard refresh.');
    });

  return (
    <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, border: '1px dashed #7c8aa5', backgroundColor: '#f8fbff' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Auth Debug</Typography>
        <Chip size="small" label={tokenInfo.hasToken ? 'Token cached' : 'No token cached'} color={tokenInfo.hasToken ? 'success' : 'default'} />
        <Chip size="small" label={sessionInfo.hasSession ? 'Session handoff cached' : 'No session handoff'} color={sessionInfo.hasSession ? 'success' : 'default'} />
        <Chip size="small" label={`App: ${appOrigin || 'unknown'}`} variant="outlined" />
        <Chip size="small" label={`Auth: ${authOrigin}`} variant="outlined" />
        <Chip size="small" label={`API: ${apiOrigin}`} variant="outlined" />
      </Stack>

      <Typography sx={{ mt: 0.8, fontSize: '0.72rem', color: '#64748b' }}>
        Session handoff uses query param transport; token and DIY probes call API origin with credentials include.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
        <Button size="small" variant="outlined" onClick={handleCaptureSession} disabled={isBusy}>Capture Session Handoff</Button>
        <Button size="small" variant="outlined" onClick={handleCheckSession} disabled={isBusy}>Check Session</Button>
        <Button size="small" variant="outlined" onClick={handleExchangeToken} disabled={isBusy}>Exchange Token</Button>
        <Button size="small" variant="outlined" onClick={handleRefreshToken} disabled={isBusy}>Refresh Token</Button>
        <Button size="small" variant="contained" onClick={handleDiyProbe} disabled={isBusy}>Probe DIY GET</Button>
      </Stack>

      <Box sx={{ mt: 1 }}>
        <Typography sx={{ fontSize: '0.8rem', color: '#334155' }}>{status}</Typography>
        {tokenInfo.tokenPreview ? (
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Cached token: {tokenInfo.tokenPreview}</Typography>
        ) : null}
        {sessionInfo.sessionPreview ? (
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Session handoff: {sessionInfo.sessionPreview}</Typography>
        ) : null}
        {details ? (
          <Box component="pre" sx={{ mt: 0.8, mb: 0, p: 1, borderRadius: 1, backgroundColor: '#fff', border: '1px solid #e2e8f0', overflowX: 'auto', fontSize: '0.7rem' }}>
            {details}
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
