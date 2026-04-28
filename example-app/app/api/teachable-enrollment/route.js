export const runtime = 'nodejs';

const TEACHABLE_API_BASE = 'https://developers.teachable.com';

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.users)) {
    return value.users;
  }

  if (Array.isArray(value?.enrollments)) {
    return value.enrollments;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  return [];
}

function getUserIdFromRecord(record) {
  if (!record || typeof record !== 'object') {
    return '';
  }

  return String(
    record.user?.id ??
    record.user_id ??
    record.userId ??
    record.owner_id ??
    record.id ??
    ''
  ).trim();
}

/**
 * GET /api/teachable-enrollment?email={email}&courseNumber={courseNumber}
 *
 * Checks whether a user (identified by email) is actively enrolled in a
 * Teachable course. Uses the Teachable Admin API directly with the school's
 * API key — the key never reaches the browser.
 *
 * Two-step flow:
 *   1. GET /v1/users?email={email} — find the user and their Teachable ID
 *   2. GET /v1/courses/{courseId}/enrollments — confirm active enrollment
 *
 * Returns: { enrolled: boolean }
 */
export async function GET(request) {
  const apiKey = String(process.env.TEACHABLE_DEVELOPERS_API_KEY || '').trim();
  if (!apiKey) {
    return Response.json(
      { error: 'TEACHABLE_DEVELOPERS_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = (searchParams.get('email') || '').trim();
  const courseId = (searchParams.get('courseNumber') || '').trim();

  if (!email || !courseId) {
    return Response.json({ error: 'email and courseNumber are required.' }, { status: 400 });
  }

  const headers = { apiKey, accept: 'application/json' };

  // Step 1: look up the user by email
  let userId;
  try {
    const usersResp = await fetch(
      `${TEACHABLE_API_BASE}/v1/users?email=${encodeURIComponent(email)}`,
      { headers }
    );
    if (!usersResp.ok) {
      return Response.json({ enrolled: false });
    }
    const usersData = await usersResp.json();
    const users = asArray(usersData);
    const match = users.find(
      (u) => String(u.email || '').toLowerCase() === email.toLowerCase()
    );
    if (!match) {
      return Response.json({ enrolled: false });
    }
    userId = getUserIdFromRecord(match);
    if (!userId) {
      return Response.json({ enrolled: false });
    }
  } catch {
    return Response.json({ enrolled: false });
  }

  // Step 2: check that the user has an active enrollment in the course
  try {
    const enrollResp = await fetch(
      `${TEACHABLE_API_BASE}/v1/courses/${courseId}/enrollments`,
      { headers }
    );
    if (!enrollResp.ok) {
      return Response.json({ enrolled: false });
    }
    const enrollData = await enrollResp.json();
    const enrollments = asArray(enrollData);
    const enrolled = enrollments.some(
      (record) => getUserIdFromRecord(record) === userId
    );
    return Response.json({ enrolled });
  } catch {
    return Response.json({ enrolled: false });
  }
}
