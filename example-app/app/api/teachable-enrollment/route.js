export const runtime = 'nodejs';

const TMK_API_BASE =
  process.env.TMK_API_BASE_URL ||
  process.env.NEXT_PUBLIC_TMK_API_URL_PRODUCTION ||
  process.env.NEXT_PUBLIC_TMK_API_URL ||
  'https://tmk-api.up.railway.app';

export async function GET(request) {
  const apiKey = String(process.env.TMK_API_AUTH_KEY || '').trim();
  if (!apiKey) {
    return Response.json(
      { error: 'TMK_API_AUTH_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || '';
  const courseNumber = searchParams.get('courseNumber') || '';

  const upstreamUrl = `${TMK_API_BASE}/api/teachable-enrollment?email=${encodeURIComponent(email)}&courseNumber=${encodeURIComponent(courseNumber)}`;

  const upstream = await fetch(upstreamUrl, {
    method: 'GET',
    headers: { 'x-api-key': apiKey },
  });

  const data = await upstream.json().catch(() => ({}));
  return Response.json(data, { status: upstream.status });
}
