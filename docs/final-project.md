# KALKULATE feature-complete handoff

KALKULATE is a production-deployed calculator with Basic, Graph, and Trace modes. It is feature-frozen after Phase 4. The next planned activity is a separately reviewed code-quality audit/refactor; this document describes the stable baseline that audit must preserve.

## 1. Project overview

The application provides everyday arithmetic, shared anonymous calculation history backed by Supabase, and a local 2D function graphing workspace. The live application is [kalkulate-five.vercel.app](https://kalkulate-five.vercel.app), and the public source is [github.com/kelseymellor797-art/kalkulate](https://github.com/kelseymellor797-art/kalkulate).

## 2. Final feature set

- Basic calculator: arithmetic, decimals, chaining, percentage, sign toggle, clear, backspace, divide-by-zero recovery, and keyboard controls.
- Shared Basic history: newest ten Supabase records, loading/offline states, confirmation-based Clear History, and resilient local fallback.
- Graph mode: safe mathematical expressions, multiple curves, SVG Cartesian axes/grid/labels, zoom, reset, function visibility, removal, and independent clear.
- Trace mode: manual or graph-selected x-coordinate, vertical line, function-colored markers, formatted y-values, and explicit undefined values.

Graph and trace state are local session state. No graph coordinates or trace state are stored remotely.

## 3. Architecture

Next.js App Router renders the shell and client workspace. Pure calculation and graph math live in domain modules. React components own presentation and interaction state. History persistence is accessed only through the repository abstraction. Supabase is configured lazily and the application remains usable without environment values.

## 4. Directory and module responsibilities

- `src/app/`: route, metadata, icon, and global design system.
- `src/components/`: calculator, history, graph, function tape, and graph window UI.
- `src/domain/calculator.ts`: pure Basic calculator state transitions and keyboard mapping.
- `src/domain/graphing.ts`: recursive-descent parser, AST evaluator, bounded sampler, trace helpers, formatter, and viewport/pixel transforms.
- `src/repositories/history.ts`: repository contract, memory adapter, resilient fallback, and serialized workspace operations.
- `src/repositories/supabase-history.ts`: Supabase SELECT, INSERT, and confirmed DELETE operations.
- `src/lib/supabase.ts`: nullable public client factory and environment validation.
- `src/types/`: persisted calculation record types.
- `supabase/`: schema and the approved-project DELETE migration.
- `tests/e2e/` and colocated `*.test.ts`: browser and unit coverage.

## 5. Basic calculation architecture

Key presses and semantic button actions are mapped to pure state transitions. Completed calculations are sent to the history repository asynchronously so storage failures never block calculator input. Decimal arithmetic uses `decimal.js`; display values are bounded and safe for the layout.

## 6. Supabase history architecture

The approved `public.calculations` table stores `id`, `expression`, `result`, and database-generated `created_at`. The repository requests newest-first rows with a database-side limit of ten. It writes only expression and result. Missing configuration or request failure switches the current session to a local fallback with a subtle status message.

## 7. Graph parser/evaluator architecture

`graphing.ts` tokenizes and parses numbers, x, unary signs, arithmetic operators, implicit multiplication, parentheses, and the functions `sin`, `cos`, `tan`, `sqrt`, and `abs`. Evaluation operates on a typed AST. No `eval`, `Function`, code generation, or arbitrary JavaScript execution is used.

## 8. Graph sampling/rendering architecture

The graph samples a bounded number of x-values across the viewport. Non-finite values and large y-jumps split segments, preventing misleading vertical lines around discontinuities. `GraphWindow` renders those segments, axes, grid, labels, and controls in an SVG viewBox that scales responsively.

## 9. Trace architecture

Trace state consists of `traceEnabled` and `traceX` in the graph workspace. Parsed ASTs are reused for each trace update. `evaluateTrace` returns finite numeric values or a safe undefined representation. Coordinate helpers translate between graph coordinates and SVG pixels for both manual input and click/tap selection. Markers are rendered only when their finite y-value is inside the visible viewport; the tape remains the textual source of truth.

## 10. Security model

Only the public Supabase URL and publishable browser key are client-side. `.env.local` is ignored. No authentication, service-role key, privileged API route, arbitrary expression execution, or secrets are part of the application. History expressions are rendered as text.

## 11. RLS behavior

RLS is enabled on `public.calculations`. Anonymous SELECT and INSERT(expression, result) are allowed for the shared demo, and the approved Clear History migration adds DELETE. UPDATE remains denied. No graph feature changes the schema or permissions.

## 12. Accessibility

Semantic buttons, visible focus states, labels, keyboard navigation, accessible tab state, `aria-pressed` Trace state, announced validation/errors, graph descriptions, textual trace values, and reduced-motion handling are included. Point markers never carry information that is unavailable in text.

## 13. Responsive design

The Basic workspace stacks on small screens. Graph controls and function input wrap, the SVG scales to its container, and trace values remain readable. The automated accessibility/layout suite checks 320px, 390px, and 1440px widths for overflow and button usability.

## 14. Testing strategy

Vitest covers calculator semantics, parser/evaluator behavior, discontinuity sampling, trace evaluation, number formatting, coordinate transforms, repositories, and configuration. Playwright covers Basic interaction, history failure/success paths, graph functions, trace controls, responsive layout, and axe accessibility checks. Release gates are `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:e2e`.

## 15. Deployment architecture

GitHub `main` deploys to the Vercel `kalkulate` project. Production environment variables point to the approved Supabase project. The canonical production alias is `https://kalkulate-five.vercel.app`. The verified feature-complete source is tagged `pre-claude-refactor`.

## 16. Known limitations

Graph expressions and trace position are not persisted. Graph mode does not provide panning, drag-trace animation, point tables, symbolic algebra, derivatives, integrals, equation solving, regression, or 3D rendering. Shared anonymous history is public by design.

## 17. Deliberately deferred features

Authentication, private histories, graph sharing, graph persistence, scientific calculator extensions, AI, and unrelated dashboard features remain out of scope.

## 18. Maintenance notes

Do not weaken parser validation, RLS, public-key boundaries, fallback behavior, or the existing quality gates during refactoring. Preserve the repository abstraction and the separation between pure domain math, persistence, and UI. Review any behavior change against the `pre-claude-refactor` tag before merging.
