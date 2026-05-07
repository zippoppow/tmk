export const runtime = 'nodejs';

import { resolveServerTmkApiBaseUrl, withTmkApiAuthHeader } from '@/lib/tmkApiOrigin.js';

function getClientCredentials() {
  const clientIdKeys = [
    'API_AUTH_CLIENT_ID',
    'TMK_API_AUTH_CLIENT_ID',
    'NEXT_PUBLIC_API_AUTH_CLIENT_ID',
  ];

  const clientSecretKeys = [
    'API_AUTH_CLIENT_SECRET',
    'TMK_API_AUTH_CLIENT_SECRET',
    'NEXT_PUBLIC_API_AUTH_CLIENT_SECRET',
  ];

  const clientId = String(
    process.env.API_AUTH_CLIENT_ID ||
      process.env.TMK_API_AUTH_CLIENT_ID ||
      process.env.NEXT_PUBLIC_API_AUTH_CLIENT_ID ||
      ''
  ).trim();

  const clientSecret = String(
    process.env.API_AUTH_CLIENT_SECRET ||
      process.env.TMK_API_AUTH_CLIENT_SECRET ||
      process.env.NEXT_PUBLIC_API_AUTH_CLIENT_SECRET ||
      ''
  ).trim();

  return {
    clientId,
    clientSecret,
    clientIdKeys,
    clientSecretKeys,
  };
}

function extractTokenPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const directToken = typeof payload.access_token === 'string' ? payload.access_token.trim() : '';
  if (directToken) {
    return {
      access_token: directToken,
      token_type: payload.token_type || 'Bearer',
      expires_in: payload.expires_in,
      scope: payload.scope,
    };
  }

  const nested = payload.data && typeof payload.data === 'object' ? payload.data : null;
  const nestedToken = typeof nested?.access_token === 'string' ? nested.access_token.trim() : '';
  if (!nestedToken) {
    return null;
  }

  return {
    access_token: nestedToken,
    token_type: nested.token_type || payload.token_type || 'Bearer',
    expires_in: nested.expires_in ?? payload.expires_in,
    scope: nested.scope ?? payload.scope,
  };
}

export async function POST() {
  const { clientId, clientSecret, clientIdKeys, clientSecretKeys } = getClientCredentials();
  if (!clientId || !clientSecret) {
    return Response.json(
      {
        error: 'Missing client credentials for utilities token minting.',
        details: 'Set client-credentials env vars in the app server environment.',
        expected: {
          clientId: clientIdKeys,
          clientSecret: clientSecretKeys,
        },
        present: {
          clientId: clientIdKeys.filter((key) => Boolean(String(process.env[key] || '').trim())),
          clientSecret: clientSecretKeys.filter((key) => Boolean(String(process.env[key] || '').trim())),
        },
      },
      { status: 500 }
    );
  }

  const apiBase = String(resolveServerTmkApiBaseUrl() || '').replace(/\/+$/, '');
  const url = `${apiBase}/api/auth/token`;
  const headers = withTmkApiAuthHeader({ 'Content-Type': 'application/json' });

  try {
    const upstreamResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
      redirect: 'manual',
    });

    const payload = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok) {
      return Response.json(
        {
          error: 'Failed to mint utilities access token.',
          status: upstreamResponse.status,
          details: payload,
        },
        { status: upstreamResponse.status }
      );
    }

    const tokenPayload = extractTokenPayload(payload);
    if (!tokenPayload?.access_token) {
      return Response.json(
        {
          error: 'Token endpoint response did not include access_token.',
          details: payload,
        },
        { status: 502 }
      );
    }

    return Response.json(tokenPayload, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to reach TMK API token endpoint.',
        details: error instanceof Error ? error.message : String(error || 'Unknown error'),
      },
      { status: 502 }
    );
  }
}
