/**
 * Deck3DView — 3D visualization of a custom deck shape
 * Uses @react-three/fiber + drei for rendering
 * Individual deck boards are rendered as separate extruded strips
 * clipped to the deck shape boundary, with gaps between them.
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

interface ShapePt {
  x: number;
  y: number;
}

interface Deck3DViewProps {
  vertices: ShapePt[];
  edgeCurves?: Record<number, number>;
  className?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const BOARD_WIDTH = 5.5 / 12; // 5.5 inches in feet
const BOARD_GAP = 0.5 / 12;  // 0.5 inch gap between boards
const BOARD_THICKNESS = 1 / 12; // 1 inch thick boards (in feet → 3D units)
const BOARD_STRIDE = BOARD_WIDTH + BOARD_GAP;

// ─── Helper: compute Bézier control point for a curved edge ─────────────────
function bezierControl(a: ShapePt, b: ShapePt, bulge: number, centroid: ShapePt): ShapePt {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let nx = -dy;
  let ny = dx;
  const len = Math.sqrt(nx * nx + ny * ny) || 1;
  nx /= len;
  ny /= len;
  const toMidX = mx - centroid.x;
  const toMidY = my - centroid.y;
  if (nx * toMidX + ny * toMidY < 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: mx + nx * bulge, y: my + ny * bulge };
}

// ─── Helper: sample points along a quadratic Bézier ─────────────────────────
function sampleBezier(a: ShapePt, ctrl: ShapePt, b: ShapePt, segments: number): ShapePt[] {
  const pts: ShapePt[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    pts.push({
      x: u * u * a.x + 2 * u * t * ctrl.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * ctrl.y + t * t * b.y,
    });
  }
  return pts;
}

// ─── Build dense polygon outline points (for clipping) ──────────────────────
function buildOutlinePoints(vertices: ShapePt[], edgeCurves: Record<number, number>): ShapePt[] {
  const centroid = {
    x: vertices.reduce((s, v) => s + v.x, 0) / vertices.length,
    y: vertices.reduce((s, v) => s + v.y, 0) / vertices.length,
  };

  const pts: ShapePt[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    const bulge = edgeCurves[i];
    if (bulge && Math.abs(bulge) > 0.1) {
      const ctrl = bezierControl(vertices[i], vertices[next], bulge, centroid);
      const sampled = sampleBezier(vertices[i], ctrl, vertices[next], 24);
      pts.push(...sampled.slice(0, -1));
    } else {
      pts.push(vertices[i]);
    }
  }
  return pts;
}

// ─── Build THREE.Shape from outline ─────────────────────────────────────────
function buildShape(vertices: ShapePt[], edgeCurves: Record<number, number>): THREE.Shape {
  const centroid = {
    x: vertices.reduce((s, v) => s + v.x, 0) / vertices.length,
    y: vertices.reduce((s, v) => s + v.y, 0) / vertices.length,
  };

  const shape = new THREE.Shape();
  shape.moveTo(vertices[0].x, -vertices[0].y);

  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    const bulge = edgeCurves[i];
    if (bulge && Math.abs(bulge) > 0.1) {
      const ctrl = bezierControl(vertices[i], vertices[next], bulge, centroid);
      shape.quadraticCurveTo(ctrl.x, -ctrl.y, vertices[next].x, -vertices[next].y);
    } else {
      shape.lineTo(vertices[next].x, -vertices[next].y);
    }
  }

  return shape;
}

// ─── Clip a horizontal board strip to the polygon outline ───────────────────
// Returns an array of [startX, endX] segments where the board intersects the polygon
function clipBoardToPolygon(boardY: number, boardYEnd: number, outlinePts: ShapePt[]): [number, number][] {
  // Use the center Y of the board for intersection testing
  const testY = (boardY + boardYEnd) / 2;

  // Find all X intersections at testY using scanline
  const intersections: number[] = [];
  const n = outlinePts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const yi = outlinePts[i].y;
    const yj = outlinePts[j].y;
    if ((yi <= testY && yj > testY) || (yj <= testY && yi > testY)) {
      const t = (testY - yi) / (yj - yi);
      intersections.push(outlinePts[i].x + t * (outlinePts[j].x - outlinePts[i].x));
    }
  }

  intersections.sort((a, b) => a - b);

  // Pair intersections into segments
  const segments: [number, number][] = [];
  for (let i = 0; i < intersections.length - 1; i += 2) {
    segments.push([intersections[i], intersections[i + 1]]);
  }

  return segments;
}

// ─── Individual board geometry (a single plank) ─────────────────────────────
function createBoardGeometry(startX: number, endX: number, boardY: number, boardWidth: number): THREE.BufferGeometry {
  const length = endX - startX;
  if (length <= 0.01) return new THREE.BufferGeometry(); // skip tiny slivers

  const geo = new THREE.BoxGeometry(length, BOARD_THICKNESS, boardWidth);
  geo.translate(startX + length / 2, BOARD_THICKNESS / 2, -(boardY + boardWidth / 2));
  return geo;
}

// ─── All deck boards as a merged geometry ───────────────────────────────────
function DeckBoards({ vertices, edgeCurves }: { vertices: ShapePt[]; edgeCurves: Record<number, number> }) {
  const geometry = useMemo(() => {
    const outlinePts = buildOutlinePoints(vertices, edgeCurves);

    // Find Y bounds
    let minY = Infinity, maxY = -Infinity;
    for (const p of outlinePts) {
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    // Generate board geometries
    const geometries: THREE.BufferGeometry[] = [];

    for (let y = minY; y < maxY; y += BOARD_STRIDE) {
      const boardYEnd = y + BOARD_WIDTH;
      const segments = clipBoardToPolygon(y, boardYEnd, outlinePts);

      for (const [sx, ex] of segments) {
        if (ex - sx > 0.02) { // skip tiny slivers
          const boardGeo = createBoardGeometry(sx, ex, y, BOARD_WIDTH);
          if (boardGeo.attributes.position) {
            geometries.push(boardGeo);
          }
        }
      }
    }

    if (geometries.length === 0) return new THREE.BufferGeometry();

    // Merge all board geometries into one for performance
    const merged = mergeGeometries(geometries);
    for (const g of geometries) g.dispose();
    return merged;
  }, [vertices, edgeCurves]);

  if (!geometry.attributes.position) return null;

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <meshStandardMaterial
        color="#9B7B3C"
        roughness={0.8}
        metalness={0.0}
      />
    </mesh>
  );
}

// ─── Simple geometry merge (no dependency needed) ───────────────────────────
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVerts = 0;
  let totalIndices = 0;

  const validGeos = geometries.filter(g => g.attributes.position);

  for (const g of validGeos) {
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let idxOffset = 0;

  for (const g of validGeos) {
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    const idx = g.index;

    for (let i = 0; i < pos.count * 3; i++) {
      positions[vertOffset * 3 + i] = (pos.array as Float32Array)[i];
    }
    if (norm) {
      for (let i = 0; i < norm.count * 3; i++) {
        normals[vertOffset * 3 + i] = (norm.array as Float32Array)[i];
      }
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices[idxOffset + i] = (idx.array as Uint32Array | Uint16Array)[i] + vertOffset;
      }
      idxOffset += idx.count;
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices[idxOffset + i] = vertOffset + i;
      }
      idxOffset += pos.count;
    }

    vertOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeVertexNormals();
  return merged;
}

// ─── Deck edge/fascia (thin border around the deck perimeter) ───────────────
function DeckFascia({ vertices, edgeCurves }: { vertices: ShapePt[]; edgeCurves: Record<number, number> }) {
  const geometry = useMemo(() => {
    const shape = buildShape(vertices, edgeCurves);
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.6, // fascia depth (visible from side)
      bevelEnabled: false,
      curveSegments: 24,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.computeVertexNormals();
    return geo;
  }, [vertices, edgeCurves]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow castShadow>
      <meshStandardMaterial
        color="#6B5520"
        roughness={0.85}
        metalness={0.0}
      />
    </mesh>
  );
}

// ─── Railing posts ──────────────────────────────────────────────────────────
function RailingPosts({ vertices, edgeCurves }: { vertices: ShapePt[]; edgeCurves: Record<number, number> }) {
  const posts = useMemo(() => {
    const centroid = {
      x: vertices.reduce((s, v) => s + v.x, 0) / vertices.length,
      y: vertices.reduce((s, v) => s + v.y, 0) / vertices.length,
    };

    const perimeterPts: ShapePt[] = [];

    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      const bulge = edgeCurves[i];
      if (bulge && Math.abs(bulge) > 0.1) {
        const ctrl = bezierControl(vertices[i], vertices[next], bulge, centroid);
        const pts = sampleBezier(vertices[i], ctrl, vertices[next], 12);
        perimeterPts.push(...pts.slice(0, -1));
      } else {
        perimeterPts.push(vertices[i]);
      }
    }

    // Place posts every ~4 feet along the perimeter
    const postPositions: ShapePt[] = [];
    let accumulated = 0;
    for (let i = 0; i < perimeterPts.length; i++) {
      const next = (i + 1) % perimeterPts.length;
      const dx = perimeterPts[next].x - perimeterPts[i].x;
      const dy = perimeterPts[next].y - perimeterPts[i].y;
      const segLen = Math.sqrt(dx * dx + dy * dy);

      if (accumulated === 0) {
        postPositions.push(perimeterPts[i]);
      }

      accumulated += segLen;
      if (accumulated >= 4) {
        postPositions.push(perimeterPts[next]);
        accumulated = 0;
      }
    }

    return postPositions;
  }, [vertices, edgeCurves]);

  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={[p.x, 0, p.y]}>
          {/* Post */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[0.3, 3, 0.3]} />
            <meshStandardMaterial color="#6B5B3A" roughness={0.8} />
          </mesh>
          {/* Post cap */}
          <mesh position={[0, 3.05, 0]}>
            <boxGeometry args={[0.4, 0.1, 0.4]} />
            <meshStandardMaterial color="#4A3F2A" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Top rail connecting posts */}
      {posts.length > 1 && posts.map((p, i) => {
        const next = posts[(i + 1) % posts.length];
        const dx = next.x - p.x;
        const dz = next.y - p.y;
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        return (
          <mesh
            key={`rail-${i}`}
            position={[(p.x + next.x) / 2, 2.8, (p.y + next.y) / 2]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[len, 0.15, 0.12]} />
            <meshStandardMaterial color="#7A6840" roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Ground plane ───────────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#2d5a27" roughness={1} />
    </mesh>
  );
}

// ─── Subtle auto-rotation ───────────────────────────────────────────────────
function AutoRotate({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5;
    }
  });
  return null;
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function Deck3DView({ vertices, edgeCurves = {}, className = "" }: Deck3DViewProps) {
  const controlsRef = useRef<any>(null);

  // Compute center and camera distance from shape bounds
  const { center, distance } = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of vertices) {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const span = Math.max(maxX - minX, maxY - minY);
    return { center: [cx, 0, cy] as [number, number, number], distance: span * 1.2 };
  }, [vertices]);

  if (vertices.length < 3) return null;

  return (
    <div className={`w-full rounded-lg overflow-hidden bg-slate-900/80 border border-white/10 ${className}`} style={{ height: "520px" }}>
      <Canvas
        shadows
        camera={{ position: [center[0] + distance * 0.6, distance * 0.7, center[2] + distance * 0.6], fov: 45 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[20, 30, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 15, -10]} intensity={0.3} />

        <DeckBoards vertices={vertices} edgeCurves={edgeCurves} />
        <DeckFascia vertices={vertices} edgeCurves={edgeCurves} />
        <RailingPosts vertices={vertices} edgeCurves={edgeCurves} />
        <Ground />

        <OrbitControls
          ref={controlsRef}
          target={center}
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={distance * 3}
        />
        <AutoRotate controlsRef={controlsRef} />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}
