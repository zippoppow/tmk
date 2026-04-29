import { forwardToTmkApi } from '../_proxy/forwardToTmk';

export const runtime = 'nodejs';

function handle(request) {
  return forwardToTmkApi(request, {
    routePrefix: 'diy-projects',
    pathSegments: [],
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
