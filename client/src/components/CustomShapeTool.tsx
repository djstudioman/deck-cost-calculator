/**
 * CustomShapeTool — orthogonal polygon drawing tool for irregular deck footprints.
 * Contractor-only feature on the Deck Size step.
 *
 * Design: dark grid background, amber accent for contractor path.
 * Features:
 *   - Click-to-place orthogonal vertices (snaps to grid)
 *   - Close shape when last point shares axis with first
 *   - Presets: Rectangle, L-Shape, T-Shape
 *   - Edge midpoint drag handles for resizing after closing
 *   - Shoelace formula for area, perimeter from vertex sum
 *   - Callbacks: onAreaChange(sqFt), onPerimeterChange(linearFt)
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Point {
  x: number; // feet
  y: number; // feet
}

interface CustomShapeToolProps {
  onAreaChange: (sqFt: number) => void;
  onPerimeterChange: (linearFt: number) => void;
  accentColor?: string; // tailwind text class e.g. "text-blue-400"
  accentBg?: string; // tailwind bg class e.g. "bg-blue-500"
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function shoelaceArea(pts: Point[]): number {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    sum += pts[i].x * pts[j].y;
    sum -= pts[j].x * pts[i].y;
  }
  return Math.abs(sum) / 2;
}

function perimeter(pts: Point[]): number {
  if (pts.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    total += Math.abs(pts[j].x - pts[i].x) + Math.abs(pts[j].y - pts[i].y);
  }
  return total;
}

function edgeMidpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function isHorizontalEdge(a: Point, b: Point): boolean {
  return a.y === b.y;
}

// ─── Preset shapes ────────────────────────────────────────────────────────────
const PRESETS: { id: string; label: string; icon: string; points: Point[] }[] = [
  {
    id: "rectangle",
    label: "Rectangle",
    icon: "▬",
    points: [
      { x: 2, y: 2 },
      { x: 18, y: 2 },
      { x: 18, y: 14 },
      { x: 2, y: 14 },
    ],
  },
  {
    id: "l-shape",
    label: "L-Shape",
    icon: "⌐",
    points: [
      { x: 2, y: 2 },
      { x: 12, y: 2 },
      { x: 12, y: 8 },
      { x: 18, y: 8 },
      { x: 18, y: 14 },
      { x: 2, y: 14 },
    ],
  },
  {
    id: "t-shape",
    label: "T-Shape",
    icon: "⊤",
    points: [
      { x: 2, y: 2 },
      { x: 18, y: 2 },
      { x: 18, y: 6 },
      { x: 13, y: 6 },
      { x: 13, y: 14 },
      { x: 7, y: 14 },
      { x: 7, y: 6 },
      { x: 2, y: 6 },
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_SIZE = 20; // feet
const CELL_SIZE_PX = 20; // pixels per foot
const SNAP_THRESHOLD = 1; // feet — snap radius for closing

export default function CustomShapeTool({
  onAreaChange,
  onPerimeterChange,
  accentColor = "text-blue-400",
  accentBg = "bg-blue-500",
}: CustomShapeToolProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [canClose, setCanClose] = useState(false);
  const [dragEdge, setDragEdge] = useState<number | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const svgWidth = GRID_SIZE * CELL_SIZE_PX;
  const svgHeight = GRID_SIZE * CELL_SIZE_PX;

  // ─── Compute area & perimeter ─────────────────────────────────────────────
  const area = useMemo(() => (isClosed ? shoelaceArea(points) : 0), [points, isClosed]);
  const perim = useMemo(() => (isClosed ? perimeter(points) : 0), [points, isClosed]);

  useEffect(() => {
    if (isClosed) {
      onAreaChange(Math.round(area));
      onPerimeterChange(Math.round(perim));
    }
  }, [area, perim, isClosed, onAreaChange, onPerimeterChange]);

  // ─── SVG coordinate helpers ───────────────────────────────────────────────
  const toSvg = useCallback((pt: Point) => ({
    x: pt.x * CELL_SIZE_PX,
    y: pt.y * CELL_SIZE_PX,
  }), []);

  // Core coordinate transform: client coords → grid coords
  // Used by drag handler (native DOM events where we only have clientX/clientY)
  const fromSvgRaw = useCallback((clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    // getBoundingClientRect gives us the SVG's position on screen,
    // accounting for all CSS transforms on ancestors (Framer Motion, etc.)
    const rect = svg.getBoundingClientRect();
    // The SVG viewBox is svgWidth x svgHeight but rendered at rect.width x rect.height.
    // preserveAspectRatio may add internal padding — compute actual content offset.
    const viewBoxAspect = svgWidth / svgHeight;
    const renderedAspect = rect.width / rect.height;
    let contentOffsetX = 0;
    let contentOffsetY = 0;
    let contentWidth = rect.width;
    let contentHeight = rect.height;
    if (renderedAspect > viewBoxAspect) {
      // Wider than viewBox → horizontal letterboxing (content centered)
      contentWidth = rect.height * viewBoxAspect;
      contentOffsetX = (rect.width - contentWidth) / 2;
    } else if (renderedAspect < viewBoxAspect) {
      // Taller than viewBox → vertical letterboxing
      contentHeight = rect.width / viewBoxAspect;
      contentOffsetY = (rect.height - contentHeight) / 2;
    }
    const localX = clientX - rect.left - contentOffsetX;
    const localY = clientY - rect.top - contentOffsetY;
    const scaleX = svgWidth / contentWidth;
    const scaleY = svgHeight / contentHeight;
    const rawX = (localX * scaleX) / CELL_SIZE_PX;
    const rawY = (localY * scaleY) / CELL_SIZE_PX;
    return { x: Math.round(rawX), y: Math.round(rawY) };
  }, [svgWidth, svgHeight]);

  // React event wrapper for SVG click/mousemove events
  const fromSvg = useCallback((e: React.MouseEvent<SVGSVGElement>): Point => {
    return fromSvgRaw(e.clientX, e.clientY);
  }, [fromSvgRaw]);

  // ─── Orthogonal snap ──────────────────────────────────────────────────────
  const snapOrthogonal = useCallback((raw: Point, prev: Point): Point => {
    const dx = Math.abs(raw.x - prev.x);
    const dy = Math.abs(raw.y - prev.y);
    // Force to the dominant axis
    if (dx >= dy) {
      return { x: raw.x, y: prev.y };
    } else {
      return { x: prev.x, y: raw.y };
    }
  }, []);

  // ─── Handle grid click ────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isClosed) return;
    const raw = fromSvg(e);

    if (points.length === 0) {
      setPoints([raw]);
      setActivePreset(null);
      return;
    }

    const prev = points[points.length - 1];
    const snapped = snapOrthogonal(raw, prev);

    // Check if we can close
    if (points.length >= 3) {
      const first = points[0];
      const distToFirst = Math.abs(snapped.x - first.x) + Math.abs(snapped.y - first.y);
      if (distToFirst <= SNAP_THRESHOLD) {
        // Close the shape — don't add the duplicate point
        setIsClosed(true);
        return;
      }
    }

    // Clamp to grid bounds
    const clamped = {
      x: Math.max(0, Math.min(GRID_SIZE, snapped.x)),
      y: Math.max(0, Math.min(GRID_SIZE, snapped.y)),
    };

    setPoints((prev) => [...prev, clamped]);
    setActivePreset(null);
  }, [isClosed, points, fromSvg, snapOrthogonal]);

  // ─── Handle mouse move (hover preview) ────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isClosed || points.length === 0) {
      setHoverPoint(null);
      setCanClose(false);
      return;
    }

    const raw = fromSvg(e);
    const prev = points[points.length - 1];
    const snapped = snapOrthogonal(raw, prev);

    setHoverPoint(snapped);

    if (points.length >= 3) {
      const first = points[0];
      const dist = Math.abs(snapped.x - first.x) + Math.abs(snapped.y - first.y);
      setCanClose(dist <= SNAP_THRESHOLD);
    } else {
      setCanClose(false);
    }
  }, [isClosed, points, fromSvg, snapOrthogonal]);

  // ─── Edge drag ────────────────────────────────────────────────────────────
  const handleEdgeDragStart = useCallback((edgeIndex: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragEdge(edgeIndex);
  }, []);

  useEffect(() => {
    if (dragEdge === null) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const raw = fromSvgRaw(clientX, clientY);

      setPoints((prev) => {
        const newPts = [...prev];
        const i = dragEdge;
        const j = (i + 1) % newPts.length;
        const a = newPts[i];
        const b = newPts[j];

        if (isHorizontalEdge(a, b)) {
          // Drag up/down — change y of both vertices
          const newY = Math.max(0, Math.min(GRID_SIZE, Math.round(raw.y)));
          newPts[i] = { ...a, y: newY };
          newPts[j] = { ...b, y: newY };
        } else {
          // Vertical edge — drag left/right
          const newX = Math.max(0, Math.min(GRID_SIZE, Math.round(raw.x)));
          newPts[i] = { ...a, x: newX };
          newPts[j] = { ...b, x: newX };
        }
        return newPts;
      });
    };

    const handleUp = () => setDragEdge(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragEdge, fromSvg]);

  // ─── Presets ──────────────────────────────────────────────────────────────
  const loadPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setPoints([...preset.points]);
    setIsClosed(true);
    setActivePreset(presetId);
    setHoverPoint(null);
    setCanClose(false);
  }, []);

  // ─── Reset ────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPoints([]);
    setIsClosed(false);
    setHoverPoint(null);
    setCanClose(false);
    setDragEdge(null);
    setActivePreset(null);
    onAreaChange(0);
    onPerimeterChange(0);
  }, [onAreaChange, onPerimeterChange]);

  // ─── Render ───────────────────────────────────────────────────────────────
  const pathD = useMemo(() => {
    if (points.length < 2) return "";
    const svgPts = points.map(toSvg);
    let d = `M ${svgPts[0].x} ${svgPts[0].y}`;
    for (let i = 1; i < svgPts.length; i++) {
      d += ` L ${svgPts[i].x} ${svgPts[i].y}`;
    }
    if (isClosed) d += " Z";
    return d;
  }, [points, isClosed, toSvg]);

  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => loadPreset(p.id)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all",
              activePreset === p.id
                ? `border-blue-500/50 bg-blue-500/10 ${accentColor}`
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
            )}
          >
            <span className="text-base mr-1">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Grid canvas */}
      <div className="relative rounded-lg border border-white/10 bg-slate-900/80 overflow-hidden">
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          style={{ maxHeight: "360px" }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHoverPoint(null); setCanClose(false); }}
        >
          {/* Grid dots */}
          {Array.from({ length: GRID_SIZE + 1 }, (_, i) =>
            Array.from({ length: GRID_SIZE + 1 }, (_, j) => (
              <circle
                key={`${i}-${j}`}
                cx={i * CELL_SIZE_PX}
                cy={j * CELL_SIZE_PX}
                r={1}
                className="fill-white/10"
              />
            ))
          )}

          {/* 5-ft major grid lines */}
          {Array.from({ length: Math.floor(GRID_SIZE / 5) + 1 }, (_, i) => (
            <g key={`major-${i}`}>
              <line
                x1={i * 5 * CELL_SIZE_PX} y1={0}
                x2={i * 5 * CELL_SIZE_PX} y2={svgHeight}
                className="stroke-white/[0.04]" strokeWidth={1}
              />
              <line
                x1={0} y1={i * 5 * CELL_SIZE_PX}
                x2={svgWidth} y2={i * 5 * CELL_SIZE_PX}
                className="stroke-white/[0.04]" strokeWidth={1}
              />
            </g>
          ))}

          {/* Scale labels */}
          {Array.from({ length: Math.floor(GRID_SIZE / 5) + 1 }, (_, i) => (
            <text
              key={`label-${i}`}
              x={i * 5 * CELL_SIZE_PX + 2}
              y={svgHeight - 4}
              className="fill-white/20 text-[8px]"
              style={{ fontSize: "8px" }}
            >
              {i * 5}'
            </text>
          ))}

          {/* Filled polygon */}
          {isClosed && points.length >= 3 && (
            <path d={pathD} className="fill-blue-500/15 stroke-none" />
          )}

          {/* Outline path */}
          {points.length >= 2 && (
            <path
              d={pathD}
              fill="none"
              className={cn(
                "stroke-2",
                isClosed ? "stroke-blue-400" : "stroke-blue-400/70"
              )}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Preview line from last point to hover */}
          {!isClosed && hoverPoint && points.length > 0 && (
            <line
              x1={toSvg(points[points.length - 1]).x}
              y1={toSvg(points[points.length - 1]).y}
              x2={toSvg(hoverPoint).x}
              y2={toSvg(hoverPoint).y}
              className="stroke-blue-400/40"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )}

          {/* Vertices */}
          {points.map((pt, i) => {
            const s = toSvg(pt);
            return (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={i === 0 && !isClosed ? 5 : 3.5}
                className={cn(
                  i === 0 && !isClosed
                    ? canClose ? "fill-emerald-400 stroke-emerald-300" : "fill-blue-400 stroke-blue-300"
                    : "fill-blue-400 stroke-blue-300"
                )}
                strokeWidth={1.5}
              />
            );
          })}

          {/* Close indicator */}
          {canClose && !isClosed && points.length >= 3 && (
            <circle
              cx={toSvg(points[0]).x}
              cy={toSvg(points[0]).y}
              r={10}
              className="fill-none stroke-emerald-400 animate-pulse"
              strokeWidth={2}
              strokeDasharray="3 2"
            />
          )}

          {/* Edge drag handles (only when closed) */}
          {isClosed && points.map((pt, i) => {
            const j = (i + 1) % points.length;
            const mid = edgeMidpoint(pt, points[j]);
            const s = toSvg(mid);
            const isHoriz = isHorizontalEdge(pt, points[j]);
            return (
              <g key={`handle-${i}`}>
                <rect
                  x={s.x - 6}
                  y={s.y - 6}
                  width={12}
                  height={12}
                  rx={2}
                  className={cn(
                    "fill-slate-800 stroke-blue-400 cursor-move transition-colors",
                    dragEdge === i ? "fill-blue-500/30" : "hover:fill-blue-500/20"
                  )}
                  strokeWidth={1.5}
                  style={{ cursor: isHoriz ? "ns-resize" : "ew-resize" }}
                  onMouseDown={(e) => handleEdgeDragStart(i, e)}
                  onTouchStart={(e) => handleEdgeDragStart(i, e as unknown as React.MouseEvent)}
                />
                {/* Direction arrows */}
                <text
                  x={s.x}
                  y={s.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-blue-300 pointer-events-none select-none"
                  style={{ fontSize: "8px" }}
                >
                  {isHoriz ? "↕" : "↔"}
                </text>
              </g>
            );
          })}

          {/* Edge length labels (when closed) */}
          {isClosed && points.map((pt, i) => {
            const j = (i + 1) % points.length;
            const mid = edgeMidpoint(pt, points[j]);
            const s = toSvg(mid);
            const len = Math.abs(points[j].x - pt.x) + Math.abs(points[j].y - pt.y);
            if (len < 2) return null;
            const isHoriz = isHorizontalEdge(pt, points[j]);
            return (
              <text
                key={`len-${i}`}
                x={s.x + (isHoriz ? 0 : 12)}
                y={s.y + (isHoriz ? -12 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-400 pointer-events-none"
                style={{ fontSize: "9px" }}
              >
                {len}'
              </text>
            );
          })}
        </svg>

        {/* Instructions overlay */}
        {!isClosed && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-500 text-xs">
              <div className="text-sm mb-1">Click to place corners</div>
              <div>All edges snap to horizontal/vertical</div>
              <div className="mt-1 text-[10px]">Or choose a preset above</div>
            </div>
          </div>
        )}

        {/* Drawing progress */}
        {!isClosed && points.length > 0 && points.length < 3 && (
          <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
            {points.length}/3 min. points — click to add more
          </div>
        )}

        {!isClosed && points.length >= 3 && (
          <div className="absolute bottom-2 left-2 text-[10px] text-emerald-400 bg-slate-900/80 px-2 py-1 rounded">
            Click near the start point to close the shape
          </div>
        )}
      </div>

      {/* Results bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {isClosed && (
            <>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Area</div>
                <div className={`font-mono font-bold text-sm ${accentColor}`}>{Math.round(area)} sq ft</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Perimeter</div>
                <div className="font-mono font-bold text-sm text-slate-300">{Math.round(perim)} LF</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Railing est.</div>
                <div className="font-mono font-bold text-sm text-slate-300">{Math.round(perim * 0.75)} LF</div>
              </div>
            </>
          )}
        </div>
        <button
          onClick={reset}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded border border-white/5 hover:border-red-400/30"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
