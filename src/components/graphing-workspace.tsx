"use client";
import { useMemo, useState } from "react";
import { DEFAULT_VIEWPORT, evaluateTrace, formatGraphNumber, parseGraphExpression, sampleGraph, type GraphAst, type GraphViewport } from "@/domain/graphing";
import { FunctionTape } from "./function-tape";
import { GraphWindow } from "./graph-window";

export type GraphEntry = { id: string; ast: GraphAst; normalized: string; visible: boolean; color: string };
const COLORS = ["#d1fa85", "#79d8ff", "#ff9f7a", "#c5a0ff", "#ffdb6e", "#74e0ad"];

export function GraphingWorkspace() {
  const [input, setInput] = useState("y = x^2");
  const [entries, setEntries] = useState<GraphEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<GraphViewport>(DEFAULT_VIEWPORT);
  const [traceEnabled, setTraceEnabled] = useState(false);
  const [traceX, setTraceX] = useState(0);
  const [traceInput, setTraceInput] = useState("0");
  const addFunction = () => { try { const parsed = parseGraphExpression(input); setEntries((current) => [...current, { ...parsed, id: crypto.randomUUID(), visible: true, color: COLORS[current.length % COLORS.length] }]); setError(null); } catch (caught) { setError(caught instanceof Error ? caught.message : "Enter a valid function."); } };
  const traceValues = useMemo(() => Object.fromEntries(entries.map((entry) => [entry.id, evaluateTrace(entry.ast, traceX).formatted])), [entries, traceX]);
  const curves = useMemo(() => entries.filter((entry) => entry.visible).map((entry) => ({ ...entry, label: entry.normalized, traceY: evaluateTrace(entry.ast, traceX).y, segments: sampleGraph(entry.ast, viewport) })), [entries, traceX, viewport]);
  const updateTrace = (raw: string) => { setTraceInput(raw); const value = Number(raw); if (raw.trim() && Number.isFinite(value) && Math.abs(value) <= 1e6) { setTraceX(value); setError(null); } else if (raw.trim()) setError("Enter a finite x-value between -1,000,000 and 1,000,000."); };
  const zoom = (factor: number) => setViewport((view) => { const xMid = (view.xMin + view.xMax) / 2; const yMid = (view.yMin + view.yMax) / 2; const xHalf = (view.xMax - view.xMin) * factor / 2; const yHalf = (view.yMax - view.yMin) * factor / 2; return { xMin: xMid - xHalf, xMax: xMid + xHalf, yMin: yMid - yHalf, yMax: yMid + yHalf }; });
  return <section className="graph-workspace" aria-label="Graph calculator"><div className="graph-input-panel"><div className="calculator-bar"><span><span className="mini-mark">∿</span> GRAPH MODE</span><span className="live-badge"><i /> LOCAL SESSION</span></div><label htmlFor="function-input">Function <span className="input-hint">use x, ^, sin(), cos(), tan(), sqrt(), abs()</span></label><div className="function-input-row"><input id="function-input" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addFunction(); } }} placeholder="y = x^2" aria-describedby="function-error" /><button className="key key-equals" onClick={addFunction}>Plot function</button></div><div className="trace-controls"><button className={`text-button ${traceEnabled ? "trace-active" : ""}`} aria-pressed={traceEnabled} onClick={() => setTraceEnabled((enabled) => !enabled)}>Trace</button><label htmlFor="trace-x">X =</label><input id="trace-x" inputMode="decimal" value={traceInput} onChange={(event) => updateTrace(event.target.value)} aria-describedby="trace-help" /><span id="trace-help" className="trace-help">{traceEnabled && (traceX < viewport.xMin || traceX > viewport.xMax ? "Outside visible x-range" : `x = ${formatGraphNumber(traceX)}`)}</span></div>{error && <p id="function-error" className="graph-error" role="alert">{error}</p>}</div><div className="graph-main"><GraphWindow viewport={viewport} curves={curves} onZoom={zoom} onReset={() => setViewport(DEFAULT_VIEWPORT)} traceEnabled={traceEnabled} traceX={traceX} onTraceX={(value) => { setTraceX(value); setTraceInput(formatGraphNumber(value)); }} /></div><FunctionTape entries={entries} traceEnabled={traceEnabled} traceX={traceX} traceValues={traceValues} onToggle={(id) => setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, visible: !entry.visible } : entry))} onRemove={(id) => setEntries((current) => current.filter((entry) => entry.id !== id))} onClear={() => setEntries([])} /></section>;
}
