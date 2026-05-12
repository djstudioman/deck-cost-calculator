/**
 * brandCatalog.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Contractor Brand Preferences catalog.
 * Used exclusively on the contractor path — homeowner/DIY paths are unaffected.
 *
 * Design philosophy:
 * - Brand Preferences step = lightweight brand-only selector (which company)
 * - Downstream steps (Material Tier, Railing, Fasteners) filter to that brand's products
 * - "no-preference" id on every category falls back to generic pricing
 *
 * Pricing sources (2025–2026):
 * - decks.com composite decking price comparison (Mar 2026)
 * - advantagelumber.com price chart (Apr 2026)
 * - decksdirect.com cost guide (Feb 2026)
 * - dgfloors.com composite pricing (Apr 2026)
 * - rmfp.com brand comparison (Apr 2026)
 * - thedeckstoreonline.com, porchstore.com, schillings.com (Apr 2026)
 * - homedepot.com, lowes.com (Apr 2026)
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface DeckingBrandEntry {
  id: string;
  name: string;
  tagline: string;
  /** Hex color for brand card accent */
  accentColor: string;
  /** Which material tier(s) this brand's products fall under */
  tierIds: ("pt" | "composite" | "pvc")[];
  /** Product lines available under this brand */
  productLines: DeckingProductLine[];
  /** Whether this brand offers hidden-fastener-compatible grooved boards */
  hiddenFastenerCompatible: boolean;
  /** Whether this brand has a dedicated fastener system (e.g. Cortex) */
  hasDedicatedFastener: boolean;
  /** Typical warranty */
  warranty: string;
  /** Short note shown on brand card */
  note: string;
}

export interface DeckingProductLine {
  id: string;
  name: string;
  /** Material tier this product line maps to */
  tierId: "pt" | "composite" | "pvc";
  /** Material cost per sq ft (boards only, no labor, national dealer avg) */
  materialCostLow: number;
  materialCostHigh: number;
  /** Short description */
  description: string;
  /** Whether grooved-edge boards are available for hidden fasteners */
  grooved: boolean;
}

export interface RailingBrandEntry {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
  /** System types this brand offers */
  systemTypes: ("picket" | "cable" | "glass" | "panel")[];
  productLines: RailingProductLine[];
  note: string;
}

export interface RailingProductLine {
  id: string;
  name: string;
  systemType: "picket" | "cable" | "glass" | "panel";
  /** Material cost per linear foot (36" height, national dealer avg) */
  materialPerLFLow: number;
  materialPerLFHigh: number;
  /** Installed cost per linear foot (contractor-installed, national avg) */
  installedPerLFLow: number;
  installedPerLFHigh: number;
  description: string;
}

export interface FastenerBrandEntry {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
  systemType: "hidden-clip" | "hidden-screw" | "face-screw" | "structural";
  productLines: FastenerProductLine[];
  note: string;
}

export interface FastenerProductLine {
  id: string;
  name: string;
  /** Cost per sq ft of deck coverage */
  costPerSqFtLow: number;
  costPerSqFtHigh: number;
  /** Compatible decking brands (empty = all) */
  compatibleBrands: string[];
  description: string;
}

// ─── DECKING BRANDS ───────────────────────────────────────────────────────────

