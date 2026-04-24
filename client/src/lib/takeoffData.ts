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

// ─── PHASE 3: FRAMING LUMBER SKUs ────────────────────────────────────────────
// Framing lumber for deck joists, beams, and rim boards.
// Species: SYP (Southern Yellow Pine) — dominant in SE/Mid-Atlantic/Midwest
//          HF/DF (Hem-Fir / Douglas Fir) — dominant in West/PNW
// Treatment: ACQ (Alkaline Copper Quaternary) or CA (Copper Azole), AWPA UC4A/B
// Sizes: 2×6, 2×8, 2×10, 2×12 — joists; 4×6, 4×8 — beams
// Lengths: 8', 10', 12', 16', 20'
//
// Joist spacing: 12" OC, 16" OC, 24" OC
// Joist count formula: ceil(deckWidthFt / spacingFt) + 1 (for rim joists × 2)
// Board feet: (thickness × width × lengthFt) / 12
//
// 2026 contractor/distributor pricing (before tax):
//   SYP #2 PT 2×6: ~$0.85–$1.10/LF
//   SYP #2 PT 2×8: ~$1.20–$1.55/LF
//   SYP #2 PT 2×10: ~$1.65–$2.10/LF
//   SYP #2 PT 2×12: ~$2.20–$2.80/LF
//   DF/HF PT 2×6: ~$1.05–$1.35/LF
//   DF/HF PT 2×8: ~$1.45–$1.85/LF
//   DF/HF PT 2×10: ~$1.90–$2.45/LF
//   DF/HF PT 2×12: ~$2.55–$3.25/LF

export interface LumberSku {
  id: string;
  manufacturer: string;    // e.g. "Severe Weather", "WeatherShield", "ProWood", "Generic SYP", "Generic DF"
  productLine: string;     // e.g. "ACQ Treated SYP", "CA-C Treated DF"
  name: string;            // display name
  species: string;         // "SYP" | "Hem-Fir" | "Douglas Fir"
  treatment: string;       // "ACQ" | "CA-C" | "CA-B"
  grade: string;           // "#2 & Better" | "Select Structural"
  nominalSize: string;     // e.g. "2×6", "2×8", "2×10", "2×12"
  nominalThicknessIn: number; // 2
  nominalWidthIn: number;     // 6, 8, 10, 12
  actualThicknessIn: number;  // 1.5
  actualWidthIn: number;      // 5.5, 7.25, 9.25, 11.25
  availableLengths: number[]; // feet
  contractorPricePerLF: number; // USD per linear foot, 2026 contractor pricing
  boardFeetPerLF: number;     // (nominalThickness × nominalWidth) / 12
  use: "joist" | "beam" | "rim" | "ledger" | "post"; // primary structural use
  notes?: string;
}

export interface LumberTakeoffInputs {
  deckAreaSqFt: number;
  deckWidthFt: number;      // shorter dimension (joist span direction)
  deckLengthFt: number;     // longer dimension (joist run direction)
  joistSpacingIn: number;   // 12, 16, or 24
  joistSku: LumberSku;
  joistLengthFt: number;    // selected joist length
  rimSku: LumberSku;        // rim joist (same size as joist, typically)
  joistQtyOverride?: number;
  joistPriceOverride?: number;
  rimQtyOverride?: number;
  rimPriceOverride?: number;
  taxRate: number;
}

export interface LumberTakeoffResult {
  // Joists
  joistSpacingIn: number;
  joistCount: number;         // field joists only
  joistLengthFt: number;
  joistBoardFeet: number;
  joistUnitPrice: number;     // per piece (LF × pricePerLF)
  joistQtyEdited: number;
  joistSubtotal: number;
  // Rim joists (2 pieces, full deck length)
  rimCount: number;           // always 2
  rimLengthFt: number;        // deckLengthFt
  rimBoardFeet: number;
  rimUnitPrice: number;
  rimQtyEdited: number;
  rimSubtotal: number;
  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  totalBoardFeet: number;
}

export function calculateLumberTakeoff(inputs: LumberTakeoffInputs): LumberTakeoffResult {
  const {
    deckWidthFt, deckLengthFt, joistSpacingIn,
    joistSku, joistLengthFt, rimSku,
    joistQtyOverride, joistPriceOverride,
    rimQtyOverride, rimPriceOverride,
    taxRate,
  } = inputs;

  const spacingFt = joistSpacingIn / 12;
  // Field joists: span the width, spaced along the length
  const joistCountCalc = Math.ceil(deckLengthFt / spacingFt) + 1;
  const joistCount = joistQtyOverride ?? joistCountCalc;
  const joistUnitPrice = joistPriceOverride ?? (joistSku.contractorPricePerLF * joistLengthFt);
  const joistSubtotal = joistCount * joistUnitPrice;
  const joistBoardFeet = joistCount * joistSku.boardFeetPerLF * joistLengthFt;

  // Rim joists: 2 pieces, each the full deck length
  const rimLengthFt = deckLengthFt;
  const rimCountCalc = 2;
  const rimCount = rimQtyOverride ?? rimCountCalc;
  const rimUnitPrice = rimPriceOverride ?? (rimSku.contractorPricePerLF * rimLengthFt);
  const rimSubtotal = rimCount * rimUnitPrice;
  const rimBoardFeet = rimCount * rimSku.boardFeetPerLF * rimLengthFt;

  const subtotal = Math.round((joistSubtotal + rimSubtotal) * 100) / 100;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + taxAmount;
  const totalBoardFeet = Math.round((joistBoardFeet + rimBoardFeet) * 10) / 10;

  return {
    joistSpacingIn,
    joistCount,
    joistLengthFt,
    joistBoardFeet: Math.round(joistBoardFeet * 10) / 10,
    joistUnitPrice: Math.round(joistUnitPrice * 100) / 100,
    joistQtyEdited: joistCount,
    joistSubtotal: Math.round(joistSubtotal * 100) / 100,
    rimCount,
    rimLengthFt,
    rimBoardFeet: Math.round(rimBoardFeet * 10) / 10,
    rimUnitPrice: Math.round(rimUnitPrice * 100) / 100,
    rimQtyEdited: rimCount,
    rimSubtotal: Math.round(rimSubtotal * 100) / 100,
    subtotal,
    taxRate,
    taxAmount,
    total: Math.round(total * 100) / 100,
    totalBoardFeet,
  };
}

// ─── LUMBER SKU CATALOG ───────────────────────────────────────────────────────

