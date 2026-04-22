/**
 * ESTIMATE STORAGE UTILITY
 * Saves/loads estimate state to localStorage and encodes/decodes shareable URLs.
 * Design: Precision Engineering (dark navy, amber accent)
 */

import type { AudienceType } from "./deckData";

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
  customWidth: number;
  customLength: number;
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

// ─── URL ENCODING ──────────────────────────────────────────────────────────────
// Encodes the snapshot as a compact base64url query param: ?e=<base64url>
// so the full estimate can be shared and restored on any device.

export function encodeEstimateToUrl(snap: EstimateSnapshot): string {
  const payload = JSON.stringify(snap);
  const b64 = btoa(unescape(encodeURIComponent(payload)))
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
    const json = decodeURIComponent(escape(atob(padded)));
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
