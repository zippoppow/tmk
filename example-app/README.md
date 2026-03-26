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

## Next Steps

- Explore `../theme/components/` to see all available components
- Browse `../tokens/` to customize design tokens for your brand
- Check `../icons/` for the full icon set
- Refer to [Pegasus Design System](https://pegasusdesignsystem.com) for component definitions and usage guidelines

## Teachable OAuth Setup

Lesson activity login now runs through local Next.js routes and calls Teachable OAuth/API directly.

Set these server env vars in `example-app/.env.local`:

```bash
TEACHABLE_SCHOOL_ID=12345
TEACHABLE_CLIENT_ID=your_client_id
TEACHABLE_CLIENT_SECRET=your_client_secret
TEACHABLE_REDIRECT_URI=http://localhost:3000/api/auth/teachable/callback
```

Optional vars:

```bash
TEACHABLE_REQUIRED_SCOPES="name:read email:read"
TEACHABLE_OPTIONAL_SCOPES="courses:read"
TEACHABLE_POST_LOGOUT_REDIRECT=/
```

The Redirect URL configured in Teachable must exactly match `TEACHABLE_REDIRECT_URI`.
