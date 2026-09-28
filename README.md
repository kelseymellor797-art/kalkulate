# KALKULATE

A focused everyday calculator with a graphite interface, lime accents, keyboard controls, and recent calculation history. Phase 0 is a functional foundation for an internship submission; cloud persistence and deployment are planned for Phase 1.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 with custom design tokens, decimal.js, the official Supabase JavaScript client, Vitest, and Playwright with axe accessibility checks. `package-lock.json` pins the installed versions. Node 22+ is required; verified with Node 24.13.0 and npm 11.6.2.

## Local setup

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No credentials are required. History is held in memory in the current page and resets on refresh; it is never represented as cloud-saved.

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

For first-time browser testing, run `npx playwright install chromium`. The browser tests start a local dev server when needed. Screenshots are written to the gitignored `artifacts/` directory.

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
- `src/repositories/history.ts`: asynchronous repository interface and per-workspace memory implementation, capped at the latest ten records. The workspace serializes writes and handles storage failures independently of calculation.
- `src/lib/supabase.ts`: lazy, nullable client factory; no connection is created merely by importing it.
- Colocated unit tests and `tests/e2e/`: regression checks.

## Supabase preparation

Optionally copy `.env.example` to `.env.local` and supply `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These are public browser configuration values. Never use a service-role or secret key in a public environment variable. `.env.local` and all other environment files except `.env.example` are ignored by Git.

**Phase 0 always uses memory history, even if these variables are provided.** No table, policies, authentication, project, or remote connection has been fabricated. Missing/malformed configuration returns null. Client creation alone does not prove a live connection.

Phase 1 will implement `HistoryRepository` using Supabase, then switch `createHistoryRepository`. Before enabling writes, establish history ownership and privacy requirements, create the calculation table with row-level security and explicit access policies, and test cross-user isolation. Do not expose a shared anonymous table of private histories.

## Vercel preparation

The production build uses Next.js defaults and requires no external font fetches or credentials. Phase 1 will connect the approved Git repository to Vercel, use `npm run build`, configure public Supabase variables for the appropriate environments, and verify the deployed application. No deployment or Git push has been performed in Phase 0.

See [the Phase 0 implementation report](docs/phase-0.md) for decisions, verification, and deferred work.

Reference documentation: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Supabase client initialization](https://supabase.com/docs/reference/javascript/initializing).
