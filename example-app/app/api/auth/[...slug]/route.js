export const runtime = 'nodejs';

import { forwardToTmkApi } from '../../_proxy/forwardToTmk.js';

/**
 * Catch-all route handler for /api/auth/* endpoints.
 * Forwards to tmk-api while preserving the full path.
 * 
 * Examples:
 *   GET /api/auth/teachable/me → GET {API}/api/auth/teachable/me
 *   POST /api/auth/teachable/logout → POST {API}/api/auth/teachable/logout
 *   POST /api/auth/user/refresh → POST {API}/api/auth/user/refresh
 *   POST /api/auth/teachable/exchange → POST {API}/api/auth/teachable/exchange
 */

export async function GET(request, { params }) {
  const pathSegments = Array.isArray(params.slug) ? params.slug : [params.slug];
  return forwardToTmkApi(request, {
    routePrefix: 'auth',
    pathSegments,
  });
}

export async function POST(request, { params }) {
  const pathSegments = Array.isArray(params.slug) ? params.slug : [params.slug];
  return forwardToTmkApi(request, {
    routePrefix: 'auth',
    pathSegments,
  });
}

export async function PUT(request, { params }) {
  const pathSegments = Array.isArray(params.slug) ? params.slug : [params.slug];
  return forwardToTmkApi(request, {
    routePrefix: 'auth',
    pathSegments,
  });
}

export async function DELETE(request, { params }) {
  const pathSegments = Array.isArray(params.slug) ? params.slug : [params.slug];
  return forwardToTmkApi(request, {
    routePrefix: 'auth',
    pathSegments,
  });
}