export const LUMBER_SKUS: LumberSku[] = [

  // ════════════════════════════════════════════════════════════════
  // SEVERE WEATHER (Lowe's exclusive, SYP, ACQ/CA treated)
  // ════════════════════════════════════════════════════════════════
  {
    id: "severe-weather-syp-2x6",
    manufacturer: "Severe Weather",
    productLine: "ACQ Treated SYP",
    name: "Severe Weather 2×6 #2 PT SYP",
    species: "SYP",
    treatment: "ACQ",
    grade: "#2 & Better",
    nominalSize: "2×6",
    nominalThicknessIn: 2,
    nominalWidthIn: 6,
    actualThicknessIn: 1.5,
    actualWidthIn: 5.5,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 0.98,
    boardFeetPerLF: (2 * 6) / 12,
    use: "joist",
    notes: "Lowe's exclusive brand. ACQ treated, AWPA UC4A. Kiln-dried after treatment (KDAT).",
  },
  {
    id: "severe-weather-syp-2x8",
    manufacturer: "Severe Weather",
    productLine: "ACQ Treated SYP",
    name: "Severe Weather 2×8 #2 PT SYP",
    species: "SYP",
    treatment: "ACQ",
    grade: "#2 & Better",
    nominalSize: "2×8",
    nominalThicknessIn: 2,
    nominalWidthIn: 8,
    actualThicknessIn: 1.5,
    actualWidthIn: 7.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 1.38,
    boardFeetPerLF: (2 * 8) / 12,
    use: "joist",
    notes: "Most common joist size for 8–12 ft spans at 16\" OC.",
  },
  {
    id: "severe-weather-syp-2x10",
    manufacturer: "Severe Weather",
    productLine: "ACQ Treated SYP",
    name: "Severe Weather 2×10 #2 PT SYP",
    species: "SYP",
    treatment: "ACQ",
    grade: "#2 & Better",
    nominalSize: "2×10",
    nominalThicknessIn: 2,
    nominalWidthIn: 10,
    actualThicknessIn: 1.5,
    actualWidthIn: 9.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 1.88,
    boardFeetPerLF: (2 * 10) / 12,
    use: "joist",
    notes: "Spans 10–14 ft at 16\" OC. Common for mid-size decks.",
  },
  {
    id: "severe-weather-syp-2x12",
    manufacturer: "Severe Weather",
    productLine: "ACQ Treated SYP",
    name: "Severe Weather 2×12 #2 PT SYP",
    species: "SYP",
    treatment: "ACQ",
    grade: "#2 & Better",
    nominalSize: "2×12",
    nominalThicknessIn: 2,
    nominalWidthIn: 12,
    actualThicknessIn: 1.5,
    actualWidthIn: 11.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 2.48,
    boardFeetPerLF: (2 * 12) / 12,
    use: "joist",
    notes: "Spans 14–18 ft at 16\" OC. Large decks and elevated structures.",
  },

  // ════════════════════════════════════════════════════════════════
  // WEATHERSHIELD (Home Depot exclusive, SYP, CA-C treated)
  // ════════════════════════════════════════════════════════════════
  {
    id: "weathershield-syp-2x6",
    manufacturer: "WeatherShield",
    productLine: "CA-C Treated SYP",
    name: "WeatherShield 2×6 #2 PT SYP",
    species: "SYP",
    treatment: "CA-C",
    grade: "#2 & Better",
    nominalSize: "2×6",
    nominalThicknessIn: 2,
    nominalWidthIn: 6,
    actualThicknessIn: 1.5,
    actualWidthIn: 5.5,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 0.95,
    boardFeetPerLF: (2 * 6) / 12,
    use: "joist",
    notes: "Home Depot exclusive. CA-C treatment, low odor, paintable.",
  },
  {
    id: "weathershield-syp-2x8",
    manufacturer: "WeatherShield",
    productLine: "CA-C Treated SYP",
    name: "WeatherShield 2×8 #2 PT SYP",
    species: "SYP",
    treatment: "CA-C",
    grade: "#2 & Better",
    nominalSize: "2×8",
    nominalThicknessIn: 2,
    nominalWidthIn: 8,
    actualThicknessIn: 1.5,
    actualWidthIn: 7.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 1.32,
    boardFeetPerLF: (2 * 8) / 12,
    use: "joist",
  },
  {
    id: "weathershield-syp-2x10",
    manufacturer: "WeatherShield",
    productLine: "CA-C Treated SYP",
    name: "WeatherShield 2×10 #2 PT SYP",
    species: "SYP",
    treatment: "CA-C",
    grade: "#2 & Better",
    nominalSize: "2×10",
    nominalThicknessIn: 2,
    nominalWidthIn: 10,
    actualThicknessIn: 1.5,
    actualWidthIn: 9.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 1.82,
    boardFeetPerLF: (2 * 10) / 12,
    use: "joist",
  },
  {
    id: "weathershield-syp-2x12",
    manufacturer: "WeatherShield",
    productLine: "CA-C Treated SYP",
    name: "WeatherShield 2×12 #2 PT SYP",
    species: "SYP",
    treatment: "CA-C",
    grade: "#2 & Better",
    nominalSize: "2×12",
    nominalThicknessIn: 2,
    nominalWidthIn: 12,
    actualThicknessIn: 1.5,
    actualWidthIn: 11.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 2.42,
    boardFeetPerLF: (2 * 12) / 12,
    use: "joist",
  },

  // ════════════════════════════════════════════════════════════════
  // PROWOOD (national distributor brand, SYP, MCA treated)
  // ════════════════════════════════════════════════════════════════
  {
    id: "prowood-syp-2x6",
    manufacturer: "ProWood",
    productLine: "MCA Treated SYP",
    name: "ProWood 2×6 #2 PT SYP",
    species: "SYP",
    treatment: "MCA",
    grade: "#2 & Better",
    nominalSize: "2×6",
    nominalThicknessIn: 2,
    nominalWidthIn: 6,
    actualThicknessIn: 1.5,
    actualWidthIn: 5.5,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 0.92,
    boardFeetPerLF: (2 * 6) / 12,
    use: "joist",
    notes: "MCA (Micronized Copper Azole). Clean, light-colored, low-corrosion. Available at independent lumber yards.",
  },
  {
    id: "prowood-syp-2x8",
    manufacturer: "ProWood",
    productLine: "MCA Treated SYP",
    name: "ProWood 2×8 #2 PT SYP",
    species: "SYP",
    treatment: "MCA",
    grade: "#2 & Better",
    nominalSize: "2×8",
    nominalThicknessIn: 2,
    nominalWidthIn: 8,
    actualThicknessIn: 1.5,
    actualWidthIn: 7.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 1.28,
    boardFeetPerLF: (2 * 8) / 12,
    use: "joist",
  },
  {
    id: "prowood-syp-2x10",
    manufacturer: "ProWood",
    productLine: "MCA Treated SYP",
    name: "ProWood 2×10 #2 PT SYP",
    species: "SYP",
    treatment: "MCA",
    grade: "#2 & Better",
    nominalSize: "2×10",
    nominalThicknessIn: 2,
    nominalWidthIn: 10,
    actualThicknessIn: 1.5,
    actualWidthIn: 9.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 1.78,
    boardFeetPerLF: (2 * 10) / 12,
    use: "joist",
  },
  {
    id: "prowood-syp-2x12",
    manufacturer: "ProWood",
    productLine: "MCA Treated SYP",
    name: "ProWood 2×12 #2 PT SYP",
    species: "SYP",
    treatment: "MCA",
    grade: "#2 & Better",
    nominalSize: "2×12",
    nominalThicknessIn: 2,
    nominalWidthIn: 12,
    actualThicknessIn: 1.5,
    actualWidthIn: 11.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 2.38,
    boardFeetPerLF: (2 * 12) / 12,
    use: "joist",
  },

  // ════════════════════════════════════════════════════════════════
  // WESTERN WOOD (Hem-Fir / Douglas Fir — West Coast / PNW)
  // ════════════════════════════════════════════════════════════════
  {
    id: "western-wood-hf-2x6",
    manufacturer: "Western Wood",
    productLine: "CA-B Treated Hem-Fir",
    name: "Western Wood 2×6 #2 PT Hem-Fir",
    species: "Hem-Fir",
    treatment: "CA-B",
    grade: "#2 & Better",
    nominalSize: "2×6",
    nominalThicknessIn: 2,
    nominalWidthIn: 6,
    actualThicknessIn: 1.5,
    actualWidthIn: 5.5,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 1.12,
    boardFeetPerLF: (2 * 6) / 12,
    use: "joist",
    notes: "Dominant species in Pacific NW and West. Lighter weight than SYP. CA-B treatment.",
  },
  {
    id: "western-wood-hf-2x8",
    manufacturer: "Western Wood",
    productLine: "CA-B Treated Hem-Fir",
    name: "Western Wood 2×8 #2 PT Hem-Fir",
    species: "Hem-Fir",
    treatment: "CA-B",
    grade: "#2 & Better",
    nominalSize: "2×8",
    nominalThicknessIn: 2,
    nominalWidthIn: 8,
    actualThicknessIn: 1.5,
    actualWidthIn: 7.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 1.58,
    boardFeetPerLF: (2 * 8) / 12,
    use: "joist",
  },
  {
    id: "western-wood-hf-2x10",
    manufacturer: "Western Wood",
    productLine: "CA-B Treated Hem-Fir",
    name: "Western Wood 2×10 #2 PT Hem-Fir",
    species: "Hem-Fir",
    treatment: "CA-B",
    grade: "#2 & Better",
    nominalSize: "2×10",
    nominalThicknessIn: 2,
    nominalWidthIn: 10,
    actualThicknessIn: 1.5,
    actualWidthIn: 9.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 2.12,
    boardFeetPerLF: (2 * 10) / 12,
    use: "joist",
  },
  {
    id: "western-wood-hf-2x12",
    manufacturer: "Western Wood",
    productLine: "CA-B Treated Hem-Fir",
    name: "Western Wood 2×12 #2 PT Hem-Fir",
    species: "Hem-Fir",
    treatment: "CA-B",
    grade: "#2 & Better",
    nominalSize: "2×12",
    nominalThicknessIn: 2,
    nominalWidthIn: 12,
    actualThicknessIn: 1.5,
    actualWidthIn: 11.25,
    availableLengths: [8, 10, 12, 16, 20],
    contractorPricePerLF: 2.82,
    boardFeetPerLF: (2 * 12) / 12,
    use: "joist",
    notes: "Spans 14–18 ft at 16\" OC. Select Structural grade recommended for long spans.",
  },
];

