/**
 * ESTIMATE STORAGE UTILITY
 * Saves/loads estimate state to localStorage and encodes/decodes shareable URLs.
 * Design: Precision Engineering (dark navy, amber accent)
 */

import type { AudienceType } from "./deckData";
import type { ShapePt } from "@/components/ShapeBuilder";

export interface EstimateSnapshot {
  id: string;           // short unique key (8 hex chars)
  name: string;         // user-provided label
  savedAt: number;      // unix ms timestamp
  // wizard state
  audience: AudienceType;
  regionId: string;
  sizeId: string;
  tierId: string;
  complexityId: string;
  railingId: string | null;
  railingLF: number;
  deckHeightIn: number;
  includeRailing: boolean;
  includeStairs: boolean;
  stairSteps: number;
  stairWidthFt: number;
  includeStairRailing: boolean;
  skillLevelId: string;
  selectedTools: string[];
  includePermit: boolean;
  permitCost: number;
  markupTierId: string;
  includeMarkup: boolean;
  crewSizeId: string;
  includeCrew: boolean;
  subFootings: boolean;
  framingId: string;
  marketTierId: string;
  customWidth: number;
  customLength: number;
  isMultiLevel: boolean;
  level2SizeId: string;
  level2CustomWidth: number;
  level2CustomLength: number;
  // Brand / fastener / edge board (contractor only)
  brandId?: string;
  includeHiddenFasteners?: boolean;
  fastenerSystemId?: "none" | "clip" | "cortex";
  edgeBoardType?: "solid" | "grooved";
  // Joist spacing (contractor only)
  joistSpacingIn?: 12 | 16 | 24;
  // 3D rendering (contractor only)
  rendering3dTier?: "none" | "basic" | "professional" | "premium";
  // Railing detail (contractor only)
  postMountId?: "surface" | "fascia";
  postSpacingFt?: 4 | 6 | 8;
  railingHeightIn?: 36 | 42;
  // Footing spec (contractor only)
  footingDiameterIn?: 8 | 10 | 12 | 16;
  useHelicalPiers?: boolean;
  // Engineer fee (all paths)
  includeEngineer?: boolean;
  engineerCost?: number;
  engineerCostMode?: "preset" | "custom";
  notes?: string;           // optional free-text context
  shapeVertices?: ShapePt[]; // custom shape polygon vertices (feet)
  // result snapshot (for display in the saved list)
  totalLow: number;
  totalHigh: number;
}

const STORAGE_KEY = "deck_estimates_v1";

function genId(): string {
  return Math.random().toString(16).slice(2, 10);
}

export function loadAllEstimates(): EstimateSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EstimateSnapshot[];
  } catch {
    return [];
  }
}

export function saveEstimate(snap: Omit<EstimateSnapshot, "id" | "savedAt">): EstimateSnapshot {
  const full: EstimateSnapshot = { ...snap, id: genId(), savedAt: Date.now() };
  const all = loadAllEstimates();
  all.unshift(full); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 20))); // cap at 20
  return full;
}

export function deleteEstimate(id: string): void {
  const all = loadAllEstimates().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function renameEstimate(id: string, name: string): void {
  const all = loadAllEstimates().map((e) => (e.id === id ? { ...e, name } : e));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function updateEstimateNotes(id: string, notes: string): void {
  const all = loadAllEstimates().map((e) => (e.id === id ? { ...e, notes } : e));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// ─── URL ENCODING ──────────────────────────────────────────────────────────────
// Encodes the snapshot as a compact base64url query param: ?e=<base64url>
// so the full estimate can be shared and restored on any device.

export function encodeEstimateToUrl(snap: EstimateSnapshot): string {
  const payload = JSON.stringify(snap);
  // Modern encoding: TextEncoder handles all Unicode correctly (replaces deprecated unescape)
  const bytes = new TextEncoder().encode(payload);
  const b64 = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("e", b64);
  return url.toString();
}

export function decodeEstimateFromUrl(): EstimateSnapshot | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get("e");
    if (!b64) return null;
    const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
    // Modern decoding: TextDecoder handles all Unicode correctly (replaces deprecated escape)
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as EstimateSnapshot;
  } catch {
    return null;
  }
}

export function clearUrlParam(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("e");
  window.history.replaceState({}, "", url.toString());
}

export function formatSavedDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