export const DECKING_BRAND_CATALOG: DeckingBrandEntry[] = [
  {
    id: "no-preference",
    name: "No Preference",
    tagline: "Use generic pricing across all brands",
    accentColor: "#64748b",
    tierIds: ["pt", "composite", "pvc"],
    hiddenFastenerCompatible: true,
    hasDedicatedFastener: false,
    warranty: "Varies",
    note: "All material options shown. Pricing uses national averages.",
    productLines: [],
  },
  {
    id: "trex",
    name: "Trex",
    tagline: "America's #1 decking brand",
    accentColor: "#2d6a4f",
    tierIds: ["composite", "pvc"],
    hiddenFastenerCompatible: true,
    hasDedicatedFastener: true,
    warranty: "25-year limited",
    note: "Domestic manufacturing. Cortex hidden fastener system available.",
    productLines: [
      {
        id: "trex-enhance-basics",
        name: "Enhance Basics",
        tierId: "composite",
        materialCostLow: 2.31,
        materialCostHigh: 3.50,
        description: "Entry-level composite. Solid boards only, no hidden fastener groove.",
        grooved: false,
      },
      {
        id: "trex-enhance-naturals",
        name: "Enhance Naturals",
        tierId: "composite",
        materialCostLow: 3.15,
        materialCostHigh: 4.50,
        description: "Mid-entry with realistic wood grain. Grooved-edge available.",
        grooved: true,
      },
      {
        id: "trex-select",
        name: "Select",
        tierId: "composite",
        materialCostLow: 4.80,
        materialCostHigh: 6.50,
        description: "Standard composite. Solid color palette, grooved-edge available.",
        grooved: true,
      },
      {
        id: "trex-transcend",
        name: "Transcend",
        tierId: "pvc",
        materialCostLow: 6.83,
        materialCostHigh: 9.50,
        description: "Premium composite with deep wood grain embossing. Grooved-edge available.",
        grooved: true,
      },
      {
        id: "trex-transcend-lineage",
        name: "Transcend Lineage",
        tierId: "pvc",
        materialCostLow: 8.50,
        materialCostHigh: 12.00,
        description: "Ultra-premium 2024 line. Widest boards, most realistic grain.",
        grooved: true,
      },
    ],
  },
  {
    id: "timbertech",
    name: "TimberTech",
    tagline: "AZEK Company. Premium composite & PVC",
    accentColor: "#1e3a5f",
    tierIds: ["composite", "pvc"],
    hiddenFastenerCompatible: true,
    hasDedicatedFastener: false,
    warranty: "30-year limited (AZEK: Lifetime)",
    note: "AZEK PVC line is the industry's most durable. Cortex compatible.",
    productLines: [
      {
        id: "timbertech-pro-terrain",
        name: "Pro Terrain",
        tierId: "composite",
        materialCostLow: 3.50,
        materialCostHigh: 5.00,
        description: "Entry composite. Grooved-edge available for hidden fasteners.",
        grooved: true,
      },
      {
        id: "timbertech-edge",
        name: "EDGE",
        tierId: "composite",
        materialCostLow: 4.50,
        materialCostHigh: 6.50,
        description: "Mid-range capped composite. Wide color selection.",
        grooved: true,
      },
      {
        id: "timbertech-pro-legacy",
        name: "Pro Legacy",
        tierId: "composite",
        materialCostLow: 5.50,
        materialCostHigh: 7.50,
        description: "Premium composite with deep embossing. Grooved-edge available.",
        grooved: true,
      },
      {
        id: "timbertech-pro-reserve",
        name: "Pro Reserve",
        tierId: "pvc",
        materialCostLow: 6.15,
        materialCostHigh: 9.00,
        description: "Top-tier composite. Highest scratch/stain resistance in the composite line.",
        grooved: true,
      },
      {
        id: "timbertech-azek-vintage",
        name: "AZEK Vintage (PVC)",
        tierId: "pvc",
        materialCostLow: 11.00,
        materialCostHigh: 14.00,
        description: "Ultra-premium capped PVC. Lifetime warranty. Best-in-class durability.",
        grooved: true,
      },
      {
        id: "timbertech-azek-landmark",
        name: "AZEK Landmark (PVC)",
        tierId: "pvc",
        materialCostLow: 9.00,
        materialCostHigh: 12.00,
        description: "Premium PVC with wide-plank look. Grooved-edge available.",
        grooved: true,
      },
    ],
  },
  {
    id: "fiberon",
    name: "Fiberon",
    tagline: "Capped composite with lifetime stain warranty",
    accentColor: "#7b3f00",
    tierIds: ["composite", "pvc"],
    hiddenFastenerCompatible: true,
    hasDedicatedFastener: false,
    warranty: "25-year limited (Paramount: Lifetime)",
    note: "Made in USA. Good Life is a strong value entry line.",
    productLines: [
      {
        id: "fiberon-good-life",
        name: "Good Life",
        tierId: "composite",
        materialCostLow: 3.00,
        materialCostHigh: 4.50,
        description: "Entry composite. Grooved-edge available. Good color selection.",
        grooved: true,
      },
      {
        id: "fiberon-symmetry",
        name: "Symmetry",
        tierId: "composite",
        materialCostLow: 4.50,
        materialCostHigh: 6.50,
        description: "Mid-range capped composite. Realistic wood grain, hidden fastener compatible.",
        grooved: true,
      },
      {
        id: "fiberon-horizon",
        name: "Horizon",
        tierId: "composite",
        materialCostLow: 5.50,
        materialCostHigh: 7.50,
        description: "Premium capped composite. Wide board option available.",
        grooved: true,
      },
      {
        id: "fiberon-paramount",
        name: "Paramount (PVC)",
        tierId: "pvc",
        materialCostLow: 7.00,
        materialCostHigh: 10.00,
        description: "High-end PVC. Lifetime stain/fade warranty. Grooved-edge available.",
        grooved: true,
      },
      {
        id: "fiberon-promenade",
        name: "Promenade (PVC)",
        tierId: "pvc",
        materialCostLow: 8.50,
        materialCostHigh: 12.00,
        description: "Ultra-premium PVC with widest plank option. Grooved-edge available.",
        grooved: true,
      },
    ],
  },
  {
    id: "wolf",
    name: "Wolf",
    tagline: "Premium composite from Wolf Home Products",
    accentColor: "#4a1942",
    tierIds: ["composite", "pvc"],
    hiddenFastenerCompatible: true,
    hasDedicatedFastener: false,
    warranty: "25-year limited",
    note: "Strong regional dealer network. Serenity is a popular mid-range choice.",
    productLines: [
      {
        id: "wolf-serenity",
        name: "Serenity",
        tierId: "composite",
        materialCostLow: 4.50,
        materialCostHigh: 6.00,
        description: "Mid-range composite. Grooved-edge available. Good value.",
        grooved: true,
      },
      {
        id: "wolf-haven",
        name: "Haven",
        tierId: "composite",
        materialCostLow: 5.50,
        materialCostHigh: 7.25,
        description: "Premium composite with deep embossing. Grooved-edge available.",
        grooved: true,
      },
      {
        id: "wolf-perspective",
        name: "Perspective",
        tierId: "pvc",
        materialCostLow: 7.00,
        materialCostHigh: 10.00,
        description: "PVC composite. High durability, grooved-edge available.",
        grooved: true,
      },
    ],
  },
  {
    id: "deckorators",
    name: "Deckorators",
    tagline: "Mineral-based composite technology",
    accentColor: "#b45309",
    tierIds: ["composite", "pvc"],
    hiddenFastenerCompatible: true,
    hasDedicatedFastener: false,
    warranty: "25-year limited",
    note: "Unique mineral-based core for superior moisture resistance.",
    productLines: [
      {
        id: "deckorators-vault",
        name: "Vault",
        tierId: "composite",
        materialCostLow: 4.00,
        materialCostHigh: 5.50,
        description: "Mid-range mineral-based composite. Grooved-edge available.",
        grooved: true,
      },
      {
        id: "deckorators-voyage",
        name: "Voyage",
        tierId: "composite",
        materialCostLow: 5.50,
        materialCostHigh: 7.00,
        description: "Premium mineral-based composite. Wide color palette.",
        grooved: true,
      },
      {
        id: "deckorators-surrey",
        name: "Surrey",
        tierId: "pvc",
        materialCostLow: 7.00,
        materialCostHigh: 9.50,
        description: "PVC-based premium line. Grooved-edge available.",
        grooved: true,
      },
    ],
  },
  {
    id: "moistureshield",
    name: "MoistureShield",
    tagline: "Can be installed in water, on ground, or in ground",
    accentColor: "#0369a1",
    tierIds: ["composite"],
    hiddenFastenerCompatible: true,
    hasDedicatedFastener: false,
    warranty: "Lifetime limited",
    note: "Unique below-grade and in-water installation capability.",
    productLines: [
      {
        id: "moistureshield-vantage",
        name: "Vantage",
        tierId: "composite",
        materialCostLow: 4.00,
        materialCostHigh: 6.00,
        description: "Entry composite. Solid-core technology. Grooved-edge available.",
        grooved: true,
      },
      {
        id: "moistureshield-vision",
        name: "Vision",
        tierId: "composite",
        materialCostLow: 5.75,
        materialCostHigh: 7.50,
        description: "Premium composite. Realistic wood grain, grooved-edge available.",
        grooved: true,
      },
    ],
  },
  {
    id: "pressure-treated",
    name: "Pressure-Treated Lumber",
    tagline: "Most affordable decking material",
    accentColor: "#365314",
    tierIds: ["pt"],
    hiddenFastenerCompatible: false,
    hasDedicatedFastener: false,
    warranty: "Varies by treatment level",
    note: "Standard #2 SYP or hem-fir. Face-screw installation only.",
    productLines: [
      {
        id: "pt-standard",
        name: "PT #2 (Standard)",
        tierId: "pt",
        materialCostLow: 1.50,
        materialCostHigh: 2.50,
        description: "Standard #2 Southern Yellow Pine. Most common budget choice.",
        grooved: false,
      },
      {
        id: "pt-premium",
        name: "PT Premium Grade",
        tierId: "pt",
        materialCostLow: 2.50,
        materialCostHigh: 3.50,
        description: "Higher grade PT with fewer knots. Better appearance.",
        grooved: false,
      },
    ],
  },
  {
    id: "cedar",
    name: "Cedar / Redwood",
    tagline: "Natural wood with inherent rot resistance",
    accentColor: "#92400e",
    tierIds: ["pt"],
    hiddenFastenerCompatible: false,
    hasDedicatedFastener: false,
    warranty: "None (natural wood)",
    note: "Western Red Cedar or Redwood. Requires periodic sealing/staining.",
    productLines: [
      {
        id: "cedar-standard",
        name: "Western Red Cedar",
        tierId: "pt",
        materialCostLow: 3.50,
        materialCostHigh: 5.50,
        description: "Naturally rot-resistant. Lightweight. Requires annual maintenance.",
        grooved: false,
      },
      {
        id: "redwood-standard",
        name: "Redwood",
        tierId: "pt",
        materialCostLow: 5.00,
        materialCostHigh: 8.00,
        description: "Premium natural wood. Excellent rot resistance. Regional availability.",
        grooved: false,
      },
    ],
  },
  {
    id: "ipe-hardwood",
    name: "Ipe / Tropical Hardwood",
    tagline: "Hardest, most durable natural decking",
    accentColor: "#451a03",
    tierIds: ["pvc"],
    hiddenFastenerCompatible: true,
    hasDedicatedFastener: false,
    warranty: "None (natural wood)",
    note: "50+ year lifespan. Requires pre-drilling and Ipe Clip fasteners.",
    productLines: [
      {
        id: "ipe-standard",
        name: "Ipe (Brazilian Walnut)",
        tierId: "pvc",
        materialCostLow: 8.60,
        materialCostHigh: 12.00,
        description: "Hardest decking available. Naturally resistant to rot, insects, fire.",
        grooved: false,
      },
      {
        id: "cumaru-standard",
        name: "Cumaru (Brazilian Teak)",
        tierId: "pvc",
        materialCostLow: 6.00,
        materialCostHigh: 8.50,
        description: "Similar to Ipe but slightly softer. Good value in the hardwood category.",
        grooved: false,
      },
    ],
  },
];

