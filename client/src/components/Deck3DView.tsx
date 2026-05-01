/**
 * Deck3DView — 3D visualization of a custom deck shape
 * Coordinate system: X=right, Y=up, Z=forward (standard Three.js)
 * The 2D shape (x,y in feet) maps to 3D as (x, 0, y).
 * Boards are BoxGeometry strips placed directly in world XZ space.
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

// ─── Constants (all in feet = Three.js units) ────────────────────────────────
const BOARD_FACE_WIDTH = 5.5 / 12;   // 5.5" face width in feet
const BOARD_GAP        = 1.0 / 12;   // 1" visible gap between boards (prevents z-fighting)
const BOARD_THICKNESS  = 1.5 / 12;   // 1.5" thick (5/4 deck board)
const BOARD_STRIDE     = BOARD_FACE_WIDTH + BOARD_GAP;
const DECK_Y           = 0.5;        // deck surface sits 0.5 ft above ground

// ─── Helper: compute Bézier control point for a curved edge ─────────────────
function bezierControl(a: ShapePt, b: ShapePt, bulge: number, centroid: ShapePt): ShapePt {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let nx = -dy, ny = dx;
  const len = Math.sqrt(nx * nx + ny * ny) || 1;
  nx /= len; ny /= len;
  if (nx * (mx - centroid.x) + ny * (my - centroid.y) < 0) { nx = -nx; ny = -ny; }
  return { x: mx + nx * bulge, y: my + ny * bulge };
}

// ─── Helper: sample points along a quadratic Bézier ─────────────────────────
function sampleBezier(a: ShapePt, ctrl: ShapePt, b: ShapePt, segments: number): ShapePt[] {
  const pts: ShapePt[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, u = 1 - t;
    pts.push({ x: u*u*a.x + 2*u*t*ctrl.x + t*t*b.x, y: u*u*a.y + 2*u*t*ctrl.y + t*t*b.y });
  }
  return pts;
}

// ─── Build dense polygon outline points ─────────────────────────────────────
function buildOutlinePoints(vertices: ShapePt[], edgeCurves: Record<number, number>): ShapePt[] {
  const centroid = { x: vertices.reduce((s,v)=>s+v.x,0)/vertices.length, y: vertices.reduce((s,v)=>s+v.y,0)/vertices.length };
  const pts: ShapePt[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    const bulge = edgeCurves[i];
    if (bulge && Math.abs(bulge) > 0.1) {
      const ctrl = bezierControl(vertices[i], vertices[next], bulge, centroid);
      pts.push(...sampleBezier(vertices[i], ctrl, vertices[next], 24).slice(0, -1));
    } else {
      pts.push(vertices[i]);
    }
  }
  return pts;
}

// ─── Build THREE.Shape for fascia extrusion (XY plane, Y flipped) ───────────
function buildShape(vertices: ShapePt[], edgeCurves: Record<number, number>): THREE.Shape {
  const centroid = { x: vertices.reduce((s,v)=>s+v.x,0)/vertices.length, y: vertices.reduce((s,v)=>s+v.y,0)/vertices.length };
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

// ─── Scanline: find X intersections at a given Z (=Y in 2D space) ───────────
function scanlineX(testZ: number, outlinePts: ShapePt[]): number[] {
  const xs: number[] = [];
  const n = outlinePts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const zi = outlinePts[i].y;
    const zj = outlinePts[j].y;
    if ((zi <= testZ && zj > testZ) || (zj <= testZ && zi > testZ)) {
      const t = (testZ - zi) / (zj - zi);
      xs.push(outlinePts[i].x + t * (outlinePts[j].x - outlinePts[i].x));
    }
  }
  xs.sort((a, b) => a - b);
  return xs;
}

// ─── Deck boards (individual planks in world XZ space) ──────────────────────
function DeckBoards({ vertices, edgeCurves }: { vertices: ShapePt[]; edgeCurves: Record<number, number> }) {
  const geometry = useMemo(() => {
    const outlinePts = buildOutlinePoints(vertices, edgeCurves);

    let minZ = Infinity, maxZ = -Infinity;
    for (const p of outlinePts) { minZ = Math.min(minZ, p.y); maxZ = Math.max(maxZ, p.y); }

    const geometries: THREE.BufferGeometry[] = [];

    for (let z = minZ; z < maxZ; z += BOARD_STRIDE) {
      const boardCenterZ = z + BOARD_FACE_WIDTH / 2;
      const xs = scanlineX(boardCenterZ, outlinePts);

      for (let k = 0; k < xs.length - 1; k += 2) {
        const x0 = xs[k], x1 = xs[k + 1];
        const boardLen = x1 - x0;
        if (boardLen < 0.02) continue;

        // BoxGeometry: width=X, height=Y(up), depth=Z
        const geo = new THREE.BoxGeometry(boardLen, BOARD_THICKNESS, BOARD_FACE_WIDTH);
        // Each board gets a tiny unique Y offset to prevent z-fighting between adjacent boards
        const yJitter = (k * 0.0001);
        geo.translate(x0 + boardLen / 2, DECK_Y + BOARD_THICKNESS / 2 + yJitter, z + BOARD_FACE_WIDTH / 2);
        geometries.push(geo);
      }
    }

    if (geometries.length === 0) return null;

    // Merge all boards into one draw call
    const merged = mergeGeometries(geometries);
    for (const g of geometries) g.dispose();
    return merged;
  }, [vertices, edgeCurves]);

  if (!geometry || !geometry.attributes.position) return null;

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial color="#9B7B3C" roughness={0.82} metalness={0} />
    </mesh>
  );
}

// ─── Fascia board (perimeter edge, extruded shape) ───────────────────────────
function DeckFascia({ vertices, edgeCurves }: { vertices: ShapePt[]; edgeCurves: Record<number, number> }) {
  const geometry = useMemo(() => {
    const shape = buildShape(vertices, edgeCurves);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: DECK_Y + BOARD_THICKNESS, // from ground up to top of boards
      bevelEnabled: false,
      curveSegments: 24,
    });
    geo.computeVertexNormals();
    return geo;
  }, [vertices, edgeCurves]);

  // Fascia is in XY plane, rotated to XZ, positioned at ground level
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
      <meshStandardMaterial color="#6B5520" roughness={0.85} metalness={0} />
    </mesh>
  );
}

// ─── Railing posts ──────────────────────────────────────────────────────────
function RailingPosts({ vertices, edgeCurves }: { vertices: ShapePt[]; edgeCurves: Record<number, number> }) {
  const posts = useMemo(() => {
    const centroid = { x: vertices.reduce((s,v)=>s+v.x,0)/vertices.length, y: vertices.reduce((s,v)=>s+v.y,0)/vertices.length };
    const perimeterPts: ShapePt[] = [];

    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      const bulge = edgeCurves[i];
      if (bulge && Math.abs(bulge) > 0.1) {
        const ctrl = bezierControl(vertices[i], vertices[next], bulge, centroid);
        perimeterPts.push(...sampleBezier(vertices[i], ctrl, vertices[next], 12).slice(0, -1));
      } else {
        perimeterPts.push(vertices[i]);
      }
    }

    const postPositions: ShapePt[] = [];
    let accumulated = 0;
    for (let i = 0; i < perimeterPts.length; i++) {
      const next = (i + 1) % perimeterPts.length;
      const dx = perimeterPts[next].x - perimeterPts[i].x;
      const dy = perimeterPts[next].y - perimeterPts[i].y;
      const segLen = Math.sqrt(dx*dx + dy*dy);
      if (accumulated === 0) postPositions.push(perimeterPts[i]);
      accumulated += segLen;
      if (accumulated >= 4) { postPositions.push(perimeterPts[next]); accumulated = 0; }
    }
    return postPositions;
  }, [vertices, edgeCurves]);

  const POST_H = 3.0;
  const BASE_Y = DECK_Y + BOARD_THICKNESS;

  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={[p.x, BASE_Y, p.y]}>
          <mesh position={[0, POST_H / 2, 0]} castShadow>
            <boxGeometry args={[0.3, POST_H, 0.3]} />
            <meshStandardMaterial color="#6B5B3A" roughness={0.8} />
          </mesh>
          <mesh position={[0, POST_H + 0.05, 0]}>
            <boxGeometry args={[0.4, 0.1, 0.4]} />
            <meshStandardMaterial color="#4A3F2A" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {posts.length > 1 && posts.map((p, i) => {
        const next = posts[(i + 1) % posts.length];
        const dx = next.x - p.x, dz = next.y - p.y;
        const len = Math.sqrt(dx*dx + dz*dz);
        const angle = Math.atan2(dz, dx);
        return (
          <mesh
            key={`rail-${i}`}
            position={[(p.x + next.x) / 2, BASE_Y + POST_H - 0.2, (p.y + next.y) / 2]}
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
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

// ─── Simple geometry merge ───────────────────────────────────────────────────
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const valid = geometries.filter(g => g.attributes.position);
  let totalVerts = 0, totalIdx = 0;
  for (const g of valid) {
    totalVerts += g.attributes.position.count;
    totalIdx += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals   = new Float32Array(totalVerts * 3);
  const indices   = new Uint32Array(totalIdx);
  let vOff = 0, iOff = 0;

  for (const g of valid) {
    const pos  = g.attributes.position;
    const norm = g.attributes.normal;
    const idx  = g.index;
    for (let i = 0; i < pos.count * 3; i++) positions[vOff * 3 + i] = (pos.array as Float32Array)[i];
    if (norm) for (let i = 0; i < norm.count * 3; i++) normals[vOff * 3 + i] = (norm.array as Float32Array)[i];
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices[iOff + i] = (idx.array as Uint32Array)[i] + vOff;
      iOff += idx.count;
    } else {
      for (let i = 0; i < pos.count; i++) indices[iOff + i] = vOff + i;
      iOff += pos.count;
    }
    vOff += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal",   new THREE.BufferAttribute(normals,   3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeVertexNormals();
  return merged;
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function Deck3DView({ vertices, edgeCurves = {}, className = "" }: Deck3DViewProps) {
  const controlsRef = useRef<any>(null);

  const { center, distance } = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const v of vertices) {
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
      minZ = Math.min(minZ, v.y); maxZ = Math.max(maxZ, v.y);
    }
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ);
    return { center: [cx, 0, cz] as [number, number, number], distance: span * 1.2 };
  }, [vertices]);

  if (vertices.length < 3) return null;

  return (
    <div
      className={`w-full rounded-lg overflow-hidden bg-slate-900/80 border border-white/10 ${className}`}
      style={{ height: "520px" }}
    >
      <Canvas
        shadows
        camera={{
          position: [center[0] + distance * 0.6, distance * 0.7, center[2] + distance * 0.6],
          fov: 45,
        }}
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

        <Ground />
        <DeckFascia vertices={vertices} edgeCurves={edgeCurves} />
        <DeckBoards vertices={vertices} edgeCurves={edgeCurves} />
        <RailingPosts vertices={vertices} edgeCurves={edgeCurves} />

        <OrbitControls
          ref={controlsRef}
          target={center}
          enablePan
          enableZoom
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
