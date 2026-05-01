/**
 * ShapeBuilder.tsx — polygon drawing tool for irregular deck footprints.
 * Contractor-only feature on the Deck Size step.
 *
 * Architecture:
 *   Lines 1–110:  Setup & math (grid constants, geometry helpers, presets)
 *   Lines 112–200: Component state
 *   Lines 200–310: Global drag listeners (window-level mouse/touch)
 *   Lines 310–430: Event handlers
 *   Lines 430–560: Derived render data
 *   Lines 560–900: JSX
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ShapePt {
  x: number; // feet
  y: number; // feet
}

interface ShapeBuilderProps {
  onShapeChange: (area: number, perimeter: number, vertices?: ShapePt[], edgeCurves?: Record<number, number>) => void;
  initialVertices?: ShapePt[];
  initialEdgeCurves?: Record<number, number>;
  accentColor?: string;
  accentBg?: string;
}

// ─── Grid constants ──────────────────────────────────────────────────────────
const GRID_W = 60; // feet wide
const GRID_H = 48; // feet tall
const CELL = 2;    // feet per cell
const COLS = GRID_W / CELL; // 30 columns
const ROWS = GRID_H / CELL; // 24 rows
const CLOSE_RADIUS = 3; // feet — snap radius for closing (uses raw coords for reliability)

// SVG viewBox dimensions (1px per foot for clean math)
const VB_W = GRID_W;
const VB_H = GRID_H;

// ─── Geometry helpers ─────────────────────────────────────────────────────────

/**
 * Compute the control point for a quadratic Bézier given two endpoints and a bulge.
 * bulge > 0 = outward (away from polygon interior), bulge < 0 = inward.
 * The control point is placed at the edge midpoint + bulge * outward_normal.
 */
function bezierControl(
  ax: number, ay: number,
  bx: number, by: number,
  bulge: number,
  cx: number, cy: number // polygon centroid for outward direction
): { cpx: number; cpy: number } {
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;
  const dx = bx - ax, dy = by - ay;
  const edgeLen = Math.sqrt(dx * dx + dy * dy) || 1;
  // Left-hand normal
  let nx = -dy / edgeLen;
  let ny = dx / edgeLen;
  // Flip so it points away from centroid
  const toCx = cx - midX, toCy = cy - midY;
  if (nx * toCx + ny * toCy > 0) { nx = -nx; ny = -ny; }
  // Control point: midpoint + bulge * outward_normal
  return { cpx: midX + nx * bulge, cpy: midY + ny * bulge };
}

/**
 * Area of the closed shape accounting for quadratic Bézier curved edges.
 * Uses the exact parametric area formula for each segment.
 * For a straight edge: standard shoelace contribution.
 * For a curved edge (quadratic Bézier P0→CP→P2):
 *   area contribution = (P0.x*(CP.y - P2.y) + CP.x*(P2.y - P0.y) + P2.x*(P0.y - CP.y)) / 3
 *   (this is the exact signed area under the Bézier curve)
 */
function computeArea(
  pts: ShapePt[],
  curves: Record<number, number>,
  centroidX: number,
  centroidY: number
): number {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const ax = pts[i].x, ay = pts[i].y;
    const bx = pts[j].x, by = pts[j].y;
    const bulge = curves[i] ?? 0;
    if (bulge === 0) {
      // Straight edge: standard shoelace
      sum += ax * by - bx * ay;
    } else {
      const { cpx, cpy } = bezierControl(ax, ay, bx, by, bulge, centroidX, centroidY);
      // Exact quadratic Bézier area contribution (signed)
      sum += (ax * (cpy - by) + cpx * (by - ay) + bx * (ay - cpy)) / 3 * 2;
      // Add the straight-edge shoelace contribution for the chord
      sum += ax * by - bx * ay;
    }
  }
  return Math.abs(sum) / 2;
}

/**
 * Perimeter accounting for curved edges.
 * Approximates arc length by sampling the Bézier at 20 points.
 */
