import { forwardToTmkApi } from '../_proxy/forwardToTmk';

export const runtime = 'nodejs';

async function handle(request) {
  return forwardToTmkApi(request, {
    routePrefix: 'lesson-activities',
    pathSegments: [],
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS, handle as HEAD };
