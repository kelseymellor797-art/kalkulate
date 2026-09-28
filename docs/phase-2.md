# Phase 2 — GitHub and Vercel production deployment

## Deployment

- Public GitHub repository: https://github.com/kelseymellor797-art/kalkulate
- Branch: `main`, tracking `origin/main`; full local history pushed.
- Vercel project: `kalkulate`.
- Team: `kelseymellor797-arts-projects` (existing Hobby account).
- Production URL: https://kalkulate-five.vercel.app
- Framework: Next.js 16.3.6.
- Deployment method: authenticated `vercel deploy --prod --yes --scope kelseymellor797-arts-projects` from the clean, pushed checkout.
- Initial verified deployment: `dpl_J8jUkvHDgrinzTiai7G7eJm8fXaf`, READY, application revision `690dcbf` (Phase 1 application code unchanged).
- Final production deployment is made from the final pushed documentation commit and checked against Vercel's deployment metadata.

## Git connection status

The repository is public and pushed successfully. Vercel's GitHub integration is now connected to `kelseymellor797-art/kalkulate`; future pushes to `main` can trigger deployments.

```sh
npx vercel git connect https://github.com/kelseymellor797-art/kalkulate --yes --scope kelseymellor797-arts-projects
```

The initial production deployment was CLI-driven. The public site and database work independently of the Git integration.

## Production configuration

Vercel Production contains exactly the application configuration names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Values were transferred from the verified ignored `.env.local` via stdin, not committed. The key is a public publishable browser key. Preview/development database values were not added. Supabase project: `grfpwfxrjescsmntuwxa`. No schema or permissions were changed during deployment.

`.env.local` remains ignored and untracked. `.vercel/` remains ignored. A `.vercelignore` file explicitly excludes environment files, build caches, dependency directories, browser reports, and local verification artifacts from CLI uploads. The CLI briefly added its OIDC token to `.env.local` during linking; that entry was removed, leaving only the two intended public configuration values.

## Production verification

The real public URL was opened in Chromium without Vercel login or protection bypass. Browser requests went to the approved Supabase project. The shared-history status appeared, and real browser INSERTs succeeded with HTTP 201.

- Twelve sequential safe calculations established newest-first ordering and a ten-row query/UI limit.
- All POST payloads contained only expression/result; returned rows had database-generated UUIDs and timestamps.
- Reload and a second browser context both preserved the latest calculation.
- Direct database inspection confirmed production-created row `a0d60de6-6f46-441a-a6d8-e6b8ce3d77d6`: `765339 + 1 = 765340`, timestamp `2026-09-28 21:59:12.832672+00`.
- Keyboard controls, decimal arithmetic (`0.1 + 0.2 = 0.3`), left-to-right chaining (`2 + 3 × 4 = 20`), percentage, sign toggle, clear, and divide-by-zero recovery passed.
- No browser console/runtime errors were observed in the production calculation flow.
- Safe verification records remain temporarily in the shared database.

## Responsive checks

At 1440px desktop, 390px mobile, and 320px mobile widths: no horizontal overflow, calculator buttons at least 44px in both dimensions, no button overlap, and readable shared history. Screenshots were captured locally under the gitignored `artifacts/` directory.

## Quality and security

Final local gates: 41 unit tests passed; ESLint passed; separate TypeScript validation passed; production build passed. The existing seven E2E checks passed during the immediately preceding live integration phase; this phase additionally tested the real production site. No calculator architecture or UI redesign was needed.

Repository/history scanning found no private credentials. GitHub contains the README, source, and lockfile, with no `.env.local`. Only the public Supabase URL/key are intentionally browser-side. Read-only database checks confirm RLS remains enabled, with anonymous SELECT and INSERT(expression, result), and no UPDATE/DELETE or explicit id/timestamp INSERT privilege. Destructive permission tests were not rerun in deployment. No accounts, auth routes, OAuth, tracking services, or unrelated features were added.

## Post-deployment clear-history update

The shared public history panel now has a secondary Clear history control. It opens an explicit confirmation dialog, supports Cancel, shows a clearing state, prevents duplicate requests, and preserves the visible rows if DELETE fails. The repository owns clearing through `HistoryRepository.clear`; the UI contains no raw Supabase calls. The in-memory adapter clears locally, while the resilient adapter clears its cache only after the remote DELETE succeeds.

The approved-project migration is [`supabase/migrations/20260928_allow_anon_delete_calculations.sql`](../supabase/migrations/20260928_allow_anon_delete_calculations.sql). It grants DELETE to `anon` and adds a `using (true)` DELETE policy on `public.calculations`. SELECT and INSERT(expression, result) remain enabled, RLS remains enabled, UPDATE remains denied, and no authentication or service-role key is involved.

Live verification on `https://kalkulate-five.vercel.app` created three calculations, reloaded them, canceled once, confirmed deletion, verified zero rows through the approved Supabase project, reloaded the empty state, and saved `8 + 9 = 17` afterward. The new row persisted after reload. The live DELETE request succeeded; anonymous UPDATE remained denied with HTTP 401 / PostgreSQL `42501`; RLS inspection returned enabled with exactly the SELECT, INSERT, and DELETE anon policies. No browser errors occurred.

## Submission

The live demo and public source repository are ready to share. Native GitHub-to-Vercel auto-deploy authorization is the remaining convenience setup; direct CLI deployment is documented and functional. Confirm any external internship rubric requirements (submission form, presentation, or screenshots) separately.