// ─── RAILING BRANDS ───────────────────────────────────────────────────────────

export const RAILING_BRAND_CATALOG: RailingBrandEntry[] = [
  {
    id: "no-preference",
    name: "No Preference",
    tagline: "Use generic pricing across all railing types",
    accentColor: "#64748b",
    systemTypes: ["picket", "cable", "glass", "panel"],
    note: "All railing options shown. Pricing uses national averages.",
    productLines: [],
  },
  {
    id: "trex-railing",
    name: "Trex Railing",
    tagline: "Matches Trex decking. Composite & cable options",
    accentColor: "#2d6a4f",
    systemTypes: ["picket", "cable"],
    note: "Best pairing with Trex decking. Transcend railing matches Transcend decking colors.",
    productLines: [
      {
        id: "trex-transcend-railing",
        name: "Transcend Railing",
        systemType: "picket",
        materialPerLFLow: 22,
        materialPerLFHigh: 38,
        installedPerLFLow: 60,
        installedPerLFHigh: 110,
        description: "Composite picket railing. Matches Transcend decking color palette.",
      },
      {
        id: "trex-select-railing",
        name: "Select Railing",
        systemType: "picket",
        materialPerLFLow: 18,
        materialPerLFHigh: 30,
        installedPerLFLow: 50,
        installedPerLFHigh: 90,
        description: "Mid-range composite picket railing. Good value.",
      },
      {
        id: "trex-signature-cable",
        name: "Signature Cable Railing",
        systemType: "cable",
        materialPerLFLow: 45,
        materialPerLFHigh: 75,
        installedPerLFLow: 100,
        installedPerLFHigh: 200,
        description: "Stainless cable with aluminum posts. Modern, open-view aesthetic.",
      },
    ],
  },
  {
    id: "timbertech-railing",
    name: "TimberTech Railing",
    tagline: "Impression Rail system. Matches AZEK & TimberTech decking",
    accentColor: "#1e3a5f",
    systemTypes: ["picket", "glass"],
    note: "Impression Rail Express is the most popular contractor choice.",
    productLines: [
      {
        id: "timbertech-impression-rail",
        name: "Impression Rail Express",
        systemType: "picket",
        materialPerLFLow: 25,
        materialPerLFHigh: 40,
        installedPerLFLow: 65,
        installedPerLFHigh: 115,
        description: "Composite picket railing. Easy installation with pre-assembled sections.",
      },
      {
        id: "timbertech-impression-glass",
        name: "Impression Rail Glass",
        systemType: "glass",
        materialPerLFLow: 80,
        materialPerLFHigh: 140,
        installedPerLFLow: 150,
        installedPerLFHigh: 350,
        description: "Glass panel infill. Unobstructed views. Premium aesthetic.",
      },
    ],
  },
  {
    id: "regal-ideas",
    name: "Regal Ideas",
    tagline: "Aluminum railing with premium finish options",
    accentColor: "#1d4ed8",
    systemTypes: ["picket", "glass", "cable"],
    note: "Canadian-made aluminum. CrystalRail glass system is a flagship product.",
    productLines: [
      {
        id: "regal-aluminum-picket",
        name: "Aluminum Picket Railing",
        systemType: "picket",
        materialPerLFLow: 18,
        materialPerLFHigh: 32,
        installedPerLFLow: 55,
        installedPerLFHigh: 110,
        description: "Powder-coated aluminum picket. Durable, low-maintenance.",
      },
      {
        id: "regal-crystalrail",
        name: "CrystalRail (Glass)",
        systemType: "glass",
        materialPerLFLow: 55,
        materialPerLFHigh: 90,
        installedPerLFLow: 130,
        installedPerLFHigh: 280,
        description: "Frameless glass panel system. Unobstructed views. Premium look.",
      },
      {
        id: "regal-cable",
        name: "Cable Railing System",
        systemType: "cable",
        materialPerLFLow: 40,
        materialPerLFHigh: 70,
        installedPerLFLow: 90,
        installedPerLFHigh: 200,
        description: "Stainless cable with aluminum posts. Modern aesthetic.",
      },
    ],
  },
  {
    id: "fortress",
    name: "Fortress Building Products",
    tagline: "Steel & aluminum railing. Industrial strength",
    accentColor: "#374151",
    systemTypes: ["picket", "panel"],
    note: "Fe26 steel is extremely durable. Popular for modern and industrial aesthetics.",
    productLines: [
      {
        id: "fortress-fe26-steel",
        name: "Fe26 Steel Railing",
        systemType: "picket",
        materialPerLFLow: 28,
        materialPerLFHigh: 52,
        installedPerLFLow: 70,
        installedPerLFHigh: 140,
        description: "Powder-coated steel picket. Extremely durable. Modern look.",
      },
      {
        id: "fortress-evolution-aluminum",
        name: "Evolution Aluminum",
        systemType: "picket",
        materialPerLFLow: 22,
        materialPerLFHigh: 40,
        installedPerLFLow: 60,
        installedPerLFHigh: 120,
        description: "Lightweight aluminum picket. Good value in the Fortress line.",
      },
      {
        id: "fortress-axis-panel",
        name: "Axis Panel System",
        systemType: "panel",
        materialPerLFLow: 35,
        materialPerLFHigh: 60,
        installedPerLFLow: 80,
        installedPerLFHigh: 160,
        description: "Horizontal panel system. Contemporary aesthetic.",
      },
    ],
  },
  {
    id: "deckorators-railing",
    name: "Deckorators Railing",
    tagline: "Aluminum & composite railing to match Deckorators decking",
    accentColor: "#b45309",
    systemTypes: ["picket", "cable"],
    note: "Best pairing with Deckorators decking. Vista cable is a popular upgrade.",
    productLines: [
      {
        id: "deckorators-aluminum-railing",
        name: "Aluminum Picket Railing",
        systemType: "picket",
        materialPerLFLow: 15,
        materialPerLFHigh: 28,
        installedPerLFLow: 50,
        installedPerLFHigh: 100,
        description: "Powder-coated aluminum picket. Good value.",
      },
      {
        id: "deckorators-vista-cable",
        name: "Vista Cable Railing",
        systemType: "cable",
        materialPerLFLow: 38,
        materialPerLFHigh: 65,
        installedPerLFLow: 90,
        installedPerLFHigh: 200,
        description: "Stainless cable with aluminum posts. Open-view aesthetic.",
      },
    ],
  },
  {
    id: "westbury",
    name: "Westbury Railing",
    tagline: "Premium aluminum railing. Made in USA",
    accentColor: "#0f172a",
    systemTypes: ["picket", "cable"],
    note: "Made in USA. Tuscany series is a popular contractor choice.",
    productLines: [
      {
        id: "westbury-tuscany",
        name: "Tuscany Series",
        systemType: "picket",
        materialPerLFLow: 22,
        materialPerLFHigh: 38,
        installedPerLFLow: 60,
        installedPerLFHigh: 120,
        description: "Premium aluminum picket. Wide color selection. Made in USA.",
      },
      {
        id: "westbury-veranda",
        name: "Veranda Series",
        systemType: "picket",
        materialPerLFLow: 16,
        materialPerLFHigh: 28,
        installedPerLFLow: 50,
        installedPerLFHigh: 100,
        description: "Entry-level aluminum picket. Good value in the Westbury line.",
      },
      {
        id: "westbury-cable",
        name: "Cable Railing",
        systemType: "cable",
        materialPerLFLow: 42,
        materialPerLFHigh: 72,
        installedPerLFLow: 95,
        installedPerLFHigh: 210,
        description: "Stainless cable with Westbury aluminum posts.",
      },
    ],
  },
  {
    id: "feeney",
    name: "Feeney / CableRail",
    tagline: "The original cable railing system",
    accentColor: "#0c4a6e",
    systemTypes: ["cable"],
    note: "Industry standard for cable railing. DesignRail aluminum posts.",
    productLines: [
      {
        id: "feeney-cablerail",
        name: "CableRail",
        systemType: "cable",
        materialPerLFLow: 50,
        materialPerLFHigh: 90,
        installedPerLFLow: 100,
        installedPerLFHigh: 240,
        description: "Stainless cable with DesignRail aluminum posts. Industry standard.",
      },
      {
        id: "feeney-designrail",
        name: "DesignRail (Aluminum)",
        systemType: "picket",
        materialPerLFLow: 30,
        materialPerLFHigh: 55,
        installedPerLFLow: 75,
        installedPerLFHigh: 145,
        description: "Aluminum infill panels with DesignRail posts. Modern aesthetic.",
      },
    ],
  },
  {
    id: "wood-railing",
    name: "Wood Railing (Generic)",
    tagline: "Traditional PT or cedar wood railing",
    accentColor: "#365314",
    systemTypes: ["picket"],
    note: "Most affordable railing option. Requires periodic maintenance.",
    productLines: [
      {
        id: "wood-pt-railing",
        name: "PT Wood Railing",
        systemType: "picket",
        materialPerLFLow: 12,
        materialPerLFHigh: 22,
        installedPerLFLow: 35,
        installedPerLFHigh: 70,
        description: "Standard pressure-treated wood picket railing. Most affordable option.",
      },
      {
        id: "wood-cedar-railing",
        name: "Cedar Railing",
        systemType: "picket",
        materialPerLFLow: 18,
        materialPerLFHigh: 30,
        installedPerLFLow: 45,
        installedPerLFHigh: 85,
        description: "Cedar picket railing. Better appearance than PT, requires sealing.",
      },
    ],
  },
];

