import { forwardToTmkApi } from '../../_proxy/forwardToTmk';

export const runtime = 'nodejs';

async function handle(request, { params }) {
  return forwardToTmkApi(request, {
    routePrefix: 'lesson-activities',
    pathSegments: params?.path || [],
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS, handle as HEAD };
