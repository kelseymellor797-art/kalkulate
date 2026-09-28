"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initialState, keyboardAction, transition } from "@/domain/calculator";
import { createHistoryRepository } from "@/repositories/history";
import type { CalculationRecord } from "@/types/calculation";
import { CalculatorDisplay } from "./calculator-display";
import { Keypad } from "./keypad";
import { HistoryPanel } from "./history-panel";
import { GraphingWorkspace } from "./graphing-workspace";

export function CalculatorWorkspace() {
  const [state, setState] = useState(initialState);
  const current = useRef(initialState);
  const [repository] = useState(createHistoryRepository);
  const [records, setRecords] = useState<CalculationRecord[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyStatus, setHistoryStatus] = useState(repository.status);
  const [clearing, setClearing] = useState(false);
  const [mode, setMode] = useState<"basic" | "graph">("basic");
  const queue = useRef(Promise.resolve());
  const updateHistory = useCallback(
    (operation: () => Promise<void>) => {
      const task = queue.current
        .then(async () => {
          await operation();
          setRecords(await repository.list());
          setHistoryStatus(repository.status);
          setHistoryError(null);
        })
        .catch((error) => {
          setHistoryError(
            "History could not be updated. You can keep calculating.",
          );
          throw error;
        })
        .finally(() => setLoading(false));
      queue.current = task.catch(() => undefined);
      return task;
    },
    [repository],
  );
  useEffect(() => {
    void updateHistory(async () => {}).catch(() => undefined);
  }, [updateHistory]);
  const onAction = useCallback(
    (action: string) => {
      const next = transition(current.current, action);
      current.current = next;
      setState(next);
      const calculation = next.completed;
      if (calculation) void updateHistory(() => repository.add(calculation)).catch(() => undefined);
    },
    [repository, updateHistory],
  );
  const clearHistory = useCallback(async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await updateHistory(() => repository.clear());
    } finally {
      setClearing(false);
    }
  }, [clearing, repository, updateHistory]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      )
        return;
      // Preserve native Enter/Space activation when a button has keyboard focus.
      if (event.key === "Enter" && target.closest("button")) return;
      const action = keyboardAction(event.key);
      if (action) {
        event.preventDefault();
        onAction(action);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onAction]);
  return (
    <>
      <div className="mode-switcher" role="tablist" aria-label="Calculator mode">
        <button role="tab" aria-selected={mode === "basic"} className={mode === "basic" ? "mode-active" : ""} onClick={() => setMode("basic")}>Basic</button>
        <button role="tab" aria-selected={mode === "graph"} className={mode === "graph" ? "mode-active" : ""} onClick={() => setMode("graph")}>Graph</button>
      </div>
      {mode === "graph" ? <GraphingWorkspace /> : <div className="workspace">
        <section className="calculator" aria-label="Standard calculator">
          <div className="calculator-bar">
            <span>
              <span className="mini-mark">＋</span> STANDARD
            </span>
            <span className="live-badge">
              <i /> LIVE INPUT
            </span>
          </div>
          <CalculatorDisplay state={state} />
          <Keypad
            onAction={onAction}
            activeOperator={state.waiting ? state.operator : null}
          />
          <div className="calculator-bottom">
            <span>BUILT FOR THE EVERYDAY.</span>
            <span aria-hidden="true">[ K / 01 ]</span>
          </div>
        </section>
        <HistoryPanel
          records={records}
          error={historyError}
          loading={loading}
          status={historyStatus}
          clearing={clearing}
          onClear={clearHistory}
        />
      </div>}
      {mode === "basic" && <details className="keyboard-help">
        <summary>
          <span aria-hidden="true">⌨</span> Keyboard shortcuts <span>+</span>
        </summary>
        <p>
          Numbers and . to type · + − * / for operations · Enter or = to
          calculate · Escape to clear · Backspace or Delete to erase · % for
          percentage. When a button is focused, Enter activates that button.
        </p>
        <p>
          Operations run left to right. Percentage divides the current value by
          100. Up to 16 significant digits; supported range 10⁻¹⁰⁰ to 10¹⁰⁰.
        </p>
      </details>}
    </>
  );
}
