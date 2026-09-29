export type GraphFunctionName = "sin" | "cos" | "tan" | "sqrt" | "abs";

export type GraphAst =
  | { kind: "number"; value: number }
  | { kind: "x" }
  | { kind: "unary"; op: "+" | "-"; value: GraphAst }
  | {
      kind: "binary";
      op: "+" | "-" | "*" | "/" | "^";
      left: GraphAst;
      right: GraphAst;
    }
  | {
      kind: "function";
      name: GraphFunctionName;
      value: GraphAst;
    };

export type GraphPoint = { x: number; y: number };
export type GraphSegment = GraphPoint[];
export type GraphViewport = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};
export type TraceValue = { y: number | null; formatted: string };

// Supported function names and their implementations in one place; the
// parser checks membership here and the evaluator calls straight into it.
const FUNCTIONS: Record<GraphFunctionName, (value: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: (value) => (value < 0 ? Number.NaN : Math.sqrt(value)),
  abs: Math.abs,
};
type Token = {
  kind: "number" | "identifier" | "operator" | "paren";
  value: string;
};

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      const match = input
        .slice(index)
        .match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if (!match) throw new Error("Enter a valid number.");
      const value = Number(match[0]);
      if (!Number.isFinite(value))
        throw new Error("That number is outside the supported range.");
      tokens.push({ kind: "number", value: match[0] });
      index += match[0].length;
      continue;
    }
    if (/[a-zA-Z]/.test(char)) {
      const match = input.slice(index).match(/^[a-zA-Z]+/);
      if (!match) throw new Error("Enter a valid function.");
      tokens.push({ kind: "identifier", value: match[0].toLowerCase() });
      index += match[0].length;
      continue;
    }
    if ("+-*/^".includes(char)) {
      tokens.push({ kind: "operator", value: char });
      index += 1;
      continue;
    }
    if (char === "(" || char === ")") {
      tokens.push({ kind: "paren", value: char });
      index += 1;
      continue;
    }
    throw new Error(`Unsupported character “${char}”.`);
  }
  return tokens;
}

export function parseGraphExpression(source: string): {
  ast: GraphAst;
  normalized: string;
} {
  const input = source.trim().replace(/^y\s*=\s*/i, "");
  if (!input) throw new Error("Enter a function to graph.");
  const tokens = tokenize(input);
  let cursor = 0;
  const peek = () => tokens[cursor];
  const consume = () => tokens[cursor++];
  const startsPrimary = (token?: Token) =>
    token &&
    (token.kind === "number" ||
      token.kind === "identifier" ||
      (token.kind === "paren" && token.value === "("));
  const parseExpression = (): GraphAst => {
    let left = parseTerm();
    while (
      peek()?.kind === "operator" &&
      (peek()!.value === "+" || peek()!.value === "-")
    ) {
      const op = consume().value as "+" | "-";
      left = { kind: "binary", op, left, right: parseTerm() };
    }
    return left;
  };
  const parseTerm = (): GraphAst => {
    let left = parseUnary();
    while (true) {
      const token = peek();
      if (
        token?.kind === "operator" &&
        (token.value === "*" || token.value === "/")
      ) {
        const op = consume().value as "*" | "/";
        left = { kind: "binary", op, left, right: parseUnary() };
      } else if (startsPrimary(token)) {
        left = { kind: "binary", op: "*", left, right: parseUnary() };
      } else break;
    }
    return left;
  };
  const parseUnary = (): GraphAst => {
    if (
      peek()?.kind === "operator" &&
      (peek()!.value === "+" || peek()!.value === "-")
    ) {
      const op = consume().value as "+" | "-";
      return { kind: "unary", op, value: parseUnary() };
    }
    let left = parsePrimary();
    if (peek()?.kind === "operator" && peek()!.value === "^") {
      consume();
      left = { kind: "binary", op: "^", left, right: parseUnary() };
    }
    return left;
  };
  const parsePrimary = (): GraphAst => {
    const token = consume();
    if (!token) throw new Error("Complete the function expression.");
    if (token.kind === "number")
      return { kind: "number", value: Number(token.value) };
    if (token.kind === "identifier") {
      if (token.value === "x") return { kind: "x" };
      if (!(token.value in FUNCTIONS))
        throw new Error(
          `“${token.value}” is not supported. Use x, sin, cos, tan, sqrt, or abs.`,
        );
      if (peek()?.value === "(") consume();
      else
        throw new Error(
          `${token.value} needs parentheses, for example ${token.value}(x).`,
        );
      const value = parseExpression();
      if (consume()?.value !== ")")
        throw new Error("Close every opening parenthesis.");
      return {
        kind: "function",
        name: token.value as GraphFunctionName,
        value,
      };
    }
    if (token.value === "(") {
      const value = parseExpression();
      if (consume()?.value !== ")")
        throw new Error("Close every opening parenthesis.");
      return value;
    }
    throw new Error("That function is not valid.");
  };
  const ast = parseExpression();
  if (cursor < tokens.length)
    throw new Error(`Unexpected “${tokens[cursor].value}”.`);
  return { ast, normalized: `y = ${input.replace(/\s+/g, " ")}` };
}

