import { describe, expect, it } from "vitest";
import { initialState, keyboardAction, transition } from "./calculator";
const run = (...actions: string[]) => actions.reduce(transition, initialState);
const sequence = (text: string) => run(...text);
describe("calculator engine", () => {
  it.each([
    ["12+3=", "15"],
    ["9-12=", "-3"],
    ["7*8=", "56"],
    ["8/2=", "4"],
    ["0.1+0.2=", "0.3"],
    ["9/4=", "2.25"],
    ["2+3*4=", "20"],
    ["5++*2=", "10"],
    ["1..5+2=", "3.5"],
    ["50%", "0.5"],
  ])("%s → %s", (input, expected) =>
    expect(sequence(input).input).toBe(expected),
  );
  it("handles signed operands", () =>
    expect(run("5", "sign", "*", "2", "=").input).toBe("-10"));
  it("supports typing a negative fraction", () =>
    expect(run("sign", ".", "5").input).toBe("-0.5"));
  it("handles division by zero and recovers on digit", () => {
    const error = sequence("7/0=");
    expect(error.error).toBe("Cannot divide by zero");
    expect(transition(error, "3").input).toBe("3");
    expect(transition(error, "+").error).toBeTruthy();
  });
  it("clears all calculator state", () =>
    expect(run("9", "+", "clear")).toEqual(initialState));
  it("deletes safely", () =>
    expect(run("1", "2", "backspace", "backspace", "backspace").input).toBe(
      "0",
    ));
  it("ignores incomplete equals", () =>
    expect(sequence("2+=").completed).toBeNull());
  it("does not duplicate history on repeated equals", () =>
    expect(sequence("2+3==").completed).toBeNull());
  it("starts fresh after a result", () =>
    expect(sequence("2+3=7").input).toBe("7"));
  it("continues from a result", () =>
    expect(sequence("2+3=*2=").input).toBe("10"));
  it("limits manual input to 16 digits", () =>
    expect(sequence("12345678901234567890").input).toBe("1234567890123456"));
  it("rejects unknown input", () =>
    expect(run("NaN", "Infinity", "hello")).toEqual(initialState));
  it("caps extreme results gracefully", () => {
    const s = {
      ...initialState,
      input: "1e100",
      left: "1e100",
      operator: "*" as const,
    };
    expect(transition(s, "=").error).toBe("Value outside supported range");
  });
  it("handles very small values in scientific notation", () =>
    expect(sequence("0.000000001/9=").input).toBe("1.111111111111111e-10"));
  it("records successful expressions", () =>
    expect(sequence("4*5=").completed).toEqual({
      expression: "4 × 5",
      result: "20",
    }));
  it("maps all required keys", () => {
    for (const key of "0123456789.+-*/%=")
      expect(keyboardAction(key)).toBe(key);
    expect(keyboardAction("Enter")).toBe("=");
    expect(keyboardAction("Escape")).toBe("clear");
    expect(keyboardAction("Backspace")).toBe("backspace");
    expect(keyboardAction("a")).toBeNull();
  });
});
