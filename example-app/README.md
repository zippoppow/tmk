# Pegasus NextJS Example App

This is an example NextJS application that consumes the **Pegasus Component Library** as its UI design system.

## Project Structure

```
example-app/
├── app/
│   ├── layout.js          Root layout with Pegasus theme provider
│   └── page.js            Home page demonstrating component usage
├── package.json           Dependencies (Next, React)
├── next.config.js         Configuration
└── README.md              This file
```

## Setup

1. **Install dependencies:**
   ```bash
   cd example-app
   yarn install
   ```

2. **Run the development server:**
   ```bash
   yarn dev
   ```

3. **Open in browser:**
   Visit `http://localhost:3000`

## How It Imports Pegasus

The example shows three key import patterns:

### Tokens
```javascript
import tokens from '../../tokens/global.json';
// Access design tokens like colors, spacing, typography
console.log(tokens.colors.primary);
```

### Theme Components
```javascript
import { Button, Card, Badge } from '../../theme/index.js';
// Use pre-styled Pegasus components
<Button>Click me</Button>
```

### Icons
```javascript
import { Home, Settings } from '../../icons/filled/general/index.jsx';
import { AppleMusicIcon } from '../../icons/filled/brands/index.jsx';
// Render icon components directly
<Home />
```

## Integration Notes

- **Relative imports:** This example uses relative paths (`../../`) to import from the Pegasus library. In a real monorepo, you'd use:
  - yarn workspaces (preferred)
  - `yarn link` for local development
  - Path aliases in `tsconfig.json` or `jsconfig.json`

- **Theme Provider:** The root `layout.js` wraps the app with the Pegasus theme. Ensure all components inherit theme context.

- **Icons Organization:** Icons are categorized by style (`filled/`, `line/`) and category (`general/`, `brands/`, etc.). See the library's [icons/](../icons/) directory for all available icons.

## Shared Lesson Activity Foundation

Lesson activities share a common set of animation and drag-and-drop primitives located at:

```
app/lesson-activities/components/shared/
├── ActivityMotionProvider.js   LazyMotion wrapper (motion library)
├── ActivityEntrance.js         Fade + slide-up entrance animation
├── ActivityDndProvider.js      DnD context (pointer, touch, keyboard sensors)
├── DraggableTile.js            Reusable draggable word/token tile
├── DropZone.js                 Reusable drop target
└── index.js                    Single import surface
```

### Animation — `motion`

Uses the [`motion`](https://motion.dev) library (`^12.11.1`). All lesson activity pages should wrap their content with `ActivityMotionProvider` to enable animations and respect the user's reduced-motion preference.

```javascript
import { ActivityMotionProvider, ActivityEntrance } from '../components/shared';

<ActivityMotionProvider>
  <ActivityEntrance>
    {/* page content fades + slides in */}
  </ActivityEntrance>
</ActivityMotionProvider>
```

`ActivityEntrance` uses `LazyMotion` (only the `domAnimation` feature set is loaded) and `MotionConfig` with `reducedMotion="user"` so system preferences are honoured automatically.

### Drag-and-Drop — `@dnd-kit`

Uses [`@dnd-kit/core`](https://dndkit.com) (`^6.3.1`) with `@dnd-kit/sortable` (`^10.0.0`) and `@dnd-kit/utilities` (`^3.2.2`). Sensors are pre-configured for pointer (desktop), touch (mobile), and keyboard (accessibility).

```javascript
import { ActivityDndProvider, DraggableTile, DropZone } from '../components/shared';

<ActivityDndProvider onDragEnd={handleDragEnd}>
  <DraggableTile id="word-1" data={{ value: 'prefix', sourceType: 'grid' }}>
    prefix
  </DraggableTile>

  <DropZone id="noun-box" data={{ category: 'noun' }}>
    {/* dropped items render here */}
  </DropZone>
</ActivityDndProvider>
```

`handleDragEnd` receives a `@dnd-kit` event — read `active.data.current` for the dragged item's metadata and `over.id` for the drop target.

The `app/lesson-activities/part-of-speech/page.js` activity is the **reference implementation** showing the full pattern.

## Next Steps

- Explore `../theme/components/` to see all available components
- Browse `../tokens/` to customize design tokens for your brand
- Check `../icons/` for the full icon set
- Refer to [Pegasus Design System](https://pegasusdesignsystem.com) for component definitions and usage guidelines

## Teachable OAuth Setup

Lesson activity login is owned by TMK API, which handles the Teachable OAuth flow and Teachable API calls.

In local development, the example app can proxy `/api/auth/teachable/*` through Next.js rewrites, but TMK API is still the auth authority. The callback URL configured in Teachable must resolve to a path that ultimately reaches the TMK API auth callback.

Set these server env vars in `example-app/.env.local`:

```bash
TEACHABLE_OAUTH_AUTHORIZE_URL=https://sso.teachable.com/secure/<school_id>/identity/oauth_provider/authorize
TEACHABLE_OAUTH_CALLBACK_URL=https://tmk-api.up.railway.app/api/auth/teachable/callback
TEACHABLE_OAUTH_CLIENT_ID=your_client_id
TEACHABLE_OAUTH_CLIENT_SECRET=your_client_secret
TEACHABLE_OAUTH_STATE_SECRET=replace_with_random_secret
TEACHABLE_OAUTH_TOKEN_URL=https://developers.teachable.com/v1/current_user/oauth2/token
```

Legacy aliases are also supported (`TEACHABLE_SCHOOL_ID`, `TEACHABLE_CLIENT_ID`, `TEACHABLE_CLIENT_SECRET`, `TEACHABLE_REDIRECT_URI`).

Optional vars:

```bash
TEACHABLE_REQUIRED_SCOPES="name:read email:read"
TEACHABLE_OPTIONAL_SCOPES="courses:read"
TEACHABLE_POST_LOGOUT_REDIRECT=/
```

Auth debug logging is disabled by default. To enable verbose auth helper logs only when needed, set:

```bash
NEXT_PUBLIC_TMK_AUTH_DEBUG=1
```

Example local-dev callback patterns:

```bash
# Direct TMK API callback
TEACHABLE_OAUTH_CALLBACK_URL=https://tmk-api.up.railway.app/api/auth/teachable/callback

# Or a public app URL that rewrites /api/auth/teachable/* to TMK API
TEACHABLE_OAUTH_CALLBACK_URL=https://your-dev-app-host/api/auth/teachable/callback
```

The Redirect URL configured in Teachable must exactly match the TMK API callback URL in `TEACHABLE_OAUTH_CALLBACK_URL` (or `TEACHABLE_REDIRECT_URI` if using legacy naming).
