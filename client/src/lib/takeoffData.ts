/**
 * takeoffData.ts — Material Takeoff Data Layer
 * Design: Precision Engineering — exact SKU-level data for contractor material takeoffs.
 *
 * Phase 1: Deck Boards
 * Sources: Trex.com, Fiberon.com, TimberTech.com, contractor pricing guides Q1 2026.
 * All prices are contractor/distributor pricing (not retail), before tax.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface BoardSku {
  id: string;
  brandId: string;           // matches DECKING_BRANDS id in deckData.ts
  manufacturer: string;      // e.g. "Trex", "Fiberon", "TimberTech", "PT Wood"
  productLine: string;       // e.g. "Transcend", "Enhance Basics"
  name: string;              // display name
  nominalWidth: number;      // inches (e.g. 6 for a 1x6)
  actualWidthIn: number;     // actual face width in inches (e.g. 5.5)
  nominalThicknessIn: number;// e.g. 1
  availableLengths: number[];// feet, e.g. [12, 16, 20]
  coveragePerBoard: {        // sq ft of coverage per board at each length
    [lengthFt: number]: number;
  };
  contractorPricePerBoard: { // contractor price per board at each length (USD, 2026)
    [lengthFt: number]: number;
  };
  grooved: boolean;          // true = hidden fastener compatible
  solidOnly: boolean;        // true = face-screw only (no groove)
  notes?: string;
}

export interface TakeoffBoardResult {
  sku: BoardSku;
  boardLengthFt: number;
  deckAreaSqFt: number;
  wasteFactor: number;       // e.g. 0.10 for 10%
  grossAreaSqFt: number;     // deckAreaSqFt * (1 + wasteFactor)
  coveragePerBoard: number;  // sq ft per board
  boardsNeeded: number;      // ceil(grossAreaSqFt / coveragePerBoard)
  boardsEdited: number;      // user-overridable
  unitPrice: number;         // price per board (editable)
  subtotal: number;          // boardsEdited * unitPrice
  taxRate: number;           // e.g. 0.06
  taxAmount: number;
  total: number;             // subtotal + taxAmount
}

// ─── DECK BOARD SKUs ──────────────────────────────────────────────────────────
// Actual face width: 5.5" for 6" nominal composite (standard)
// Coverage per 16' board at 5.5" face = (5.5/12) * 16 = 7.33 sq ft
// Coverage per 12' board at 5.5" face = (5.5/12) * 12 = 5.5 sq ft
// Coverage per 20' board at 5.5" face = (5.5/12) * 20 = 9.17 sq ft

function coverage(widthIn: number, lengthFt: number): number {
  return Math.round(((widthIn / 12) * lengthFt) * 100) / 100;
}

export const DECK_BOARD_SKUS: BoardSku[] = [
  // ── TREX ENHANCE BASICS (solid only, budget) ──
  {
    id: "trex-enhance-basics-6",
    brandId: "trex-enhance-basics",
    manufacturer: "Trex",
    productLine: "Enhance Basics",
    name: "Trex Enhance Basics 1×6",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 18.50,
      16: 24.75,
      20: 30.90,
    },
    grooved: false,
    solidOnly: true,
    notes: "Solid boards only. No hidden fastener groove. Best value for budget builds.",
  },

  // ── FIBERON GOOD LIFE (grooved available) ──
  {
    id: "fiberon-good-life-6-solid",
    brandId: "fiberon-good-life",
    manufacturer: "Fiberon",
    productLine: "Good Life",
    name: "Fiberon Good Life 1×6 Solid",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 22.00,
      16: 29.50,
      20: 36.75,
    },
    grooved: false,
    solidOnly: false,
    notes: "Solid board. Use for picture-frame borders or face-screw installs.",
  },
  {
    id: "fiberon-good-life-6-grooved",
    brandId: "fiberon-good-life",
    manufacturer: "Fiberon",
    productLine: "Good Life",
    name: "Fiberon Good Life 1×6 Grooved",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 24.25,
      16: 32.50,
      20: 40.50,
    },
    grooved: true,
    solidOnly: false,
    notes: "Grooved edge for hidden fastener systems (clips or Cortex).",
  },

  // ── TREX SELECT ──
  {
    id: "trex-select-6-solid",
    brandId: "trex-select",
    manufacturer: "Trex",
    productLine: "Select",
    name: "Trex Select 1×6 Solid",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 26.50,
      16: 35.25,
      20: 44.00,
    },
    grooved: false,
    solidOnly: false,
  },
  {
    id: "trex-select-6-grooved",
    brandId: "trex-select",
    manufacturer: "Trex",
    productLine: "Select",
    name: "Trex Select 1×6 Grooved",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 28.75,
      16: 38.25,
      20: 47.75,
    },
    grooved: true,
    solidOnly: false,
  },

  // ── TREX TRANSCEND ──
  {
    id: "trex-transcend-6-solid",
    brandId: "trex-transcend",
    manufacturer: "Trex",
    productLine: "Transcend",
    name: "Trex Transcend 1×6 Solid",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 38.00,
      16: 50.75,
      20: 63.25,
    },
    grooved: false,
    solidOnly: false,
  },
  {
    id: "trex-transcend-6-grooved",
    brandId: "trex-transcend",
    manufacturer: "Trex",
    productLine: "Transcend",
    name: "Trex Transcend 1×6 Grooved",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 41.50,
      16: 55.25,
      20: 69.00,
    },
    grooved: true,
    solidOnly: false,
  },

  // ── FIBERON PARAMOUNT ──
  {
    id: "fiberon-paramount-6-solid",
    brandId: "fiberon-paramount",
    manufacturer: "Fiberon",
    productLine: "Paramount",
    name: "Fiberon Paramount 1×6 Solid",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 44.00,
      16: 58.75,
      20: 73.25,
    },
    grooved: false,
    solidOnly: false,
  },
  {
    id: "fiberon-paramount-6-grooved",
    brandId: "fiberon-paramount",
    manufacturer: "Fiberon",
    productLine: "Paramount",
    name: "Fiberon Paramount 1×6 Grooved",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 47.50,
      16: 63.25,
      20: 79.00,
    },
    grooved: true,
    solidOnly: false,
  },

  // ── TIMBERTECH AZEK VINTAGE (ultra-premium) ──
  {
    id: "timbertech-azek-vintage-6-solid",
    brandId: "timbertech-azek",
    manufacturer: "TimberTech",
    productLine: "AZEK Vintage",
    name: "TimberTech AZEK Vintage 1×6 Solid",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 68.00,
      16: 90.75,
      20: 113.25,
    },
    grooved: false,
    solidOnly: false,
    notes: "Full PVC. Cellular foam core. Highest scratch/stain resistance.",
  },
  {
    id: "timbertech-azek-vintage-6-grooved",
    brandId: "timbertech-azek",
    manufacturer: "TimberTech",
    productLine: "AZEK Vintage",
    name: "TimberTech AZEK Vintage 1×6 Grooved",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 72.50,
      16: 96.75,
      20: 120.75,
    },
    grooved: true,
    solidOnly: false,
    notes: "Full PVC grooved. Use with Cortex or AZEK-compatible clip system.",
  },

  // ── PT WOOD (for non-composite builds) ──
  {
    id: "pt-wood-5-4x6",
    brandId: "pt-wood",
    manufacturer: "PT Wood",
    productLine: "Pressure Treated",
    name: "PT 5/4×6 Decking (SYP)",
    nominalWidth: 6,
    actualWidthIn: 5.5,
    nominalThicknessIn: 1.25,
    availableLengths: [12, 16, 20],
    coveragePerBoard: {
      12: coverage(5.5, 12),
      16: coverage(5.5, 16),
      20: coverage(5.5, 20),
    },
    contractorPricePerBoard: {
      12: 11.50,
      16: 15.25,
      20: 19.00,
    },
    grooved: false,
    solidOnly: true,
    notes: "Southern Yellow Pine, #2 or better. ACQ/CA treated. Standard face-screw install.",
  },
];

// ─── CALCULATION ──────────────────────────────────────────────────────────────

export interface BoardTakeoffInputs {
  deckAreaSqFt: number;
  sku: BoardSku;
  boardLengthFt: number;
  wasteFactor: number;       // 0.05–0.20
  boardsOverride?: number;   // user-edited board count
  unitPriceOverride?: number;// user-edited unit price
  taxRate: number;           // e.g. 0.06 for 6%
}

export function calculateBoardTakeoff(inputs: BoardTakeoffInputs): TakeoffBoardResult {
  const { deckAreaSqFt, sku, boardLengthFt, wasteFactor, boardsOverride, unitPriceOverride, taxRate } = inputs;

  const coveragePerBoard = sku.coveragePerBoard[boardLengthFt] ?? coverage(sku.actualWidthIn, boardLengthFt);
  const grossAreaSqFt = deckAreaSqFt * (1 + wasteFactor);
  const boardsNeeded = Math.ceil(grossAreaSqFt / coveragePerBoard);
  const boardsEdited = boardsOverride ?? boardsNeeded;
  const unitPrice = unitPriceOverride ?? (sku.contractorPricePerBoard[boardLengthFt] ?? 0);
  const subtotal = boardsEdited * unitPrice;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + taxAmount;

  return {
    sku,
    boardLengthFt,
    deckAreaSqFt,
    wasteFactor,
    grossAreaSqFt: Math.round(grossAreaSqFt * 10) / 10,
    coveragePerBoard: Math.round(coveragePerBoard * 100) / 100,
    boardsNeeded,
    boardsEdited,
    unitPrice,
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate,
    taxAmount,
    total: Math.round(total * 100) / 100,
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Return SKUs available for a given brandId, filtered by grooved preference */
export function getSkusForBrand(brandId: string, groovedOnly?: boolean): BoardSku[] {
  return DECK_BOARD_SKUS.filter(s =>
    s.brandId === brandId &&
    (groovedOnly === undefined || s.grooved === groovedOnly)
  );
}

