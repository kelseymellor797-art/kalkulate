"use client";
import { useMemo, useState } from "react";
import {
  DEFAULT_VIEWPORT,
  evaluateTrace,
  formatGraphNumber,
  parseGraphExpression,
  sampleGraph,
  type GraphAst,
  type GraphSegment,
  type GraphViewport,
  type TraceValue,
} from "@/domain/graphing";
import { FunctionTape } from "./function-tape";
import { GraphWindow } from "./graph-window";

export type GraphEntry = {
  id: string;
  ast: GraphAst;
  normalized: string;
  visible: boolean;
  color: string;
};
const COLORS = [
  "#d1fa85",
  "#79d8ff",
  "#ff9f7a",
  "#c5a0ff",
  "#ffdb6e",
  "#74e0ad",
];

export function GraphingWorkspace() {
  const [input, setInput] = useState("y = x^2");
  const [entries, setEntries] = useState<GraphEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<GraphViewport>(DEFAULT_VIEWPORT);
  const [traceEnabled, setTraceEnabled] = useState(false);
  const [traceX, setTraceX] = useState(0);
  const [traceInput, setTraceInput] = useState("0");

  const addFunction = () => {
    try {
      const parsed = parseGraphExpression(input);
      setEntries((current) => [
        ...current,
        {
          ...parsed,
          id: crypto.randomUUID(),
          visible: true,
          color: COLORS[current.length % COLORS.length],
        },
      ]);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Enter a valid function.",
      );
    }
  };
  const updateTrace = (raw: string) => {
    setTraceInput(raw);
    const value = Number(raw);
    if (raw.trim() && Number.isFinite(value) && Math.abs(value) <= 1e6) {
      setTraceX(value);
      setError(null);
    } else if (raw.trim())
      setError("Enter a finite x-value between -1,000,000 and 1,000,000.");
  };
  const zoom = (factor: number) =>
    setViewport((view) => {
      const xMid = (view.xMin + view.xMax) / 2;
      const yMid = (view.yMin + view.yMax) / 2;
      const xHalf = ((view.xMax - view.xMin) * factor) / 2;
      const yHalf = ((view.yMax - view.yMin) * factor) / 2;
      return {
        xMin: xMid - xHalf,
        xMax: xMid + xHalf,
        yMin: yMid - yHalf,
        yMax: yMid + yHalf,
      };
    });

  // Each entry is evaluated at traceX exactly once here; every consumer
  // (the tape's readouts and the graph's point markers) reads the result
  // rather than calling evaluateTrace again.
  const traceResults = useMemo(
    () =>
      Object.fromEntries(
        entries.map((entry) => [entry.id, evaluateTrace(entry.ast, traceX)]),
      ) as Record<string, TraceValue>,
    [entries, traceX],
  );
  const traceValues = useMemo(
    () =>
      Object.fromEntries(
        entries.map((entry) => [entry.id, traceResults[entry.id].formatted]),
      ) as Record<string, string>,
    [entries, traceResults],
  );
  // Sampling depends only on the viewport, so moving the trace position
  // never triggers a resample of the curves.
  const segments = useMemo(
    () =>
      Object.fromEntries(
        entries.map((entry) => [entry.id, sampleGraph(entry.ast, viewport)]),
      ) as Record<string, GraphSegment[]>,
    [entries, viewport],
  );
  const curves = useMemo(
    () =>
      entries
        .filter((entry) => entry.visible)
        .map((entry) => ({
          ...entry,
          label: entry.normalized,
          traceY: traceResults[entry.id].y,
          segments: segments[entry.id],
        })),
    [entries, traceResults, segments],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setInput(event.target.value);
  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addFunction();
    }
  };
  const toggleTrace = () => setTraceEnabled((enabled) => !enabled);
  const handleTraceInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => updateTrace(event.target.value);
  const resetViewport = () => setViewport(DEFAULT_VIEWPORT);
  const selectTraceX = (value: number) => {
    setTraceX(value);
    setTraceInput(formatGraphNumber(value));
  };
  const toggleEntryVisibility = (id: string) =>
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, visible: !entry.visible } : entry,
      ),
    );
  const removeEntry = (id: string) =>
    setEntries((current) => current.filter((entry) => entry.id !== id));
  const clearEntries = () => setEntries([]);

  return (
    <section className="graph-workspace" aria-label="Graph calculator">
      <div className="graph-input-panel">
        <div className="calculator-bar">
          <span>
            <span className="mini-mark">∿</span> GRAPH MODE
          </span>
          <span className="live-badge">
            <i /> LOCAL SESSION
          </span>
        </div>
        <label htmlFor="function-input">
          Function{" "}
          <span className="input-hint">
            use x, ^, sin(), cos(), tan(), sqrt(), abs()
          </span>
        </label>
        <div className="function-input-row">
          <input
            id="function-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="y = x^2"
            aria-describedby="function-error"
          />
          <button className="key" onClick={addFunction}>
            Plot function
          </button>
        </div>
        <div className="trace-controls">
          <button
            className={`text-button ${traceEnabled ? "trace-active" : ""}`}
            aria-pressed={traceEnabled}
            onClick={toggleTrace}
          >
            Trace
          </button>
          <label htmlFor="trace-x">X =</label>
          <input
            id="trace-x"
            inputMode="decimal"
            value={traceInput}
            onChange={handleTraceInputChange}
            aria-describedby="trace-help"
          />
          <span id="trace-help" className="trace-help">
            {traceEnabled &&
              (traceX < viewport.xMin || traceX > viewport.xMax
                ? "Outside visible x-range"
                : `x = ${formatGraphNumber(traceX)}`)}
          </span>
        </div>
        {error && (
          <p id="function-error" className="graph-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="graph-main">
        <GraphWindow
          viewport={viewport}
          curves={curves}
          onZoom={zoom}
          onReset={resetViewport}
          traceEnabled={traceEnabled}
          traceX={traceX}
          onTraceX={selectTraceX}
        />
      </div>
      <FunctionTape
        entries={entries}
        traceEnabled={traceEnabled}
        traceX={traceX}
        traceValues={traceValues}
        onToggle={toggleEntryVisibility}
        onRemove={removeEntry}
        onClear={clearEntries}
      />
    </section>
  );
}
