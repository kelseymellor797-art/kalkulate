# KALKULATE

A focused everyday calculator with a graphite interface, lime accents, keyboard controls, and recent calculation history. Phase 1 adds shared anonymous Supabase history without accounts, login, or authentication. Live Supabase persistence is verified on the deployed application.

**Live demo:** https://kalkulate-five.vercel.app

**Source:** https://github.com/kelseymellor797-art/kalkulate

This repository is feature-frozen after Phase 4. Future work should be a separately reviewed code-quality audit or maintenance fix, not an unplanned product expansion.

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

Use the **Basic / Graph** mode switch to move between everyday calculations and a local 2D graphing workspace. Graph mode accepts `y = x^2` or an expression such as `sin(x)`, supports `+ - * / ^`, parentheses, `x`, `sin`, `cos`, `tan`, `sqrt`, and `abs`, and safely parses expressions without JavaScript execution. Add multiple curves, hide/show or remove individual functions, clear the graph tape, and use the zoom/reset controls to inspect the Cartesian plane. Turn on **Trace** to enter an x-value or click the graph and inspect every visible function's y-value, including clearly labeled undefined results. Graph expressions and trace position are session-only; standard calculation history continues to use Supabase.

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
- `src/domain/graphing.ts`: safe expression parser/evaluator, bounded sampling, trace evaluation, numeric formatting, and coordinate transforms.
- `src/components/graphing-workspace.tsx`, `graph-window.tsx`, and `function-tape.tsx`: session-local graph, trace, and function-tape presentation.
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

RLS is enabled. `calculations_anon_select` allows the `anon` role to read all rows; `calculations_anon_insert` allows it to insert; and the Phase 2 clear-history migration adds only `calculations_anon_delete`, allowing the public demo to delete shared rows after confirmation. Grants restrict INSERT to `expression` and `result`, so the database supplies IDs and timestamps. UPDATE remains denied; there are no auth flows or privileged functions. Clear history is a two-step confirmation and keeps the existing rows visible if deletion fails.

This is intentionally **public history**, not private per-person storage. All visitors can read all rows and submit data. The ten-record limit controls the app's query, not what the public API permits people to read. Do not enter private information. RLS does not provide rate limiting or prevent anonymous submissions from consuming storage.

### Persistence and failure behavior

The app loads history on mount and after each completed calculation, using `created_at DESC, id DESC` with `limit(10)` in the database query. Each insert sends only expression and result. No realtime subscription or polling is added; reload to see other visitors' newest work.

Requests have a five-second abort timeout and SDK retries disabled. A failure switches the current page to cached/session-local history with a subtle offline message. The latest cached rows and new local calculations remain available until refresh. Reload reconnects; unsaved local entries are **not uploaded or replayed**. A write that timed out may already have reached the database, so automatic replay could duplicate it. Database errors are sanitized and never block calculator input. Remote strings render as React text, never HTML.

## Production deployment

The public app is hosted on Vercel as `kalkulate` in the `kelseymellor797-arts-projects` team. Production uses the approved shared Supabase database. The Vercel Production environment contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; no service-role key is used.

Deployment currently uses the authenticated Vercel CLI from a clean, pushed `main` checkout:

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
git push origin main
npx vercel deploy --prod --yes --scope kelseymellor797-arts-projects
```

On a new checkout, link the existing project with `npx vercel link --yes --project kalkulate --scope kelseymellor797-arts-projects`. Supply public environment values through Vercel project settings or `vercel env add`; never commit them. `.vercelignore` excludes local environment files, build caches, and verification artifacts from CLI uploads. No additional product features are required to deploy.

The Vercel GitHub integration is connected to this repository, so future pushes to `main` can trigger production deployments. Preview/development Supabase variables are deliberately not configured.

After each deployment, open the public URL, complete a calculation, reload and confirm shared history persists, and check desktop/mobile layouts. See [Phase 2](docs/phase-2.md) for deployment evidence and the release revision reference. [Phase 0](docs/phase-0.md) and [Phase 1](docs/phase-1.md) retain the historical implementation reports; their earlier pending-live statements were superseded by successful live verification and deployment.

The feature-complete baseline is tagged `pre-claude-refactor`. Any later refactor should compare against that tag and preserve the documented behavior and quality gates.

Reference documentation: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Supabase client initialization](https://supabase.com/docs/reference/javascript/initializing).