/** Return lumber SKUs grouped by manufacturer */
export function getLumberSkusByManufacturer(): Record<string, LumberSku[]> {
  const groups: Record<string, LumberSku[]> = {};
  LUMBER_SKUS.forEach(sku => {
    if (!groups[sku.manufacturer]) groups[sku.manufacturer] = [];
    groups[sku.manufacturer].push(sku);
  });
  return groups;
}

/** Return the default joist SKU for a given deck area (picks 2×8 SYP as the standard) */
export function getDefaultLumberSku(): LumberSku {
  return LUMBER_SKUS.find(s => s.id === "severe-weather-syp-2x8") ?? LUMBER_SKUS[0];
}

/** Derive deck width and length from sqFt (assume square-ish, width = shorter side) */
export function estimateDeckDimensions(sqFt: number): { widthFt: number; lengthFt: number } {
  // Use the SIZE_OPTIONS dimensions if possible; otherwise approximate
  const knownSizes: Record<number, { w: number; l: number }> = {
    100:  { w: 10, l: 10 },
    192:  { w: 12, l: 16 },
    320:  { w: 16, l: 20 },
    480:  { w: 20, l: 24 },
    600:  { w: 20, l: 30 },
  };
  if (knownSizes[sqFt]) return { widthFt: knownSizes[sqFt].w, lengthFt: knownSizes[sqFt].l };
  const side = Math.sqrt(sqFt);
  return { widthFt: Math.round(side), lengthFt: Math.round(sqFt / Math.round(side)) };
}

// ─── PHASE 4: CONCRETE & FOOTINGS SKUs ───────────────────────────────────────
// Footing types: tube form (Sonotube / Quik-Tube) poured in place
// Concrete mix: 60 lb bag (~0.45 cu ft), 80 lb bag (~0.60 cu ft)
// Fast-setting: 50 lb bag (~0.375 cu ft) — no mixing required
//
// Tube form diameters: 8", 10", 12", 16"
// Typical footing depths: 12"–48" depending on frost line
//
// Bag count formula per footing:
//   cylinderVolumeCuFt = π × (diameterIn/2/12)² × depthFt
//   bagsNeeded = ceil(cylinderVolumeCuFt / bagYieldCuFt) + 10% waste
//
// Post base hardware: Simpson Strong-Tie ABA, ABU, CB, PBS series
//
// 2026 contractor/distributor pricing (before tax):
//   Quikrete 60 lb: ~$5.50–$6.50/bag
//   Quikrete 80 lb: ~$7.00–$8.50/bag
//   Quikrete Fast-Setting 50 lb: ~$8.00–$9.50/bag
//   Sakrete 60 lb: ~$5.25–$6.25/bag
//   Sakrete 80 lb: ~$6.75–$8.25/bag
//   Sakrete Fast-Setting 50 lb: ~$7.75–$9.25/bag

export interface ConcreteSku {
  id: string;
  manufacturer: string;      // "Quikrete" | "Sakrete"
  productLine: string;       // e.g. "Standard Concrete Mix", "Fast-Setting Concrete"
  name: string;
  description: string;
  bagWeightLb: number;       // 50, 60, 80
  yieldCuFt: number;         // cubic feet per bag
  isFastSetting: boolean;    // true = no mixing, pour dry into hole
  contractorPricePerBag: number; // USD, 2026 contractor pricing
  notes?: string;
}

