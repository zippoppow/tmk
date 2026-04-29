import { forwardToTmkApi } from '../_proxy/forwardToTmk';

export const runtime = 'nodejs';

function handle(request) {
  return forwardToTmkApi(request, {
    routePrefix: 'lesson-activities',
    pathSegments: [],
  });
}

export const GET = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = handle;
