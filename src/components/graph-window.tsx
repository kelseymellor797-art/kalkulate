import {
  graphToPixel,
  pixelToGraph,
  type GraphSegment,
  type GraphViewport,
} from "@/domain/graphing";

function niceStep(range: number) {
  const rough = range / 8;
  const power = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / power;
  return (normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1) * power;
}

export function GraphWindow({
  viewport,
  curves,
  onZoom,
  onReset,
  traceEnabled,
  traceX,
  onTraceX,
}: {
  viewport: GraphViewport;
  curves: {
    id: string;
    segments: GraphSegment[];
    color: string;
    label: string;
    traceY: number | null;
  }[];
  onZoom: (factor: number) => void;
  onReset: () => void;
  traceEnabled: boolean;
  traceX: number;
  onTraceX: (x: number) => void;
}) {
  const width = 760;
  const height = 480;
  const sx = (x: number) =>
    graphToPixel({ x, y: 0 }, viewport, width, height).x;
  const sy = (y: number) =>
    graphToPixel({ x: 0, y }, viewport, width, height).y;
  const xStep = niceStep(viewport.xMax - viewport.xMin);
  const yStep = niceStep(viewport.yMax - viewport.yMin);
  const xTicks: number[] = [];
  const yTicks: number[] = [];
  for (
    let x = Math.ceil(viewport.xMin / xStep) * xStep;
    x <= viewport.xMax;
    x += xStep
  )
    xTicks.push(Number(x.toFixed(8)));
  for (
    let y = Math.ceil(viewport.yMin / yStep) * yStep;
    y <= viewport.yMax;
    y += yStep
  )
    yTicks.push(Number(y.toFixed(8)));
  const description = curves.length
    ? `Cartesian graph showing ${curves.map((curve) => curve.label).join(", ")}. Viewport x ${viewport.xMin.toFixed(1)} to ${viewport.xMax.toFixed(1)}, y ${viewport.yMin.toFixed(1)} to ${viewport.yMax.toFixed(1)}.`
    : "Empty Cartesian graph. Add a function to plot it.";
  const traceVisible =
    traceEnabled && traceX >= viewport.xMin && traceX <= viewport.xMax;
  return (
    <div className="graph-window-wrap">
      <div className="graph-controls">
        <button className="text-button" onClick={() => onZoom(0.75)}>
          Zoom in
        </button>
        <button className="text-button" onClick={() => onZoom(1.333333)}>
          Zoom out
        </button>
        <button className="text-button" onClick={onReset}>
          Reset view
        </button>
      </div>
      <svg
        className="graph-window"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={description}
        preserveAspectRatio="none"
        onClick={(event) => {
          if (!traceEnabled) return;
          const rect = event.currentTarget.getBoundingClientRect();
          onTraceX(
            pixelToGraph(
              ((event.clientX - rect.left) / rect.width) * width,
              ((event.clientY - rect.top) / rect.height) * height,
              viewport,
              width,
              height,
            ).x,
          );
        }}
      >
        <rect width={width} height={height} fill="#111610" />
        {xTicks.map((x) => (
          <line
            key={`x-${x}`}
            x1={sx(x)}
            x2={sx(x)}
            y1={0}
            y2={height}
            className="graph-grid"
          />
        ))}
        {yTicks.map((y) => (
          <line
            key={`y-${y}`}
            x1={0}
            x2={width}
            y1={sy(y)}
            y2={sy(y)}
            className="graph-grid"
          />
        ))}
        {viewport.xMin <= 0 && viewport.xMax >= 0 && (
          <line
            x1={sx(0)}
            x2={sx(0)}
            y1={0}
            y2={height}
            className="graph-axis"
          />
        )}
        {viewport.yMin <= 0 && viewport.yMax >= 0 && (
          <line
            x1={0}
            x2={width}
            y1={sy(0)}
            y2={sy(0)}
            className="graph-axis"
          />
        )}
        {xTicks.map((x) => (
          <text
            key={`xl-${x}`}
            x={sx(x) + 4}
            y={Math.min(height - 5, Math.max(14, sy(0) + 16))}
            className="graph-label"
          >
            {x}
          </text>
        ))}
        {yTicks.map((y) => (
          <text
            key={`yl-${y}`}
            x={Math.min(width - 30, Math.max(4, sx(0) + 5))}
            y={sy(y) - 5}
            className="graph-label"
          >
            {y}
          </text>
        ))}
        {curves.map((curve) =>
          curve.segments.map((segment, index) => (
            <polyline
              key={`${curve.id}-${index}`}
              points={segment
                .map((point) => `${sx(point.x)},${sy(point.y)}`)
                .join(" ")}
              fill="none"
              stroke={curve.color}
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          )),
        )}
        {traceVisible && (
          <line
            data-testid="trace-line"
            x1={sx(traceX)}
            x2={sx(traceX)}
            y1={0}
            y2={height}
            className="trace-line"
          />
        )}
        {traceVisible &&
          curves.map((curve) => {
            const y = curve.traceY;
            return y !== null && y >= viewport.yMin && y <= viewport.yMax ? (
              <circle
                data-testid="trace-point"
                key={`point-${curve.id}`}
                cx={sx(traceX)}
                cy={sy(y)}
                r="5"
                fill={curve.color}
                className="trace-point"
              />
            ) : null;
          })}
      </svg>
    </div>
  );
}