export interface PostBaseSku {
  id: string;
  manufacturer: string;      // "Simpson Strong-Tie"
  productLine: string;       // e.g. "ABA Series", "ABU Series"
  name: string;
  description: string;
  postSize: string;           // "4×4" | "6×6" | "4×4 & 6×6"
  adjustable: boolean;
  contractorPriceEach: number;
  notes?: string;
}

export interface FootingTakeoffInputs {
  postCount: number;
  tubeDiameterIn: number;    // 8, 10, 12, 16
  footingDepthFt: number;    // frost-line depth
  concreteSku: ConcreteSku;
  postBaseSku: PostBaseSku;
  concreteQtyOverride?: number;  // bags
  concretePriceOverride?: number;
  postBaseQtyOverride?: number;
  postBasePriceOverride?: number;
  taxRate: number;
}

export interface FootingTakeoffResult {
  postCount: number;
  tubeDiameterIn: number;
  footingDepthFt: number;
  volumePerFootingCuFt: number;
  bagsPerFooting: number;
  totalBagsCalc: number;
  totalBagsEdited: number;
  concretePricePerBag: number;
  concreteSubtotal: number;
  postBaseCount: number;
  postBasePriceEach: number;
  postBaseSubtotal: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export function calculateFootingTakeoff(inputs: FootingTakeoffInputs): FootingTakeoffResult {
  const {
    postCount, tubeDiameterIn, footingDepthFt,
    concreteSku, postBaseSku,
    concreteQtyOverride, concretePriceOverride,
    postBaseQtyOverride, postBasePriceOverride,
    taxRate,
  } = inputs;

  const radiusFt = (tubeDiameterIn / 2) / 12;
  const volumePerFootingCuFt = Math.round(Math.PI * radiusFt * radiusFt * footingDepthFt * 100) / 100;
  const bagsPerFooting = Math.ceil(volumePerFootingCuFt / concreteSku.yieldCuFt);
  const totalBagsCalc = Math.ceil(bagsPerFooting * postCount * 1.10); // 10% waste
  const totalBagsEdited = concreteQtyOverride ?? totalBagsCalc;
  const concretePricePerBag = concretePriceOverride ?? concreteSku.contractorPricePerBag;
  const concreteSubtotal = Math.round(totalBagsEdited * concretePricePerBag * 100) / 100;

  const postBaseCount = postBaseQtyOverride ?? postCount;
  const postBasePriceEach = postBasePriceOverride ?? postBaseSku.contractorPriceEach;
  const postBaseSubtotal = Math.round(postBaseCount * postBasePriceEach * 100) / 100;

  const subtotal = Math.round((concreteSubtotal + postBaseSubtotal) * 100) / 100;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    postCount,
    tubeDiameterIn,
    footingDepthFt,
    volumePerFootingCuFt,
    bagsPerFooting,
    totalBagsCalc,
    totalBagsEdited,
    concretePricePerBag,
    concreteSubtotal,
    postBaseCount,
    postBasePriceEach,
    postBaseSubtotal,
    subtotal,
    taxRate,
    taxAmount,
    total,
  };
}

// ─── CONCRETE SKU CATALOG ─────────────────────────────────────────────────────

export const CONCRETE_SKUS: ConcreteSku[] = [

  // ════════════════════════════════════════════════════════════════
  // QUIKRETE
  // ════════════════════════════════════════════════════════════════
  {
    id: "quikrete-concrete-60",
    manufacturer: "Quikrete",
    productLine: "Standard Concrete Mix",
    name: "Quikrete Concrete Mix 60 lb",
    description: "All-purpose 4000 PSI concrete mix. Mix with water in a wheelbarrow or mixer.",
    bagWeightLb: 60,
    yieldCuFt: 0.45,
    isFastSetting: false,
    contractorPricePerBag: 5.98,
    notes: "Most common bag size. Good for standard footings with mixing.",
  },
  {
    id: "quikrete-concrete-80",
    manufacturer: "Quikrete",
    productLine: "Standard Concrete Mix",
    name: "Quikrete Concrete Mix 80 lb",
    description: "All-purpose 4000 PSI concrete mix. Higher yield per bag, fewer bags needed.",
    bagWeightLb: 80,
    yieldCuFt: 0.60,
    isFastSetting: false,
    contractorPricePerBag: 7.48,
    notes: "Best value per cubic foot. Requires mixer for large pours.",
  },
  {
    id: "quikrete-fast-setting-50",
    manufacturer: "Quikrete",
    productLine: "Fast-Setting Concrete",
    name: "Quikrete Fast-Setting Concrete 50 lb",
    description: "No mixing required. Pour dry mix into hole, add water on top. Sets in 20–40 min.",
    bagWeightLb: 50,
    yieldCuFt: 0.375,
    isFastSetting: true,
    contractorPricePerBag: 8.98,
    notes: "Ideal for post bases and tube forms. No mixing — pour dry, add water.",
  },
  {
    id: "quikrete-fast-setting-80",
    manufacturer: "Quikrete",
    productLine: "Fast-Setting Concrete",
    name: "Quikrete Fast-Setting Concrete 80 lb",
    description: "No mixing required. Larger bag for deeper footings. Sets in 20–40 min.",
    bagWeightLb: 80,
    yieldCuFt: 0.60,
    isFastSetting: true,
    contractorPricePerBag: 12.48,
    notes: "Best fast-set value per cubic foot. Saves significant labor time.",
  },
  {
    id: "quikrete-5000-60",
    manufacturer: "Quikrete",
    productLine: "High-Strength 5000 Mix",
    name: "Quikrete 5000 High-Early Strength 60 lb",
    description: "5000 PSI at 28 days. Achieves working strength in 24 hours. Ideal for cold weather.",
    bagWeightLb: 60,
    yieldCuFt: 0.45,
    isFastSetting: false,
    contractorPricePerBag: 7.28,
    notes: "Premium mix for high-load footings or cold-weather pours.",
  },
  {
    id: "quikrete-5000-80",
    manufacturer: "Quikrete",
    productLine: "High-Strength 5000 Mix",
    name: "Quikrete 5000 High-Early Strength 80 lb",
    description: "5000 PSI at 28 days. Higher yield, fewer bags. Best for large-diameter footings.",
    bagWeightLb: 80,
    yieldCuFt: 0.60,
    isFastSetting: false,
    contractorPricePerBag: 9.48,
    notes: "Best performance per cubic foot. Recommended for 12\"+ diameter footings.",
  },

  // ════════════════════════════════════════════════════════════════
  // SAKRETE
  // ════════════════════════════════════════════════════════════════
  {
    id: "sakrete-concrete-60",
    manufacturer: "Sakrete",
    productLine: "Standard Concrete Mix",
    name: "Sakrete Concrete Mix 60 lb",
    description: "4000 PSI all-purpose concrete mix. Consistent blend of sand, gravel, and cement.",
    bagWeightLb: 60,
    yieldCuFt: 0.45,
    isFastSetting: false,
    contractorPricePerBag: 5.78,
    notes: "Slightly lower price than Quikrete. Available at Lowe's and independent yards.",
  },
  {
    id: "sakrete-concrete-80",
    manufacturer: "Sakrete",
    productLine: "Standard Concrete Mix",
    name: "Sakrete Concrete Mix 80 lb",
    description: "4000 PSI all-purpose concrete mix. Best value per cubic foot in the Sakrete line.",
    bagWeightLb: 80,
    yieldCuFt: 0.60,
    isFastSetting: false,
    contractorPricePerBag: 7.18,
    notes: "Best Sakrete value per cubic foot.",
  },
  {
    id: "sakrete-fast-setting-50",
    manufacturer: "Sakrete",
    productLine: "Fast-Setting Concrete",
    name: "Sakrete Fast-Setting Concrete 50 lb",
    description: "No mixing required. Pour dry into hole, add water. Sets in 20–40 min.",
    bagWeightLb: 50,
    yieldCuFt: 0.375,
    isFastSetting: true,
    contractorPricePerBag: 8.68,
    notes: "Competitive alternative to Quikrete Fast-Setting.",
  },
  {
    id: "sakrete-fast-setting-80",
    manufacturer: "Sakrete",
    productLine: "Fast-Setting Concrete",
    name: "Sakrete Fast-Setting Concrete 80 lb",
    description: "No mixing required. Larger bag for deeper footings. Sets in 20–40 min.",
    bagWeightLb: 80,
    yieldCuFt: 0.60,
    isFastSetting: true,
    contractorPricePerBag: 11.98,
    notes: "Good fast-set value for larger footings.",
  },
  {
    id: "sakrete-5000-plus-60",
    manufacturer: "Sakrete",
    productLine: "5000 Plus Concrete",
    name: "Sakrete 5000 Plus Concrete 60 lb",
    description: "5000 PSI high-strength mix. Achieves 3500 PSI in 24 hours.",
    bagWeightLb: 60,
    yieldCuFt: 0.45,
    isFastSetting: false,
    contractorPricePerBag: 7.08,
    notes: "Sakrete's premium mix. Good for frost-heave-prone regions.",
  },
  {
    id: "sakrete-5000-plus-80",
    manufacturer: "Sakrete",
    productLine: "5000 Plus Concrete",
    name: "Sakrete 5000 Plus Concrete 80 lb",
    description: "5000 PSI high-strength mix. Best yield in the Sakrete premium line.",
    bagWeightLb: 80,
    yieldCuFt: 0.60,
    isFastSetting: false,
    contractorPricePerBag: 9.18,
    notes: "Best Sakrete premium value per cubic foot.",
  },
];

