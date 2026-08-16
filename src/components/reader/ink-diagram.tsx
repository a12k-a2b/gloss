import type { DiagramLane, DiagramSpec } from "@/lib/types";
import { cn } from "@/lib/cn";

const LANE_H = 118;
const PAD_X = 18;
const PAD_Y = 28;
const NODE_W = 92;
const NODE_H = 44;

function nodePoint(lane: DiagramLane, index: number, width: number) {
  const n = Math.max(lane.nodes.length, 1);
  const usable = width - PAD_X * 2 - NODE_W;
  const x =
    n === 1 ? width / 2 - NODE_W / 2 : PAD_X + (usable * index) / (n - 1);
  return { x, y: PAD_Y };
}

function Cloud({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <path
      d={`M ${cx - w * 0.28} ${cy + h * 0.18}
          c ${-w * 0.22} 0 ${-w * 0.22} ${-h * 0.42} 0 ${-h * 0.42}
          c ${w * 0.06} ${-h * 0.32} ${w * 0.36} ${-h * 0.32} ${w * 0.42} ${-h * 0.04}
          c ${w * 0.22} ${-h * 0.08} ${w * 0.34} ${h * 0.18} ${w * 0.14} ${h * 0.32}
          c ${w * 0.16} ${h * 0.08} ${w * 0.08} ${h * 0.28} ${-w * 0.12} ${h * 0.22}
          z`}
      fill="var(--color-paper)"
      stroke="var(--color-ink)"
      strokeWidth="1.75"
    />
  );
}

function Actor({ x, y, w }: { x: number; y: number; w: number }) {
  const cx = x + w / 2;
  return (
    <g fill="none" stroke="var(--color-ink)" strokeWidth="1.75">
      <circle cx={cx} cy={y + 11} r="7" />
      <path d={`M ${cx} ${y + 18} v 10`} />
      <path d={`M ${cx - 10} ${y + 24} h 20`} />
      <path d={`M ${cx} ${y + 28} l -8 12`} />
      <path d={`M ${cx} ${y + 28} l 8 12`} />
    </g>
  );
}

function Lane({
  lane,
  width,
  yOffset,
  markerId,
}: {
  lane: DiagramLane;
  width: number;
  yOffset: number;
  markerId: string;
}) {
  const points = lane.nodes.map((_, i) => nodePoint(lane, i, width));
  const byId = new Map(lane.nodes.map((n, i) => [n.id, { node: n, i }]));

  return (
    <g transform={`translate(0 ${yOffset})`}>
      {lane.label ? (
        <text
          x={PAD_X}
          y={14}
          fill="var(--color-ink-faint)"
          fontFamily="var(--font-sans)"
          fontSize="10"
          letterSpacing="0.12em"
        >
          {lane.label.toUpperCase()}
        </text>
      ) : null}

      {lane.edges.map((edge, ei) => {
        const a = byId.get(edge.from);
        const b = byId.get(edge.to);
        if (!a || !b) return null;
        const p1 = points[a.i];
        const p2 = points[b.i];
        const y1 = p1.y + NODE_H / 2;
        const y2 = p2.y + NODE_H / 2;
        const x1 = p1.x + NODE_W;
        const x2 = p2.x;
        const mid = (x1 + x2) / 2;
        const same = a.i === b.i;
        const path = same
          ? `M ${p1.x + NODE_W / 2} ${p1.y} C ${p1.x + NODE_W / 2} ${p1.y - 22}, ${p2.x + NODE_W / 2} ${p2.y - 22}, ${p2.x + NODE_W / 2} ${p2.y}`
          : `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
        return (
          <g key={`${edge.from}-${edge.to}-${ei}`}>
            <path
              d={path}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="1.5"
              strokeDasharray={edge.dashed ? "5 4" : undefined}
              markerEnd={`url(#${markerId})`}
            />
            {edge.label ? (
              <text
                x={mid}
                y={Math.min(y1, y2) - 8}
                textAnchor="middle"
                fill="var(--color-ink-soft)"
                fontFamily="var(--font-sans)"
                fontSize="10"
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {lane.nodes.map((node, i) => {
        const { x, y } = points[i];
        const lines = node.label.split("\n");
        const kind = node.kind ?? "box";
        return (
          <g key={node.id}>
            {kind === "cloud" ? (
              <Cloud x={x} y={y} w={NODE_W} h={NODE_H} />
            ) : kind === "actor" ? (
              <Actor x={x} y={y} w={NODE_W} />
            ) : kind === "note" ? null : (
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx="5"
                fill="var(--color-paper)"
                stroke="var(--color-ink)"
                strokeWidth="1.75"
              />
            )}
            <text
              x={x + NODE_W / 2}
              y={
                kind === "actor"
                  ? y + NODE_H + 6
                  : y + NODE_H / 2 - (lines.length - 1) * 6
              }
              textAnchor="middle"
              fill="var(--color-ink)"
              fontFamily="var(--font-sans)"
              fontSize="11"
              fontWeight={500}
            >
              {lines.map((line, li) => (
                <tspan key={li} x={x + NODE_W / 2} dy={li === 0 ? 0 : 13}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function InkDiagram({
  spec,
  className,
}: {
  spec: DiagramSpec;
  className?: string;
}) {
  const width = 360;
  const height = spec.lanes.length * LANE_H + 8;
  const markerId = `arr-${spec.title.replace(/\s+/g, "").slice(0, 12)}`;

  return (
    <figure className={cn("my-1", className)}>
      <div className="hairline rounded-md bg-paper-sunken px-2 pt-3 pb-2">
        <p className="caps mb-2 px-2">{spec.title}</p>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label={spec.caption}
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-ink)" />
            </marker>
          </defs>
          {spec.lanes.map((lane, i) => (
            <Lane
              key={i}
              lane={lane}
              width={width}
              yOffset={i * LANE_H}
              markerId={markerId}
            />
          ))}
        </svg>
      </div>
      <figcaption className="mt-2 font-serif text-sm leading-snug text-ink-soft">
        {spec.caption}
      </figcaption>
    </figure>
  );
}
