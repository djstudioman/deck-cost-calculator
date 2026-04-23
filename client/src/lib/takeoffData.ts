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