// ─── POST BASE SKU CATALOG ────────────────────────────────────────────────────

export const POST_BASE_SKUS: PostBaseSku[] = [
  {
    id: "simpson-aba44",
    manufacturer: "Simpson Strong-Tie",
    productLine: "ABA Series — Adjustable",
    name: "Simpson ABA44 Adjustable Post Base 4×4",
    description: "Standoff post base with 1\" standoff to prevent end-grain moisture contact. Adjustable ±1.5\" for alignment.",
    postSize: "4×4",
    adjustable: true,
    contractorPriceEach: 14.98,
    notes: "Most popular post base for deck posts. Allows post alignment after concrete sets.",
  },
  {
    id: "simpson-aba66",
    manufacturer: "Simpson Strong-Tie",
    productLine: "ABA Series — Adjustable",
    name: "Simpson ABA66 Adjustable Post Base 6×6",
    description: "Heavy-duty standoff post base for 6×6 posts. ±1.5\" adjustment for alignment.",
    postSize: "6×6",
    adjustable: true,
    contractorPriceEach: 21.48,
    notes: "Required for elevated decks and heavy beam loads.",
  },
  {
    id: "simpson-abu44",
    manufacturer: "Simpson Strong-Tie",
    productLine: "ABU Series — Standoff",
    name: "Simpson ABU44 Standoff Post Base 4×4",
    description: "Fixed standoff post base. 1\" standoff, concealed fasteners on two sides.",
    postSize: "4×4",
    adjustable: false,
    contractorPriceEach: 11.28,
    notes: "Lower profile than ABA. Good when post location is precisely known.",
  },
  {
    id: "simpson-abu66",
    manufacturer: "Simpson Strong-Tie",
    productLine: "ABU Series — Standoff",
    name: "Simpson ABU66 Standoff Post Base 6×6",
    description: "Fixed standoff post base for 6×6 posts. Concealed fasteners on two sides.",
    postSize: "6×6",
    adjustable: false,
    contractorPriceEach: 16.78,
    notes: "Fixed position — set anchor bolt precisely before pour.",
  },
  {
    id: "simpson-cb44",
    manufacturer: "Simpson Strong-Tie",
    productLine: "CB Series — Column Base",
    name: "Simpson CB44 Column Base 4×4",
    description: "Flush column base. Post sits flush with concrete surface. No standoff.",
    postSize: "4×4",
    adjustable: false,
    contractorPriceEach: 8.98,
    notes: "Budget option. Not recommended for ground-contact — use with sealed post end.",
  },
  {
    id: "simpson-cb66",
    manufacturer: "Simpson Strong-Tie",
    productLine: "CB Series — Column Base",
    name: "Simpson CB66 Column Base 6×6",
    description: "Flush column base for 6×6 posts. Post sits flush with concrete surface.",
    postSize: "6×6",
    adjustable: false,
    contractorPriceEach: 13.48,
    notes: "Budget option for 6×6. Use with sealed post end to prevent moisture wicking.",
  },
  {
    id: "simpson-pbs44",
    manufacturer: "Simpson Strong-Tie",
    productLine: "PBS Series — Post Base Standoff",
    name: "Simpson PBS44 Post Base Standoff 4×4",
    description: "Elevated standoff post base. 3\" standoff keeps post well above concrete and water.",
    postSize: "4×4",
    adjustable: false,
    contractorPriceEach: 16.48,
    notes: "Best moisture protection. Ideal for coastal or high-humidity regions.",
  },
  {
    id: "simpson-pbs66",
    manufacturer: "Simpson Strong-Tie",
    productLine: "PBS Series — Post Base Standoff",
    name: "Simpson PBS66 Post Base Standoff 6×6",
    description: "Elevated standoff post base for 6×6. 3\" standoff for maximum moisture protection.",
    postSize: "6×6",
    adjustable: false,
    contractorPriceEach: 23.98,
    notes: "Premium moisture protection for 6×6 posts in wet climates.",
  },
];

/** Group concrete SKUs by manufacturer */
export function getConcreteSkusByManufacturer(): Record<string, ConcreteSku[]> {
  const groups: Record<string, ConcreteSku[]> = {};
  CONCRETE_SKUS.forEach(sku => {
    if (!groups[sku.manufacturer]) groups[sku.manufacturer] = [];
    groups[sku.manufacturer].push(sku);
  });
  return groups;
}

