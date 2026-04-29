import { resolveServerTmkApiBaseUrl } from '@/lib/tmkApiOrigin.js';

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'transfer-encoding',
]);

function cloneRequestHeaders(sourceHeaders) {
  const headers = new Headers(sourceHeaders || {});
  HOP_BY_HOP_REQUEST_HEADERS.forEach((header) => headers.delete(header));
  return headers;
}

function buildTargetUrl(request, routePrefix, pathSegments = []) {
  const baseUrl = resolveServerTmkApiBaseUrl();
  const prefix = String(routePrefix || '').replace(/^\/+/, '').replace(/\/+$/, '');
  const path = (Array.isArray(pathSegments) ? pathSegments : [])
    .map((segment) => encodeURIComponent(String(segment || '')))
    .filter(Boolean)
    .join('/');
  const suffix = path ? `/${path}` : '';
  const query = request?.nextUrl?.search || '';
  return `${baseUrl}/api/${prefix}${suffix}${query}`;
}

function buildProxyRequestInit(request, apiAuthKey) {
  const headers = cloneRequestHeaders(request?.headers);
  headers.set('x-api-key', apiAuthKey);

  const method = request?.method || 'GET';
  return {
    method,
    headers,
    redirect: 'manual',
    body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
    duplex: method === 'GET' || method === 'HEAD' ? undefined : 'half',
  };
}

export async function forwardToTmkApi(request, { routePrefix, pathSegments = [] }) {
  const apiAuthKey = String(process.env.TMK_API_AUTH_KEY || '').trim();
  if (!apiAuthKey) {
    return Response.json(
      { error: 'TMK_API_AUTH_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  const targetUrl = buildTargetUrl(request, routePrefix, pathSegments);

  try {
    const upstreamResponse = await fetch(targetUrl, buildProxyRequestInit(request, apiAuthKey));

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: upstreamResponse.headers,
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to reach TMK API.',
        details: error instanceof Error ? error.message : String(error || 'Unknown error'),
      },
      { status: 502 }
    );
  }
}
