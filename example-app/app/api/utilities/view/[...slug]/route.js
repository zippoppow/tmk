export const runtime = 'nodejs';

import { forwardToTmkApi } from '../../../_proxy/forwardToTmk.js';

function normalizeSegments(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (value) {
    return [value];
  }
  return [];
}

function buildRouteConfig(params) {
  const segments = normalizeSegments(params?.slug);
  const [routePrefix, ...pathSegments] = segments;

  return {
    routePrefix,
    pathSegments,
  };
}

function handle(request, { params }) {
  const { routePrefix, pathSegments } = buildRouteConfig(params);

  if (!routePrefix) {
    return Response.json(
      {
        error: 'Missing resource path for utilities view proxy.',
      },
      { status: 400 }
    );
  }

  return forwardToTmkApi(request, {
    routePrefix,
    pathSegments,
  });
}

export const GET = handle;
export const OPTIONS = handle;