/** Return the default SKU for a brand (grooved if hidden fasteners, solid otherwise) */
export function getDefaultSku(brandId: string, preferGrooved: boolean): BoardSku | undefined {
  const skus = getSkusForBrand(brandId);
  if (preferGrooved) {
    return skus.find(s => s.grooved) ?? skus[0];
  }
  return skus.find(s => !s.grooved) ?? skus[0];
}

/** Format a dollar amount as currency */
export function formatTakeoffCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

// ─── PHASE 2: FASTENER SKUs ───────────────────────────────────────────────────
// Sources: FastenMaster.com, Deck Screws distributor pricing, contractor quotes Q1 2026.
// All prices are contractor/distributor pricing (not retail), before tax.
//
// Coverage notes:
//   Face screws: ~350–400 screws per 100 sq ft (2 per joist crossing, 16" OC, 6" boards)
//   Generic clips: ~175–200 clips per 100 sq ft (1 clip per board end + 1 per mid-joist)
//   Cortex plugs: 1 plug per screw, same count as face screws (~350–400 per 100 sq ft)

export type FastenerSystemId = "none" | "clip" | "cortex";

export interface FastenerSku {
  id: string;
  systemId: FastenerSystemId;
  brand: string;             // e.g. "FastenMaster", "CAMO", "GRK"
  name: string;
  description: string;
  unit: string;              // "box", "bag", "pack", "bucket"
  qtyPerUnit: number;        // screws/clips/plugs per unit
  coverageSqFtPerUnit: number; // sq ft covered per unit (at 16" OC, 6" boards)
  contractorPricePerUnit: number; // USD, 2026 contractor pricing
  notes?: string;
}

