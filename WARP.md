# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Commands

Use `npm` for scripts unless the user explicitly prefers another package manager.

- Development server: `npm run dev`
- Production build: `npm run build`
- Start production server (after build): `npm start`
- Lint (Next.js + TypeScript ESLint config): `npm run lint`

There are currently no test scripts defined in `package.json`. If you add a test runner (e.g. Jest, Vitest, Playwright, Cypress), also add a corresponding `test` (and optionally `test:watch`) script so future agents can use `npm test` and `npm run test:watch`.

## Project Overview

This is a Next.js App Router project (`app/` directory) bootstrapped with `create-next-app`.

- Entry layout: `app/layout.tsx` defines the root HTML structure, global fonts, and shared chrome (navigation bar and background visual effects).
- Home page: `app/page.tsx` renders the hero (“The Hub for every Dev Event you Cant Miss”) plus a featured events section sourced from `lib/constants.ts`.
- Routing: there are no additional `app/**/page.tsx` routes yet; navigation links in `NavBar` currently point to `/` (placeholders for future routes).

## Architecture & Key Modules

### UI Shell and Layout

- **Root layout (`app/layout.tsx`)**
  - Uses `Schibsted_Grotesk` and `Martian_Mono` via `next/font/google`, exposing them as CSS variables on the `<body>`.
  - Renders `NavBar` followed by a full-screen WebGL light-rays background (`LightRays`), then a `<main>` that renders the current route’s content.
  - The light-rays component is absolutely positioned behind the content (`z-[-1]`) while remaining full-screen, so any new pages automatically get the animated background.

- **Navigation bar (`components/NavBar.tsx`)**
  - Simple header/nav with a logo (`/icons/logo.png`) and three links: Home, Events, Create Event.
  - All links currently route to `/`. Future work will likely involve adding real `app/events` and `app/events/new` routes and pointing these links there.

- **Animated background (`components/LightRays.tsx`)**
  - Client component using `ogl` to render a full-screen fragment shader that simulates "light rays".
  - Key concepts:
    - Uses a `Renderer`, `Triangle`, and `Mesh` from `ogl` to render a fullscreen quad.
    - Fragment shader uses uniforms such as `rayPos`, `rayDir`, `raysColor`, `raysSpeed`, `lightSpread`, `rayLength`, `pulsating`, `noiseAmount`, and `distortion` to control the ray effect.
    - `raysOrigin` (e.g. `"top-center"`, `"bottom-left"`, etc.) is mapped to an anchor and direction via `getAnchorAndDir`, which depends on the canvas resolution.
    - Mouse tracking is optional (`followMouse`, `mouseInfluence`); when enabled, the ray direction is interpolated toward the mouse position for an interactive effect.
    - Uses an `IntersectionObserver` to only initialize WebGL when the component is visible, and carefully cleans up the WebGL context and animation frame on unmount / visibility change.
  - When modifying this component, keep the cleanup and intersection-observer logic intact to avoid WebGL context leaks.

### Pages and Components

- **Home page (`app/page.tsx`)**
  - Imports `ExploreBtn`, `EventCard`, and `events` from `lib/constants`.
  - Renders a hero section and a "Featured Events" list:
    - `events` is a static array of event descriptors (slug, image, title, location, date, time).
    - Each event is rendered via `EventCard`, using the event fields as props.
  - If you add dynamic routes (e.g. `/events/[slug]`), ensure `EventCard` links and `events` slugs are aligned with your new route structure.

- **Event card (`components/EventCard.tsx`)**
  - Displays event poster image, title, and small blocks for location/date/time using `next/image` and `next/link`.
  - Currently links to `/events` for every event; once detail routes exist, update this to use the `slug` (e.g. `/events/${slug}`).
  - Uses icon assets from `public/icons` (e.g. `pin.svg`, `calendar.svg`, `clock.svg`); new icons should follow the same pattern.

- **Explore button (`components/ExploreBtn.tsx`)**
  - Client component that renders a button anchored to the `#events` section via an `<a href="#events">`.
  - Logs a click to the console; this is a good place to integrate analytics or smooth scrolling behavior.

### Data Layer and Models

Even though the current UI uses static event data from `lib/constants.ts`, the repo already includes a MongoDB/Mongoose data layer for events and bookings.

- **MongoDB connection (`lib/mongodb.ts`)**
  - Provides `connectDB()` which caches a Mongoose connection in `global.mongoose`.
  - Uses `MONGODB_URI` from environment variables and throws a helpful error if it’s missing.
  - Designed to be reused across server components, route handlers, or server actions without reconnecting on every request.

