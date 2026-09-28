# Phase 3 — Graphing calculator mode

Phase 3 adds a second, in-place **Graph** mode while preserving the existing Basic calculator, shared Supabase history, and Clear History behavior.

## Architecture

- `src/domain/graphing.ts` contains a small recursive-descent parser, typed AST, evaluator, viewport model, and curve sampler. It never uses `eval`, `Function`, or generated JavaScript.
- `src/components/graphing-workspace.tsx` owns session-only graph functions and validation state.
- `src/components/graph-window.tsx` renders a responsive SVG Cartesian plane with grid, axes, labels, curves, zoom, and reset controls.
- `src/components/function-tape.tsx` provides independent graph-function visibility, removal, and clear controls.

Graph state is intentionally local/session-only. The `calculations` table is not used for graph coordinates or expressions.

## Syntax and sampling

Expressions may begin with `y =`, or omit it. Supported operators are `+`, `-`, `*`, `/`, `^`, unary signs, parentheses, and implicit multiplication (`2x`). Supported functions are `sin`, `cos`, `tan`, `sqrt`, and `abs`. Invalid names, malformed parentheses, unsupported characters, and incomplete function calls produce announced validation messages.

The graph samples a bounded number of points across the current viewport. Non-finite values and large jumps are split into separate segments, so `1/x` does not draw a false vertical line through its asymptote. Sampling is recalculated when the viewport changes.

## Viewport and accessibility

The default viewport is approximately -10 to 10 on both axes. Zoom in, zoom out, and reset are keyboard-accessible buttons. The SVG includes an accessible description of visible functions and viewport. Function inputs, validation errors, visibility controls, and remove controls have accessible names. The layout reflows to one column on small screens and respects reduced-motion preferences.

## Verification

Graph parser tests cover linear, polynomial, decimal, negative, trigonometric, square-root, absolute-value, division, invalid syntax, and discontinuity sampling behavior. Playwright covers Basic/Graph switching, plotting multiple functions, hide/show, remove, clear, and returning to Basic mode. The existing calculator, history, accessibility, responsive, lint, typecheck, and production-build checks remain part of the release gates.

## Known limitations

Graph expressions are not persisted or shared, and the current phase does not include symbolic algebra, derivatives, integrals, equation solving, point inspection, panning, or 3D rendering. Tangent and other discontinuous functions are sampled numerically and may vary slightly with viewport scale.

