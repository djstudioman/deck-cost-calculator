/**
 * ShapeBuilder.tsx — orthogonal polygon drawing tool for irregular deck footprints.
 * Contractor-only feature on the Deck Size step.
 *
 * Architecture:
 *   Lines 1–82:   Setup & math (grid constants, geometry helpers, presets)
 *   Lines 84–119: Component state
 *   Lines 142–182: Global drag listeners (window-level mouse/touch)
 *   Lines 184–261: Event handlers
 *   Lines 286–372: Derived render data
 *   Lines 374–662: JSX
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ShapePt {
  x: number; // feet
  y: number; // feet
}

interface ShapeBuilderProps {
  onShapeChange: (area: number, perimeter: number) => void;
  initialVertices?: ShapePt[];
  accentColor?: string;
  accentBg?: string;
}

// ─── Grid constants ──────────────────────────────────────────────────────────
const GRID_W = 44; // feet wide
const GRID_H = 36; // feet tall
const CELL = 2;    // feet per cell
const COLS = GRID_W / CELL; // 22 columns
const ROWS = GRID_H / CELL; // 18 rows
const CLOSE_RADIUS = 2; // feet — snap radius for closing

// SVG viewBox dimensions (1px per foot for clean math)
const VB_W = GRID_W;
const VB_H = GRID_H;

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function shoelaceArea(pts: ShapePt[]): number {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    sum += pts[i].x * pts[j].y;
    sum -= pts[j].x * pts[i].y;
  }
  return Math.abs(sum) / 2;
}

function polyPerimeter(pts: ShapePt[]): number {
  if (pts.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    total += Math.abs(pts[j].x - pts[i].x) + Math.abs(pts[j].y - pts[i].y);
  }
  return total;
}

/** Convert browser clientX/Y to SVG viewBox coordinates */
function getSVGCoords(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
  // The SVG is rendered at rect.width × rect.height but viewBox is VB_W × VB_H.
  // preserveAspectRatio (default xMidYMid meet) may letterbox.
  const viewBoxAspect = VB_W / VB_H;
  const renderedAspect = rect.width / rect.height;
  let contentW = rect.width;
  let contentH = rect.height;
  let offsetX = 0;
  let offsetY = 0;
  if (renderedAspect > viewBoxAspect) {
    contentW = rect.height * viewBoxAspect;
    offsetX = (rect.width - contentW) / 2;
  } else if (renderedAspect < viewBoxAspect) {
    contentH = rect.width / viewBoxAspect;
    offsetY = (rect.height - contentH) / 2;
  }
  const localX = clientX - rect.left - offsetX;
  const localY = clientY - rect.top - offsetY;
  return {
    x: (localX / contentW) * VB_W,
    y: (localY / contentH) * VB_H,
  };
}

/** Snap to nearest grid point (multiples of CELL) */
function snapToGrid(x: number, y: number): ShapePt {
  return {
    x: Math.round(x / CELL) * CELL,
    y: Math.round(y / CELL) * CELL,
  };
}

/** Force orthogonal: new point shares either X or Y with previous */
function orthoSnap(raw: ShapePt, prev: ShapePt): ShapePt {
  const dx = Math.abs(raw.x - prev.x);
  const dy = Math.abs(raw.y - prev.y);
  if (dx >= dy) {
    return { x: raw.x, y: prev.y };
  } else {
    return { x: prev.x, y: raw.y };
  }
}

