# KALKULATE

A focused everyday calculator with a graphite interface, lime accents, keyboard controls, and recent calculation history. Phase 1 adds shared anonymous Supabase history without accounts, login, or authentication. The persistence code is ready; live database setup requires an approved KALKULATE project. Deployment is deferred.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 with custom design tokens, decimal.js, the official Supabase JavaScript client, Vitest, and Playwright with axe accessibility checks. `package-lock.json` pins the installed versions. Node 22+ is required; verified with Node 24.13.0 and npm 11.6.2.

## Local setup

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No credentials are required. Without Supabase configuration, history stays in memory and resets on refresh. With valid public configuration and the schema installed, history is shared publicly across visitors and survives reloads.

| Command              | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Development server                                     |
| `npm run lint`       | ESLint                                                 |
| `npm run typecheck`  | TypeScript check (run build first on a clean checkout) |
| `npm test`           | Engine, repository, and config unit tests              |
| `npm run test:watch` | Interactive unit tests                                 |
| `npm run test:e2e`   | Chromium interaction, layout, and accessibility checks |
| `npm run build`      | Production build                                       |
| `npm start`          | Serve the production build                             |

For first-time browser testing, run `npx playwright install chromium`. The browser tests start isolated servers on ports 3017 (no configuration) and 3018 (mocked Supabase). They override environment values, never contact a real database, and require both ports to be free. Screenshots are written to the gitignored `artifacts/` directory.

## Calculator behavior

Operations evaluate immediately, left to right: `2 + 3 × 4 = 20`. Pressing another operator replaces a pending operator. Equals requires two operands and does not repeat a previous operation. A digit after equals starts a new calculation; an operator continues from the result.

Percentage divides the current operand by 100 (`50 % = 0.5`); it does not compute a relative percentage of the previous operand. Sign toggle and percentage apply to an entered operand, not a pending one. AC resets calculator state without deleting history. Backspace edits active input; a completed result is preserved until new input or AC.

Decimal arithmetic uses 24-digit internal precision and returns up to 16 significant digits. Manual input is limited to 16 digits. Scientific notation represents small/large results; nonzero magnitudes outside 10^-100 through 10^100 produce a recoverable error. Divide-by-zero never exposes NaN or Infinity.

Keyboard: `0–9`, `.`, `+`, `-`, `*`, `/`, `%`, `Enter`/`=`, `Escape`, `Backspace`/`Delete`. When a button is focused, Enter activates that button. Space also uses native button behavior. Shortcuts do not intercept modifier shortcuts or editable fields.

## Architecture

- `src/app/`: server-rendered route, layout, metadata, icon, and responsive design system.
- `src/components/`: client workspace controller, display, keypad, and history panel.
- `src/domain/calculator.ts`: pure state transition engine, decimal arithmetic, keyboard mapping; no React or persistence dependencies.
- `src/types/calculation.ts`: record shape (`id`, `expression`, `result`, `created_at`), with numeric results stored as strings to preserve representation.
- `src/repositories/history.ts`: asynchronous repository interface and per-workspace memory implementation, capped at the latest ten records. The workspace serializes initial loading and writes. A resilient wrapper caches history and handles storage failures independently of calculation. `src/repositories/supabase-history.ts` performs database queries.
- `src/lib/supabase.ts`: lazy, nullable client factory; no connection is created merely by importing it.
- Colocated unit tests and `tests/e2e/`: regression checks.

## Supabase setup

1. Select the explicitly approved **KALKULATE** Supabase project. Do not reuse another application's project by guesswork.
2. In its SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). This is a one-time transaction that intentionally fails if `public.calculations` already exists. Inspect any existing table before deciding how to proceed; do not drop it.
3. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` to the project's URL and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to its public anon JWT or publishable key.
4. Restart `npm run dev` (public environment values are bundled at startup/build).
5. Complete a calculation and reload. Verify the row appears in the shared history and in the approved project's table. Verify a second browser also sees it.

Never use a service-role or secret key in a public environment variable. `.env.local` and all other environment files except `.env.example` are ignored. Runtime guards reject known privileged key formats, but cannot prevent a mistakenly configured `NEXT_PUBLIC_` value from being bundled: only configure public keys.

### Table and permissions

`public.calculations` contains `id uuid primary key default gen_random_uuid()`, `expression text not null`, `result text not null`, and `created_at timestamptz not null default now()`. Expression/result lengths are bounded to 256/64 characters. An index supports newest-first retrieval.

RLS is enabled. `calculations_anon_select` allows the `anon` role to read all rows; `calculations_anon_insert` allows it to insert. Grants restrict INSERT to `expression` and `result`, so the database supplies IDs and timestamps. There are no UPDATE or DELETE grants/policies, auth flows, or privileged functions. Shared history has no clear button. The local-only fallback retains its existing clear action.

This is intentionally **public history**, not private per-person storage. All visitors can read all rows and submit data. The ten-record limit controls the app's query, not what the public API permits people to read. Do not enter private information. RLS does not provide rate limiting or prevent anonymous submissions from consuming storage.

### Persistence and failure behavior

The app loads history on mount and after each completed calculation, using `created_at DESC, id DESC` with `limit(10)` in the database query. Each insert sends only expression and result. No realtime subscription or polling is added; reload to see other visitors' newest work.

Requests have a five-second abort timeout and SDK retries disabled. A failure switches the current page to cached/session-local history with a subtle offline message. The latest cached rows and new local calculations remain available until refresh. Reload reconnects; unsaved local entries are **not uploaded or replayed**. A write that timed out may already have reached the database, so automatic replay could duplicate it. Database errors are sanitized and never block calculator input. Remote strings render as React text, never HTML.

## Vercel preparation

The production build uses Next.js defaults and requires no external font fetches or credentials. A later deployment phase will connect the approved Git repository to Vercel, use `npm run build`, configure public Supabase variables for the appropriate environments, and verify the deployed application. No deployment or Git push has been performed.

See [Phase 0](docs/phase-0.md) for the original foundation and [Phase 1](docs/phase-1.md) for persistence decisions, verification, and the remaining live setup steps.

Reference documentation: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Supabase client initialization](https://supabase.com/docs/reference/javascript/initializing).
