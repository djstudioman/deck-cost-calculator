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

import { useState, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";

const Deck3DView = lazy(() => import("./Deck3DView"));

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
  /** When true, renders in full-screen mobile mode with enlarged touch targets */
  mobileFullscreen?: boolean;
  /** When provided, a Confirm button appears once the shape is closed */
  onConfirm?: (area: number, perimeter: number, vertices: ShapePt[], edgeCurves: Record<number, number>) => void;
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
function snapToGrid(x: number, y: number, snapSize: number = CELL): ShapePt {
  return {
    x: Math.round(x / snapSize) * snapSize,
    y: Math.round(y / snapSize) * snapSize,
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
  mobileFullscreen = false,
  onConfirm,
}: ShapeBuilderProps) {
  // In mobile fullscreen mode, default snap to 1ft for finger precision
  // ─── State ──────────────────────────────────────────────────────────────────
  const [vertices, setVertices] = useState<ShapePt[]>(initialVertices ?? []);
  const [closed, setClosed] = useState(initialVertices ? initialVertices.length >= 3 : false);
  const [candidate, setCandidate] = useState<ShapePt | null>(null);
  // edgeCurves: map from edge index → bulge in feet (0 = straight)
  const [edgeCurves, setEdgeCurves] = useState<Record<number, number>>(initialEdgeCurves ?? {});
  const [dragging, setDragging] = useState<
    | { type: "edge"; edge: number }
    | { type: "vertex"; index: number }
    | { type: "curve"; edge: number; startBulge: number; handleOffset: number; perpAxis: { nx: number; ny: number } }
    | null
  >(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [edgeHoverPt, setEdgeHoverPt] = useState<ShapePt | null>(null);
  const [snapTo1ft, setSnapTo1ft] = useState(mobileFullscreen);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  // Selected vertex index for exact-coordinate editing
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  // Controlled input values (strings so user can type freely)
  const [editX, setEditX] = useState("");
  const [editY, setEditY] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  // Store callback in ref so it never causes useEffect re-runs
  const onShapeChangeRef = useRef(onShapeChange);
  useEffect(() => { onShapeChangeRef.current = onShapeChange; });

  // Keep coordinate inputs in sync when the selected vertex is dragged
  useEffect(() => {
    if (selectedVertex === null || !vertices[selectedVertex]) return;
    // Only update when not actively typing (dragging sets values, not user input)
    if (dragging?.type === "vertex" && dragging.index === selectedVertex) {
      const v = vertices[selectedVertex];
      setEditX(String(v.x));
      setEditY(String(v.y));
    }
  }, [vertices, selectedVertex, dragging]);

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

  // Smooth geometric centroid for badge positioning — changes continuously during drag
  // (no discrete jumps unlike the pole-of-inaccessibility centroid used for normals)
  const badgeCentroid = useMemo(() => {
    if (vertices.length < 3) return { x: VB_W / 2, y: VB_H / 2 };
    const sumX = vertices.reduce((s, v) => s + v.x, 0);
    const sumY = vertices.reduce((s, v) => s + v.y, 0);
    return { x: sumX / vertices.length, y: sumY / vertices.length };
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

  // Fire onShapeChange when closed shape updates.
  // Pass raw (unrounded) area/perim so that small curve changes that don't
  // change the rounded integer still trigger a Home.tsx re-render and price update.
  useEffect(() => {
    if (closed && vertices.length >= 3) {
      onShapeChangeRef.current(area, perim, vertices, edgeCurves);
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
      const snapSize = snapTo1ft ? 1 : CELL;
      const snapped = snapToGrid(raw.x, raw.y, snapSize);

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
          const dxSnap = Math.round((newX - oldMidX) / snapSize) * snapSize;
          const dySnap = Math.round((newY - oldMidY) / snapSize) * snapSize;
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
        // Signed distance from midpoint along outward normal.
        // Subtract handleOffset so dragging from the handle's rest position gives 0 delta.
        const rawBulge = (raw.x - midX) * nx + (raw.y - midY) * ny - dragging.handleOffset;
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
  }, [dragging, vertices, snapTo1ft]);

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
    const snapped = snapToGrid(raw.x, raw.y, snapTo1ft ? 1 : CELL);

    if (!closed) {
      setCandidate(snapped);
      setEdgeHoverPt(null);
      return;
    }

    const EDGE_THRESHOLD = 1.5;
    let bestDist = Infinity;
    let bestPt: ShapePt | null = null;
    const cx = centroid.x, cy = centroid.y;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      const v = vertices[i], next = vertices[j];
      const bulge = edgeCurves[i] ?? 0;

      if (bulge !== 0) {
        // Curved edge: sample the Bézier arc and find closest point
        const { cpx, cpy } = bezierControl(v.x, v.y, next.x, next.y, bulge, cx, cy);
        const N = 40;
        let closestT = 0;
        let closestDist = Infinity;
        for (let k = 0; k <= N; k++) {
          const t = k / N;
          const mt = 1 - t;
          const qx = mt * mt * v.x + 2 * mt * t * cpx + t * t * next.x;
          const qy = mt * mt * v.y + 2 * mt * t * cpy + t * t * next.y;
          const d = Math.sqrt((raw.x - qx) ** 2 + (raw.y - qy) ** 2);
          if (d < closestDist) { closestDist = d; closestT = t; }
        }
        if (closestDist < EDGE_THRESHOLD && closestDist < bestDist) {
          bestDist = closestDist;
          // Snap t to nearest foot increment along the arc
          const snapSz = snapTo1ft ? 1 : CELL;
          const arcLen = (() => {
            let len = 0;
            let px = v.x, py = v.y;
            for (let k = 1; k <= N; k++) {
              const t2 = k / N;
              const mt2 = 1 - t2;
              const qx2 = mt2 * mt2 * v.x + 2 * mt2 * t2 * cpx + t2 * t2 * next.x;
              const qy2 = mt2 * mt2 * v.y + 2 * mt2 * t2 * cpy + t2 * t2 * next.y;
              len += Math.sqrt((qx2 - px) ** 2 + (qy2 - py) ** 2);
              px = qx2; py = qy2;
            }
            return len;
          })();
          const snappedArcDist = Math.round(closestT * arcLen / snapSz) * snapSz;
          const tSnapped = Math.max(0, Math.min(1, snappedArcDist / arcLen));
          const mt = 1 - tSnapped;
          bestPt = {
            x: mt * mt * v.x + 2 * mt * tSnapped * cpx + tSnapped * tSnapped * next.x,
            y: mt * mt * v.y + 2 * mt * tSnapped * cpy + tSnapped * tSnapped * next.y,
          };
        }
      } else {
        // Straight edge
        const d = distToSegment(raw.x, raw.y, v.x, v.y, next.x, next.y);
        if (d < EDGE_THRESHOLD && d < bestDist) {
          bestDist = d;
          const dx = next.x - v.x, dy = next.y - v.y;
          const lenSq = dx * dx + dy * dy;
          if (lenSq === 0) continue;
          const t = Math.max(0, Math.min(1, ((snapped.x - v.x) * dx + (snapped.y - v.y) * dy) / lenSq));
          const edgeLen = Math.sqrt(lenSq);
          const snapSz = snapTo1ft ? 1 : CELL;
          const tSnapped = Math.round(t * edgeLen / snapSz) * snapSz / edgeLen;
          const tClamped = Math.max(0, Math.min(1, tSnapped));
          bestPt = { x: v.x + tClamped * dx, y: v.y + tClamped * dy };
        }
      }
    }
    setEdgeHoverPt(bestPt);
  }, [closed, vertices, distToSegment, snapTo1ft, edgeCurves, centroid]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (closed || !svgRef.current) return;
    const touch = e.touches[0];
    const raw = getSVGCoords(svgRef.current, touch.clientX, touch.clientY);
    const snapped = snapToGrid(raw.x, raw.y, snapTo1ft ? 1 : CELL);
    setCandidate(snapped);
  }, [closed, snapTo1ft]);

  const tryAddVertex = useCallback((clientX: number, clientY: number) => {
    if (closed || !svgRef.current) return;
    const raw = getSVGCoords(svgRef.current, clientX, clientY);
    const snapped = snapToGrid(raw.x, raw.y, snapTo1ft ? 1 : CELL);

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
      if (Math.sqrt(dx * dx + dy * dy) <= (mobileFullscreen ? CLOSE_RADIUS * 2.5 : CLOSE_RADIUS)) {
        setClosed(true);
        setCandidate(null);
        setActivePreset(null);
        return;
      }
    }

    setVertices((prev) => [...prev, clamped]);
    setActivePreset(null);
  }, [closed, vertices, snapTo1ft]);

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
    const existingBulge = edgeCurves[edgeIndex] ?? 0;
    // The handle is rendered at midpoint + outNormal * 3.5.
    // Store this offset so the drag handler can zero-reference from the handle's rest position.
    const HANDLE_OFFSET = 3.5;
    setDragging({
      type: "curve",
      edge: edgeIndex,
      startBulge: existingBulge,
      handleOffset: HANDLE_OFFSET,
      perpAxis: { nx, ny },
    });
  }, [vertices, edgeCurves, centroid]);

  const startVertexDrag = useCallback((index: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!closed) return;
    e.stopPropagation();
    e.preventDefault();
    setDragging({ type: "vertex", index });
  }, [closed]);

  // Single-click on a vertex selects it and populates the coordinate inputs
  const selectVertex = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!closed) return;
    setSelectedVertex((prev) => {
      if (prev === index) {
        // Deselect on second click
        return null;
      }
      const v = vertices[index];
      setEditX(String(v.x));
      setEditY(String(v.y));
      return index;
    });
  }, [closed, vertices]);

  // Apply typed coordinates to the selected vertex
  const applyCoordinates = useCallback(() => {
    if (selectedVertex === null) return;
    const nx = parseFloat(editX);
    const ny = parseFloat(editY);
    if (isNaN(nx) || isNaN(ny)) return;
    const clampedX = Math.max(0, Math.min(GRID_W, nx));
    const clampedY = Math.max(0, Math.min(GRID_H, ny));
    setVertices((prev) => {
      const pts = [...prev];
      pts[selectedVertex] = { x: clampedX, y: clampedY };
      return pts;
    });
    setEditX(String(clampedX));
    setEditY(String(clampedY));
  }, [selectedVertex, editX, editY]);

  const insertVertexOnEdge = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (!closed || !svgRef.current) return;
    e.stopPropagation();
    const raw = getSVGCoords(svgRef.current, e.clientX, e.clientY);
    const snapped = snapToGrid(raw.x, raw.y, snapTo1ft ? 1 : CELL);

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
  }, [closed, vertices, snapTo1ft]);

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

  // In mobile fullscreen, close-snap radius is more generous for fingers
  const effectiveCloseRadius = mobileFullscreen ? CLOSE_RADIUS * 2.5 : CLOSE_RADIUS;

  // Can-close detection
  const canClose = useMemo(() => {
    if (closed || vertices.length < 3 || !candidate) return false;
    const first = vertices[0];
    const dx = candidate.x - first.x;
    const dy = candidate.y - first.y;
    return Math.sqrt(dx * dx + dy * dy) <= effectiveCloseRadius + 1;
  }, [closed, vertices, candidate, effectiveCloseRadius]);

  // ─── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className={cn(mobileFullscreen ? "flex flex-col h-full gap-0" : "space-y-3")}>
      {/* Preset buttons + 2D/3D toggle */}
      <div className={cn("flex gap-2", mobileFullscreen && "px-3 pt-2 pb-1 shrink-0")}>
        {viewMode === "2d" && PRESETS.map((p) => (
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
        {viewMode === "3d" && (
          <div className="flex-1 text-xs text-slate-500 flex items-center">
            Orbit: drag &middot; Zoom: scroll &middot; Pan: right-drag
          </div>
        )}
        {/* 2D / 3D toggle — only show when shape is closed */}
        {closed && vertices.length >= 3 && (
          <button
            onClick={() => setViewMode(viewMode === "2d" ? "3d" : "2d")}
            className={cn(
              "py-2 px-3 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap",
              viewMode === "3d"
                ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
            )}
          >
            {viewMode === "2d" ? "\u25A8 3D" : "\u25A1 2D"}
          </button>
        )}
      </div>

      {/* Canvas area: 2D or 3D */}
      {viewMode === "3d" && closed && vertices.length >= 3 ? (
        <Suspense fallback={
          <div className={cn(
            "flex items-center justify-center",
            mobileFullscreen ? "flex-1 min-h-0 bg-slate-900/80" : "rounded-lg border border-white/10 bg-slate-900/80"
          )} style={{ height: "520px" }}>
            <div className="text-slate-500 text-sm animate-pulse">Loading 3D view...</div>
          </div>
        }>
          <Deck3DView
            vertices={vertices}
            edgeCurves={edgeCurves}
            className={mobileFullscreen ? "flex-1 min-h-0" : ""}
          />
        </Suspense>
      ) : (
      <div className={cn(
        "relative overflow-hidden",
        mobileFullscreen
          ? "flex-1 min-h-0 bg-slate-900/80"
          : "rounded-lg border border-white/10 bg-slate-900/80"
      )}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className={cn(
            "cursor-crosshair select-none",
            mobileFullscreen ? "w-full h-full" : "w-full h-auto"
          )}
          style={mobileFullscreen ? { touchAction: "none", display: "block" } : { maxHeight: "520px" }}
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
                    <rect x={labelX - padW / 2} y={labelY - 1.1} width={padW} height={2.0} rx={0.35}
                      className="fill-slate-900" opacity={0.85} />
                    <text x={labelX} y={labelY} textAnchor="middle" dy="0.35em"
                      className="fill-amber-400"
                      style={{ fontSize: "1.3px", fontFamily: "monospace", fontWeight: 600, lineHeight: 1 }}>
                      {lenLabel}
                    </text>
                  </>
                )}
              </g>
            );
          })()}

          {/* Edge dimension labels — pill background + centered text */}
          {edges.map((edge) => {
            if (edge.len < 2) return null;
            const dimLabel = `${edge.len}'`;
            const pillW = dimLabel.length * 0.85 + 1.0;
            const pillH = 1.9;
            return (
              <g key={`dim-${edge.i}`} className="pointer-events-none">
                <rect
                  x={edge.labelX - pillW / 2}
                  y={edge.labelY - pillH / 2}
                  width={pillW}
                  height={pillH}
                  rx={0.35}
                  className="fill-slate-900"
                  opacity={0.82}
                />
                <text
                  x={edge.labelX}
                  y={edge.labelY}
                  textAnchor="middle"
                  dy="0.35em"
                  className="fill-slate-300"
                  style={{ fontSize: "1.1px", fontFamily: "monospace", lineHeight: 1 }}>
                  {dimLabel}
                </text>
              </g>
            );
          })}

          {/* Area badge at centroid */}
          {closed && area > 0 && (() => {
            const label = `${Math.round(area)} ft²`;
            // Width: each char ~1.0px wide at 1.6px font size in monospace
            const badgeW = label.length * 1.0 + 1.6;
            const badgeH = 2.8;
            // Use smooth geometric centroid so badge moves continuously, not in discrete jumps
            const bx = badgeCentroid.x;
            const by = badgeCentroid.y;
            return (
              <>
                <rect
                  x={bx - badgeW / 2}
                  y={by - badgeH / 2}
                  width={badgeW}
                  height={badgeH}
                  rx={0.5}
                  className="fill-slate-900"
                  opacity={0.9}
                />
                <text
                  x={bx}
                  y={by}
                  textAnchor="middle"
                  dy="0.35em"
                  className="fill-amber-300 pointer-events-none"
                  style={{ fontSize: "1.6px", fontFamily: "monospace", fontWeight: 700, lineHeight: 1 }}>
                  {label}
                </text>
              </>
            );
          })()}

          {/* Clickable edge hit areas for inserting a new vertex */}
          {closed && vertices.map((v, i) => {
            const j = (i + 1) % vertices.length;
            const next = vertices[j];
            const bulge = edgeCurves[i] ?? 0;
            if (bulge !== 0) {
              const { cpx, cpy } = bezierControl(v.x, v.y, next.x, next.y, bulge, centroid.x, centroid.y);
              const d = `M ${v.x} ${v.y} Q ${cpx} ${cpy} ${next.x} ${next.y}`;
              return (
                <path key={`edge-hit-${i}`}
                  d={d}
                  stroke="transparent" strokeWidth={2} fill="none"
                  style={{ cursor: "cell" }}
                  onClick={insertVertexOnEdge}
                />
              );
            }
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
                  r={mobileFullscreen ? 1.8 : 0.5}
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
                {/* Curve drag handle — offset beyond the dimension label */}
                <circle
                  cx={edge.midX + edge.outNx * 3.5}
                  cy={edge.midY + edge.outNy * 3.5}
                  r={mobileFullscreen ? 1.4 : 0.35}
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
              {/* Selection ring */}
              {closed && selectedVertex === i && (
                <circle cx={v.x} cy={v.y} r={1.1}
                  className="fill-none stroke-sky-400"
                  strokeWidth={0.25}
                  style={{ pointerEvents: "none" }}
                />
              )}
              <circle cx={v.x} cy={v.y} r={mobileFullscreen ? 3.5 : 1.5} fill="transparent"
                style={{ cursor: closed ? "move" : "default" }}
                onMouseDown={closed ? (e) => { startVertexDrag(i, e); } : undefined}
                onClick={closed ? (e) => selectVertex(i, e) : undefined}
                onTouchStart={closed ? (e) => startVertexDrag(i, e as unknown as React.MouseEvent) : undefined}
                onDoubleClick={closed ? (e) => deleteVertex(i, e) : undefined}
              />
              <circle cx={v.x} cy={v.y}
                r={mobileFullscreen ? (i === 0 && !closed ? 1.2 : 0.9) : (i === 0 && !closed ? 0.6 : 0.4)}
                className={cn(
                  "pointer-events-none transition-colors",
                  i === 0 && !closed
                    ? canClose ? "fill-emerald-400 stroke-emerald-300" : "fill-amber-400 stroke-amber-300"
                    : closed
                      ? dragging?.type === "vertex" && dragging.index === i
                        ? "fill-white stroke-amber-200"
                        : selectedVertex === i
                          ? "fill-sky-300 stroke-sky-200"
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
                <rect x={tipX - padW / 2} y={tipY - 1.3} width={padW} height={2.4} rx={0.4}
                  className="fill-slate-900" opacity={0.9} />
                <text x={tipX} y={tipY} textAnchor="middle" dy="0.35em"
                  className="fill-amber-300"
                  style={{ fontSize: "1.4px", fontFamily: "monospace", fontWeight: 600, lineHeight: 1 }}>
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
                <rect x={tipX - padW / 2} y={tipY - 1.3} width={padW} height={2.4} rx={0.4}
                  className="fill-slate-900" opacity={0.9} />
                <text x={tipX} y={tipY} textAnchor="middle" dy="0.35em"
                  className="fill-sky-300"
                  style={{ fontSize: "1.4px", fontFamily: "monospace", fontWeight: 600, lineHeight: 1 }}>
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
              <div>Lines snap to {snapTo1ft ? "1ft" : "2ft"} grid points</div>
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
      )}

      {/* Exact-coordinate editor — shown when a vertex is selected */}
      {closed && selectedVertex !== null && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-sky-500/30 bg-sky-500/5">
          <span className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold whitespace-nowrap">
            Corner {selectedVertex + 1}
          </span>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-slate-500 font-mono">X</label>
            <input
              type="number"
              value={editX}
              min={0}
              max={GRID_W}
              step={snapTo1ft ? 1 : CELL}
              onChange={(e) => setEditX(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyCoordinates(); if (e.key === "Escape") setSelectedVertex(null); }}
              className="w-14 px-2 py-0.5 rounded border border-white/10 bg-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-slate-500">ft</span>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-slate-500 font-mono">Y</label>
            <input
              type="number"
              value={editY}
              min={0}
              max={GRID_H}
              step={snapTo1ft ? 1 : CELL}
              onChange={(e) => setEditY(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyCoordinates(); if (e.key === "Escape") setSelectedVertex(null); }}
              className="w-14 px-2 py-0.5 rounded border border-white/10 bg-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-slate-500">ft</span>
          </div>
          <button
            onClick={applyCoordinates}
            className="text-xs px-2 py-0.5 rounded border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition-colors font-mono"
          >
            Apply
          </button>
          <button
            onClick={() => setSelectedVertex(null)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary bar */}
      <div className={cn("flex items-center justify-between", mobileFullscreen && "px-3 py-2 shrink-0 border-t border-white/10 bg-slate-900/90")}>
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
              <div title="5.5in face x 16ft board, 10% waste">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Boards est.</div>
                <div className="font-mono font-bold text-sm text-slate-300">
                  {Math.ceil((area * 1.10) / ((5.5 / 12) * 16))} pcs
                </div>
                <div className="text-[9px] text-slate-600">5.5&quot; x 16ft &middot; 10% waste</div>
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
          {closed && Object.keys(edgeCurves).length > 0 && (
            <button
              onClick={() => setEdgeCurves({})}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors px-2 py-1 rounded border border-sky-500/30 hover:border-sky-400/50 bg-sky-500/10"
            >
              ⟳ Reset Curves
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
          {/* Snap precision toggle */}
          <button
            onClick={() => setSnapTo1ft((v) => !v)}
            title={snapTo1ft ? "1ft snap active — click for 2ft" : "2ft snap active — click for 1ft"}
            className={cn(
              "text-xs transition-colors px-2 py-1 rounded border font-mono",
              snapTo1ft
                ? "text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-slate-400 border-white/10 bg-white/[0.03] hover:border-white/20 hover:text-white"
            )}
          >
            {snapTo1ft ? "⊞ 1ft" : "⊞ 2ft"}
          </button>
          <button
            onClick={reset}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded border border-white/5 hover:border-red-400/30"
          >
            Clear
          </button>
          {onConfirm && closed && (
            <button
              onClick={() => onConfirm(area, perim, vertices, edgeCurves)}
              className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 transition-colors"
            >
              ✓ Use This Shape
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
