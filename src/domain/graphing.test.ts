import { describe, expect, it } from "vitest";
import { DEFAULT_VIEWPORT, evaluateGraph, evaluateTrace, formatGraphNumber, graphToPixel, parseGraphExpression, pixelToGraph, sampleGraph } from "./graphing";

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
  it("evaluates trace values and safely excludes undefined results", () => {
    expect(evaluateTrace(parseGraphExpression("x^2").ast, 2).formatted).toBe("4");
    expect(evaluateTrace(parseGraphExpression("2x + 3").ast, 2).formatted).toBe("7");
    expect(evaluateTrace(parseGraphExpression("sin(x)").ast, 2).formatted).toBe("0.9093");
    expect(evaluateTrace(parseGraphExpression("1/x").ast, 0).formatted).toBe("undefined");
    expect(evaluateTrace(parseGraphExpression("sqrt(x)").ast, -1).y).toBeNull();
  });
  it("formats useful trace numbers without floating point noise", () => {
    expect(formatGraphNumber(0.30000000000000004)).toBe("0.3");
    expect(formatGraphNumber(-7)).toBe("-7");
    expect(formatGraphNumber(Number.NaN)).toBe("undefined");
  });
  it("converts between graph and pixel coordinates", () => {
    const point = graphToPixel({ x: 0, y: 0 }, DEFAULT_VIEWPORT, 760, 480);
    expect(point).toEqual({ x: 380, y: 240 });
    expect(pixelToGraph(point.x, point.y, DEFAULT_VIEWPORT, 760, 480)).toEqual({ x: 0, y: 0 });
  });
});
