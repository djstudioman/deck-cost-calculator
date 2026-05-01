/**
 * Deck3DView — 3D visualization of a custom deck shape
 * Uses @react-three/fiber + drei for rendering
 * Extrudes the 2D polygon into a realistic deck with:
 * - Individual deck boards with wood-grain procedural texture
 * - Simple railing posts around the perimeter
 * - Orbital camera controls
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

// ─── Helper: compute Bézier control point for a curved edge ─────────────────
function bezierControl(a: ShapePt, b: ShapePt, bulge: number, centroid: ShapePt): ShapePt {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Perpendicular (outward from centroid)
  let nx = -dy;
  let ny = dx;
  const len = Math.sqrt(nx * nx + ny * ny) || 1;
  nx /= len;
  ny /= len;
  // Ensure outward direction
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

// ─── Build shape outline with curves ────────────────────────────────────────
function buildOutline(vertices: ShapePt[], edgeCurves: Record<number, number>): THREE.Shape {
  const centroid = {
    x: vertices.reduce((s, v) => s + v.x, 0) / vertices.length,
    y: vertices.reduce((s, v) => s + v.y, 0) / vertices.length,
  };

  const shape = new THREE.Shape();
  shape.moveTo(vertices[0].x, -vertices[0].y); // flip Y for 3D

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

// ─── Deck surface mesh ──────────────────────────────────────────────────────
function DeckSurface({ vertices, edgeCurves }: { vertices: ShapePt[]; edgeCurves: Record<number, number> }) {
  const geometry = useMemo(() => {
    const shape = buildOutline(vertices, edgeCurves);
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.4, // deck board thickness ~5 inches in feet scale
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
      curveSegments: 24,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.computeVertexNormals();
    return geo;
  }, [vertices, edgeCurves]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
      <meshStandardMaterial
        color="#8B6914"
        roughness={0.75}
        metalness={0.0}
      />
    </mesh>
  );
}

// ─── Board lines (grooves between boards) ───────────────────────────────────
function BoardLines({ vertices, edgeCurves }: { vertices: ShapePt[]; edgeCurves: Record<number, number> }) {
  const lines = useMemo(() => {
    // Find bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of vertices) {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }

    // Create horizontal lines every 0.458 ft (5.5 inches) across the shape
    const boardWidth = 5.5 / 12; // 5.5 inches in feet
    const linePositions: number[][] = [];

    for (let y = minY + boardWidth; y < maxY; y += boardWidth) {
      linePositions.push([minX - 1, y, maxX + 1, y]);
    }

    return linePositions;
  }, [vertices]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.41, 0]}>
      {lines.map((line, i) => (
        <mesh key={i} position={[(line[0] + line[2]) / 2, -(line[1] + line[3]) / 2, 0]}>
          <planeGeometry args={[line[2] - line[0], 0.02]} />
          <meshBasicMaterial color="#5C4A0E" opacity={0.6} transparent />
        </mesh>
      ))}
    </group>
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
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

        <DeckSurface vertices={vertices} edgeCurves={edgeCurves} />
        <BoardLines vertices={vertices} edgeCurves={edgeCurves} />
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