/** Group post base SKUs by product line */
export function getPostBaseSkusByProductLine(): Record<string, PostBaseSku[]> {
  const groups: Record<string, PostBaseSku[]> = {};
  POST_BASE_SKUS.forEach(sku => {
    if (!groups[sku.productLine]) groups[sku.productLine] = [];
    groups[sku.productLine].push(sku);
  });
  return groups;
}

/** Default concrete SKU — Quikrete Fast-Setting 50 lb */
export function getDefaultConcreteSku(): ConcreteSku {
  return CONCRETE_SKUS.find(s => s.id === "quikrete-fast-setting-50") ?? CONCRETE_SKUS[0];
}

/** Default post base SKU — Simpson ABA44 */
export function getDefaultPostBaseSku(): PostBaseSku {
  return POST_BASE_SKUS.find(s => s.id === "simpson-aba44") ?? POST_BASE_SKUS[0];
}

/** Estimate post count from deck area (1 post per ~64 sq ft, min 4) */
export function estimatePostCount(deckAreaSqFt: number): number {
  return Math.max(4, Math.ceil(deckAreaSqFt / 64));
}

// ─── PHASE 5: RAILING SKUs ────────────────────────────────────────────────────
// Railing systems: composite (Trex Transcend, TimberTech Impression Rail)
// Components: posts, post sleeves, top rail, bottom rail, balusters, post caps
//
// Standard railing section: 6 ft or 8 ft between posts
// Baluster spacing: max 4" on center (IRC code)
// Baluster count per section: floor((sectionLengthIn - 1.5) / (4 + 1.5)) + 1
//   where 1.5" = baluster width, 4" = max clear space
//   Simplified: ~2 balusters per linear foot
//
// Post spacing: typically 6 ft OC (max 8 ft for some systems)
// Post count: ceil(railingLF / postSpacingFt) + 1
//
// 2026 contractor/distributor pricing (before tax):
//   Trex Transcend composite post sleeve 4×4: ~$45–$55
//   Trex Transcend top/bottom rail 6': ~$28–$35
//   Trex Transcend baluster 32": ~$5–$7
//   Trex Transcend post cap: ~$12–$18
//   TimberTech Impression composite post sleeve 4×4: ~$42–$52
//   TimberTech Impression top/bottom rail 6': ~$26–$33
//   TimberTech Impression baluster 36": ~$5–$7
//   TimberTech Impression post cap: ~$11–$16

export type RailingComponentType = "post-sleeve" | "top-rail" | "bottom-rail" | "baluster" | "post-cap" | "rail-kit" | "post-hardware";

export interface RailingSku {
  id: string;
  manufacturer: string;        // "Trex" | "TimberTech"
  productLine: string;         // "Transcend Railing" | "Impression Rail"
  name: string;
  description: string;
  componentType: RailingComponentType;
  unit: string;                // "each", "8-ft section", "6-ft section", "box of 32"
  lengthFt?: number;           // for rail sections
  color?: string;              // e.g. "Vintage Lantern", "Classic White"
  contractorPricePerUnit: number;
  notes?: string;
}

export interface RailingTakeoffInputs {
  railingLF: number;           // total linear feet of railing
  postSpacingFt: number;       // 6 or 8
  postSku: RailingSku;
  topRailSku: RailingSku;
  bottomRailSku: RailingSku;
  balustrSku: RailingSku;
  postCapSku: RailingSku;
  // overrides
  postQtyOverride?: number;
  topRailQtyOverride?: number;
  bottomRailQtyOverride?: number;
  balustrQtyOverride?: number;
  postCapQtyOverride?: number;
  taxRate: number;
}

export interface RailingTakeoffResult {
  railingLF: number;
  postSpacingFt: number;
  // Posts
  postCountCalc: number;
  postCountEdited: number;
  postUnitPrice: number;
  postSubtotal: number;
  // Top rail
  topRailSectionsCalc: number;
  topRailSectionsEdited: number;
  topRailUnitPrice: number;
  topRailSubtotal: number;
  // Bottom rail
  bottomRailSectionsCalc: number;
  bottomRailSectionsEdited: number;
  bottomRailUnitPrice: number;
  bottomRailSubtotal: number;
  // Balusters
  balustrCountCalc: number;
  balustrCountEdited: number;
  balustrUnitPrice: number;
  balustrSubtotal: number;
  // Post caps
  postCapCountCalc: number;
  postCapCountEdited: number;
  postCapUnitPrice: number;
  postCapSubtotal: number;
  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export function calculateRailingTakeoff(inputs: RailingTakeoffInputs): RailingTakeoffResult {
  const {
    railingLF, postSpacingFt,
    postSku, topRailSku, bottomRailSku, balustrSku, postCapSku,
    postQtyOverride, topRailQtyOverride, bottomRailQtyOverride,
    balustrQtyOverride, postCapQtyOverride,
    taxRate,
  } = inputs;

  // Posts: one at each end + one every postSpacingFt
  const postCountCalc = Math.ceil(railingLF / postSpacingFt) + 1;
  const postCountEdited = postQtyOverride ?? postCountCalc;
  const postUnitPrice = postSku.contractorPricePerUnit;
  const postSubtotal = Math.round(postCountEdited * postUnitPrice * 100) / 100;

  // Rail sections: total LF / section length, rounded up
  const railSectionLengthFt = topRailSku.lengthFt ?? 8;
  const topRailSectionsCalc = Math.ceil(railingLF / railSectionLengthFt);
  const topRailSectionsEdited = topRailQtyOverride ?? topRailSectionsCalc;
  const topRailUnitPrice = topRailSku.contractorPricePerUnit;
  const topRailSubtotal = Math.round(topRailSectionsEdited * topRailUnitPrice * 100) / 100;

  const bottomRailSectionLengthFt = bottomRailSku.lengthFt ?? 8;
  const bottomRailSectionsCalc = Math.ceil(railingLF / bottomRailSectionLengthFt);
  const bottomRailSectionsEdited = bottomRailQtyOverride ?? bottomRailSectionsCalc;
  const bottomRailUnitPrice = bottomRailSku.contractorPricePerUnit;
  const bottomRailSubtotal = Math.round(bottomRailSectionsEdited * bottomRailUnitPrice * 100) / 100;

  // Balusters: ~2 per linear foot (4" OC spacing, 1.5" baluster width)
  const balustrCountCalc = Math.ceil(railingLF * 2);
  const balustrCountEdited = balustrQtyOverride ?? balustrCountCalc;
  const balustrUnitPrice = balustrSku.contractorPricePerUnit;
  const balustrSubtotal = Math.round(balustrCountEdited * balustrUnitPrice * 100) / 100;

  // Post caps: one per post
  const postCapCountCalc = postCountCalc;
  const postCapCountEdited = postCapQtyOverride ?? postCapCountCalc;
  const postCapUnitPrice = postCapSku.contractorPricePerUnit;
  const postCapSubtotal = Math.round(postCapCountEdited * postCapUnitPrice * 100) / 100;

  const subtotal = Math.round((postSubtotal + topRailSubtotal + bottomRailSubtotal + balustrSubtotal + postCapSubtotal) * 100) / 100;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    railingLF, postSpacingFt,
    postCountCalc, postCountEdited, postUnitPrice, postSubtotal,
    topRailSectionsCalc, topRailSectionsEdited, topRailUnitPrice, topRailSubtotal,
    bottomRailSectionsCalc, bottomRailSectionsEdited, bottomRailUnitPrice, bottomRailSubtotal,
    balustrCountCalc, balustrCountEdited, balustrUnitPrice, balustrSubtotal,
    postCapCountCalc, postCapCountEdited, postCapUnitPrice, postCapSubtotal,
    subtotal, taxRate, taxAmount, total,
  };
}

