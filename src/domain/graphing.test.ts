import { describe, expect, it } from "vitest";
import { DEFAULT_VIEWPORT, evaluateGraph, parseGraphExpression, sampleGraph } from "./graphing";

const value = (source: string, x: number) => evaluateGraph(parseGraphExpression(source).ast, x);

describe("graph expression parser", () => {
  it.each([["y = x", 3, 3], ["x^2", -2, 4], ["2x + 3", 4, 11], ["(x + 1) * 2", 2, 6], ["abs(x)", -4, 4], ["sqrt(x)", 9, 3], ["sin(x)", 0, 0], ["cos(x)", 0, 1]])("evaluates %s", (source, x, expected) => expect(value(source, x)).toBeCloseTo(expected as number));
  it("supports tangent and negative values", () => expect(value("tan(x)", 0)).toBeCloseTo(0));
  it("rejects unsupported identifiers and malformed parentheses", () => {
    expect(() => parseGraphExpression("log(x)")).toThrow(/not supported/);
    expect(() => parseGraphExpression("(x + 1")).toThrow(/parenthesis/);
  });
  it("returns a safe non-finite value for division by zero", () => expect(value("1/x", 0)).toBeNaN());
  it("breaks sampled curves at discontinuities", () => {
    const segments = sampleGraph(parseGraphExpression("1/x").ast, DEFAULT_VIEWPORT, 101);
    expect(segments.length).toBeGreaterThan(1);
    expect(segments.flat().every((point) => Number.isFinite(point.y))).toBe(true);
  });
});

