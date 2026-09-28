"use client";
import { useMemo, useState } from "react";
import { DEFAULT_VIEWPORT, parseGraphExpression, sampleGraph, type GraphAst, type GraphViewport } from "@/domain/graphing";
import { FunctionTape } from "./function-tape";
import { GraphWindow } from "./graph-window";

export type GraphEntry = { id: string; ast: GraphAst; normalized: string; visible: boolean; color: string };
const COLORS = ["#d1fa85", "#79d8ff", "#ff9f7a", "#c5a0ff", "#ffdb6e", "#74e0ad"];

export function GraphingWorkspace() {
  const [input, setInput] = useState("y = x^2");
  const [entries, setEntries] = useState<GraphEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<GraphViewport>(DEFAULT_VIEWPORT);
  const addFunction = () => { try { const parsed = parseGraphExpression(input); setEntries((current) => [...current, { ...parsed, id: crypto.randomUUID(), visible: true, color: COLORS[current.length % COLORS.length] }]); setError(null); } catch (caught) { setError(caught instanceof Error ? caught.message : "Enter a valid function."); } };
  const curves = useMemo(() => entries.filter((entry) => entry.visible).map((entry) => ({ ...entry, label: entry.normalized, segments: sampleGraph(entry.ast, viewport) })), [entries, viewport]);
  const zoom = (factor: number) => setViewport((view) => { const xMid = (view.xMin + view.xMax) / 2; const yMid = (view.yMin + view.yMax) / 2; const xHalf = (view.xMax - view.xMin) * factor / 2; const yHalf = (view.yMax - view.yMin) * factor / 2; return { xMin: xMid - xHalf, xMax: xMid + xHalf, yMin: yMid - yHalf, yMax: yMid + yHalf }; });
  return <section className="graph-workspace" aria-label="Graph calculator"><div className="graph-input-panel"><div className="calculator-bar"><span><span className="mini-mark">∿</span> GRAPH MODE</span><span className="live-badge"><i /> LOCAL SESSION</span></div><label htmlFor="function-input">Function <span className="input-hint">use x, ^, sin(), cos(), tan(), sqrt(), abs()</span></label><div className="function-input-row"><input id="function-input" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addFunction(); } }} placeholder="y = x^2" aria-describedby="function-error" /><button className="key key-equals" onClick={addFunction}>Plot function</button></div>{error && <p id="function-error" className="graph-error" role="alert">{error}</p>}</div><div className="graph-main"><GraphWindow viewport={viewport} curves={curves} onZoom={zoom} onReset={() => setViewport(DEFAULT_VIEWPORT)} /></div><FunctionTape entries={entries} onToggle={(id) => setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, visible: !entry.visible } : entry))} onRemove={(id) => setEntries((current) => current.filter((entry) => entry.id !== id))} onClear={() => setEntries([])} /></section>;
}
