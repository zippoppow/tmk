# TMK-API README
This is a copy of the tmk-api readme documentation that specifies how the routing is set up in tmk-api.

### API Authorization
- All API routes are protected by default with a global auth guard.
- Preferred for user-scoped TMK routes: send `Authorization: Bearer <user_access_token>` from your existing user-auth flow.
- `POST /api/auth/token` mints a client-credentials token (`principalType: client`) for machine-to-machine usage; do not use it for user-only endpoints.
- Transitional fallback (optional): send `x-api-key: <API_AUTH_KEY>` while migrating clients.
- Public routes currently include:
  - `GET /`
  - `POST /api/auth/token`
  - `POST /api/auth/user/refresh`
  - `POST /api/auth/user/logout`
  - Teachable OAuth public routes are listed below in `#### Teachable OAuth Routes`.
- Authenticated maintenance routes include:
  - `POST /api/auth/token/cleanup`
  - `POST /api/auth/teachable/cleanup`

#### TMK Route Auth Boundary
- TMK API authentication is the edge auth for all non-public TMK routes.
- Clients call TMK routes with `Authorization: Bearer <tmk_access_token>`.
- Optional legacy fallback remains `x-api-key: <API_AUTH_KEY>` when enabled.

#### Access Token Refresh Flow (Browser Frontend)
1. Frontend uses `Authorization: Bearer <access_token>` for protected API calls.
2. Ensure the browser already has a valid `tmk_api_refresh` cookie issued by your existing user-auth flow.
3. On access-token expiry, call `POST /api/auth/user/refresh` with `credentials: 'include'`.
4. API rotates refresh token session and returns a new `access_token`.

Standard TMK routes are authenticated via TMK bearer token (or optional legacy x-api-key fallback when enabled).
The Teachable session cookie is not required for TMK routes that use server-side Teachable Developers API calls (for example, enrollment lookup).
Important nuance:

For user token refresh (POST /api/auth/user/refresh), you need tmk_api_refresh cookie, not tmk_teachable_session.

#### Scope Enforcement
- Guard enforces scopes on bearer tokens.
- Explicit `@RequireScopes(...)` metadata is supported per route.
- DIY-gated routes require `feature:diy` via explicit metadata.
- If no explicit metadata exists:
  - `GET/HEAD` require one of `read:all` or `read:<resource>`
  - write operations require one of `write:all` or `write:<resource>`

Client credentials token example:

