# Phase 4 — Graph trace mode

Phase 4 adds point inspection to Graph mode without changing Basic mode, Supabase history, or graph persistence.

## Behavior

Trace is off by default. Turning it on shows a thin vertical line, a selected `x` coordinate, and color-matched point markers for visible functions whose y-value is inside the viewport. The x input accepts decimal and negative values, rejects non-finite or out-of-range values, and reports when the selected coordinate is outside the visible x-range. Clicking or tapping the SVG graph selects the corresponding x coordinate; the page does not capture drag gestures or block mobile scrolling.

The function tape includes a compact trace readout for each function. Hidden functions are labeled hidden, and undefined values such as `1/x` at `x = 0` are displayed as `undefined` without rendering NaN or Infinity.

## Domain architecture

`src/domain/graphing.ts` now provides `evaluateTrace`, `formatGraphNumber`, `graphToPixel`, and `pixelToGraph`. These helpers reuse the existing parsed AST and evaluator. Trace values are calculated from the stored AST objects; expressions are not reparsed for each interaction. SVG coordinate conversion uses the fixed viewBox dimensions and the current viewport, so responsive rendering remains accurate.

## Accessibility and responsive behavior

The Trace control exposes an `aria-pressed` state. The x field has a visible label and numeric input mode. Trace readouts use `aria-live`, while the SVG has an accessible description of the visible curves and viewport. Values remain available as text rather than relying on point markers. Controls wrap on narrow layouts, and the existing 320px/390px/1440px checks continue to guard against horizontal overflow.

## Verification and limitations

Unit tests cover trace evaluation, multiple function values, hidden/undefined cases, number formatting, and both coordinate transforms. Playwright covers enabling Trace, manual x input, readouts for polynomial/trigonometric/undefined values, point markers, graph click selection, function visibility management, and returning to Basic mode. Production verification covers the same flow on the deployed URL.

Trace does not add panning, continuous dragging, point tables, symbolic math, derivatives, integrals, or persistence. Trace position remains local session state.