export const FASTENER_SKUS: FastenerSku[] = [

  // ════════════════════════════════════════════════════════════════
  // FACE SCREWS (systemId: "none")
  // ~4 screws/sq ft at 16" OC with 6" boards (2 screws per board per joist)
  // ════════════════════════════════════════════════════════════════

  // ── FASTENMASTER DECK-DRIVE DCU ──
  {
    id: "fastenmaster-dcu-305ss-100ct",
    systemId: "none",
    brand: "FastenMaster",
    name: "Deck-Drive DCU #10 × 3\" 305 SS (100-ct box)",
    description: "FastenMaster Deck-Drive DCU composite screw. 305 stainless, #10 × 3\", star drive. Designed for composite over PT framing. Reverse-thread tip reduces mushrooming.",
    unit: "box",
    qtyPerUnit: 100,
    coverageSqFtPerUnit: 25,
    contractorPricePerUnit: 16.75,
    notes: "100-ct covers ~25 sq ft. Preferred for Trex, Fiberon, TimberTech installs.",
  },
  {
    id: "fastenmaster-dcu-305ss-350ct",
    systemId: "none",
    brand: "FastenMaster",
    name: "Deck-Drive DCU #10 × 3\" 305 SS (350-ct box)",
    description: "FastenMaster Deck-Drive DCU composite screw, bulk box. 305 stainless, #10 × 3\", star drive.",
    unit: "box",
    qtyPerUnit: 350,
    coverageSqFtPerUnit: 87,
    contractorPricePerUnit: 52.00,
    notes: "350-ct covers ~87 sq ft. Best value for mid-size decks (100–300 sq ft).",
  },
  {
    id: "fastenmaster-dcu-305ss-1750ct",
    systemId: "none",
    brand: "FastenMaster",
    name: "Deck-Drive DCU #10 × 3\" 305 SS (1,750-ct bucket)",
    description: "FastenMaster Deck-Drive DCU composite screw, contractor bucket. 305 stainless, #10 × 3\", star drive.",
    unit: "bucket",
    qtyPerUnit: 1750,
    coverageSqFtPerUnit: 437,
    contractorPricePerUnit: 218.00,
    notes: "1,750-ct covers ~437 sq ft. Best value for decks over 400 sq ft.",
  },

  // ── GRK RSS COMPOSITE SCREW ──
  {
    id: "grk-rss-305ss-100ct",
    systemId: "none",
    brand: "GRK Fasteners",
    name: "GRK RSS #10 × 3\" 305 SS (100-ct box)",
    description: "GRK RSS (Rugged Structural Screw) composite deck screw. 305 stainless, #10 × 3\", W-Cut tip, star drive. Self-countersinking head.",
    unit: "box",
    qtyPerUnit: 100,
    coverageSqFtPerUnit: 25,
    contractorPricePerUnit: 15.50,
    notes: "W-Cut tip reduces splitting in PT framing. Star drive prevents cam-out.",
  },
  {
    id: "grk-rss-305ss-500ct",
    systemId: "none",
    brand: "GRK Fasteners",
    name: "GRK RSS #10 × 3\" 305 SS (500-ct bucket)",
    description: "GRK RSS composite deck screw, bulk bucket. 305 stainless, #10 × 3\", W-Cut tip, star drive.",
    unit: "bucket",
    qtyPerUnit: 500,
    coverageSqFtPerUnit: 125,
    contractorPricePerUnit: 64.00,
    notes: "500-ct covers ~125 sq ft. Contractor bulk pricing.",
  },

  // ── STARBORN CAMO DRIVE (face-screw version) ──
  {
    id: "starborn-pro-plug-305ss-100ct",
    systemId: "none",
    brand: "Starborn Industries",
    name: "Starborn Pro Plug #10 × 2-3/4\" 305 SS (100-ct)",
    description: "Starborn Pro Plug System screw for composite decking. 305 stainless, #10 × 2-3/4\", star drive. Countersinks flush for optional plug insert.",
    unit: "box",
    qtyPerUnit: 100,
    coverageSqFtPerUnit: 25,
    contractorPricePerUnit: 17.25,
    notes: "Compatible with Starborn color-matched plugs for a near-hidden look without Cortex pricing.",
  },

  // ════════════════════════════════════════════════════════════════
  // HIDDEN CLIP SYSTEM (systemId: "clip")
  // ~1.8 clips/sq ft at 16" OC with 6" boards
  // ════════════════════════════════════════════════════════════════

  // ── CAMO MARKSMAN PRO ──
  {
    id: "camo-edge-clip-100pk",
    systemId: "clip",
    brand: "CAMO",
    name: "CAMO Edge Clip (100-pack)",
    description: "CAMO Edge Clip for grooved composite decking. Stainless steel clip snaps into board groove and screws to joist. No face screws visible. Use with CAMO Marksman Pro tool.",
    unit: "pack",
    qtyPerUnit: 100,
    coverageSqFtPerUnit: 55,
    contractorPricePerUnit: 24.50,
    notes: "100-pack covers ~55 sq ft. Compatible with most 1×6 grooved composite boards.",
  },
  {
    id: "camo-edge-clip-500pk",
    systemId: "clip",
    brand: "CAMO",
    name: "CAMO Edge Clip (500-pack)",
    description: "CAMO Edge Clip bulk pack for grooved composite decking. Stainless steel, snap-in design.",
    unit: "pack",
    qtyPerUnit: 500,
    coverageSqFtPerUnit: 275,
    contractorPricePerUnit: 104.00,
    notes: "500-pack covers ~275 sq ft. Best value for decks over 250 sq ft.",
  },

  // ── EB-TY HIDDEN DECK FASTENER ──
  {
    id: "ebty-hidden-clip-175pk",
    systemId: "clip",
    brand: "EB-TY",
    name: "EB-TY Hidden Deck Fastener (175-pack)",
    description: "EB-TY biscuit-style hidden fastener. Fits into a biscuit slot routed in the board edge. Provides a consistent 1/4\" gap. Works with grooved or biscuit-slotted boards.",
    unit: "pack",
    qtyPerUnit: 175,
    coverageSqFtPerUnit: 97,
    contractorPricePerUnit: 44.00,
    notes: "Requires biscuit slot or compatible groove. Consistent spacing without a guide tool.",
  },

  // ── TREX HIDEAWAY UNIVERSAL ──
  {
    id: "trex-hideaway-universal-175pk",
    systemId: "clip",
    brand: "Trex",
    name: "Trex Hideaway Universal Fastener (175-pack)",
    description: "Trex-branded universal hidden fastener. Fits Trex grooved boards and most other grooved 1×6 composite decking. Stainless steel clip.",
    unit: "pack",
    qtyPerUnit: 175,
    coverageSqFtPerUnit: 97,
    contractorPricePerUnit: 46.00,
    notes: "Trex recommends 1 pack per 50 sq ft (conservative). Our calc uses actual coverage rate.",
  },

  // ── FIBERON PHANTOM CLIP ──
  {
    id: "fiberon-phantom-clip-100pk",
    systemId: "clip",
    brand: "Fiberon",
    name: "Fiberon Phantom Hidden Fastener (100-pack)",
    description: "Fiberon-branded hidden clip for Fiberon grooved composite boards. Stainless steel, snap-in design.",
    unit: "pack",
    qtyPerUnit: 100,
    coverageSqFtPerUnit: 55,
    contractorPricePerUnit: 26.00,
    notes: "Designed for Fiberon Good Life, Horizon, and Paramount grooved boards.",
  },

  // ════════════════════════════════════════════════════════════════
  // CORTEX BY FASTENMASTER (systemId: "cortex")
  // ~4 screws+plugs/sq ft — same density as face screws
  // ════════════════════════════════════════════════════════════════

  {
    id: "cortex-composite-100pk",
    systemId: "cortex",
    brand: "FastenMaster",
    name: "Cortex for Composite — 100-pack",
    description: "Cortex by FastenMaster hidden fastening system. Countersinks a #10 screw below the surface, then inserts a color-matched composite plug flush with the board face. No visible fasteners.",
    unit: "pack",
    qtyPerUnit: 100,
    coverageSqFtPerUnit: 25,
    contractorPricePerUnit: 38.50,
    notes: "100-pack: 100 screws + 100 plugs. Specify board color when ordering.",
  },
  {
    id: "cortex-composite-350pk",
    systemId: "cortex",
    brand: "FastenMaster",
    name: "Cortex for Composite — 350-pack",
    description: "Cortex by FastenMaster, bulk pack. Countersinks screw + inserts color-matched plug. Best value for 100–300 sq ft decks.",
    unit: "pack",
    qtyPerUnit: 350,
    coverageSqFtPerUnit: 87,
    contractorPricePerUnit: 118.00,
    notes: "350-pack covers ~87 sq ft. Includes installation guide.",
  },
  {
    id: "cortex-composite-1750pk",
    systemId: "cortex",
    brand: "FastenMaster",
    name: "Cortex for Composite — 1,750-pack (Contractor)",
    description: "Cortex by FastenMaster, contractor bulk pack. Color-matched plugs included. Best value for large decks over 400 sq ft.",
    unit: "pack",
    qtyPerUnit: 1750,
    coverageSqFtPerUnit: 437,
    contractorPricePerUnit: 498.00,
    notes: "1,750-pack covers ~437 sq ft. Best value for large decks.",
  },

  // ── CORTEX FOR TIMBERTECH / AZEK ──
  {
    id: "cortex-azek-100pk",
    systemId: "cortex",
    brand: "FastenMaster",
    name: "Cortex for AZEK/TimberTech — 100-pack",
    description: "Cortex by FastenMaster, formulated for AZEK PVC and TimberTech composite boards. Color-matched PVC plugs. Drill, countersink, screw, plug.",
    unit: "pack",
    qtyPerUnit: 100,
    coverageSqFtPerUnit: 25,
    contractorPricePerUnit: 41.00,
    notes: "Use for TimberTech AZEK Vintage and other PVC boards. Specify AZEK color.",
  },
  {
    id: "cortex-azek-350pk",
    systemId: "cortex",
    brand: "FastenMaster",
    name: "Cortex for AZEK/TimberTech — 350-pack",
    description: "Cortex by FastenMaster for AZEK/PVC, bulk pack. Color-matched PVC plugs.",
    unit: "pack",
    qtyPerUnit: 350,
    coverageSqFtPerUnit: 87,
    contractorPricePerUnit: 128.00,
    notes: "350-pack covers ~87 sq ft. Best value for mid-size AZEK decks.",
  },
];

