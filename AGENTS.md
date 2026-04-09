# AGENTS.md

## 1) Project Snapshot

`react_chat` is a frontend chat application built with **React 19 + TypeScript + Vite**.
Core capabilities:
- authentication via Firebase Auth
- rooms list and room access control
- real-time messaging via Firestore
- retro terminal-like UI (CSS Modules + global theme variables)

Architecture follows a layered, feature-oriented structure (`app / pages / entities / shared / widgets`).

## 2) Setup, Lint, Test Commands

### Install dependencies
- `npm install`
- alternative: `pnpm install`

### Start local development
- `npm run dev`

### Build (type-check + bundle)
- `npm run build`

### Lint
- `npm run lint`

### Tests
- no test runner is configured in `package.json`
- `npm run test` is currently unavailable

## 3) Code Style and Conventions (Observed)

### TypeScript and imports
- strict TypeScript mode is enabled (`strict`, `noUnusedLocals`, `noUnusedParameters`)
- path alias `@/` points to `src/`
- use type-only imports where appropriate (`import type { ... }`)
- explicit domain types in `entities/*/model/types.ts`

### React patterns
- function components are declared as arrow constants (`const Component = () => {}`)
- hooks are extracted into `model/` files and named with `use*`
- presentational parts are split into small components in `ui/components`
- route guarding is handled through `PrivateRoute` / `PublicRoute`

### Exports and file organization
- mixed export style is used:
  - many page/components use named exports (`export const RoomsPage`)
  - some root-level files use default export (`App`)
- barrel `index.ts` files are used in shared UI primitives (`shared/ui/*/index.ts`)

### Styling
- global design tokens and baseline styles live in `src/shared/styles/globals.css`
- local styles use CSS Modules (`*.module.css`)
- CSS module import alias is typically `s` (`import s from "./file.module.css"`)
- conditional class composition uses `clsx`

### Formatting and linting baseline
- ESLint uses `@eslint/js` recommended + `typescript-eslint` recommended
- `react-hooks` recommended rules are enabled
- `react-refresh/only-export-components` is enabled as warning
- current codebase consistently uses:
  - double quotes
  - semicolons
  - trailing commas in multiline structures

## 4) Directory Map (Agent Navigation Guide)

```text
src/
  app/                     # app bootstrap, routes, providers
    providers/
      router/              # route guards (PrivateRoute/PublicRoute)
      store/               # Redux store setup
  entities/                # domain entities and shared entity types
    message/model/types.ts
    room/model/types.ts
  pages/                   # route-level features (login/registration/rooms/chat)
    <page>/
      model/               # page hooks and business logic
      ui/                  # page component + local UI components + CSS modules
  shared/                  # reusable cross-feature code
    api/firebase/          # Firebase init and auth helpers
    lib/                   # validation and small utilities
    styles/                # global CSS and theme tokens
    ui/                    # reusable UI primitives (Button/Input/TerminalFrame)
  widgets/                 # reusable composite UI blocks (e.g., splash)
```

## 5) Practical Notes for AI Agents

- Prefer keeping business logic in page `model` hooks, not in large UI components.
- Reuse existing shared primitives from `src/shared/ui` before introducing new ones.
- Keep new styles in CSS Modules unless a truly global style/token change is needed.
- Preserve existing alias imports (`@/`) and naming conventions to minimize churn.
- If adding tests, first introduce a test runner and scripts in `package.json`, then document commands here.