```bash
curl -X POST https://tmk-api.up.railway.app/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "'$API_AUTH_CLIENT_ID'",
    "client_secret": "'$API_AUTH_CLIENT_SECRET'",
    "scope": "read:all"
  }'
```
Protected route example:

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://tmk-api.up.railway.app/api/products
```

### Teachable OAuth API (Implemented)
The backend now includes a Teachable OAuth module at `api/auth/teachable` designed for a plain HTML/JavaScript frontend.

#### Teachable OAuth Boundary
- Teachable OAuth routes under `/api/auth/teachable/*` are a separate proxy flow for frontend apps that choose Teachable sign-in.
- Teachable Developers API calls made by TMK backend (for example `/v1/users`) use `apiKey` header with `TEACHABLE_DEVELOPERS_API_KEY`.
- TMK routes that proxy Teachable Developers API calls do not require a Teachable OAuth session cookie.

#### Teachable OAuth Requirement
  - `TEACHABLE_OAUTH_PROFILE_URL` is required for the Teachable user flow. The backend exchanges the authorization code for an access token and then calls this URL to resolve the current Teachable user for session creation.
  - If this env var is missing, the OAuth callback will fail after token exchange with `Could not retrieve Teachable user profile` and the logs will show `Missing required environment variable: TEACHABLE_OAUTH_PROFILE_URL`.
  - Do not use `https://developers.teachable.com/v1/users` for this value. That endpoint expects an API key and will reject OAuth bearer tokens with `No API key found in request`.
  - OAuth sessions now store `teachableUserId` only (not raw profile JSON). `/api/auth/teachable/me` fetches profile fields live from Teachable using the current session access token.
  - `GET /api/auth/teachable/*`
  - `POST /api/auth/teachable/*`

#### Teachable OAuth Routes
- `GET /api/auth/teachable/start` - Initiate OAuth flow
- `GET /api/auth/teachable/callback` - OAuth callback handler
- `GET /api/auth/teachable/me` - Check current auth status (live profile fetch from Teachable)
- `GET /api/auth/teachable/logout` - Logout and clear session (relative `redirectTo` values resolve against `TEACHABLE_POST_LOGIN_REDIRECT_URL`)
- `POST /api/auth/teachable/logout` - Logout and clear session
- `POST /api/auth/teachable/cleanup` - Remove expired sessions (maintenance endpoint, requires TMK auth)

- `https://tmk.themorphologykit.com/api/auth/teachable/callback` -- for production


#### Teachable Enrollment Endpoint
- `GET /api/teachable-enrollment` is TMK-authenticated (bearer token preferred).
- The backend calls Teachable Developers API using `TEACHABLE_DEVELOPERS_API_KEY`.
- Frontend callers should not send Teachable OAuth cookies/tokens to use this endpoint.

Example (frontend/server client calling TMK API):

```bash
curl -G https://tmk-api.up.railway.app/api/teachable-enrollment \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "email=user@example.com" \
  --data-urlencode "courseNumber=2944218"
```

### Hardening Defaults
- `API_AUTH_ALLOW_LEGACY_API_KEY` should be set to `false` in production.
- `teachable` cleanup endpoint is not public by default.

### DIY Projects API (User-Scoped)
- DIY project routes are protected and scoped to the authenticated user.
- DIY project routes additionally require `feature:diy` scope.
- Ownership is derived from bearer token subject (`tmk:user:<userId>`), not from request body params.
- No email is accepted or stored for DIY ownership.

Routes:

- `PUT /api/diy-projects` - Upsert current user's DIY project collection
- `GET /api/diy-projects` - Fetch current user's DIY project collection
- `DELETE /api/diy-projects` - Delete current user's DIY project collection

Payload example for `PUT /api/diy-projects`:

```json
{
  "diy-projects": [
    {
      "project-name": "Semester Project",
      "created-at": 1773338823441,
      "modified-at": 1773338823441,
      "lesson-activities": []
    }
  ]
}
```

DIY projects examples:

```bash
# Upsert current user's collection
curl -X PUT https://tmk-api.up.railway.app/api/diy-projects \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diy-projects": [
      {
        "project-name": "Semester Project",
        "created-at": 1773338823441,
        "modified-at": 1773338823441,
        "lesson-activities": []
      }
    ]
  }'

# Get current user's collection
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://tmk-api.up.railway.app/api/diy-projects

# Delete current user's collection
curl -X DELETE -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://tmk-api.up.railway.app/api/diy-projects
```


#### Lesson Activities API (User-Scoped)
- Lesson activity routes are protected and scoped to the authenticated user.
- Lesson activity routes additionally require `feature:diy` scope.
- Ownership is derived from bearer token subject (`tmk:user:<userId>`).
- `activity-data` is stored as JSON per activity row in `lesson_activities`.

Routes:

- `PUT /api/lesson-activities` - Create or update one lesson activity for current user
- `GET /api/lesson-activities` - List current user's lesson activities
- `GET /api/lesson-activities/:id` - Fetch one lesson activity for current user
- `POST /api/lesson-activities/:id/associations` - Attach association records to one lesson activity
- `DELETE /api/lesson-activities/:id/associations` - Detach association records from one lesson activity
- `DELETE /api/lesson-activities` - Delete one lesson activity for current user

Lesson activities examples:

```bash
# Upsert one activity by id
curl -X PUT https://tmk-api.up.railway.app/api/lesson-activities \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "activity-123",
    "lesson-id": "lesson-42",
    "activity-data": {
      "completed": true,
      "score": 95
    }
  }'

# List current user's activities
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://tmk-api.up.railway.app/api/lesson-activities

# Delete a single activity
curl -X DELETE https://tmk-api.up.railway.app/api/lesson-activities \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "activity-123"}'
```


### Frontend Flow (HTML/JS) for Teachable Authentication
This flow is specifically for the Teachable OAuth proxy/session routes (/api/auth/teachable/*) and managing the tmk_teachable_session cookie state.

It is not required for calling most TMK API routes:

Standard TMK routes are authenticated via TMK bearer token (or optional legacy x-api-key fallback when enabled).
The Teachable session cookie is not required for TMK routes that use server-side Teachable Developers API calls (for example, enrollment lookup).
Important nuance:

For user token refresh (POST /api/auth/user/refresh), you need tmk_api_refresh cookie, not tmk_teachable_session.

1. Frontend calls `GET /api/auth/teachable/start`.
2. Frontend redirects browser to the returned `authorizationUrl`.
3. Teachable redirects to backend callback route.
4. Backend exchanges code for token, sets `tmk_teachable_session` cookie, then redirects to your frontend.
5. Frontend calls `GET /api/auth/teachable/me` with credentials to confirm logged-in state.

```html
<button id="login">Login with Teachable</button>
<button id="logout">Logout</button>
<pre id="status"></pre>

<script>
  const apiBase = 'http://localhost:3000';
  const statusEl = document.getElementById('status');

  async function refreshAuthStatus() {
    const res = await fetch(`${apiBase}/api/auth/teachable/me`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    statusEl.textContent = JSON.stringify(data, null, 2);
  }

  document.getElementById('login').addEventListener('click', async () => {
    const res = await fetch(
      `${apiBase}/api/auth/teachable/start?redirectTo=${encodeURIComponent(window.location.origin)}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const data = await res.json();
    window.location.href = data.authorizationUrl;
  });

  document.getElementById('logout').addEventListener('click', async () => {
    await fetch(`${apiBase}/api/auth/teachable/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    await refreshAuthStatus();
  });

  refreshAuthStatus().catch(console.error);
</script>
```