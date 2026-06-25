import { resolveServerTmkApiBaseUrl } from '@/lib/tmkApiOrigin.js';

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'transfer-encoding',
  // Avoid upstream compressed payload/header mismatches when proxying through Node fetch.
  'accept-encoding',
]);

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  'connection',
  'content-length',
  'content-encoding',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const TEACHABLE_SESSION_PARAM = 'teachable_session';
const TEACHABLE_SESSION_COOKIE = 'tmk_teachable_session';

function cloneRequestHeaders(sourceHeaders) {
  const headers = new Headers(sourceHeaders || {});
  HOP_BY_HOP_REQUEST_HEADERS.forEach((header) => headers.delete(header));
  return headers;
}

function splitSetCookieHeader(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(/,(?=\s*[^;=\s]+=[^;]+)/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSetCookieHeaders(headers) {
  if (!headers) {
    return [];
  }

  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie().filter(Boolean);
  }

  return splitSetCookieHeader(headers.get('set-cookie'));
}

function rewriteSetCookieForProxy(cookieValue) {
  return String(cookieValue || '')
    .replace(/;\s*Domain=[^;]*/gi, '')
    .replace(/;\s*Partitioned/gi, '');
}

function buildProxyResponseHeaders(upstreamHeaders) {
  const headers = new Headers(upstreamHeaders || {});
  const setCookies = getSetCookieHeaders(upstreamHeaders);

  HOP_BY_HOP_RESPONSE_HEADERS.forEach((header) => headers.delete(header));

  if (setCookies.length > 0) {
    headers.delete('set-cookie');
    for (const cookieValue of setCookies) {
      headers.append('set-cookie', rewriteSetCookieForProxy(cookieValue));
    }
  }

  return headers;
}

function getFallbackPathFromRequest(request) {
  const pathname = String(request?.nextUrl?.pathname || '').replace(/\/+$/, '');
  const match = pathname.match(/^\/api\/(.+)$/);
  return match ? match[1] : '';
}

function buildTargetUrl(request, routePrefix, pathSegments = []) {
  const baseUrl = String(resolveServerTmkApiBaseUrl() || '').replace(/\/+$/, ''); // remove trailing slashes
  const prefix = String(routePrefix || '').replace(/^\/+/, '').replace(/\/+$/, '');
  const path = (Array.isArray(pathSegments) ? pathSegments : [])
    .map((segment) => encodeURIComponent(String(segment || '')))
    .filter(Boolean)
    .join('/');
  const fallbackPath = getFallbackPathFromRequest(request);
  const baseApiPath = prefix ? `/api/${prefix}` : fallbackPath ? `/api/${fallbackPath}` : '/api';
  const suffix = prefix && path ? `/${path}` : '';
  const query = request?.nextUrl?.search || '';
  const targetUrl = `${baseUrl}${baseApiPath}${suffix}${query}`;
  
  return targetUrl;
}

async function buildProxyRequestInit(request, apiAuthKey) {
  const headers = cloneRequestHeaders(request?.headers);
  const teachableSession = String(request?.nextUrl?.searchParams?.get(TEACHABLE_SESSION_PARAM) || '').trim();
  const existingCookieHeader = String(headers.get('cookie') || '');

  if (teachableSession && !existingCookieHeader.includes(`${TEACHABLE_SESSION_COOKIE}=`)) {
    const cookieParts = existingCookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean);
    cookieParts.push(`${TEACHABLE_SESSION_COOKIE}=${encodeURIComponent(teachableSession)}`);
    headers.set('cookie', cookieParts.join('; '));
  }
  
  // Forward user's Authorization header if present (preferred for user-scoped routes)
  // Otherwise use the server's API key as fallback
  if (!headers.has('Authorization') && apiAuthKey) {
    headers.set('x-api-key', apiAuthKey);
  }

  const method = request?.method || 'GET';
  const isBodyMethod = method !== 'GET' && method !== 'HEAD';
  const requestInit = {
    method,
    headers,
    redirect: 'manual',
  };

  // In Vercel Node runtime, request.body can be null for body methods; read raw bytes from a clone instead.
  if (isBodyMethod) {
    try {
      const bodyBuffer = await request.clone().arrayBuffer();
      if (bodyBuffer.byteLength > 0) {
        requestInit.body = bodyBuffer;
      } else {
        headers.delete('content-type');
      }
    } catch {
      headers.delete('content-type');
    }
  }

  return requestInit;
}

export async function forwardToTmkApi(request, { routePrefix, pathSegments = [] }) {
  const apiAuthKey = String(process.env.TMK_API_AUTH_KEY || '').trim();

  const targetUrl = buildTargetUrl(request, routePrefix, pathSegments);
  if (/\/api\/?(?:\?.*)?$/.test(targetUrl)) {
    return Response.json(
      {
        error: 'Proxy path resolution failed.',
        details: 'Refusing to forward to API root. Expected a specific API endpoint path.',
      },
      { status: 500 }
    );
  }


  try {
    const requestInit = await buildProxyRequestInit(request, apiAuthKey);
    const upstreamResponse = await fetch(targetUrl, requestInit);
    const responseHeaders = buildProxyResponseHeaders(upstreamResponse.headers);


    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
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
