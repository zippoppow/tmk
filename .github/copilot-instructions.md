<!-- Generated guidance for AI coding agents working in this repo -->
# Copilot instructions for Pegasus Component Library

Purpose: Help coding agents be productive maintaining and consuming the **Pegasus Component Library** — a design tokens, theme, and icon package.

## Context

This is the canonical implementation of the [Pegasus Design System](https://pegasusdesignsystem.com). Downstream consumer projects (e.g., NextJS apps) import `tokens`, `theme`, and `icons` from this library to build UIs with a unified design system.

- Big picture
  - This project provides tokens, theme, and icons that power Pegasus components:
    - `tokens/` — JSON design token bundles (global.json, theme-default.json, theme-darkmode.json) used for color, spacing, typography, etc.
    - `theme/` — JS theme layers and React component wrappers under `theme/components/` (button, card, dialog, accordion, etc.).
    - `icons/` — 100+ React JSX icon components organized by style (`filled/`, `line/`) and category (`general/`, `brands/`, `payment/`, etc.).

- Key entry points (look at these files first)
  - `index.d.ts` — Type definitions for consumers.
  - `tokens/index.js` — token exports and runtime selection.
  - `theme/index.js` — main theme assembly used by downstream apps.

- Common patterns and conventions
  - Tokens are JSON. Add new tokens to `tokens/global.json` and expose theme overrides in `tokens/theme-*.json`.
  - Icon files are React JSX components named per icon (e.g., icons/filled/general/home.jsx) and each category directory exposes an `index.jsx` that re-exports its icons. When adding an icon, add the component file and update the category's `index.jsx` export.
  - Theme component modules live in `theme/components/<component>/` and follow a simple export pattern: default styled wrapper + optional subcomponents (see `theme/components/button/`).

- Editing examples
  - Add token: update `tokens/global.json` and, if theme-specific, `tokens/theme-default.json`.
  - Add icon: create `icons/filled/<category>/<name>.jsx` and add `export {default as <Name>} from './<name>.jsx'` to the category `index.jsx`.
  - Update theme behavior: edit `theme/index.js` or the specific module in `theme/components/`.

- Build / test / debug notes (repo-specific)
  - This repository is a library with no top-level `package.json` at the root. It's designed to be consumed by downstream projects (see `example-app/` for a working NextJS reference).
  - The Pegasus theme uses Material-UI (`@mui/material`) and Emotion (`@emotion/react`, `@emotion/styled`) under the hood. Consumer projects **must** install these dependencies.
  - Pegasus theme's `theme/index.js` calls `createTheme()` at module load—this is a client-side function. Consumer apps must wrap imports in a `'use client'` component or lazy-load the theme in a client boundary (see `example-app/app/page.js` for pattern).
  - Consumer setup checklist:
    - Install dependencies: `@mui/material`, `@emotion/react`, `@emotion/styled`
    - Wrap pages/components using theme with `'use client'` directive
    - Use `ThemeProvider` from `@mui/material/styles` to wrap your component tree
    - Import tokens from `tokens/global.json` or use Material-UI's `createTheme()` to customize
  - When uncertain about runtime behavior, inspect `tokens/index.js` and `theme/index.js` to see how themes are selected and exported.

- Integration points & external dependencies
  - Downstream projects (NextJS apps, etc.) import `tokens` and `theme` from this library's export points (`tokens/index.js`, `theme/index.js`, and type definitions in `index.d.ts`).
  - **Critical:** Pegasus theme depends on Material-UI and Emotion. All consumer projects **must** install:
    ```
    yarn add @mui/material @emotion/react @emotion/styled
    ```
  - No top-level `package.json` in repo root — this is a package-like structure consumed by a monorepo or external projects (see `example-app/package.json` for a working consumer setup).
  - Icons are plain React JSX components — keep them side-effect free and export defaults.
  - Consumer apps must use `'use client'` directive on pages that import the theme, since `createTheme()` from Material-UI is a client function.
  - Example consumer project at `example-app/` demonstrates correct setup: yarn workspaces, theme provider wrapping, and client-side component boundaries.

- What not to change without asking
  - Do not rename existing token keys in `tokens/*.json` or change public JS export names in `theme/` and `tokens/` without coordinating, as downstream consumers depend on stable names.

- Quick checklist for PRs made by an agent
  - Update or add tokens in JSON only; preserve formatting and structure.
  - For icons: include the component and update the category `index.jsx` exports.
  - Keep `index.d.ts` in sync if you add public exports or change types.
  - **Consumer PRs:** Verify Material-UI and Emotion are in dependencies, pages using theme have `'use client'`, and theme is wrapped with `ThemeProvider`.

- Example consumer app
  - See `example-app/` for a complete, working NextJS 14 app that consumes Pegasus.
  - Key files to review: `package.json` (dependencies), `app/page.js` ('use client' + ThemeProvider pattern), `app/layout.js` (basic setup).
  - Run: `cd example-app && yarn install && yarn dev` to test locally.

If any of these areas are unclear or you want me to expand examples (e.g., a concrete icon add PR or consumer setup), tell me which area to expand.