- **Event model (`database/event.model.ts`)**
  - Defines `IEvent` and an `Event` Mongoose model with strong validation and normalization:
    - Fields: `title`, `slug`, `description`, `overview`, `image`, `venue`, `location`, `date`, `time`, `mode`, `audience`, `agenda`, `organizer`, `tags`, plus timestamps.
    - `mode` is constrained to `"online" | "offline" | "hybrid"` via an enum.
    - `agenda` and `tags` must be non-empty arrays.
  - Pre-save hook:
    - Generates a URL-safe `slug` from `title` if the title changed or the document is new.
    - Normalizes `date` via `normalizeDate()` into ISO-like `YYYY-MM-DD`.
    - Normalizes `time` via `normalizeTime()` into `HH:MM` 24-hour format, accepting `HH:MM` and `HH:MM AM/PM` inputs.
  - Indexes:
    - Unique index on `slug`.
    - Compound index on `{ date: 1, mode: 1 }` for common query patterns (e.g. listing upcoming events by date and mode).
  - When adding APIs or server actions, always reuse this model instead of redefining schemas.

- **Booking model (`database/booking.model.ts`)**
  - Currently a duplicate of the event schema/interface; it appears to be a placeholder for a future booking entity.
  - Before using it, it’s worth revisiting field names and interface naming (it currently reuses `IEvent`/`EventSchema`).

- **Static events (`lib/constants.ts`)**
  - Contains the `events` array used by the home page.
  - This can serve as seed data for the MongoDB `Event` model or be replaced with dynamic data fetching once an API layer is built.

### Utilities and Styling

- **Utility helper (`lib/utils.ts`)**
  - Provides a `cn` helper that merges Tailwind class names using `clsx` and `tailwind-merge`.
  - Prefer `cn()` when composing complex Tailwind class strings to prevent conflicting classes.

- **Tailwind / PostCSS**
  - The repo includes `tailwindcss` v4, `@tailwindcss/postcss`, and `postcss.config.mjs` plus `components.json` for Tailwind configuration.
  - Global styles are imported from `app/globals.css` in `app/layout.tsx`.
  - When adding new components, follow the existing utility-class approach and centralize shared class patterns into helpers/components.

### Analytics and Instrumentation

- **PostHog client (`instrumentation-client.ts`)**
  - Initializes PostHog via `posthog-js` using `process.env.NEXT_PUBLIC_POSTHOG_KEY`.
  - Routes analytics network traffic through the Next.js rewrites defined in `next.config.ts`:
    - `/ingest/static/:path*` → `https://us-assets.i.posthog.com/static/:path*`
    - `/ingest/:path*` → `https://us.i.posthog.com/:path*`
  - `skipTrailingSlashRedirect: true` is enabled in `next.config.ts` to support PostHog’s trailing-slash API patterns.
  - When adding client-side analytics (e.g. tracking button clicks or page views), import and use this initialized PostHog instance or a small wrapper around it.

## Linting & TypeScript

- ESLint is configured via `eslint.config.mjs` using `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
  - Default Next.js ignores for build artifacts (`.next/**`, `out/**`, `build/**`, `next-env.d.ts`) are managed via `globalIgnores`.
  - Run `npm run lint` before significant refactors or when modifying critical files like `app/layout.tsx` or `components/LightRays.tsx`.

- TypeScript is configured in `tsconfig.json`:
  - Strict mode is enabled (`"strict": true`) with `noEmit` and `moduleResolution: "bundler"`.
  - React JSX is configured via `"jsx": "react-jsx"`.
  - Path alias `@/*` points to the repo root, used extensively throughout (`@/components/...`, `@/lib/...`, `@/database/...`).
  - When moving files, keep this alias in mind to avoid broken imports; prefer updating imports to use `@/` rather than relative `../` chains.

## How Future Agents Should Extend the App

- For new pages or sections (e.g. Events listing, Event details, Create Event):
  - Create new routes under `app/` using the App Router conventions (e.g. `app/events/page.tsx`, `app/events/[slug]/page.tsx`, `app/events/new/page.tsx`).
  - Leverage `Event` and `connectDB()` for data access instead of hard-coding additional event data in `lib/constants.ts`.

- For background/visual changes:
  - Prefer adjusting props to `LightRays` in `app/layout.tsx` (e.g. `raysOrigin`, `raysColor`, `mouseInfluence`) rather than rewriting shader logic.
  - If you must change the shader, ensure cleanup and `IntersectionObserver` behavior remain intact.

- For analytics:
  - Use `instrumentation-client.ts` as the single place for PostHog initialization and configuration so tracking remains consistent across the app.