// ─── FASTENER CALCULATION ─────────────────────────────────────────────────────

export interface FastenerTakeoffInputs {
  deckAreaSqFt: number;
  systemId: FastenerSystemId;
  selectedSkuId: string;
  qtyOverride?: number;
  unitPriceOverride?: number;
  taxRate: number;
  wasteFactor?: number;       // default 0.05 (5% extra for drops/waste)
}

export interface FastenerTakeoffResult {
  sku: FastenerSku;
  deckAreaSqFt: number;
  systemId: FastenerSystemId;
  grossAreaSqFt: number;
  unitsNeeded: number;
  unitsEdited: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export function calculateFastenerTakeoff(inputs: FastenerTakeoffInputs): FastenerTakeoffResult {
  const { deckAreaSqFt, selectedSkuId, qtyOverride, unitPriceOverride, taxRate, wasteFactor = 0.05 } = inputs;

  const sku = FASTENER_SKUS.find(s => s.id === selectedSkuId) ?? FASTENER_SKUS[0];
  const grossAreaSqFt = deckAreaSqFt * (1 + wasteFactor);
  const unitsNeeded = Math.ceil(grossAreaSqFt / sku.coverageSqFtPerUnit);
  const unitsEdited = qtyOverride ?? unitsNeeded;
  const unitPrice = unitPriceOverride ?? sku.contractorPricePerUnit;
  const subtotal = unitsEdited * unitPrice;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + taxAmount;

  return {
    sku,
    deckAreaSqFt,
    systemId: sku.systemId,
    grossAreaSqFt: Math.round(grossAreaSqFt * 10) / 10,
    unitsNeeded,
    unitsEdited,
    unitPrice,
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate,
    taxAmount,
    total: Math.round(total * 100) / 100,
  };
}

/** Return fastener SKUs for a given system */
export function getFastenerSkusForSystem(systemId: FastenerSystemId): FastenerSku[] {
  return FASTENER_SKUS.filter(s => s.systemId === systemId);
}

/** Return the default (best-value) SKU for a system and deck area */
export function getDefaultFastenerSku(systemId: FastenerSystemId, deckAreaSqFt: number): FastenerSku {
  const skus = getFastenerSkusForSystem(systemId);
  if (skus.length === 0) return FASTENER_SKUS[0];
  // Pick the largest pack that doesn't massively over-order (covers ≤ 3× the deck area)
  const sorted = [...skus].sort((a, b) => b.coverageSqFtPerUnit - a.coverageSqFtPerUnit);
  return sorted.find(s => s.coverageSqFtPerUnit <= deckAreaSqFt * 2) ?? sorted[sorted.length - 1];
}

/** Human-readable label for a fastener system */
export function fastenerSystemLabel(systemId: FastenerSystemId): string {
  if (systemId === "clip") return "Hidden Clip System";
  if (systemId === "cortex") return "Cortex by FastenMaster";
  return "Face Screws";
}