// ─── RAILING SKU CATALOG ──────────────────────────────────────────────────────

export const RAILING_SKUS: RailingSku[] = [

  // ════════════════════════════════════════════════════════════════
  // TREX — Transcend Railing
  // ════════════════════════════════════════════════════════════════

  // Post sleeves (wrap a 4×4 structural post)
  {
    id: "trex-transcend-post-sleeve-white",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Post Sleeve 4×4 — Classic White",
    description: "Composite post sleeve wraps a 4×4 structural post. Fade and stain resistant. 42\" height.",
    componentType: "post-sleeve",
    unit: "each",
    color: "Classic White",
    contractorPricePerUnit: 49.98,
    notes: "Most popular color. Pairs with white rail and balusters.",
  },
  {
    id: "trex-transcend-post-sleeve-vintage",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Post Sleeve 4×4 — Vintage Lantern",
    description: "Composite post sleeve in warm brown tone. 42\" height.",
    componentType: "post-sleeve",
    unit: "each",
    color: "Vintage Lantern",
    contractorPricePerUnit: 49.98,
    notes: "Coordinates with Trex Transcend Spiced Rum and Tiki Torch deck boards.",
  },
  {
    id: "trex-transcend-post-sleeve-charcoal",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Post Sleeve 4×4 — Charcoal Black",
    description: "Composite post sleeve in dark charcoal. 42\" height.",
    componentType: "post-sleeve",
    unit: "each",
    color: "Charcoal Black",
    contractorPricePerUnit: 52.48,
    notes: "Premium dark finish. Pairs with Trex Transcend Gravel Path or Island Mist boards.",
  },

  // Top rail sections
  {
    id: "trex-transcend-top-rail-8-white",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Top Rail 8 ft — Classic White",
    description: "Composite top rail, 8 ft section. Grooved for baluster inserts. Includes mounting hardware.",
    componentType: "top-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Classic White",
    contractorPricePerUnit: 34.98,
  },
  {
    id: "trex-transcend-top-rail-8-vintage",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Top Rail 8 ft — Vintage Lantern",
    description: "Composite top rail, 8 ft section. Grooved for baluster inserts.",
    componentType: "top-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Vintage Lantern",
    contractorPricePerUnit: 34.98,
  },
  {
    id: "trex-transcend-top-rail-8-charcoal",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Top Rail 8 ft — Charcoal Black",
    description: "Composite top rail, 8 ft section. Premium dark finish.",
    componentType: "top-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Charcoal Black",
    contractorPricePerUnit: 36.48,
  },

  // Bottom rail sections
  {
    id: "trex-transcend-bottom-rail-8-white",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Bottom Rail 8 ft — Classic White",
    description: "Composite bottom rail, 8 ft section. Grooved for baluster inserts.",
    componentType: "bottom-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Classic White",
    contractorPricePerUnit: 32.48,
  },
  {
    id: "trex-transcend-bottom-rail-8-vintage",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Bottom Rail 8 ft — Vintage Lantern",
    description: "Composite bottom rail, 8 ft section.",
    componentType: "bottom-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Vintage Lantern",
    contractorPricePerUnit: 32.48,
  },
  {
    id: "trex-transcend-bottom-rail-8-charcoal",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Bottom Rail 8 ft — Charcoal Black",
    description: "Composite bottom rail, 8 ft section. Premium dark finish.",
    componentType: "bottom-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Charcoal Black",
    contractorPricePerUnit: 33.98,
  },

  // Balusters
  {
    id: "trex-transcend-baluster-square-white",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Square Baluster — Classic White (box of 32)",
    description: "Composite square balusters, 32\" length. Box of 32. Snap-in installation.",
    componentType: "baluster",
    unit: "each",
    color: "Classic White",
    contractorPricePerUnit: 5.98,
    notes: "Priced per baluster. Box of 32 = ~$191. Covers approx. 16 LF of railing.",
  },
  {
    id: "trex-transcend-baluster-square-charcoal",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Square Baluster — Charcoal Black (box of 32)",
    description: "Composite square balusters, 32\" length. Box of 32. Snap-in installation.",
    componentType: "baluster",
    unit: "each",
    color: "Charcoal Black",
    contractorPricePerUnit: 6.48,
    notes: "Priced per baluster. Premium dark finish.",
  },

  // Post caps
  {
    id: "trex-transcend-post-cap-flat-white",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Flat Post Cap — Classic White",
    description: "Composite flat post cap for 4×4 post sleeve. Snap-on installation.",
    componentType: "post-cap",
    unit: "each",
    color: "Classic White",
    contractorPricePerUnit: 13.98,
  },
  {
    id: "trex-transcend-post-cap-pyramid-white",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Pyramid Post Cap — Classic White",
    description: "Composite pyramid post cap for 4×4 post sleeve. Classic architectural look.",
    componentType: "post-cap",
    unit: "each",
    color: "Classic White",
    contractorPricePerUnit: 15.48,
  },
  {
    id: "trex-transcend-post-cap-solar-white",
    manufacturer: "Trex",
    productLine: "Transcend Railing",
    name: "Trex Transcend Solar Post Cap — Classic White",
    description: "Solar-powered LED post cap. Charges during the day, illuminates at night.",
    componentType: "post-cap",
    unit: "each",
    color: "Classic White",
    contractorPricePerUnit: 34.98,
    notes: "Premium option. No wiring required. Adds ambiance and safety lighting.",
  },

  // ════════════════════════════════════════════════════════════════
  // TIMBERTECH — Impression Rail
  // ════════════════════════════════════════════════════════════════

  // Post sleeves
  {
    id: "timbertech-impression-post-sleeve-white",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Post Sleeve 4×4 — White",
    description: "Composite post sleeve for 4×4 structural post. 42\" height. Capped four sides.",
    componentType: "post-sleeve",
    unit: "each",
    color: "White",
    contractorPricePerUnit: 47.48,
    notes: "Capped composite — superior moisture resistance vs. wood-based composites.",
  },
  {
    id: "timbertech-impression-post-sleeve-brownstone",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Post Sleeve 4×4 — Brownstone",
    description: "Composite post sleeve in warm brown. 42\" height. Capped four sides.",
    componentType: "post-sleeve",
    unit: "each",
    color: "Brownstone",
    contractorPricePerUnit: 47.48,
    notes: "Coordinates with TimberTech Tigerwood and Mocha deck boards.",
  },
  {
    id: "timbertech-impression-post-sleeve-black",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Post Sleeve 4×4 — Black",
    description: "Composite post sleeve in matte black. 42\" height. Capped four sides.",
    componentType: "post-sleeve",
    unit: "each",
    color: "Black",
    contractorPricePerUnit: 49.98,
    notes: "Premium dark finish. Pairs with TimberTech Slate Grey boards.",
  },

  // Top rail
  {
    id: "timbertech-impression-top-rail-8-white",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Top Rail 8 ft — White",
    description: "Composite top rail, 8 ft section. Compatible with square and round balusters.",
    componentType: "top-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "White",
    contractorPricePerUnit: 32.98,
  },
  {
    id: "timbertech-impression-top-rail-8-brownstone",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Top Rail 8 ft — Brownstone",
    description: "Composite top rail, 8 ft section. Warm brown tone.",
    componentType: "top-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Brownstone",
    contractorPricePerUnit: 32.98,
  },
  {
    id: "timbertech-impression-top-rail-8-black",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Top Rail 8 ft — Black",
    description: "Composite top rail, 8 ft section. Matte black premium finish.",
    componentType: "top-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Black",
    contractorPricePerUnit: 34.48,
  },

  // Bottom rail
  {
    id: "timbertech-impression-bottom-rail-8-white",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Bottom Rail 8 ft — White",
    description: "Composite bottom rail, 8 ft section.",
    componentType: "bottom-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "White",
    contractorPricePerUnit: 30.48,
  },
  {
    id: "timbertech-impression-bottom-rail-8-brownstone",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Bottom Rail 8 ft — Brownstone",
    description: "Composite bottom rail, 8 ft section. Warm brown tone.",
    componentType: "bottom-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Brownstone",
    contractorPricePerUnit: 30.48,
  },
  {
    id: "timbertech-impression-bottom-rail-8-black",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Bottom Rail 8 ft — Black",
    description: "Composite bottom rail, 8 ft section. Matte black premium finish.",
    componentType: "bottom-rail",
    unit: "8-ft section",
    lengthFt: 8,
    color: "Black",
    contractorPricePerUnit: 31.98,
  },

  // Balusters
  {
    id: "timbertech-impression-baluster-square-white",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Square Baluster — White (each)",
    description: "Composite square baluster, 36\" length. Snap-in installation. Sold individually.",
    componentType: "baluster",
    unit: "each",
    color: "White",
    contractorPricePerUnit: 5.78,
    notes: "36\" height (vs Trex 32\"). Slightly taller profile.",
  },
  {
    id: "timbertech-impression-baluster-square-black",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Square Baluster — Black (each)",
    description: "Composite square baluster, 36\" length. Premium dark finish.",
    componentType: "baluster",
    unit: "each",
    color: "Black",
    contractorPricePerUnit: 6.28,
  },

  // Post caps
  {
    id: "timbertech-impression-post-cap-flat-white",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Flat Post Cap — White",
    description: "Composite flat post cap for 4×4 post sleeve.",
    componentType: "post-cap",
    unit: "each",
    color: "White",
    contractorPricePerUnit: 12.98,
  },
  {
    id: "timbertech-impression-post-cap-pyramid-white",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Pyramid Post Cap — White",
    description: "Composite pyramid post cap for 4×4 post sleeve.",
    componentType: "post-cap",
    unit: "each",
    color: "White",
    contractorPricePerUnit: 14.48,
  },
  {
    id: "timbertech-impression-post-cap-solar-white",
    manufacturer: "TimberTech",
    productLine: "Impression Rail",
    name: "TimberTech Impression Solar Post Cap — White",
    description: "Solar LED post cap. Charges during day, illuminates at night. No wiring.",
    componentType: "post-cap",
    unit: "each",
    color: "White",
    contractorPricePerUnit: 32.98,
    notes: "No wiring required. Premium lighting option.",
  },
];

