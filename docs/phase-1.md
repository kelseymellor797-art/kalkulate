# Phase 1 — shared anonymous Supabase history

## Delivery boundary

Persistence implementation and SQL are prepared. **No live Supabase project is connected or modified.** The repository had no configured environment values, and the accessible project list did not identify an approved KALKULATE project. No project was selected by guesswork. All database transport tests use mocks, not live Supabase. Applying and verifying the schema and live requests remains pending project approval/configuration.

The Phase 0 engine, arithmetic semantics, visual design, and keyboard controls are preserved. No accounts, login, signup, OAuth, route protection, or auth sessions were added.

## Architecture

`HistoryRepository` retains asynchronous `add` and `list`. It now exposes a small status value; `clear` is optional because shared data must not be deleted. `MemoryHistoryRepository` preserves the unconfigured behavior. `createHistoryRepository` selects a `ResilientHistoryRepository` around `SupabaseHistoryRepository` only when public configuration is valid.

`SupabaseHistoryRepository` uses the installed official client to insert only expression/result. Supabase generates UUIDs and timestamps. Reads select exactly the four record fields, order by `created_at DESC` and then `id DESC` to break timestamp ties deterministically, and request a server-side limit of ten. The existing domain record type remains unchanged. Returned data is shape/length checked and rendered using escaped React text.

`ResilientHistoryRepository` caches successful loads and locally records completed calculations before attempting remote writes. On an error it permanently switches that page instance to memory until reload. This keeps the last cached rows and recent local calculations visible, capped at ten, without retrying ambiguous writes. If an INSERT succeeds but the following SELECT fails, the result remains in local history. Local timestamps order newly completed fallback calculations by insertion; shared ordering comes from the database.

The workspace serializes loading and saving independently of the calculator state. The panel shows loading, empty, shared, local, and offline states. Only unconfigured memory history can be cleared. There is no remote DELETE method or control. Initial reads and post-save reads refresh shared history; other visitors' changes become visible on reload or the next successful calculation.

Requests abort after five seconds, with SDK automatic retries disabled so retry backoff cannot delay fallback. Reload starts a fresh connection attempt. No offline queue is persisted or uploaded. A timed-out INSERT can have committed server-side, so retrying it automatically would risk duplicates. This behavior is explained in the UI and README.

## SQL and RLS

`supabase/schema.sql` is a one-time transaction, deliberately failing if a `calculations` relation already exists. It does not drop/reuse another application's table and touches no unrelated tables.

- `id`: UUID primary key with `gen_random_uuid()` default.
- `expression`: non-null text, trimmed length 1–256.
- `result`: non-null text, trimmed length 1–64.
- `created_at`: non-null timestamptz with `now()` default.
- Descending `(created_at, id)` index.
- RLS enabled.
- Default table privileges revoked from PUBLIC, anon, and authenticated.
- `anon` receives SELECT and column-level INSERT on expression/result only.
- `calculations_anon_select`: SELECT to anon, USING (true).
- `calculations_anon_insert`: INSERT to anon, WITH CHECK (true).
- No UPDATE/DELETE policies or grants, SECURITY DEFINER functions, or auth dependencies.

All records are intentionally public. The ten-row application query is not an access-control boundary; anonymous clients can read the table and submit bounded text. Anonymous abuse/rate limiting and retention are not implemented in this phase. No secrets or personal data should be entered.

## Verification

Unit tests exercise the real Supabase SDK against a mocked fetch transport: exact insert payload, query ordering/limit, empty history, database errors, network errors, abort timeout, malformed rows, cache preservation, failed writes, failure after a successful write, and missing configuration. Config tests also reject known secret/privileged key formats. Existing engine tests are retained.

Browser tests run isolated local and mocked-configured servers; supplied environment overrides ensure they cannot accidentally write to a real project. Tests cover saved rows surviving a mocked reload, newest-first presentation, no delete button, loading during active calculator input, failure fallback, HTML-looking history rendered as text, and original keyboard/pointer, responsive, and accessibility checks.

Quality-gate results are recorded after execution below. SQL has been reviewed but **has not been executed or validated against a live Postgres/Supabase instance**; mocked tests do not prove deployed RLS behavior.

## Manual steps and production readiness

1. Identify the approved KALKULATE Supabase project by project name and project reference/URL. Alternatively explicitly approve creating a dedicated project in a named organization; none has been created here.
2. Inspect that project's existing `calculations` relation, if any. Apply `supabase/schema.sql` only when the target is approved and the name is available.
3. Configure the public URL and anon/publishable key in ignored `.env.local`. Never configure a service-role/secret key in frontend variables.
4. Restart the app. Insert a calculation using the anonymous client, reload, and verify the newest row/ten-row limit from another browser.
5. In the approved project verify RLS, grants and the two policies. Confirm public INSERT of expression/result succeeds and UPDATE, DELETE, and INSERT with supplied id/created_at are denied. Perform these checks transactionally or on designated verification rows; do not delete unrelated data.
6. Re-run unit tests, lint, TypeScript, production build, and browser tests. Record live verification separately from mocked tests.
7. Before a later deployment, supply the approved GitHub repository and Vercel project/team. Configure public environment values for the intended Vercel environments, build, and smoke-test the approved deployment. No push or deployment is authorized in this phase.

Only the approved project identity and public configuration are needed to finish live Phase 1 verification. Phase 2 scope and deployment destinations still require the user's direction; authentication is not a prerequisite.

## Final quality-gate results

- `npm test`: 41 tests passed across four files, including all Phase 0 engine tests.
- `npm run test:e2e`: seven browser tests passed (four original local tests, three mocked Supabase tests).
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; Next.js 16.3.6 statically generated the application.
- `git diff --check`: passed.
- `.env.local` is ignored; `.env.example` is the only tracked environment file and has empty values. No real credentials were added. Test endpoints use the reserved `.invalid` domain and explicitly fake keys.
- No live INSERT, SELECT, schema application, or RLS policy execution has been performed. Live verification remains pending an approved project.
