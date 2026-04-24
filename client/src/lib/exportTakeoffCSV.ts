// ─── exportTakeoffCSV.ts ──────────────────────────────────────────────────────
// Builds a structured CSV from all 7 Material Takeoff phases and triggers a
// browser download. The CSV is designed to open cleanly in Excel, Google
// Sheets, and Numbers.
//
// Column layout:
//   Phase | Category | SKU / Item | Description | Unit | Qty | Unit Price | Subtotal
//
// Each phase ends with a blank row, and the file closes with a grand total row.

import type {
  TakeoffBoardResult,
  MultiFastenerTakeoffResult,
  LumberTakeoffResult,
  FootingTakeoffResult,
  RailingTakeoffResult,
  StairTakeoffResult,
  HardwareTakeoffResult,
  BoardSku,
  LumberSku,
  ConcreteSku,
  PostBaseSku,
  RailingSku,
  StairSku,
  HardwareSku,
} from "./takeoffData";
import { fastenerCategoryLabel } from "./takeoffData";

// ─── helpers ─────────────────────────────────────────────────────────────────

function esc(value: string | number): string {
  const str = String(value);
  // Wrap in quotes if the value contains a comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...cells: (string | number)[]): string {
  return cells.map(esc).join(",");
}

function blank(): string {
  return "";
}

function currency(n: number): string {
  return `$${n.toFixed(2)}`;
}

// ─── main export function ─────────────────────────────────────────────────────

export interface TakeoffExportData {
  // Phase 1
  boardSku: BoardSku;
  boardTakeoff: TakeoffBoardResult;
  wasteFactor: number;
  // Phase 2
  fastenerTakeoff: MultiFastenerTakeoffResult;
  // Phase 3
  lumberSku: LumberSku;
  lumberTakeoff: LumberTakeoffResult;
  joistLengthFt: number;
  joistSpacingLabel: string;
  // Phase 4
  footingConcreteSku: ConcreteSku;
  footingPostBaseSku: PostBaseSku;
  footingTakeoff: FootingTakeoffResult;
  tubeDiameterIn: number;
  footingDepthIn: number;
  // Phase 5
  railingSkus: { component: string; sku: RailingSku }[];
  railingTakeoff: RailingTakeoffResult;
  railingLF: number;
  railingBrand: string;
  // Phase 6
  treadSku: StairSku;
  stringerSku: StairSku;
  bracketSku: StairSku;
  treadHardwareSku: StairSku;
  stairTakeoff: StairTakeoffResult;
  // Phase 7
  joistHangerSku: HardwareSku;
  postCapSku: HardwareSku;
  ledgerFlashingSku: HardwareSku;
  structuralScrewSku: HardwareSku;
  joistTapeSku: HardwareSku;
  hardwareTakeoff: HardwareTakeoffResult;
  ledgerLF: number;
  // Shared
  taxRate: number;
  grandTotal: number;
  projectLabel: string; // e.g. "320 sq ft Composite Deck — Mid-Atlantic"
}