// ─── FASTENER BRANDS ──────────────────────────────────────────────────────────

export const FASTENER_BRAND_CATALOG: FastenerBrandEntry[] = [
  {
    id: "no-preference",
    name: "No Preference",
    tagline: "Use generic fastener pricing",
    accentColor: "#64748b",
    systemType: "face-screw",
    note: "Generic face-screw pricing used. All decking brands compatible.",
    productLines: [],
  },
  {
    id: "camo",
    name: "Camo",
    tagline: "Edge-drive hidden fastener system",
    accentColor: "#4d7c0f",
    systemType: "hidden-clip",
    note: "Marksman Pro-X1 tool required (~$50–$80 one-time). Works with most grooved-edge boards.",
    productLines: [
      {
        id: "camo-edge-clip",
        name: "EdgeClip",
        costPerSqFtLow: 1.00,
        costPerSqFtHigh: 1.50,
        compatibleBrands: [],
        description: "Stainless steel clip. Works with most grooved-edge composite boards.",
      },
      {
        id: "camo-edge-x",
        name: "EdgeX (Stainless)",
        costPerSqFtLow: 1.20,
        costPerSqFtHigh: 1.80,
        compatibleBrands: [],
        description: "Premium stainless EdgeX. Best for coastal/high-moisture environments.",
      },
    ],
  },
  {
    id: "fastenmaster",
    name: "Fastenmaster",
    tagline: "Structural and hidden fastener systems",
    accentColor: "#dc2626",
    systemType: "hidden-screw",
    note: "Cortex plugged screw system creates a clean, plug-covered surface.",
    productLines: [
      {
        id: "fastenmaster-cortex-trex",
        name: "Cortex for Trex",
        costPerSqFtLow: 1.50,
        costPerSqFtHigh: 2.50,
        compatibleBrands: ["trex"],
        description: "Plugged screw system. Color-matched plugs for Trex decking. Clean finish.",
      },
      {
        id: "fastenmaster-cortex-fiberon",
        name: "Cortex for Fiberon",
        costPerSqFtLow: 1.50,
        costPerSqFtHigh: 2.50,
        compatibleBrands: ["fiberon"],
        description: "Plugged screw system. Color-matched plugs for Fiberon decking.",
      },
      {
        id: "fastenmaster-cortex-azek",
        name: "Cortex for AZEK/TimberTech",
        costPerSqFtLow: 1.50,
        costPerSqFtHigh: 2.50,
        compatibleBrands: ["timbertech"],
        description: "Plugged screw system. Color-matched plugs for AZEK/TimberTech decking.",
      },
      {
        id: "fastenmaster-cortex-universal",
        name: "Cortex Universal",
        costPerSqFtLow: 1.40,
        costPerSqFtHigh: 2.20,
        compatibleBrands: [],
        description: "Universal plugged screw. Works with most composite decking brands.",
      },
      {
        id: "fastenmaster-headlok",
        name: "HeadLok Structural Screw",
        costPerSqFtLow: 0.30,
        costPerSqFtHigh: 0.60,
        compatibleBrands: [],
        description: "Heavy-duty structural screw for framing and ledger connections.",
      },
    ],
  },
  {
    id: "tiger-claw",
    name: "Tiger Claw",
    tagline: "Hidden clip fastener for grooved-edge boards",
    accentColor: "#f59e0b",
    systemType: "hidden-clip",
    note: "TC-G for grooved boards. Stainless steel for coastal environments.",
    productLines: [
      {
        id: "tiger-claw-tc-g",
        name: "TC-G (Grooved)",
        costPerSqFtLow: 1.30,
        costPerSqFtHigh: 1.60,
        compatibleBrands: [],
        description: "For grooved-edge composite boards. Stainless steel option available.",
      },
      {
        id: "tiger-claw-tc-g-stainless",
        name: "TC-G Stainless",
        costPerSqFtLow: 1.50,
        costPerSqFtHigh: 1.90,
        compatibleBrands: [],
        description: "Stainless steel version. Best for coastal/high-moisture environments.",
      },
    ],
  },
  {
    id: "ipe-clip",
    name: "Ipe Clip",
    tagline: "Hidden fastener for hardwood and dense composite",
    accentColor: "#451a03",
    systemType: "hidden-clip",
    note: "Required for Ipe and other tropical hardwoods. Also works with some composites.",
    productLines: [
      {
        id: "ipe-clip-extreme",
        name: "Ipe Clip Extreme",
        costPerSqFtLow: 1.50,
        costPerSqFtHigh: 2.00,
        compatibleBrands: ["ipe-hardwood"],
        description: "For Ipe and tropical hardwoods. Stainless steel. Requires pre-drilled groove.",
      },
      {
        id: "ipe-clip-original",
        name: "Ipe Clip Original",
        costPerSqFtLow: 1.00,
        costPerSqFtHigh: 1.50,
        compatibleBrands: ["ipe-hardwood"],
        description: "Original Ipe Clip. Works with pre-grooved hardwood boards.",
      },
    ],
  },
  {
    id: "simpson-strong-tie",
    name: "Simpson Strong-Tie",
    tagline: "Structural connectors, joist hangers, post bases",
    accentColor: "#b91c1c",
    systemType: "structural",
    note: "Industry standard for structural hardware. Required by most building codes.",
    productLines: [
      {
        id: "simpson-joist-hangers",
        name: "Joist Hangers (LUS/LUS28)",
        costPerSqFtLow: 0.20,
        costPerSqFtHigh: 0.40,
        compatibleBrands: [],
        description: "LUS/LUS28 series. Required for all joist-to-beam connections.",
      },
      {
        id: "simpson-post-bases",
        name: "Post Bases (ABA/ABU)",
        costPerSqFtLow: 0.10,
        costPerSqFtHigh: 0.25,
        compatibleBrands: [],
        description: "ABA/ABU series. For post-to-concrete connections.",
      },
      {
        id: "simpson-ledger-connectors",
        name: "Ledger Connectors (LCE/LSSJ)",
        costPerSqFtLow: 0.05,
        costPerSqFtHigh: 0.15,
        compatibleBrands: [],
        description: "For ledger-to-house connections. Critical for structural integrity.",
      },
      {
        id: "simpson-full-hardware-package",
        name: "Full Hardware Package",
        costPerSqFtLow: 0.40,
        costPerSqFtHigh: 0.80,
        compatibleBrands: [],
        description: "Complete structural hardware package: joist hangers, post bases, ledger connectors, hurricane ties.",
      },
    ],
  },
  {
    id: "face-screw-generic",
    name: "Face Screw (Generic)",
    tagline: "Standard deck screws. Most affordable option",
    accentColor: "#374151",
    systemType: "face-screw",
    note: "Stainless or coated deck screws. Visible fastener heads on deck surface.",
    productLines: [
      {
        id: "face-screw-coated",
        name: "Coated Deck Screws",
        costPerSqFtLow: 0.25,
        costPerSqFtHigh: 0.40,
        compatibleBrands: [],
        description: "Polymer-coated deck screws. Good corrosion resistance. Most affordable.",
      },
      {
        id: "face-screw-stainless",
        name: "Stainless Steel Screws",
        costPerSqFtLow: 0.40,
        costPerSqFtHigh: 0.65,
        compatibleBrands: [],
        description: "Stainless steel deck screws. Best for coastal environments.",
      },
    ],
  },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

/** Get a decking brand entry by id */
export function getDeckingBrand(id: string): DeckingBrandEntry | undefined {
  return DECKING_BRAND_CATALOG.find((b) => b.id === id);
}

/** Get a railing brand entry by id */
export function getRailingBrand(id: string): RailingBrandEntry | undefined {
  return RAILING_BRAND_CATALOG.find((b) => b.id === id);
}

/** Get a fastener brand entry by id */
export function getFastenerBrand(id: string): FastenerBrandEntry | undefined {
  return FASTENER_BRAND_CATALOG.find((b) => b.id === id);
}

/**
 * Get the decking product lines for a given brand that match a specific tier.
 * Returns all product lines if brand is "no-preference".
 */
export function getDeckingProductLinesForTier(
  brandId: string,
  tierId: "pt" | "composite" | "pvc"
): DeckingProductLine[] {
  if (brandId === "no-preference") return [];
  const brand = getDeckingBrand(brandId);
  if (!brand) return [];
  return brand.productLines.filter((p) => p.tierId === tierId);
}

/**
 * Get the railing product lines for a given brand.
 * Returns empty array if brand is "no-preference".
 */
export function getRailingProductLines(brandId: string): RailingProductLine[] {
  if (brandId === "no-preference") return [];
  const brand = getRailingBrand(brandId);
  if (!brand) return [];
  return brand.productLines;
}

/**
 * Get the fastener product lines for a given brand.
 * Returns empty array if brand is "no-preference".
 */
export function getFastenerProductLines(brandId: string): FastenerProductLine[] {
  if (brandId === "no-preference") return [];
  const brand = getFastenerBrand(brandId);
  if (!brand) return [];
  return brand.productLines;
}

/**
 * Get the material cost delta (vs. tier baseline) for a specific decking product line.
 * Used by the calculation engine to adjust installed/material costs.
 * Returns 0 if no preference or product line not found.
 */
export function getDeckingMaterialDelta(
  brandId: string,
  productLineId: string
): { low: number; high: number } {
  if (brandId === "no-preference" || !productLineId) return { low: 0, high: 0 };
  const brand = getDeckingBrand(brandId);
  if (!brand) return { low: 0, high: 0 };
  const line = brand.productLines.find((p) => p.id === productLineId);
  if (!line) return { low: 0, high: 0 };
  // Delta is relative to the tier's baseline materialPerSqFtMin/Max
  // Tier baselines: pt ~$2/sf, composite ~$5/sf, pvc ~$10/sf
  const tierBaselines: Record<string, { low: number; high: number }> = {
    pt: { low: 2.0, high: 3.0 },
    composite: { low: 5.0, high: 7.0 },
    pvc: { low: 10.0, high: 13.0 },
  };
  const baseline = tierBaselines[line.tierId] ?? { low: 0, high: 0 };
  return {
    low: line.materialCostLow - baseline.low,
    high: line.materialCostHigh - baseline.high,
  };
}