function computePerimeter(
  pts: ShapePt[],
  curves: Record<number, number>,
  centroidX: number,
  centroidY: number
): number {
  if (pts.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const ax = pts[i].x, ay = pts[i].y;
    const bx = pts[j].x, by = pts[j].y;
    const bulge = curves[i] ?? 0;
    if (bulge === 0) {
      total += Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
    } else {
      const { cpx, cpy } = bezierControl(ax, ay, bx, by, bulge, centroidX, centroidY);
      const N = 20;
      let px = ax, py = ay;
      for (let k = 1; k <= N; k++) {
        const t = k / N;
        const mt = 1 - t;
        const qx = mt * mt * ax + 2 * mt * t * cpx + t * t * bx;
        const qy = mt * mt * ay + 2 * mt * t * cpy + t * t * by;
        total += Math.sqrt((qx - px) ** 2 + (qy - py) ** 2);
        px = qx; py = qy;
      }
    }
  }
  return total;
}

/** Simple shoelace area for centroid computation (ignores curves — close enough for label placement) */
function shoelaceArea(pts: ShapePt[]): number {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    sum += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(sum) / 2;
}

/** Convert browser clientX/Y to SVG viewBox coordinates */
function getSVGCoords(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
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
  initialEdgeCurves,
  accentColor = "text-amber-400",
  accentBg = "bg-amber-500",
}: ShapeBuilderProps) {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [vertices, setVertices] = useState<ShapePt[]>(initialVertices ?? []);
  const [closed, setClosed] = useState(initialVertices ? initialVertices.length >= 3 : false);
  const [candidate, setCandidate] = useState<ShapePt | null>(null);
  // edgeCurves: map from edge index → bulge in feet (0 = straight)
  const [edgeCurves, setEdgeCurves] = useState<Record<number, number>>(initialEdgeCurves ?? {});
  const [dragging, setDragging] = useState<
    | { type: "edge"; edge: number }
    | { type: "vertex"; index: number }
    | { type: "curve"; edge: number; startBulge: number; perpAxis: { nx: number; ny: number } }
    | null
  >(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [edgeHoverPt, setEdgeHoverPt] = useState<ShapePt | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // Store callback in ref so it never causes useEffect re-runs
  const onShapeChangeRef = useRef(onShapeChange);
  useEffect(() => { onShapeChangeRef.current = onShapeChange; });

  // ─── Centroid (simple, for outward normal direction) ─────────────────────
  const centroid = useMemo(() => {
    if (vertices.length < 3) return { x: VB_W / 2, y: VB_H / 2 };

    function pointInPoly(px: number, py: number): boolean {
      let inside = false;
      for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    }

    function distToEdges(px: number, py: number): number {
      let minD = Infinity;
      for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        const ax = vertices[i].x, ay = vertices[i].y;
        const bx = vertices[j].x, by = vertices[j].y;
        const dx = bx - ax, dy = by - ay;
        const lenSq = dx * dx + dy * dy;
        const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
        const nearX = ax + t * dx, nearY = ay + t * dy;
        const d = Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);
        if (d < minD) minD = d;
      }
      return minD;
    }

    const STEP = CELL;
    let bestX = vertices[0].x, bestY = vertices[0].y, bestD = -1;
    const xs = vertices.map((v) => v.x);
    const ys = vertices.map((v) => v.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    for (let sx = minX + STEP / 2; sx < maxX; sx += STEP) {
      for (let sy = minY + STEP / 2; sy < maxY; sy += STEP) {
        if (!pointInPoly(sx, sy)) continue;
        const d = distToEdges(sx, sy);
        if (d > bestD) { bestD = d; bestX = sx; bestY = sy; }
      }
    }
    return { x: bestX, y: bestY };
  }, [vertices]);

  // ─── Area & perimeter (curve-aware) ─────────────────────────────────────
  const area = useMemo(
    () => closed ? computeArea(vertices, edgeCurves, centroid.x, centroid.y) : 0,
    [vertices, edgeCurves, closed, centroid]
  );
  const perim = useMemo(
    () => closed ? computePerimeter(vertices, edgeCurves, centroid.x, centroid.y) : 0,
    [vertices, edgeCurves, closed, centroid]
  );

  // Fire onShapeChange when closed shape updates
  useEffect(() => {
    if (closed && vertices.length >= 3) {
      onShapeChangeRef.current(Math.round(area), Math.round(perim), vertices, edgeCurves);
    }
  }, [vertices, edgeCurves, closed, area, perim]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (!closed) {
          setVertices((prev) => prev.slice(0, -1));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closed]);

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
        const newX = Math.max(0, Math.min(GRID_W, snapped.x));
        const newY = Math.max(0, Math.min(GRID_H, snapped.y));
        setVertices((prev) => {
          const pts = [...prev];
          pts[dragging.index] = { x: newX, y: newY };
          return pts;
        });
      } else if (dragging.type === "edge") {
        setVertices((prev) => {
          const pts = [...prev];
          const i = dragging.edge;
          const j = (i + 1) % pts.length;
          const newX = Math.max(0, Math.min(GRID_W, snapped.x));
          const newY = Math.max(0, Math.min(GRID_H, snapped.y));
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
      } else if (dragging.type === "curve") {
        // Project raw cursor movement onto the outward normal to get bulge delta
        const { nx, ny } = dragging.perpAxis;
        const i = dragging.edge;
        const v = vertices[i];
        const j = (i + 1) % vertices.length;
        const next = vertices[j];
        const midX = (v.x + next.x) / 2;
        const midY = (v.y + next.y) / 2;
        // Signed distance from midpoint along outward normal
        const rawBulge = (raw.x - midX) * nx + (raw.y - midY) * ny;
        // Clamp to half the edge length to prevent control point from overshooting
        const edgeLen = Math.sqrt((next.x - v.x) ** 2 + (next.y - v.y) ** 2) || 1;
        const maxBulge = edgeLen * 0.8;
        // Snap bulge to 0.5ft increments, clamp to ±maxBulge
        const snappedBulge = Math.round(rawBulge / 0.5) * 0.5;
        const clampedBulge = Math.max(-maxBulge, Math.min(maxBulge, snappedBulge));
        setEdgeCurves((prev) => {
          if (Math.abs(clampedBulge) < 0.25) {
            const next = { ...prev };
            delete next[i];
            return next;
          }
          return { ...prev, [i]: clampedBulge };
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
  }, [dragging, vertices]);

  // ─── Event handlers ─────────────────────────────────────────────────────────
  const distToSegment = useCallback((px: number, py: number, ax: number, ay: number, bx: number, by: number): number => {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    return Math.sqrt((px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const raw = getSVGCoords(svgRef.current, e.clientX, e.clientY);
    const snapped = snapToGrid(raw.x, raw.y);

    if (!closed) {
      setCandidate(snapped);
      setEdgeHoverPt(null);
      return;
    }

    const EDGE_THRESHOLD = 1.5;
    let bestDist = Infinity;
    let bestPt: ShapePt | null = null;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      const v = vertices[i], next = vertices[j];
      const d = distToSegment(raw.x, raw.y, v.x, v.y, next.x, next.y);
      if (d < EDGE_THRESHOLD && d < bestDist) {
        bestDist = d;
        const dx = next.x - v.x, dy = next.y - v.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;
        const t = Math.max(0, Math.min(1, ((snapped.x - v.x) * dx + (snapped.y - v.y) * dy) / lenSq));
        const edgeLen = Math.sqrt(lenSq);
        const tSnapped = Math.round(t * edgeLen / CELL) * CELL / edgeLen;
        const tClamped = Math.max(0, Math.min(1, tSnapped));
        bestPt = { x: v.x + tClamped * dx, y: v.y + tClamped * dy };
      }
    }
    setEdgeHoverPt(bestPt);
  }, [closed, vertices, distToSegment]);

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

    const clamped: ShapePt = {
      x: Math.max(0, Math.min(GRID_W, snapped.x)),
      y: Math.max(0, Math.min(GRID_H, snapped.y)),
    };

    if (vertices.length >= 3) {
      const first = vertices[0];
      const dx = raw.x - first.x;
      const dy = raw.y - first.y;
      if (Math.sqrt(dx * dx + dy * dy) <= CLOSE_RADIUS) {
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

  const startEdgeDrag = useCallback((edgeIndex: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging({ type: "edge", edge: edgeIndex });
  }, []);

  /**
   * Start a curve drag on an edge midpoint handle.
   * We compute the outward normal once at drag start and store it in state
   * so the drag handler doesn't need to recompute it from potentially stale vertices.
   */
  const startCurveDrag = useCallback((edgeIndex: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const v = vertices[edgeIndex];
    const j = (edgeIndex + 1) % vertices.length;
    const next = vertices[j];
    const dx = next.x - v.x, dy = next.y - v.y;
    const edgeLen = Math.sqrt(dx * dx + dy * dy) || 1;
    let nx = -dy / edgeLen;
    let ny = dx / edgeLen;
    // Flip so it points away from centroid
    const midX = (v.x + next.x) / 2;
    const midY = (v.y + next.y) / 2;
    const toCx = centroid.x - midX, toCy = centroid.y - midY;
    if (nx * toCx + ny * toCy > 0) { nx = -nx; ny = -ny; }
    setDragging({
      type: "curve",
      edge: edgeIndex,
      startBulge: edgeCurves[edgeIndex] ?? 0,
      perpAxis: { nx, ny },
    });
  }, [vertices, edgeCurves, centroid]);

  const startVertexDrag = useCallback((index: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!closed) return;
    e.stopPropagation();
    e.preventDefault();
    setDragging({ type: "vertex", index });
  }, [closed]);

  const insertVertexOnEdge = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (!closed || !svgRef.current) return;
    e.stopPropagation();
    const raw = getSVGCoords(svgRef.current, e.clientX, e.clientY);
    const snapped = snapToGrid(raw.x, raw.y);

    let bestEdge = -1;
    let bestDist = Infinity;
    vertices.forEach((v, i) => {
      const j = (i + 1) % vertices.length;
      const next = vertices[j];
      const dx = next.x - v.x, dy = next.y - v.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return;
      const t = Math.max(0, Math.min(1, ((snapped.x - v.x) * dx + (snapped.y - v.y) * dy) / lenSq));
      const projX = v.x + t * dx, projY = v.y + t * dy;
      const dist = Math.sqrt((snapped.x - projX) ** 2 + (snapped.y - projY) ** 2);
      if (dist < bestDist) { bestDist = dist; bestEdge = i; }
    });

    if (bestEdge === -1 || bestDist > 2) return;

    setVertices((prev) => {
      const pts = [...prev];
      pts.splice(bestEdge + 1, 0, snapped);
      return pts;
    });
    // Shift curve indices after the inserted vertex
    setEdgeCurves((prev) => {
      const next: Record<number, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        const ki = parseInt(k);
        if (ki <= bestEdge) next[ki] = v;
        else next[ki + 1] = v;
      }
      return next;
    });
    setActivePreset(null);
  }, [closed, vertices]);

  const deleteVertex = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setVertices((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length < 3) {
        setClosed(false);
        onShapeChangeRef.current(0, 0);
      }
      return next;
    });
    // Remove curve for deleted edge and shift subsequent indices
    setEdgeCurves((prev) => {
      const next: Record<number, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        const ki = parseInt(k);
        if (ki < index) next[ki] = v;
        else if (ki > index) next[ki - 1] = v;
        // ki === index: deleted edge, drop it
      }
      return next;
    });
  }, []);

  const resetEdgeCurve = useCallback((edgeIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEdgeCurves((prev) => {
      const next = { ...prev };
      delete next[edgeIndex];
      return next;
    });
  }, []);

  // ─── Presets & reset ────────────────────────────────────────────────────────
  const loadPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setVertices([...preset.vertices]);
    setClosed(true);
    setEdgeCurves({});
    setActivePreset(presetId);
    setCandidate(null);
  }, []);

  const reset = useCallback(() => {
    setVertices([]);
    setClosed(false);
    setCandidate(null);
    setDragging(null);
    setActivePreset(null);
    setEdgeCurves({});
    onShapeChangeRef.current(0, 0);
  }, []);

  // ─── Derived render data ────────────────────────────────────────────────────

  // Build SVG path string for the closed shape (supports curved edges via quadratic Bézier)
  const shapePath = useMemo(() => {
    if (vertices.length < 2) return "";
    const parts: string[] = [];
    parts.push(`M ${vertices[0].x} ${vertices[0].y}`);
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      const ax = vertices[i].x, ay = vertices[i].y;
      const bx = vertices[j].x, by = vertices[j].y;
      const bulge = edgeCurves[i] ?? 0;
      if (bulge === 0) {
        parts.push(`L ${bx} ${by}`);
      } else {
        const { cpx, cpy } = bezierControl(ax, ay, bx, by, bulge, centroid.x, centroid.y);
        parts.push(`Q ${cpx} ${cpy} ${bx} ${by}`);
      }
    }
    parts.push("Z");
    return parts.join(" ");
  }, [vertices, edgeCurves, centroid]);

  // Polyline points string for drawing mode (no curves yet)
  const polylinePoints = useMemo(() => {
    if (vertices.length < 2) return "";
    return vertices.map((v) => `${v.x},${v.y}`).join(" ");
  }, [vertices]);

  // Edge midpoints and dimension labels
  const edges = useMemo(() => {
    if (!closed || vertices.length < 3) return [];
    const cx = centroid.x, cy = centroid.y;
    const LABEL_OFFSET = 2.2;
    const MARGIN = 1.5;
    return vertices.map((v, i) => {
      const j = (i + 1) % vertices.length;
      const next = vertices[j];
      const bulge = edgeCurves[i] ?? 0;
      // For curved edges, place the label at the Bézier midpoint (t=0.5)
      let midX: number, midY: number;
      if (bulge !== 0) {
        const { cpx, cpy } = bezierControl(v.x, v.y, next.x, next.y, bulge, cx, cy);
        const t = 0.5;
        midX = (1 - t) * (1 - t) * v.x + 2 * (1 - t) * t * cpx + t * t * next.x;
        midY = (1 - t) * (1 - t) * v.y + 2 * (1 - t) * t * cpy + t * t * next.y;
      } else {
        midX = (v.x + next.x) / 2;
        midY = (v.y + next.y) / 2;
      }
      const dx = next.x - v.x, dy = next.y - v.y;
      const edgeLen = Math.sqrt(dx * dx + dy * dy) || 1;
      const len = Math.round(edgeLen);
      let nx = -dy / edgeLen;
      let ny = dx / edgeLen;
      const toCx = cx - (v.x + next.x) / 2;
      const toCy = cy - (v.y + next.y) / 2;
      if (nx * toCx + ny * toCy > 0) { nx = -nx; ny = -ny; }
      let labelX = midX + nx * LABEL_OFFSET;
      let labelY = midY + ny * LABEL_OFFSET;
      if (labelX < MARGIN) labelX = midX + Math.abs(nx) * LABEL_OFFSET;
      if (labelX > VB_W - MARGIN) labelX = midX - Math.abs(nx) * LABEL_OFFSET;
      if (labelY < MARGIN) labelY = midY + Math.abs(ny) * LABEL_OFFSET;
      if (labelY > VB_H - MARGIN) labelY = midY - Math.abs(ny) * LABEL_OFFSET;
      // Outward normal (for curve drag)
      const outNx = nx, outNy = ny;
      const isCurved = Math.abs(bulge) >= 0.25;
      return { midX, midY, len, i, labelX, labelY, outNx, outNy, isCurved, bulge };
    });
  }, [vertices, edgeCurves, closed, centroid]);

  // Can-close detection
  const canClose = useMemo(() => {
    if (closed || vertices.length < 3 || !candidate) return false;
    const first = vertices[0];
    const dx = candidate.x - first.x;
    const dy = candidate.y - first.y;
    return Math.sqrt(dx * dx + dy * dy) <= CLOSE_RADIUS + 1;
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
          style={{ maxHeight: "520px" }}
          preserveAspectRatio="xMidYMid meet"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseLeave={() => { setCandidate(null); setEdgeHoverPt(null); }}
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
          {Array.from({ length: Math.floor(GRID_W / 10) + 1 }, (_, i) => i === 0 ? null : (
            <text key={`rx${i}`} x={i * 10} y={VB_H - 0.5} className="fill-white/25"
              style={{ fontSize: "1.8px", fontFamily: "monospace" }}>{i * 10}'</text>
          ))}
          {/* Ruler labels — left edge */}
          {Array.from({ length: Math.floor(GRID_H / 10) + 1 }, (_, i) => i === 0 ? null : (
            <text key={`ry${i}`} x={0.5} y={i * 10 + 1.5} className="fill-white/25"
              style={{ fontSize: "1.8px", fontFamily: "monospace" }}>{i * 10}'</text>
          ))}

          {/* Filled polygon (closed) */}
          {closed && vertices.length >= 3 && (
            <path d={shapePath} className="fill-amber-500/15 stroke-none" />
          )}

          {/* Drawing polyline (while building) */}
          {!closed && vertices.length >= 2 && (
            <polyline
              points={polylinePoints}
              fill="none"
              className="stroke-amber-400/70"
              strokeWidth={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Closed outline */}
          {closed && vertices.length >= 3 && (
            <path
              d={shapePath}
              fill="none"
              className="stroke-amber-400"
              strokeWidth={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Ghost snap crosshair — only before first vertex is placed */}
          {!closed && candidate && vertices.length === 0 && (
            <g className="pointer-events-none">
              <line x1={candidate.x - 1.2} y1={candidate.y} x2={candidate.x + 1.2} y2={candidate.y}
                className="stroke-amber-400/50" strokeWidth={0.2} />
              <line x1={candidate.x} y1={candidate.y - 1.2} x2={candidate.x} y2={candidate.y + 1.2}
                className="stroke-amber-400/50" strokeWidth={0.2} />
              <circle cx={candidate.x} cy={candidate.y} r={0.4}
                className="fill-amber-400/70 stroke-amber-300/50" strokeWidth={0.1} />
            </g>
          )}

          {/* Dashed preview line to candidate + live edge length */}
          {!closed && candidate && vertices.length > 0 && (() => {
            const prev = vertices[vertices.length - 1];
            const dx = candidate.x - prev.x;
            const dy = candidate.y - prev.y;
            const len = Math.round(Math.sqrt(dx * dx + dy * dy));
            const midX = (prev.x + candidate.x) / 2;
            const midY = (prev.y + candidate.y) / 2;
            const lineLen = Math.sqrt(dx * dx + dy * dy) || 1;
            let nx = -dy / lineLen;
            let ny = dx / lineLen;
            const OFFSET = 1.5;
            const labelX = midX + nx * OFFSET;
            const labelY = midY + ny * OFFSET;
            const lenLabel = `${len}'`;
            const padW = lenLabel.length * 1.1 + 0.8;
            return (
              <g className="pointer-events-none">
                <line x1={prev.x} y1={prev.y} x2={candidate.x} y2={candidate.y}
                  className="stroke-amber-400/40" strokeWidth={0.2} strokeDasharray="0.5 0.4" />
                {len > 0 && (
                  <>
                    <rect x={labelX - padW / 2} y={labelY - 1.2} width={padW} height={2.2} rx={0.35}
                      className="fill-slate-900" opacity={0.85} />
                    <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle"
                      className="fill-amber-400"
                      style={{ fontSize: "1.3px", fontFamily: "monospace", fontWeight: 600 }}>
                      {lenLabel}
                    </text>
                  </>
                )}
              </g>
            );
          })()}

          {/* Edge dimension labels */}
          {edges.map((edge) => {
            if (edge.len < 2) return null;
            return (
              <text key={`dim-${edge.i}`} x={edge.labelX} y={edge.labelY}
                textAnchor="middle" dominantBaseline="middle"
                className="fill-slate-400 pointer-events-none"
                style={{ fontSize: "1.2px", fontFamily: "monospace" }}>
                {edge.len}'
              </text>
            );
          })}

          {/* Area badge at centroid */}
          {closed && area > 0 && (() => {
            const displayArea = Math.round(area * 2 / 3);
            const label = `${displayArea} ft²`;
            const badgeW = label.length * 1.1 + 1.2;
            const badgeH = 2.6;
            return (
              <>
                <rect x={centroid.x - badgeW / 2} y={centroid.y - badgeH / 2}
                  width={badgeW} height={badgeH} rx={0.45} className="fill-slate-900" opacity={0.88} />
                <text x={centroid.x} y={centroid.y} textAnchor="middle" dominantBaseline="middle"
                  className="fill-amber-300 pointer-events-none"
                  style={{ fontSize: "1.6px", fontFamily: "monospace", fontWeight: 700 }}>
                  {label}
                </text>
              </>
            );
          })()}

          {/* Clickable edge hit areas for inserting a new vertex */}
          {closed && vertices.map((v, i) => {
            const j = (i + 1) % vertices.length;
            const next = vertices[j];
            return (
              <line key={`edge-hit-${i}`}
                x1={v.x} y1={v.y} x2={next.x} y2={next.y}
                stroke="transparent" strokeWidth={2}
                style={{ cursor: "cell" }}
                onClick={insertVertexOnEdge}
              />
            );
          })}

          {/* Ghost dot on edge hover */}
          {edgeHoverPt && (
            <g className="pointer-events-none">
              <circle cx={edgeHoverPt.x} cy={edgeHoverPt.y} r={0.7}
                className="fill-emerald-400/30 stroke-emerald-400" strokeWidth={0.15} />
              <circle cx={edgeHoverPt.x} cy={edgeHoverPt.y} r={0.25} className="fill-emerald-300" />
            </g>
          )}

          {/* Edge midpoint handles — left-click drag = translate edge, right-click drag = curve */}
          {edges.map((edge) => {
            if (edge.len < 2) return null;
            const isCurving = dragging?.type === "curve" && dragging.edge === edge.i;
            const isMoving = dragging?.type === "edge" && dragging.edge === edge.i;
            return (
              <g key={`handle-${edge.i}`}>
                {/* Main handle circle */}
                <circle
                  cx={edge.midX}
                  cy={edge.midY}
                  r={0.5}
                  className={cn(
                    "stroke-amber-400 transition-colors",
                    isCurving ? "fill-sky-400/50 stroke-sky-300" :
                    isMoving ? "fill-amber-500/30" :
                    edge.isCurved ? "fill-sky-500/20 stroke-sky-400" :
                    "fill-slate-800 hover:fill-amber-500/20"
                  )}
                  strokeWidth={0.15}
                  style={{ cursor: "move" }}
                  onMouseDown={(e) => {
                    if (e.button === 2) return; // ignore right-click
                    startEdgeDrag(edge.i, e);
                  }}
                  onTouchStart={(e) => startEdgeDrag(edge.i, e as unknown as React.MouseEvent)}
                />
                {/* Curve drag handle — small perpendicular arrow indicator */}
                <circle
                  cx={edge.midX + edge.outNx * 1.2}
                  cy={edge.midY + edge.outNy * 1.2}
                  r={0.35}
                  className={cn(
                    "transition-colors",
                    isCurving ? "fill-sky-300 stroke-sky-200" :
                    edge.isCurved ? "fill-sky-400/60 stroke-sky-300" :
                    "fill-slate-700 stroke-sky-400/50 hover:fill-sky-400/40"
                  )}
                  strokeWidth={0.12}
                  style={{ cursor: "ns-resize" }}
                  onMouseDown={(e) => { e.stopPropagation(); startCurveDrag(edge.i, e); }}
                  onTouchStart={(e) => { e.stopPropagation(); startCurveDrag(edge.i, e as unknown as React.MouseEvent); }}
                  onDoubleClick={(e) => resetEdgeCurve(edge.i, e)}
                />
              </g>
            );
          })}

          {/* Vertex dots */}
          {vertices.map((v, i) => (
            <g key={`v-${i}`}>
              <circle cx={v.x} cy={v.y} r={1.5} fill="transparent"
                style={{ cursor: closed ? "move" : "default" }}
                onMouseDown={closed ? (e) => startVertexDrag(i, e) : undefined}
                onTouchStart={closed ? (e) => startVertexDrag(i, e as unknown as React.MouseEvent) : undefined}
                onDoubleClick={closed ? (e) => deleteVertex(i, e) : undefined}
              />
              <circle cx={v.x} cy={v.y}
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
            const tipX = v.x > VB_W - 8 ? v.x - 1.5 : v.x + 1.5;
            const tipY = v.y > VB_H - 4 ? v.y - 2 : v.y - 1.5;
            const label = `${v.x}', ${v.y}'`;
            const padW = label.length * 1.05 + 1;
            return (
              <g className="pointer-events-none">
                <rect x={tipX - padW / 2} y={tipY - 1.4} width={padW} height={2.6} rx={0.4}
                  className="fill-slate-900" opacity={0.9} />
                <text x={tipX} y={tipY} textAnchor="middle" dominantBaseline="middle"
                  className="fill-amber-300"
                  style={{ fontSize: "1.4px", fontFamily: "monospace", fontWeight: 600 }}>
                  {label}
                </text>
              </g>
            );
          })()}

          {/* Live bulge tooltip while curving an edge */}
          {dragging?.type === "curve" && (() => {
            const i = dragging.edge;
            const bulge = edgeCurves[i] ?? 0;
            const v = vertices[i];
            const j = (i + 1) % vertices.length;
            const next = vertices[j];
            const midX = (v.x + next.x) / 2;
            const midY = (v.y + next.y) / 2;
            const { nx, ny } = dragging.perpAxis;
            const tipX = midX + nx * 4;
            const tipY = midY + ny * 4;
            const label = `curve ${bulge >= 0 ? "+" : ""}${bulge.toFixed(1)}'`;
            const padW = label.length * 1.05 + 1;
            return (
              <g className="pointer-events-none">
                <rect x={tipX - padW / 2} y={tipY - 1.4} width={padW} height={2.6} rx={0.4}
                  className="fill-slate-900" opacity={0.9} />
                <text x={tipX} y={tipY} textAnchor="middle" dominantBaseline="middle"
                  className="fill-sky-300"
                  style={{ fontSize: "1.4px", fontFamily: "monospace", fontWeight: 600 }}>
                  {label}
                </text>
              </g>
            );
          })()}

          {/* Close indicator ring */}
          {canClose && !closed && vertices.length >= 3 && (
            <circle cx={vertices[0].x} cy={vertices[0].y} r={1}
              className="fill-none stroke-emerald-400 animate-pulse"
              strokeWidth={0.15} strokeDasharray="0.4 0.25" />
          )}
        </svg>

        {/* Instructions overlay */}
        {!closed && vertices.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-500 text-xs">
              <div className="text-sm mb-1">Click to place corners</div>
              <div>Lines snap to 2ft grid points</div>
              <div className="mt-1 text-[10px]">Or choose a preset above</div>
            </div>
          </div>
        )}
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
          <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded space-y-0.5">
            <div>Click edge to add point · Double-click corner to remove · Drag <span className="text-sky-400">◉</span> to curve edge</div>
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
        <div className="flex items-center gap-2">
          {closed && (
            <button
              onClick={() => setClosed(false)}
              className="text-xs text-slate-400 hover:text-sky-400 transition-colors px-2 py-1 rounded border border-white/5 hover:border-sky-400/30"
            >
              ✎ Edit
            </button>
          )}
          {!closed && vertices.length >= 3 && (
            <button
              onClick={() => setClosed(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded border border-emerald-500/30 hover:border-emerald-400/50 bg-emerald-500/10"
            >
              ✓ Close Shape
            </button>
          )}
          {!closed && vertices.length > 0 && (
            <button
              onClick={() => setVertices((prev) => prev.slice(0, -1))}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors px-2 py-1 rounded border border-white/5 hover:border-amber-400/30"
            >
              ↩ Undo
            </button>
          )}
          <button
            onClick={reset}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded border border-white/5 hover:border-red-400/30"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
