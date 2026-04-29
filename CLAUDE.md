# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server with HMR at http://localhost:5173
- `npm run build` — production build to `build/` (outputs `client/` static assets and `server/index.js`)
- `npm run start` — serve the built app via `react-router-serve`
- `npm run typecheck` — runs `react-router typegen` then `tsc`. Run this after changing routes; typegen writes `./.react-router/types/` which `+types/<route>` imports rely on.

There is no test runner or linter configured.

## Architecture

This is a React Router v7 SSR app whose purpose is to demonstrate `fontdue-js` integration. The whole codebase is intentionally small (a handful of routes under `app/routes/`); the interesting pattern lives in how those routes consume `fontdue-js`.

### The fontdue-js preload pattern

Every `fontdue-js` component (`TypeTester`, `TypeTesters`, `CharacterViewer`, `BuyButton`, `CartButton`, `StoreModal`/`FontdueProvider`, `TestFontsForm`, `NewsletterSignup`) is paired with a `loadXxxQuery()` function. The contract is:

1. Call `loadXxxQuery(args)` inside the route `loader` (server-side). Run multiple loads in `Promise.all` so they parallelize.
2. Return the resulting `preloadedQuery` value(s) from the loader.
3. Pass `preloadedQuery={loaderData.xxxPreload}` to the component in the route's default export.

The component then hydrates without re-fetching. Breaking this pattern (e.g. rendering a fontdue component without `preloadedQuery`) defeats the whole point of the example.

`app/root.tsx` does this at the layout level for `FontdueProvider` (commits aux payload — theme, test mode, tracking — into the client Relay env) and `CartButton` (so the header shows correct cart count on first paint). Page routes do it for their own components.

### Configuration

- `vite.config.ts` registers the `fontdue-js/vite` plugin alongside `@tailwindcss/vite` and `@react-router/dev/vite`. The fontdue plugin is required for `fontdue-js` imports to resolve correctly.
- `react-router.config.ts` has `ssr: true`. Switching to SPA mode would break the loader-based preload pattern.
- `VITE_FONTDUE_URL` in `.env` points the fontdue client at the backend (e.g. `https://example.fontdue.xyz`).
- `~/*` in `tsconfig.json` maps to `./app/*`.

### Routes

Defined explicitly in `app/routes.ts` (not file-system routing). Adding a route means editing that file and creating the corresponding module under `app/routes/`.
