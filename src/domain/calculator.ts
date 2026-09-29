import Decimal from "decimal.js";
import type { NewCalculation } from "@/types/calculation";

const NumberValue = Decimal.clone({
  precision: 24,
  rounding: Decimal.ROUND_HALF_UP,
});
export type Operator = "+" | "-" | "*" | "/";
export interface CalculatorState {
  input: string;
  left: string | null;
  operator: Operator | null;
  waiting: boolean;
  finished: boolean;
  expression: string;
  error: string | null;
  completed: NewCalculation | null;
}
export const initialState: CalculatorState = {
  input: "0",
  left: null,
  operator: null,
  waiting: false,
  finished: false,
  expression: "",
  error: null,
  completed: null,
};
const symbol = (op: Operator) =>
  ({ "+": "+", "-": "−", "*": "×", "/": "÷" })[op];
const format = (value: Decimal) => {
  if (
    !value.isFinite() ||
    value.abs().gt("1e100") ||
    (!value.isZero() && value.abs().lt("1e-100"))
  ) {
    throw new Error("Value outside supported range");
  }
  return value.toSignificantDigits(16).toString();
};
function calculate(left: string, right: string, op: Operator) {
  const a = new NumberValue(left),
    b = new NumberValue(right);
  if (op === "/" && b.isZero()) throw new Error("Cannot divide by zero");
  return format(
    op === "+"
      ? a.plus(b)
      : op === "-"
        ? a.minus(b)
        : op === "*"
          ? a.times(b)
          : a.div(b),
  );
}

/** Immediate execution, left to right. Percent always divides the current operand by 100. */
export function transition(
  previous: CalculatorState,
  action: string,
): CalculatorState {
  if (action === "clear") return { ...initialState };
  let s: CalculatorState = { ...previous, completed: null };
  if (s.error) {
    if (!/^[0-9.]$/.test(action) && action !== "backspace") return s;
    s = { ...initialState };
  }
  try {
    if (/^[0-9.]$/.test(action)) {
      const fresh = s.waiting || s.finished;
      let input = fresh ? "0" : s.input;
      if (action === ".") {
        if (input.includes(".") || input.includes("e")) return s;
        input += ".";
      } else {
        if (input.replace(/[^0-9]/g, "").length >= 16 && input !== "0")
          return s;
        input =
          input === "0"
            ? action
            : input === "-0"
              ? "-" + action
              : input + action;
      }
      return {
        ...s,
        input,
        waiting: false,
        finished: false,
        expression: s.finished ? "" : s.expression,
      };
    }
    if (action === "backspace") {
      if (s.waiting || s.finished) return s;
      const input = s.input.includes("e") ? "0" : s.input.slice(0, -1);
      return { ...s, input: input && input !== "-" ? input : "0" };
    }
    if (action === "sign" || action === "%") {
      if (s.waiting) return s;
      const input =
        action === "%"
          ? format(new NumberValue(s.input).div(100))
          : s.input.startsWith("-")
            ? s.input.slice(1)
            : "-" + s.input;
      return {
        ...s,
        input,
        expression: s.finished ? "" : s.expression,
        finished: false,
      };
    }
    if (["+", "-", "*", "/"].includes(action)) {
      const op = action as Operator;
      const input =
        s.operator && s.left !== null && !s.waiting
          ? calculate(s.left, s.input, s.operator)
          : s.input;
      return {
        ...s,
        input,
        left: input,
        operator: op,
        waiting: true,
        finished: false,
        expression: `${input} ${symbol(op)}`,
      };
    }
    if (action === "=" && s.operator && s.left !== null && !s.waiting) {
      const result = calculate(s.left, s.input, s.operator);
      const expression = `${s.left} ${symbol(s.operator)} ${s.input}`;
      return {
        ...initialState,
        input: result,
        expression: `${expression} =`,
        finished: true,
        completed: { expression, result },
      };
    }
    return s;
  } catch (error) {
    return {
      ...initialState,
      error: error instanceof Error ? error.message : "Unable to calculate",
    };
  }
}

export function keyboardAction(key: string): string | null {
  if (/^[0-9.+\-*/%=]$/.test(key)) return key;
  return (
    (
      {
        Enter: "=",
        Escape: "clear",
        Backspace: "backspace",
        Delete: "backspace",
      } as Record<string, string>
    )[key] ?? null
  );
}