export function evaluateGraph(ast: GraphAst, x: number): number {
  switch (ast.kind) {
    case "number":
      return ast.value;
    case "x":
      return x;
    case "unary":
      return ast.op === "-"
        ? -evaluateGraph(ast.value, x)
        : evaluateGraph(ast.value, x);
    case "binary": {
      const left = evaluateGraph(ast.left, x);
      const right = evaluateGraph(ast.right, x);
      if (ast.op === "+") return left + right;
      if (ast.op === "-") return left - right;
      if (ast.op === "*") return left * right;
      if (ast.op === "/") return right === 0 ? Number.NaN : left / right;
      return Math.pow(left, right);
    }
    case "function":
      return FUNCTIONS[ast.name](evaluateGraph(ast.value, x));
  }
}

export function formatGraphNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "undefined";
  if (Object.is(value, -0)) return "0";
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute < 0.0001 || absolute >= 1e8))
    return value.toExponential(4).replace(/\.?(\d*?)0+e/, "$1e");
  return Number(value.toFixed(4)).toString();
}

export function evaluateTrace(ast: GraphAst, x: number): TraceValue {
  const y = evaluateGraph(ast, x);
  return { y: Number.isFinite(y) ? y : null, formatted: formatGraphNumber(y) };
}

export function graphToPixel(
  value: GraphPoint,
  viewport: GraphViewport,
  width: number,
  height: number,
) {
  return {
    x: ((value.x - viewport.xMin) / (viewport.xMax - viewport.xMin)) * width,
    y:
      height -
      ((value.y - viewport.yMin) / (viewport.yMax - viewport.yMin)) * height,
  };
}

export function pixelToGraph(
  pixelX: number,
  pixelY: number,
  viewport: GraphViewport,
  width: number,
  height: number,
): GraphPoint {
  return {
    x: viewport.xMin + (pixelX / width) * (viewport.xMax - viewport.xMin),
    y: viewport.yMax - (pixelY / height) * (viewport.yMax - viewport.yMin),
  };
}

export function sampleGraph(
  ast: GraphAst,
  viewport: GraphViewport,
  samples = 720,
): GraphSegment[] {
  const segments: GraphSegment[] = [];
  let segment: GraphSegment = [];
  const count = Math.max(80, Math.min(1200, Math.floor(samples)));
  const step = (viewport.xMax - viewport.xMin) / (count - 1);
  const maxJump = (viewport.yMax - viewport.yMin) * 1.4;
  for (let index = 0; index < count; index += 1) {
    const x = viewport.xMin + step * index;
    const y = evaluateGraph(ast, x);
    const previous = segment[segment.length - 1];
    const valid = Number.isFinite(y) && Math.abs(y) < 1e8;
    if (!valid || (previous && Math.abs(y - previous.y) > maxJump)) {
      if (segment.length > 1) segments.push(segment);
      segment = [];
      continue;
    }
    segment.push({ x, y });
  }
  if (segment.length > 1) segments.push(segment);
  return segments;
}

export const DEFAULT_VIEWPORT: GraphViewport = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
};
