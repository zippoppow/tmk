export const runtime = 'nodejs';

import { forwardToTmkApi } from '../_proxy/forwardToTmk.js';

function handle(request) {
  return forwardToTmkApi(request, {
    routePrefix: 'morphemes',
  });
}

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
