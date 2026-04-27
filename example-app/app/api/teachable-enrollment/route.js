import { forwardToTmkApi } from '../_proxy/forwardToTmk';

export const runtime = 'nodejs';

async function handle(request) {
  return forwardToTmkApi(request, { routePrefix: 'teachable-enrollment', pathSegments: [] });
}

export { handle as GET };
