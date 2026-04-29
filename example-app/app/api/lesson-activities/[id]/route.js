import { forwardToTmkApi } from '../../_proxy/forwardToTmk';

export const runtime = 'nodejs';

function handle(request, { params }) {
  const { id } = params;
  return forwardToTmkApi(request, {
    routePrefix: 'lesson-activities',
    pathSegments: [id],
  });
}

export const GET = handle;
export const OPTIONS = handle;