/** Group railing SKUs by manufacturer, then by componentType */
export function getRailingSkusByManufacturer(): Record<string, RailingSku[]> {
  const groups: Record<string, RailingSku[]> = {};
  RAILING_SKUS.forEach(sku => {
    if (!groups[sku.manufacturer]) groups[sku.manufacturer] = [];
    groups[sku.manufacturer].push(sku);
  });
  return groups;
}

/** Get railing SKUs for a manufacturer filtered by component type */
export function getRailingSkusByComponent(manufacturer: string, componentType: RailingComponentType): RailingSku[] {
  return RAILING_SKUS.filter(s => s.manufacturer === manufacturer && s.componentType === componentType);
}

/** Default railing SKUs — Trex Transcend Classic White */
export function getDefaultRailingSkus(manufacturer: "Trex" | "TimberTech" = "Trex"): {
  postSku: RailingSku;
  topRailSku: RailingSku;
  bottomRailSku: RailingSku;
  balustrSku: RailingSku;
  postCapSku: RailingSku;
} {
  if (manufacturer === "TimberTech") {
    return {
      postSku: RAILING_SKUS.find(s => s.id === "timbertech-impression-post-sleeve-white")!,
      topRailSku: RAILING_SKUS.find(s => s.id === "timbertech-impression-top-rail-8-white")!,
      bottomRailSku: RAILING_SKUS.find(s => s.id === "timbertech-impression-bottom-rail-8-white")!,
      balustrSku: RAILING_SKUS.find(s => s.id === "timbertech-impression-baluster-square-white")!,
      postCapSku: RAILING_SKUS.find(s => s.id === "timbertech-impression-post-cap-flat-white")!,
    };
  }
  return {
    postSku: RAILING_SKUS.find(s => s.id === "trex-transcend-post-sleeve-white")!,
    topRailSku: RAILING_SKUS.find(s => s.id === "trex-transcend-top-rail-8-white")!,
    bottomRailSku: RAILING_SKUS.find(s => s.id === "trex-transcend-bottom-rail-8-white")!,
    balustrSku: RAILING_SKUS.find(s => s.id === "trex-transcend-baluster-square-white")!,
    postCapSku: RAILING_SKUS.find(s => s.id === "trex-transcend-post-cap-flat-white")!,
  };
}

/** Estimate railing linear footage from deck perimeter (3 sides typical) */
export function estimateRailingLF(deckWidthFt: number, deckLengthFt: number): number {
  // 3 sides: 2 × width + 1 × length (house side has no railing)
  return Math.round(2 * deckWidthFt + deckLengthFt);
}