// ─── Shape presets ───────────────────────────────────────────────────────────
const PRESETS: { id: string; label: string; icon: string; vertices: ShapePt[] }[] = [
  {
    id: "rectangle",
    label: "Rectangle",
    icon: "▬",
    vertices: [
      { x: 6, y: 6 }, { x: 38, y: 6 }, { x: 38, y: 26 }, { x: 6, y: 26 },
    ],
  },
  {
    id: "l-shape",
    label: "L-Shape",
    icon: "⌐",
    vertices: [
      { x: 4, y: 4 }, { x: 24, y: 4 }, { x: 24, y: 16 },
      { x: 38, y: 16 }, { x: 38, y: 30 }, { x: 4, y: 30 },
    ],
  },
  {
    id: "t-shape",
    label: "T-Shape",
    icon: "⊤",
    vertices: [
      { x: 4, y: 4 }, { x: 40, y: 4 }, { x: 40, y: 14 },
      { x: 28, y: 14 }, { x: 28, y: 30 }, { x: 16, y: 30 },
      { x: 16, y: 14 }, { x: 4, y: 14 },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function ShapeBuilder({
  onShapeChange,
  initialVertices,
  accentColor = "text-amber-400",
  accentBg = "bg-amber-500",
}: ShapeBuilderProps) {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [vertices, setVertices] = useState<ShapePt[]>(initialVertices ?? []);
  const [closed, setClosed] = useState(initialVertices ? initialVertices.length >= 3 : false);
  const [candidate, setCandidate] = useState<ShapePt | null>(null);
  const [dragging, setDragging] = useState<
    | { type: "edge"; edge: number; axis: "x" | "y" }
    | { type: "vertex"; index: number }
    | null
  >(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync restored vertices from saved estimates
  useEffect(() => {
    if (initialVertices && initialVertices.length >= 3) {
      setVertices(initialVertices);
      setClosed(true);
    }
  }, [initialVertices]);

  // Fire onShapeChange when closed shape updates
  useEffect(() => {
    if (closed && vertices.length >= 3) {
      const area = shoelaceArea(vertices);
      const perim = polyPerimeter(vertices);
      onShapeChange(Math.round(area), Math.round(perim));
    }
  }, [vertices, closed, onShapeChange]);

  // ─── Global drag listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!svgRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const raw = getSVGCoords(svgRef.current, clientX, clientY);
      const snapped = snapToGrid(raw.x, raw.y);

      if (dragging.type === "vertex") {
        // Move the single vertex freely (clamped to grid bounds)
        const newX = Math.max(0, Math.min(GRID_W, snapped.x));
        const newY = Math.max(0, Math.min(GRID_H, snapped.y));
        setVertices((prev) => {
          const pts = [...prev];
          pts[dragging.index] = { x: newX, y: newY };
          return pts;
        });
      } else {
        // Edge drag — translate both endpoints by the same delta, snapped
        setVertices((prev) => {
          const pts = [...prev];
          const i = dragging.edge;
          const j = (i + 1) % pts.length;
          const newX = Math.max(0, Math.min(GRID_W, snapped.x));
          const newY = Math.max(0, Math.min(GRID_H, snapped.y));
          // Move the midpoint to the new snapped position, preserving edge shape
          const oldMidX = (pts[i].x + pts[j].x) / 2;
          const oldMidY = (pts[i].y + pts[j].y) / 2;
          const dxSnap = Math.round((newX - oldMidX) / CELL) * CELL;
          const dySnap = Math.round((newY - oldMidY) / CELL) * CELL;
          pts[i] = {
            x: Math.max(0, Math.min(GRID_W, pts[i].x + dxSnap)),
            y: Math.max(0, Math.min(GRID_H, pts[i].y + dySnap)),
          };
          pts[j] = {
            x: Math.max(0, Math.min(GRID_W, pts[j].x + dxSnap)),
            y: Math.max(0, Math.min(GRID_H, pts[j].y + dySnap)),
          };
          return pts;
        });
      }
    };

    const handleUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragging]);

  // ─── Event handlers ─────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (closed || !svgRef.current) {
      setCandidate(null);
      return;
    }
    const raw = getSVGCoords(svgRef.current, e.clientX, e.clientY);
    const snapped = snapToGrid(raw.x, raw.y);
    setCandidate(snapped);
  }, [closed]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (closed || !svgRef.current) return;
    const touch = e.touches[0];
    const raw = getSVGCoords(svgRef.current, touch.clientX, touch.clientY);
    const snapped = snapToGrid(raw.x, raw.y);
    setCandidate(snapped);
  }, [closed]);

  const tryAddVertex = useCallback((clientX: number, clientY: number) => {
    if (closed || !svgRef.current) return;
    const raw = getSVGCoords(svgRef.current, clientX, clientY);
    const snapped = snapToGrid(raw.x, raw.y);

    if (vertices.length === 0) {
      setVertices([snapped]);
      setActivePreset(null);
      return;
    }

    // Clamp to grid bounds
    const clamped: ShapePt = {
      x: Math.max(0, Math.min(GRID_W, snapped.x)),
      y: Math.max(0, Math.min(GRID_H, snapped.y)),
    };

    // Check close gesture
    if (vertices.length >= 3) {
      const first = vertices[0];
      const dx = clamped.x - first.x;
      const dy = clamped.y - first.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= CLOSE_RADIUS) {
        setClosed(true);
        setCandidate(null);
        setActivePreset(null);
        return;
      }
    }

    setVertices((prev) => [...prev, clamped]);
    setActivePreset(null);
  }, [closed, vertices]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (closed) return;
    tryAddVertex(e.clientX, e.clientY);
  }, [closed, tryAddVertex]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (closed) return;
    const touch = e.changedTouches[0];
    tryAddVertex(touch.clientX, touch.clientY);
  }, [closed, tryAddVertex]);

  const startEdgeDrag = useCallback((edgeIndex: number, axis: "x" | "y", e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging({ type: "edge", edge: edgeIndex, axis });
  }, []);

  const startVertexDrag = useCallback((index: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!closed) return;
    e.stopPropagation();
    e.preventDefault();
    setDragging({ type: "vertex", index });
  }, [closed]);

  const deleteVertex = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setVertices((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length < 3) {
        // Too few points to stay closed — re-open for editing
        setClosed(false);
        onShapeChange(0, 0);
      }
      return next;
    });
  }, [onShapeChange]);

  // ─── Presets & reset ────────────────────────────────────────────────────────
  const loadPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setVertices([...preset.vertices]);
    setClosed(true);
    setActivePreset(presetId);
    setCandidate(null);
  }, []);

  const reset = useCallback(() => {
    setVertices([]);
    setClosed(false);
    setCandidate(null);
    setDragging(null);
    setActivePreset(null);
    onShapeChange(0, 0);
  }, [onShapeChange]);

  // ─── Derived render data ────────────────────────────────────────────────────
  const area = useMemo(() => (closed ? shoelaceArea(vertices) : 0), [vertices, closed]);
  const perim = useMemo(() => (closed ? polyPerimeter(vertices) : 0), [vertices, closed]);

  // Polygon points string for SVG
  const polygonPoints = useMemo(() => {
    if (vertices.length < 2) return "";
    return vertices.map((v) => `${v.x},${v.y}`).join(" ");
  }, [vertices]);

  // Edge midpoints and dimension labels
  const edges = useMemo(() => {
    if (!closed || vertices.length < 3) return [];
    const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
    const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;
    const LABEL_OFFSET = 2.2; // feet away from edge
    const MARGIN = 1.5;       // min feet from grid boundary before flipping inward
    return vertices.map((v, i) => {
      const j = (i + 1) % vertices.length;
      const next = vertices[j];
      const midX = (v.x + next.x) / 2;
      const midY = (v.y + next.y) / 2;
      const isHoriz = v.y === next.y;
      // True Euclidean length for diagonal edges
      const dx = next.x - v.x;
      const dy = next.y - v.y;
      const len = Math.round(Math.sqrt(dx * dx + dy * dy));

      // Edge normal pointing away from centroid (outward)
      // Perpendicular to edge direction, normalised
      const edgeLen = Math.sqrt(dx * dx + dy * dy) || 1;
      let nx = -dy / edgeLen; // left-hand normal
      let ny = dx / edgeLen;
      // Flip if it points toward centroid instead of away
      const toCx = cx - midX;
      const toCy = cy - midY;
      if (nx * toCx + ny * toCy > 0) { nx = -nx; ny = -ny; }

      let labelX = midX + nx * LABEL_OFFSET;
      let labelY = midY + ny * LABEL_OFFSET;
      // Clamp to grid boundary
      if (labelX < MARGIN) labelX = midX + Math.abs(nx) * LABEL_OFFSET;
      if (labelX > VB_W - MARGIN) labelX = midX - Math.abs(nx) * LABEL_OFFSET;
      if (labelY < MARGIN) labelY = midY + Math.abs(ny) * LABEL_OFFSET;
      if (labelY > VB_H - MARGIN) labelY = midY - Math.abs(ny) * LABEL_OFFSET;

      return { midX, midY, isHoriz, len, i, labelX, labelY };
    });
  }, [vertices, closed]);

  // Centroid for area badge
  const centroid = useMemo(() => {
    if (vertices.length < 3) return { x: VB_W / 2, y: VB_H / 2 };
    const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
    const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;
    return { x: cx, y: cy };
  }, [vertices]);

  // Can-close detection for visual hint
  const canClose = useMemo(() => {
    if (closed || vertices.length < 3 || !candidate) return false;
    const first = vertices[0];
    const dx = candidate.x - first.x;
    const dy = candidate.y - first.y;
    return Math.sqrt(dx * dx + dy * dy) <= CLOSE_RADIUS;
  }, [closed, vertices, candidate]);

  // ─── JSX ────────────────────────────────────────────────────────────────────
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
                ? `border-amber-500/50 bg-amber-500/10 ${accentColor}`
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
            )}
          >
            <span className="text-base mr-1">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* SVG Canvas */}
      <div className="relative rounded-lg border border-white/10 bg-slate-900/80 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full h-auto cursor-crosshair select-none"
          style={{ maxHeight: "400px" }}
          preserveAspectRatio="xMidYMid meet"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseLeave={() => setCandidate(null)}
        >
          {/* Grid lines */}
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * CELL} y1={0} x2={i * CELL} y2={VB_H}
              className={i % 5 === 0 ? "stroke-white/[0.08]" : "stroke-white/[0.03]"}
              strokeWidth={i % 5 === 0 ? 0.3 : 0.15}
            />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0} y1={i * CELL} x2={VB_W} y2={i * CELL}
              className={i % 5 === 0 ? "stroke-white/[0.08]" : "stroke-white/[0.03]"}
              strokeWidth={i % 5 === 0 ? 0.3 : 0.15}
            />
          ))}

          {/* Ruler labels — bottom edge */}
          {Array.from({ length: Math.floor(GRID_W / 10) + 1 }, (_, i) => (
            <text
              key={`rx${i}`}
              x={i * 10}
              y={VB_H - 0.5}
              className="fill-white/25"
              style={{ fontSize: "1.8px", fontFamily: "monospace" }}
            >
              {i * 10}'
            </text>
          ))}
          {/* Ruler labels — left edge */}
          {Array.from({ length: Math.floor(GRID_H / 10) + 1 }, (_, i) => (
            <text
              key={`ry${i}`}
              x={0.5}
              y={i * 10 + 1.5}
              className="fill-white/25"
              style={{ fontSize: "1.8px", fontFamily: "monospace" }}
            >
              {i * 10}'
            </text>
          ))}

          {/* Filled polygon */}
          {closed && vertices.length >= 3 && (
            <polygon
              points={polygonPoints}
              className="fill-amber-500/15 stroke-none"
            />
          )}

          {/* Drawing polyline (while building) */}
          {!closed && vertices.length >= 2 && (
            <polyline
              points={polygonPoints}
              fill="none"
              className="stroke-amber-400/70"
              strokeWidth={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Closed outline */}
          {closed && vertices.length >= 3 && (
            <polygon
              points={polygonPoints}
              fill="none"
              className="stroke-amber-400"
              strokeWidth={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Ghost snap point — shown when hovering before first vertex is placed */}
          {!closed && candidate && vertices.length === 0 && (
            <g>
              {/* Crosshair lines */}
              <line x1={candidate.x - 1.2} y1={candidate.y} x2={candidate.x + 1.2} y2={candidate.y}
                className="stroke-amber-400/50" strokeWidth={0.2} />
              <line x1={candidate.x} y1={candidate.y - 1.2} x2={candidate.x} y2={candidate.y + 1.2}
                className="stroke-amber-400/50" strokeWidth={0.2} />
              {/* Center dot */}
              <circle cx={candidate.x} cy={candidate.y} r={0.4}
                className="fill-amber-400/70 stroke-amber-300/50" strokeWidth={0.1} />
            </g>
          )}

          {/* Dashed preview line to candidate */}
          {!closed && candidate && vertices.length > 0 && (
            <line
              x1={vertices[vertices.length - 1].x}
              y1={vertices[vertices.length - 1].y}
              x2={candidate.x}
              y2={candidate.y}
              className="stroke-amber-400/40"
              strokeWidth={0.2}
              strokeDasharray="0.5 0.4"
            />
          )}

          {/* Edge dimension labels — always outside the shape, clamped at grid boundary */}
          {edges.map((edge) => {
            if (edge.len < 2) return null;
            return (
              <text
                key={`dim-${edge.i}`}
                x={edge.labelX}
                y={edge.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-400 pointer-events-none"
                style={{ fontSize: "1.2px", fontFamily: "monospace" }}
              >
                {edge.len}'
              </text>
            );
          })}

          {/* Area badge at centroid — rendered last so it sits on top */}
          {closed && area > 0 && (
            <>
              <rect
                x={centroid.x - 5}
                y={centroid.y - 1.5}
                width={10}
                height={3}
                rx={0.5}
                className="fill-slate-900/80"
              />
              <text
                x={centroid.x}
                y={centroid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-amber-300 pointer-events-none"
                style={{ fontSize: "2px", fontFamily: "monospace", fontWeight: 700 }}
              >
                {Math.round(area)} ft²
              </text>
            </>
          )}

          {/* Drag handles at edge midpoints */}
          {edges.map((edge) => {
            if (edge.len < 2) return null;
            return (
              <circle
                key={`handle-${edge.i}`}
                cx={edge.midX}
                cy={edge.midY}
                r={0.5}
                className={cn(
                  "fill-slate-800 stroke-amber-400 cursor-move transition-colors",
                  dragging?.type === "edge" && dragging.edge === edge.i ? "fill-amber-500/30" : "hover:fill-amber-500/20"
                )}
                strokeWidth={0.15}
                style={{ cursor: "move" }}
                onMouseDown={(e) => startEdgeDrag(edge.i, "x", e)}
                onTouchStart={(e) => startEdgeDrag(edge.i, "x", e as unknown as React.MouseEvent)}
              />
            );
          })}

          {/* Vertex dots — double-click to delete when shape is closed */}
          {vertices.map((v, i) => (
            <g key={`v-${i}`}>
              {/* Invisible wider hit area — drag to move, double-click to delete */}
              <circle
                cx={v.x}
                cy={v.y}
                r={1.5}
                fill="transparent"
                style={{ cursor: closed ? "move" : "default" }}
                onMouseDown={closed ? (e) => startVertexDrag(i, e) : undefined}
                onTouchStart={closed ? (e) => startVertexDrag(i, e as unknown as React.MouseEvent) : undefined}
                onDoubleClick={closed ? (e) => deleteVertex(i, e) : undefined}
              />
              {/* Visible dot */}
              <circle
                cx={v.x}
                cy={v.y}
                r={i === 0 && !closed ? 0.6 : 0.4}
                className={cn(
                  "pointer-events-none transition-colors",
                  i === 0 && !closed
                    ? canClose ? "fill-emerald-400 stroke-emerald-300" : "fill-amber-400 stroke-amber-300"
                    : closed
                      ? dragging?.type === "vertex" && dragging.index === i
                        ? "fill-white stroke-amber-200"
                        : "fill-amber-400/80 stroke-amber-300"
                      : "fill-amber-400 stroke-amber-300"
                )}
                strokeWidth={0.1}
              />
            </g>
          ))}

          {/* Live coordinate tooltip while dragging a vertex */}
          {dragging?.type === "vertex" && (() => {
            const v = vertices[dragging.index];
            if (!v) return null;
            // Offset the tooltip so it doesn't overlap the dot
            // Push right by default; flip left if near right boundary
            const tipX = v.x > VB_W - 8 ? v.x - 1.5 : v.x + 1.5;
            const tipY = v.y > VB_H - 4 ? v.y - 2 : v.y - 1.5;
            const label = `${v.x}', ${v.y}'`;
            const padW = label.length * 1.05 + 1;
            return (
              <g className="pointer-events-none">
                <rect
                  x={tipX - padW / 2}
                  y={tipY - 1.4}
                  width={padW}
                  height={2.6}
                  rx={0.4}
                  className="fill-slate-900"
                  opacity={0.9}
                />
                <text
                  x={tipX}
                  y={tipY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-amber-300"
                  style={{ fontSize: "1.4px", fontFamily: "monospace", fontWeight: 600 }}
                >
                  {label}
                </text>
              </g>
            );
          })()}

          {/* Close indicator ring */}
          {canClose && !closed && vertices.length >= 3 && (
            <circle
              cx={vertices[0].x}
              cy={vertices[0].y}
              r={1}
              className="fill-none stroke-emerald-400 animate-pulse"
              strokeWidth={0.15}
              strokeDasharray="0.4 0.25"
            />
          )}
        </svg>

        {/* Instructions overlay */}
        {!closed && vertices.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-500 text-xs">
              <div className="text-sm mb-1">Click to place corners</div>
              <div>All edges snap to horizontal/vertical</div>
              <div className="mt-1 text-[10px]">Or choose a preset above</div>
            </div>
          </div>
        )}

        {/* Drawing progress hint */}
        {!closed && vertices.length > 0 && vertices.length < 3 && (
          <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
            {vertices.length}/3 min. points — click to add more
          </div>
        )}
        {!closed && vertices.length >= 3 && (
          <div className="absolute bottom-2 left-2 text-[10px] text-emerald-400 bg-slate-900/80 px-2 py-1 rounded">
            Click near the start point to close the shape
          </div>
        )}
        {closed && (
          <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded">
            Double-click a corner to remove it
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {closed && (
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
