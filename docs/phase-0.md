# Phase 0 delivery

## Implemented

KALKULATE now has a Next.js App Router/TypeScript foundation with npm, ESLint, Tailwind CSS, a custom responsive graphite-and-lime interface, app metadata, and a branded SVG icon. The calculator supports all requested operations, clear, backspace, sign toggle, percentage, chained calculations, and keyboard input. The display distinguishes input, expressions, completed results, and recoverable errors. History shows the latest ten successful equals operations with timestamps and a clear action.

## Decisions

- A pure transition function owns arithmetic and calculator state. Presentation components never evaluate expressions or use `eval`.
- decimal.js avoids binary floating-point artifacts. Results round to 16 significant digits with bounded magnitudes; errors never show NaN or Infinity.
- Immediate left-to-right execution matches a standard calculator. Percent means current operand / 100. Pending operators can be replaced. Repeated equals does not repeat or duplicate records. These semantics are documented in README and keyboard help.
- A per-workspace `MemoryHistoryRepository` implements an asynchronous interface. There is no server-global history, browser disk storage, or implied cloud persistence. Refresh clears the session. Storage operations are serialized; storage failures do not block the calculator.
- Supabase client initialization is lazy and nullable. The official client and public environment placeholders are ready, but the app deliberately retains the memory repository until a real schema and access policies are implemented.
- System fonts avoid external font dependencies at build time. CSS container sizing keeps long numbers readable on narrow screens. Native buttons, focus outlines, a skip link, live display, and reduced-motion styles support accessibility.

## Important files

- `src/domain/calculator.ts`: state machine, decimal arithmetic, keyboard mapping.
- `src/components/calculator-workspace.tsx`: interaction and repository coordination.
- `src/components/calculator-display.tsx`, `keypad.tsx`, `history-panel.tsx`: presentation.
- `src/repositories/history.ts`: persistence boundary and memory adapter.
- `src/types/calculation.ts`: record contract.
- `src/lib/supabase.ts`: optional client factory.
- `src/app/`: route, layout, CSS, icon.
- `.env.example`: empty public configuration fields; `.env.local` is ignored.
- `src/**/*.test.ts`, `tests/e2e/calculator.spec.ts`: regression tests.

## Verification

Verified on Node v24.13.0 and npm 11.6.2:

- Unit tests: 28 passed across engine, repository, and Supabase configuration.
- ESLint: passed.
- TypeScript: passed as part of the production build.
- Production build: passed with Next.js 16.3.6; home page statically prerendered.
- Playwright: four tests passed, covering keyboard/pointer interaction, focus activation, history, divide-by-zero recovery, refresh behavior, and 320/390/1440px layouts.
- axe: no detected accessibility violations at all three tested widths. Automated checks do not replace a full assistive-technology audit.
- Browser runtime: no page errors in the interaction test; agent-browser also loaded and inspected the page.
- Desktop and 320px screenshots reviewed. Long-number wrapping found in review was corrected with display-relative font sizing.
- Dependency installation audit reported zero vulnerabilities.
- Environment ignore rules and tracked source reviewed for accidental credentials. No actual credentials were supplied or included.

The sandbox initially blocked local server/compiler ports; running the same commands with approved permissions resolved that environmental issue. The generated Node 20 type definitions were upgraded to Node 24 types to satisfy the current test tooling. A TypeScript inference error and a Next.js link lint finding were fixed before completion.

The live development server uses http://127.0.0.1:3003 because port 3000 was occupied. A normal `npm run dev` uses the first available port starting at 3000. Browser tests explicitly use port 3003.

## Deferred to Phase 1

Real Supabase table/migrations, row-level security policies, history ownership rules, the Supabase repository adapter and integration tests, cross-session persistence, and approved Vercel deployment. No auth, scientific functions, AI, currency conversion, unrelated APIs, remote project creation, push, or deployment was added.

Needed next: the approved Supabase project URL and public anon/publishable key (configure locally, never provide a service-role key), the intended history ownership/privacy behavior, and the GitHub/Vercel project destinations. Authentication should only be added if the chosen ownership model requires it.
