import type { CalculatorState } from "@/domain/calculator";

export function CalculatorDisplay({ state }: { state: CalculatorState }) {
  return (
    <div className="display">
      <div className="display-heading">
        <span>
          <i />{" "}
          {state.error
            ? "CHECK INPUT"
            : state.finished
              ? "RESULT"
              : "READY TO CALCULATE"}
        </span>
        <span>DEC / 01</span>
      </div>
      <div className="expression" title={state.expression}>
        {state.expression || "Let’s work it out."}
      </div>
      <output
        aria-label="Calculator display"
        aria-live="polite"
        aria-atomic="true"
        className={
          state.error
            ? "value error"
            : `value ${state.input.length > 10 ? "compact" : ""}`
        }
      >
        {state.error || state.input}
      </output>
      <div className="display-foot">
        <span>
          {state.error
            ? "Press AC or type a number to continue"
            : "Precision in every possibility."}
        </span>
        <span aria-hidden="true">↵</span>
      </div>
    </div>
  );
}