export function exportTakeoffCSV(data: TakeoffExportData): void {
  const lines: string[] = [];
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // ── Header ──
  lines.push(row("DeckCost 2026 — Material Takeoff Export"));
  lines.push(row("Project", data.projectLabel));
  lines.push(row("Generated", now));
  lines.push(row("Tax Rate", `${(data.taxRate * 100).toFixed(2)}%`));
  lines.push(blank());
  lines.push(row("Phase", "Category", "SKU / Item", "Description", "Unit", "Qty", "Unit Price", "Subtotal"));

  // ── Phase 1: Deck Boards ──
  lines.push(blank());
  lines.push(row("PHASE 1 — DECK BOARDS", "", "", "", "", "", "", ""));
  lines.push(row(
    "1", "Deck Boards",
    data.boardSku.name,
    `${data.boardSku.productLine} · ${data.boardSku.manufacturer} · ${data.boardTakeoff.boardLengthFt}ft boards`,
    "board",
    data.boardTakeoff.boardsEdited,
    currency(data.boardTakeoff.unitPrice),
    currency(data.boardTakeoff.subtotal),
  ));
  lines.push(row("", "", `Waste factor: ${((data.wasteFactor - 1) * 100).toFixed(0)}%`, "", "", "", "", ""));
  lines.push(row("", "", "Phase 1 Subtotal (materials)", "", "", "", "", currency(data.boardTakeoff.subtotal)));
  lines.push(row("", "", `Sales tax (${(data.taxRate * 100).toFixed(2)}%)`, "", "", "", "", currency(data.boardTakeoff.taxAmount)));
  lines.push(row("", "", "Phase 1 TOTAL", "", "", "", "", currency(data.boardTakeoff.total)));

  // ── Phase 2: Fasteners (multi-line) ──
  lines.push(blank());
  lines.push(row("PHASE 2 — FASTENERS", "", "", "", "", "", "", ""));
  for (const [cat, lineResult] of Object.entries(data.fastenerTakeoff.lines)) {
    if (!lineResult) continue;
    lines.push(row(
      "2", fastenerCategoryLabel(cat),
      lineResult.sku.name,
      `${lineResult.sku.brand} · ${lineResult.basisLabel}`,
      lineResult.sku.unit,
      lineResult.unitsEdited,
      currency(lineResult.unitPrice),
      currency(lineResult.subtotal),
    ));
  }
  lines.push(row("", "", "Phase 2 Subtotal (materials)", "", "", "", "", currency(data.fastenerTakeoff.subtotal)));
  lines.push(row("", "", `Sales tax (${(data.taxRate * 100).toFixed(2)}%)`, "", "", "", "", currency(data.fastenerTakeoff.taxAmount)));
  lines.push(row("", "", "Phase 2 TOTAL", "", "", "", "", currency(data.fastenerTakeoff.total)));

  // ── Phase 3: Framing Lumber ──
  lines.push(blank());
  lines.push(row("PHASE 3 — FRAMING LUMBER", "", "", "", "", "", "", ""));
  lines.push(row(
    "3", "Joists",
    data.lumberSku.name,
    `${data.lumberSku.manufacturer} · ${data.lumberSku.productLine} · ${data.joistLengthFt}ft · ${data.joistSpacingLabel} OC`,
    "board",
    data.lumberTakeoff.joistQtyEdited,
    currency(data.lumberTakeoff.joistUnitPrice),
    currency(data.lumberTakeoff.joistSubtotal),
  ));
  lines.push(row("", "", `Board feet: ${data.lumberTakeoff.joistBoardFeet.toFixed(1)} BF`, "", "", "", "", ""));
  lines.push(row("", "", "Phase 3 Subtotal (materials)", "", "", "", "", currency(data.lumberTakeoff.subtotal)));
  lines.push(row("", "", `Sales tax (${(data.taxRate * 100).toFixed(2)}%)`, "", "", "", "", currency(data.lumberTakeoff.taxAmount)));
  lines.push(row("", "", "Phase 3 TOTAL", "", "", "", "", currency(data.lumberTakeoff.total)));

  // ── Phase 4: Concrete & Footings ──
  lines.push(blank());
  lines.push(row("PHASE 4 — CONCRETE & FOOTINGS", "", "", "", "", "", "", ""));
  lines.push(row(
    "4", "Concrete Bags",
    data.footingConcreteSku.name,
    `${data.footingConcreteSku.manufacturer} · ${data.tubeDiameterIn}" tube · ${data.footingDepthIn}" deep`,
    `${data.footingConcreteSku.bagWeightLb} lb bag`,
    data.footingTakeoff.totalBagsEdited,
    currency(data.footingTakeoff.concretePricePerBag),
    currency(data.footingTakeoff.concreteSubtotal),
  ));
  lines.push(row(
    "4", "Post Bases",
    data.footingPostBaseSku.name,
    `${data.footingPostBaseSku.manufacturer} · ${data.footingPostBaseSku.description}`,
    "each",
    data.footingTakeoff.postBaseCount,
    currency(data.footingTakeoff.postBasePriceEach),
    currency(data.footingTakeoff.postBaseSubtotal),
  ));
  lines.push(row("", "", "Phase 4 Subtotal (materials)", "", "", "", "", currency(data.footingTakeoff.subtotal)));
  lines.push(row("", "", `Sales tax (${(data.taxRate * 100).toFixed(2)}%)`, "", "", "", "", currency(data.footingTakeoff.taxAmount)));
  lines.push(row("", "", "Phase 4 TOTAL", "", "", "", "", currency(data.footingTakeoff.total)));

  // ── Phase 5: Railing ──
  lines.push(blank());
  lines.push(row("PHASE 5 — RAILING", "", "", "", "", "", "", ""));
  lines.push(row("", "", `Brand: ${data.railingBrand} · ${data.railingLF} LF`, "", "", "", "", ""));
  data.railingSkus.forEach(({ component, sku }) => {
    lines.push(row(
      "5", component,
      sku.name,
      `${sku.manufacturer} · ${sku.productLine}`,
      sku.unit,
      "", // qty is per-component in railing takeoff
      currency(sku.contractorPricePerUnit),
      "",
    ));
  });
  lines.push(row("", "", "Phase 5 Subtotal (materials)", "", "", "", "", currency(data.railingTakeoff.subtotal)));
  lines.push(row("", "", `Sales tax (${(data.taxRate * 100).toFixed(2)}%)`, "", "", "", "", currency(data.railingTakeoff.taxAmount)));
  lines.push(row("", "", "Phase 5 TOTAL", "", "", "", "", currency(data.railingTakeoff.total)));

  // ── Phase 6: Stairs ──
  lines.push(blank());
  lines.push(row("PHASE 6 — STAIRS", "", "", "", "", "", "", ""));
  lines.push(row(
    "6", "Stair Treads",
    data.treadSku.name,
    `${data.treadSku.manufacturer} · ${data.treadSku.description}`,
    data.treadSku.unit,
    data.stairTakeoff.treadQtyEdited,
    currency(data.stairTakeoff.treadUnitPrice),
    currency(data.stairTakeoff.treadSubtotal),
  ));
  lines.push(row(
    "6", "Stringers",
    data.stringerSku.name,
    `${data.stringerSku.manufacturer} · ${data.stringerSku.description}`,
    data.stringerSku.unit,
    data.stairTakeoff.stringerCountEdited,
    currency(data.stairTakeoff.stringerUnitPrice),
    currency(data.stairTakeoff.stringerSubtotal),
  ));
  lines.push(row(
    "6", "Stringer Brackets",
    data.bracketSku.name,
    `${data.bracketSku.manufacturer} · ${data.bracketSku.description}`,
    data.bracketSku.unit,
    data.stairTakeoff.stringerBracketQtyEdited,
    currency(data.stairTakeoff.stringerBracketUnitPrice),
    currency(data.stairTakeoff.stringerBracketSubtotal),
  ));
  lines.push(row(
    "6", "Tread Fasteners",
    data.treadHardwareSku.name,
    `${data.treadHardwareSku.manufacturer} · ${data.treadHardwareSku.description}`,
    data.treadHardwareSku.unit,
    data.stairTakeoff.treadHardwareQtyEdited,
    currency(data.stairTakeoff.treadHardwareUnitPrice),
    currency(data.stairTakeoff.treadHardwareSubtotal),
  ));
  lines.push(row("6", "", `Steps: ${data.stairTakeoff.stepCountEdited} · Stringers: ${data.stairTakeoff.stringerCountCalc}`, "", "", "", "", ""));
  lines.push(row("", "", "Phase 6 Subtotal (materials)", "", "", "", "", currency(data.stairTakeoff.subtotal)));
  lines.push(row("", "", `Sales tax (${(data.taxRate * 100).toFixed(2)}%)`, "", "", "", "", currency(data.stairTakeoff.taxAmount)));
  lines.push(row("", "", "Phase 6 TOTAL", "", "", "", "", currency(data.stairTakeoff.total)));

  // ── Phase 7: Hardware & Misc ──
  lines.push(blank());
  lines.push(row("PHASE 7 — HARDWARE & MISC", "", "", "", "", "", "", ""));
  lines.push(row(
    "7", "Joist Hangers",
    data.joistHangerSku.name,
    `${data.joistHangerSku.manufacturer} · ${data.joistHangerSku.description}`,
    data.joistHangerSku.unit,
    data.hardwareTakeoff.joistHangerQtyEdited,
    currency(data.hardwareTakeoff.joistHangerUnitPrice),
    currency(data.hardwareTakeoff.joistHangerSubtotal),
  ));
  lines.push(row(
    "7", "Post Caps / Bases",
    data.postCapSku.name,
    `${data.postCapSku.manufacturer} · ${data.postCapSku.description}`,
    data.postCapSku.unit,
    data.hardwareTakeoff.postCapQtyEdited,
    currency(data.hardwareTakeoff.postCapUnitPrice),
    currency(data.hardwareTakeoff.postCapSubtotal),
  ));
  lines.push(row(
    "7", "Ledger Flashing",
    data.ledgerFlashingSku.name,
    `${data.ledgerFlashingSku.manufacturer} · ${data.ledgerFlashingSku.description} · ${data.ledgerLF} LF`,
    data.ledgerFlashingSku.unit,
    data.hardwareTakeoff.ledgerFlashingQtyEdited,
    currency(data.hardwareTakeoff.ledgerFlashingUnitPrice),
    currency(data.hardwareTakeoff.ledgerFlashingSubtotal),
  ));
  lines.push(row(
    "7", "Structural Screws",
    data.structuralScrewSku.name,
    `${data.structuralScrewSku.manufacturer} · ${data.structuralScrewSku.description}`,
    data.structuralScrewSku.unit,
    data.hardwareTakeoff.structuralScrewQtyEdited,
    currency(data.hardwareTakeoff.structuralScrewUnitPrice),
    currency(data.hardwareTakeoff.structuralScrewSubtotal),
  ));
  lines.push(row(
    "7", "Joist & Beam Tape",
    data.joistTapeSku.name,
    `${data.joistTapeSku.manufacturer} · ${data.joistTapeSku.description}`,
    data.joistTapeSku.unit,
    data.hardwareTakeoff.joistTapeQtyEdited,
    currency(data.hardwareTakeoff.joistTapeUnitPrice),
    currency(data.hardwareTakeoff.joistTapeSubtotal),
  ));
  lines.push(row("", "", "Phase 7 Subtotal (materials)", "", "", "", "", currency(data.hardwareTakeoff.subtotal)));
  lines.push(row("", "", `Sales tax (${(data.taxRate * 100).toFixed(2)}%)`, "", "", "", "", currency(data.hardwareTakeoff.taxAmount)));
  lines.push(row("", "", "Phase 7 TOTAL", "", "", "", "", currency(data.hardwareTakeoff.total)));

  // ── Grand Total ──
  lines.push(blank());
  lines.push(row("COMPLETE MATERIAL TAKEOFF — ALL 7 PHASES", "", "", "", "", "", "", ""));
  lines.push(row("", "", "Phase 1 — Deck Boards", "", "", "", "", currency(data.boardTakeoff.total)));
  lines.push(row("", "", "Phase 2 — Fasteners", "", "", "", "", currency(data.fastenerTakeoff.total)));
  lines.push(row("", "", "Phase 3 — Framing Lumber", "", "", "", "", currency(data.lumberTakeoff.total)));
  lines.push(row("", "", "Phase 4 — Concrete & Footings", "", "", "", "", currency(data.footingTakeoff.total)));
  lines.push(row("", "", "Phase 5 — Railing", "", "", "", "", currency(data.railingTakeoff.total)));
  lines.push(row("", "", "Phase 6 — Stairs", "", "", "", "", currency(data.stairTakeoff.total)));
  lines.push(row("", "", "Phase 7 — Hardware & Misc", "", "", "", "", currency(data.hardwareTakeoff.total)));
  lines.push(row("", "", "GRAND TOTAL (materials + tax)", "", "", "", "", currency(data.grandTotal)));
  lines.push(blank());
  lines.push(row("", "", "Materials only — excludes labor, permits, and equipment rental", "", "", "", "", ""));
  lines.push(row("", "", "Generated by DeckCost 2026 · deckcostcalculator.manus.space", "", "", "", "", ""));

  // ── Trigger download ──
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeLabel = data.projectLabel.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase();
  link.href = url;
  link.download = `deckcost-takeoff-${safeLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
