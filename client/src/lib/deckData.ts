/**
 * DECK COST CALCULATOR — DATA LAYER
 * Design: Precision Engineering (dark navy, amber accent, wizard flow)
 * All data sourced from: "The Complete Guide to Deck Building Costs in 2026"
 */

// ─── AUDIENCE TYPES ────────────────────────────────────────────────────────────
export type AudienceType = "homeowner" | "diy" | "contractor";

// ─── REGIONS ───────────────────────────────────────────────────────────────────
export interface Region {
  id: string;
  label: string;
  states: string;
  laborMultiplier: number; // relative to national baseline
  laborPerSqFtMin: number;
  laborPerSqFtMax: number;
  frostDepthLabel: string;
  frostDepthInches: number; // representative depth for cost calc
  climateNotes: string[];
  climatePremium: number; // flat $ added to project
}

export const REGIONS: Region[] = [
  {
    id: "southeast",
    label: "Southeast",
    states: "FL, GA, SC, NC, TN, AL, MS, LA",
    laborMultiplier: 0.93,
    laborPerSqFtMin: 11,
    laborPerSqFtMax: 22,
    frostDepthLabel: "0–18\"",
    frostDepthInches: 12,
    climateNotes: ["Minimal frost depth", "Hurricane clips required in FL coastal zones"],
    climatePremium: 0,
  },
  {
    id: "southwest",
    label: "Southwest",
    states: "AZ, NV, NM, TX, OK",
    laborMultiplier: 0.95,
    laborPerSqFtMin: 12,
    laborPerSqFtMax: 24,
    frostDepthLabel: "6–18\"",
    frostDepthInches: 12,
    climateNotes: ["UV/heat material upgrade recommended: +$5–$20/sq ft"],
    climatePremium: 0,
  },
  {
    id: "midwest",
    label: "Midwest",
    states: "OH, IN, IL, IA, KS, NE, MI, WI, MN",
    laborMultiplier: 1.05,
    laborPerSqFtMin: 12,
    laborPerSqFtMax: 30,
    frostDepthLabel: "24–80\"",
    frostDepthInches: 48,
    climateNotes: [
      "Deep frost footings required: +$600–$2,500",
      "High snow load framing (40–100 psf): +$1,500–$5,000",
      "Short building season adds 5–20% to labor",
    ],
    climatePremium: 1500,
  },
  {
    id: "mid-atlantic",
    label: "Mid-Atlantic",
    states: "VA, MD, DC, PA, NJ, DE, WV, KY",
    laborMultiplier: 1.12,
    laborPerSqFtMin: 15,
    laborPerSqFtMax: 30,
    frostDepthLabel: "15–36\"",
    frostDepthInches: 30,
    climateNotes: ["Moderate frost depth", "Standard construction season"],
    climatePremium: 400,
  },
  {
    id: "northeast",
    label: "Northeast",
    states: "NY, CT, MA, NH, VT, ME, RI",
    laborMultiplier: 1.26,
    laborPerSqFtMin: 16,
    laborPerSqFtMax: 38,
    frostDepthLabel: "30–74\"",
    frostDepthInches: 54,
    climateNotes: [
      "Deep frost footings: +$600–$2,500",
      "High snow load framing: +$1,500–$5,000",
      "Short building season: +5–20% labor",
    ],
    climatePremium: 2000,
  },
  {
    id: "mountain-west",
    label: "Mountain West",
    states: "CO, MT, WY, ID, UT",
    laborMultiplier: 1.01,
    laborPerSqFtMin: 13,
    laborPerSqFtMax: 35,
    frostDepthLabel: "24–61\"",
    frostDepthInches: 42,
    climateNotes: [
      "Extreme snow loads in mountain areas: +$1,500–$5,000",
      "Short building season in high elevations",
    ],
    climatePremium: 1200,
  },
  {
    id: "pacific-northwest",
    label: "Pacific Northwest",
    states: "WA, OR",
    laborMultiplier: 1.20,
    laborPerSqFtMin: 20,
    laborPerSqFtMax: 40,
    frostDepthLabel: "12–24\"",
    frostDepthInches: 18,
    climateNotes: ["PNW moisture/waterproofing premium: +$1,500–$5,000"],
    climatePremium: 1800,
  },
  {
    id: "california",
    label: "California",
    states: "CA",
    laborMultiplier: 1.52,
    laborPerSqFtMin: 20,
    laborPerSqFtMax: 50,
    frostDepthLabel: "0–12\"",
    frostDepthInches: 6,
    climateNotes: [
      "Highest labor rates nationally",
      "Permitting can reach $2,000+ in many jurisdictions",
    ],
    climatePremium: 0,
  },
];

// ─── DECK SIZES ────────────────────────────────────────────────────────────────
export interface DeckSize {
  id: string;
  label: string;
  sqFt: number;
  dimensions: string;
}

export const DECK_SIZES: DeckSize[] = [
  { id: "100", label: "Small (10×10)", sqFt: 100, dimensions: "10 × 10 ft" },
  { id: "192", label: "Medium-Small (12×16)", sqFt: 192, dimensions: "12 × 16 ft" },
  { id: "320", label: "Standard (16×20)", sqFt: 320, dimensions: "16 × 20 ft" },
  { id: "480", label: "Large (20×24)", sqFt: 480, dimensions: "20 × 24 ft" },
  { id: "600", label: "Extra Large (20×30+)", sqFt: 600, dimensions: "20 × 30+ ft" },
];

// ─── MATERIAL TIERS ────────────────────────────────────────────────────────────
export interface MaterialTier {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  examples: string[];
  materialPerSqFtMin: number;
  materialPerSqFtMax: number;
  installedPerSqFtMin: number;
  installedPerSqFtMax: number;
  lifespan: string;
  maintenance: string;
  tariffImpact: string;
  color: string; // tailwind color class for UI
}

export const MATERIAL_TIERS: MaterialTier[] = [
  {
    id: "pt",
    label: "Pressure-Treated (PT) Wood",
    shortLabel: "PT Wood",
    description: "5/4×6 Southern Yellow Pine, AWPA UC4A/UC4B treated. Most affordable option.",
    examples: ["5/4×6 PT #2 SYP", "2×6 PT framing", "PT wood railing"],
    materialPerSqFtMin: 10,
    materialPerSqFtMax: 25,
    installedPerSqFtMin: 30,  // contractor quote low (budget tier)
    installedPerSqFtMax: 75,  // contractor quote high (premium tier)
    lifespan: "15–25 years with maintenance",
    maintenance: "Annual sealing/staining required. ~$200–$500/yr.",
    tariffImpact: "Most affected: PT lumber 15–25% above 2024 levels due to Canadian softwood tariffs.",
    color: "amber",
  },
  {
    id: "composite",
    label: "Mid-Range Composite",
    shortLabel: "Composite",
    description: "Trex Select, Fiberon Good Life, TimberTech EDGE. Low maintenance, 25-year warranty.",
    examples: ["Trex Select ($10.47–$11.52/SF)", "Fiberon Good Life ($5.89–$6.85/SF)", "TimberTech EDGE ($7.49–$9.51/SF)"],
    materialPerSqFtMin: 15,
    materialPerSqFtMax: 32,
    installedPerSqFtMin: 45,  // contractor quote low (budget tier)
    installedPerSqFtMax: 107, // contractor quote high (premium tier)
    lifespan: "25–30 years",
    maintenance: "Minimal. Annual cleaning ~$50–$150/yr.",
    tariffImpact: "Less affected (domestic manufacturing). Trex confirmed 7.5–15% increases effective 2025.",
    color: "green",
  },
  {
    id: "pvc",
    label: "Premium Composite / PVC",
    shortLabel: "Premium PVC",
    description: "TimberTech AZEK Vintage, Trex Transcend Lineage, Trex Transcend. Top-tier aesthetics and durability. Cable railing is a separate selection on the railing step.",
    examples: ["AZEK Vintage ($16.75/SF)", "Trex Transcend ($15.59/SF)", "Trex Transcend Lineage ($18–$22/SF)"],
    materialPerSqFtMin: 25,
    materialPerSqFtMax: 45,
    installedPerSqFtMin: 75,  // contractor quote low (budget tier)
    installedPerSqFtMax: 200, // contractor quote high (premium tier, AZEK/Transcend Lineage)
    lifespan: "30–50 years",
    maintenance: "Virtually none. Occasional cleaning ~$50/yr.",
    tariffImpact: "Minimal direct impact. Steel tariffs raised connector costs 10–15%.",
    color: "blue",
  },
];

// ─── DECKING BRANDS (contractor-only, shown for composite + pvc tiers) ────────
// Sources: Advantage Lumber price comparison chart (Apr 2026), rmfp.com brand comparison
// (Apr 2026), DecksDirect cost guide (Feb 2026), dgfloors.com composite pricing (Apr 2026).
// materialDeltaPerSqFt = additional material cost ABOVE the base tier rate.
// hiddenFastenerCompatible = supports hidden clip fastening systems.
// Sources for absolute material costs (boards only, no labor):
// Advantage Lumber price chart Apr 2026, rmfp.com brand comparison Apr 2026,
// DecksDirect cost guide Feb 2026, dgfloors.com composite pricing Apr 2026.
export const DECKING_BRANDS = [
  {
    id: "trex-enhance",
    name: "Trex Enhance Basics",
    brand: "Trex",
    tierIds: ["composite"],
    materialCostLow: 2.33,   // $/SF materials only (boards)
    materialCostHigh: 3.50,
    materialDeltaLow: -2.00, // delta vs tier baseline (used in calculate())
    materialDeltaHigh: -1.00,
    description: "Entry-level composite. Solid boards only — no hidden fastener groove. Best value for budget-conscious builds.",
    warranty: "25-year limited",
    hiddenFastenerCompatible: false,
  },
  {
    id: "fiberon-good-life",
    name: "Fiberon Good Life",
    brand: "Fiberon",
    tierIds: ["composite"],
    materialCostLow: 4.48,
    materialCostHigh: 6.85,
    materialDeltaLow: -1.00,
    materialDeltaHigh: 0.00,
    description: "Mid-range composite with grooved-edge option. Good color selection, hidden fastener compatible.",
    warranty: "25-year limited",
    hiddenFastenerCompatible: true,
  },
  {
    id: "trex-select",
    name: "Trex Select",
    brand: "Trex",
    tierIds: ["composite"],
    materialCostLow: 5.00,
    materialCostHigh: 7.00,
    materialDeltaLow: 0.00,
    materialDeltaHigh: 0.50,
    description: "Standard composite with grooved-edge boards available. Solid color palette, hidden fastener compatible.",
    warranty: "25-year limited",
    hiddenFastenerCompatible: true,
  },
  {
    id: "trex-transcend",
    name: "Trex Transcend",
    brand: "Trex",
    tierIds: ["pvc"],
    materialCostLow: 8.00,
    materialCostHigh: 12.00,
    materialDeltaLow: 0.00,
    materialDeltaHigh: 1.00,
    description: "Premium composite with realistic wood grain. Grooved-edge boards available. Hidden fastener compatible.",
    warranty: "25-year limited",
    hiddenFastenerCompatible: true,
  },
  {
    id: "fiberon-paramount",
    name: "Fiberon Paramount",
    brand: "Fiberon",
    tierIds: ["pvc"],
    materialCostLow: 9.00,
    materialCostHigh: 13.18,
    materialDeltaLow: 0.50,
    materialDeltaHigh: 2.00,
    description: "High-end PVC composite with deep wood grain texture. Grooved-edge boards available for hidden fasteners.",
    warranty: "Lifetime limited",
    hiddenFastenerCompatible: true,
  },
  {
    id: "azek-vintage",
    name: "TimberTech AZEK Vintage",
    brand: "TimberTech",
    tierIds: ["pvc"],
    materialCostLow: 11.00,
    materialCostHigh: 13.50,
    materialDeltaLow: 2.00,
    materialDeltaHigh: 4.00,
    description: "Ultra-premium capped PVC. Highest durability and aesthetics. Grooved-edge available for hidden fasteners.",
    warranty: "Lifetime limited",
    hiddenFastenerCompatible: true,
  },
];

export type DeckingBrand = (typeof DECKING_BRANDS)[number];

// ─── COMPLEXITY MULTIPLIERS ────────────────────────────────────────────────────
export interface Complexity {
  id: string;
  label: string;
  description: string;
  laborMultiplier: number;
  laborPctRange: string;
}

export const COMPLEXITIES: Complexity[] = [
  {
    id: "simple",
    label: "Simple Rectangle",
    description: "Ground-level or low-rise, single level, straight boards, standard railing",
    laborMultiplier: 1.0,
    laborPctRange: "45–50%",
  },
  {
    id: "standard",
    label: "Standard Raised",
    description: "Raised deck (2–8 ft), stairs, composite decking, standard railing",
    laborMultiplier: 1.3,
    laborPctRange: "50–60%",
  },
  {
    id: "angled",
    label: "Angled / Non-Rectangular",
    description: "45° angles, L-shape, T-shape, or non-rectangular layout. Extra cuts, waste, and layout time.",
    laborMultiplier: 1.65,
    laborPctRange: "55–65%",
  },
  {
    id: "custom",
    label: "Curved / Custom",
    description: "Curved edges, angled boards, custom shapes, premium railing systems",
    laborMultiplier: 2.1,
    laborPctRange: "55–65%",
  },
];

// ─── RAILING SYSTEMS ───────────────────────────────────────────────────────────
export interface RailingSystem {
  id: string;
  label: string;
  materialPerLFMin: number;
  materialPerLFMax: number;
  installedPerLFMin: number;
  installedPerLFMax: number;
}

// Pricing updated April 2026 based on research from HomeAdvisor (Nov 2025), Angi (Mar 2026),
// HomeGuide, Deck & Rail Supply, Senmit (Dec 2025), Advantage Lumber (Mar 2026).
// All "installed" figures include materials + professional labor (national average).
export const RAILING_SYSTEMS: RailingSystem[] = [
  { id: "pt-wood",           label: "PT Wood",                              materialPerLFMin: 12,  materialPerLFMax: 25,  installedPerLFMin: 35,  installedPerLFMax: 70  },
  { id: "composite-select",  label: "Composite (Trex Select / TimberTech)", materialPerLFMin: 22,  materialPerLFMax: 40,  installedPerLFMin: 60,  installedPerLFMax: 110 },
  { id: "composite-premium", label: "Composite Premium (Trex Transcend)",   materialPerLFMin: 38,  materialPerLFMax: 60,  installedPerLFMin: 80,  installedPerLFMax: 135 },
  { id: "aluminum",          label: "Aluminum Picket Railing",              materialPerLFMin: 35,  materialPerLFMax: 70,  installedPerLFMin: 65,  installedPerLFMax: 130 },
  { id: "cable",             label: "Cable Rail (Feeney / Muzata)",         materialPerLFMin: 50,  materialPerLFMax: 110, installedPerLFMin: 100, installedPerLFMax: 250 },
  { id: "glass",             label: "Glass (Framed)",                       materialPerLFMin: 90,  materialPerLFMax: 220, installedPerLFMin: 150, installedPerLFMax: 500 },
];

// ─── INSTALLED COST LOOKUP TABLE ───────────────────────────────────────────────
// [sqFt][tier] = { low, high } installed cost (national baseline, before regional multiplier)
// Contractor-quote-calibrated installed cost table.
// Values represent what a homeowner will realistically be quoted by a contractor,
// not the raw installed cost. Low = budget contractor (15% mat / 20% labor / 10% OH),
// High = premium contractor (30% mat / 45% labor / 20% OH).
// Sources: HomeAdvisor 2026, Angi 2026, TimberTech/Trex dealer surveys, Reddit r/Decks.
export const INSTALLED_COST_TABLE: Record<string, Record<string, { low: number; high: number }>> = {
  "100": {
    pt: { low: 3000, high: 7000 },
    composite: { low: 4000, high: 11000 },
    pvc: { low: 7000, high: 21000 },
  },
  "192": {
    pt: { low: 5500, high: 14500 },
    composite: { low: 8500, high: 21500 },
    pvc: { low: 14500, high: 39500 },
  },
  "320": {
    pt: { low: 9500, high: 25000 },
    composite: { low: 14500, high: 34000 },
    pvc: { low: 24000, high: 62500 },
  },
  "480": {
    pt: { low: 14500, high: 36000 },
    composite: { low: 21500, high: 50000 },
    pvc: { low: 35500, high: 95000 },
  },
  "600": {
    pt: { low: 18000, high: 45000 },
    composite: { low: 26000, high: 62500 },
    pvc: { low: 47500, high: 120000 },
  },
};

// Materials-only cost table (DIY)
export const MATERIALS_COST_TABLE: Record<string, Record<string, { low: number; high: number }>> = {
  "100": {
    pt: { low: 1000, high: 2500 },
    composite: { low: 1500, high: 3200 },
    pvc: { low: 2500, high: 5500 },
  },
  "192": {
    pt: { low: 1920, high: 4800 },
    composite: { low: 2900, high: 5800 },
    pvc: { low: 5000, high: 10000 },
  },
  "320": {
    pt: { low: 3200, high: 8000 },
    composite: { low: 4800, high: 9600 },
    pvc: { low: 8000, high: 16000 },
  },
  "480": {
    pt: { low: 4800, high: 12000 },
    composite: { low: 7200, high: 15400 },
    pvc: { low: 12000, high: 24000 },
  },
  "600": {
    pt: { low: 6000, high: 15000 },
    composite: { low: 9000, high: 21000 },
    pvc: { low: 15000, high: 35000 },
  },
};

// ─── COST BREAKDOWN CATEGORIES ─────────────────────────────────────────────────
export interface CostBreakdown {
  category: string;
  pctOfTotal: number;
  low: number;
  high: number;
  note: string;
}

// ─── TOOL RENTAL OPTIONS (DIY) ────────────────────────────────────────────────
export interface ToolRentalOption {
  id: string;
  label: string;
  description: string;
  dailyRentLow: number;
  dailyRentHigh: number;
  daysNeeded: number;
  neededFor: string[];
}

export const TOOL_RENTAL_OPTIONS: ToolRentalOption[] = [
  {
    id: "circular-saw",
    label: "Circular Saw",
    description: "For cutting decking boards and framing lumber",
    dailyRentLow: 35,
    dailyRentHigh: 55,
    daysNeeded: 2,
    neededFor: ["pt", "composite", "pvc"],
  },
  {
    id: "post-hole-digger",
    label: "Power Auger / Post-Hole Digger",
    description: "For drilling footings — essential for frost-depth regions",
    dailyRentLow: 75,
    dailyRentHigh: 120,
    daysNeeded: 1,
    neededFor: ["pt", "composite", "pvc"],
  },
  {
    id: "impact-driver",
    label: "Impact Driver + Drill Set",
    description: "For driving screws and fasteners",
    dailyRentLow: 25,
    dailyRentHigh: 40,
    daysNeeded: 3,
    neededFor: ["pt", "composite", "pvc"],
  },
  {
    id: "miter-saw",
    label: "Miter / Chop Saw",
    description: "For precise angle cuts on railing and trim",
    dailyRentLow: 45,
    dailyRentHigh: 70,
    daysNeeded: 2,
    neededFor: ["composite", "pvc"],
  },
  {
    id: "concrete-mixer",
    label: "Concrete Mixer",
    description: "For mixing footing concrete on-site",
    dailyRentLow: 40,
    dailyRentHigh: 65,
    daysNeeded: 1,
    neededFor: ["pt", "composite", "pvc"],
  },
  {
    id: "jigsaw",
    label: "Jigsaw",
    description: "For curved cuts — only needed for custom designs",
    dailyRentLow: 20,
    dailyRentHigh: 35,
    daysNeeded: 1,
    neededFor: ["composite", "pvc"],
  },
];

export const DIY_SKILL_LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "First deck build. Comfortable with basic power tools.",
    wasteFactor: 0.18,
    timeMultiplier: 2.0,
    notes: [
      "Add 18% material waste for cutting errors and learning curve",
      "Budget extra time — a 320 sq ft deck may take 3–4 weekends",
      "Consider hiring a framing contractor for footings and ledger",
    ],
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Have completed home improvement projects. Comfortable with framing.",
    wasteFactor: 0.12,
    timeMultiplier: 1.4,
    notes: [
      "Add 12% material waste — standard industry allowance",
      "A 320 sq ft deck typically takes 2–3 weekends for an intermediate DIYer",
    ],
  },
  {
    id: "experienced",
    label: "Experienced",
    description: "Built decks or similar structures before.",
    wasteFactor: 0.08,
    timeMultiplier: 1.0,
    notes: [
      "Standard 8–10% waste factor for experienced builders",
    ],
  },
];

// ─── CONTRACTOR MARKUP TIERS ───────────────────────────────────────────────────
export const CONTRACTOR_MARKUP_TIERS = [
  {
    id: "low",
    label: "Competitive / Volume",
    description: "Lower margin, high volume. Typical for established contractors with repeat clients.",
    materialMarkup: 0.15,
    laborMarkup: 0.20,
    overheadPct: 0.10,
  },
  {
    id: "standard",
    label: "Standard Market Rate",
    description: "Typical residential contractor margin. Covers overhead, insurance, warranty.",
    materialMarkup: 0.20,
    laborMarkup: 0.25,
    overheadPct: 0.12,
  },
  {
    id: "premium",
    label: "Premium / Custom",
    description: "High-end or specialty contractor. Full design service, warranty, premium materials.",
    materialMarkup: 0.30,
    laborMarkup: 0.35,
    overheadPct: 0.15,
  },
];

// ─── ENGINEER FEE PRESETS ────────────────────────────────────────────────────
// Sources: Angi 2026 ($200–$1,500), Thumbtack 2026 ($566–$965 avg), HomeAdvisor 2025 ($350–$800)
// Three tiers covering the most common deck engineering scenarios.
export const ENGINEER_FEE_PRESETS = [
  {
    id: "stamp",
    label: "Stamped Letter",
    description: "Engineer reviews standard plans and provides a signed/stamped letter. Common for simple ground-level or low-elevation decks.",
    fee: 350,
    range: "$250–$450",
    typical: "Simple decks, ground-level, standard span",
  },
  {
    id: "review",
    label: "Plan Review & Stamp",
    description: "Engineer reviews and stamps custom plans. The most common requirement for permit-required decks.",
    fee: 650,
    range: "$500–$800",
    typical: "Most residential decks requiring a permit",
  },
  {
    id: "design",
    label: "Full Structural Design",
    description: "Engineer designs and stamps full structural drawings. Required for elevated, multi-level, cantilevered, or unusual load decks.",
    fee: 1100,
    range: "$900–$1,500",
    typical: "Elevated, multi-level, cantilever, or complex loads",
  },
] as const;

export type EngineerFeePresetId = typeof ENGINEER_FEE_PRESETS[number]["id"];

// ─── FRAMING OPTIONS (contractor-only) ───────────────────────────────────────
// Sources: Advantage Lumber 2026, BuildingAdvisor, HomeGuide, contractor field data
// materialCostPerSqFt: framing lumber/steel cost at the lumberyard (materials only)
// laborMultiplier:     multiplier on the base labor cost (1.0 = same as standard PT framing)
// installDaysAdder:    additional crew-days for specialty framing (steel/aluminum require
//                      different fasteners, drilling, and layout time)
export const FRAMING_OPTIONS = [
  {
    id: "pt",
    label: "Standard PT Wood",
    shortLabel: "PT Wood",
    description: "Pressure-treated Southern Yellow Pine or Douglas Fir. Industry standard for residential decks.",
    pros: ["Lowest material cost", "Widely available", "Easy to cut/fasten"],
    cons: ["Requires periodic sealing", "Can warp/check over time", "Chemical treatment concerns"],
    materialCostPerSqFt: { low: 3.50, high: 5.50 },  // joists + beams + posts + ledger
    laborMultiplier: 1.00,
    installDaysAdder: 0,
    lifespan: "15–30 years with maintenance",
    icon: "🪵",
    badge: null,
  },
  {
    id: "pwt",
    label: "PWT Framing",
    shortLabel: "PWT",
    description: "Premium pressure-treated wood with higher retention levels (UC4B/UC4C). Ideal for ground contact, high-moisture, or coastal environments.",
    pros: ["Superior rot resistance", "Code-required in many wet/coastal zones", "Longer service life than standard PT"],
    cons: ["20–35% cost premium over standard PT", "Heavier than standard PT", "Requires stainless or hot-dip galvanized hardware"],
    materialCostPerSqFt: { low: 4.50, high: 7.00 },
    laborMultiplier: 1.05,  // slightly heavier, same skill set
    installDaysAdder: 0,
    lifespan: "25–40 years with maintenance",
    icon: "🌲",
    badge: "Coastal / Wet Zones",
  },
  {
    id: "steel",
    label: "Steel Framing",
    shortLabel: "Steel",
    description: "Galvanized or powder-coated steel joists and beams (e.g., Fortress Evolution, DeckFrame). Eliminates rot and insect damage entirely.",
    pros: ["No rot, no insects, no warping", "Longer spans — fewer posts", "Lifetime structural warranty from major brands"],
    cons: ["2–3× material cost of PT", "Requires specialized fasteners", "Longer install time", "Thermal expansion in extreme climates"],
    materialCostPerSqFt: { low: 8.00, high: 14.00 },
    laborMultiplier: 1.30,  // drilling, specialized connectors, layout
    installDaysAdder: 1,
    lifespan: "40–50+ years",
    icon: "⚙️",
    badge: "Premium",
  },
  {
    id: "aluminum",
    label: "Aluminum Framing",
    shortLabel: "Aluminum",
    description: "Extruded aluminum framing systems (e.g., Wahoo Decks, Trex Elevations). Lightweight, corrosion-proof, and ideal for rooftop or waterproof deck applications.",
    pros: ["Lightest structural option", "100% corrosion-proof", "Ideal for rooftop / waterproof decks", "No maintenance"],
    cons: ["Highest material cost", "Requires proprietary connectors", "Longest install time", "Not DIY-friendly"],
    materialCostPerSqFt: { low: 10.00, high: 18.00 },
    laborMultiplier: 1.45,  // proprietary connectors, layout, learning curve
    installDaysAdder: 2,
    lifespan: "50+ years",
    icon: "🔩",
    badge: "Rooftop / Waterproof",
  },
] as const;

export type FramingOption = typeof FRAMING_OPTIONS[number];

// ─── LABOR MARKET TIERS (contractor-only) ────────────────────────────────────
// Sources: RSMeans City Cost Index 2025/2026, BLS Occupational Employment Stats,
// HomeGuide 2026 regional labor data, contractor field reports.
// Applied as a multiplier on top of the regional labor multiplier.
// Rural: limited skilled labor pool, lower COL, lower overhead → 0.82×
// Suburban: national baseline → 1.00×
// Metro: union presence, higher wages, parking/access costs, higher demand → 1.28×
export const MARKET_TIERS = [
  {
    id: "rural",
    label: "Rural / Small Town",
    shortLabel: "Rural",
    description: "Limited labor pool, lower cost of living, lower overhead. Typical for projects outside metro areas.",
    laborMultiplier: 0.82,
    examples: "Population under 50K, 30+ min from major city",
    icon: "🌾",
    badge: "Lower labor rates",
    badgeColor: "emerald" as const,
  },
  {
    id: "suburban",
    label: "Suburban",
    shortLabel: "Suburban",
    description: "National baseline. Typical residential contractor market with standard labor availability.",
    laborMultiplier: 1.00,
    examples: "Suburbs of mid-size or major cities",
    icon: "🏘️",
    badge: "National baseline",
    badgeColor: "blue" as const,
  },
  {
    id: "metro",
    label: "Metro / High-Demand",
    shortLabel: "Metro",
    description: "Union presence, higher wages, parking/access costs, high contractor demand. Major metro areas.",
    laborMultiplier: 1.28,
    examples: "NYC, LA, Chicago, Boston, Seattle, SF, DC",
    icon: "🏙️",
    badge: "Higher labor rates",
    badgeColor: "amber" as const,
  },
] as const;

export type MarketTier = typeof MARKET_TIERS[number];

export const CREW_SIZES = [
  { id: "solo", label: "Solo Contractor", size: 1, laborEfficiencyFactor: 0.7 },
  { id: "two", label: "2-Person Crew", size: 2, laborEfficiencyFactor: 1.0 },
  { id: "three", label: "3-Person Crew", size: 3, laborEfficiencyFactor: 1.3 },
  { id: "four-plus", label: "4+ Person Crew", size: 4, laborEfficiencyFactor: 1.5 },
];

// ─── CALCULATION ENGINE ────────────────────────────────────────────────────────
export interface CalculatorInputs {
  audience: AudienceType;
  regionId: string;
  sizeId: string;
  tierId: string;
  complexityId: string;
  railingId: string | null;
  railingLF: number;
  includeStairs: boolean;
  stairSteps: number;
  stairWidthFt?: number; // 4–8 ft, base 4ft, +$150/step per extra foot (contractor field data)
  includeStairRailing?: boolean; // opt-in, uses same system as deck railing
  // DIY-specific
  skillLevelId?: string;
  selectedTools?: string[];
  includePermit?: boolean;
  permitCost?: number;
  // Contractor-specific
  markupTierId?: string;
  includeMarkup?: boolean;
  crewSizeId?: string;
  includeCrew?: boolean;
  subFootings?: boolean;
  // Decking brand / product line (contractor only, composite + pvc tiers)
  brandId?: string;             // id from DECKING_BRANDS; undefined = no specific brand
  // Hidden fastener system (contractor only)
  // "none" | "clip" | "cortex"
  includeHiddenFasteners?: boolean; // legacy: true = "clip" if fastenerSystemId not set
  fastenerSystemId?: "none" | "clip" | "cortex";
  // Edge board type (contractor only)
  edgeBoardType?: "solid" | "grooved"; // grooved auto-set when hidden fasteners on
  // Custom size (contractor only)
  customSqFt?: number; // used when sizeId === "custom" or "shape"
  // Demolition / removal (contractor only)
  includeDemoRemoval?: boolean;
  demoMaterialType?: "wood" | "composite" | "other"; // affects labor difficulty
  demoIncludeDisposal?: boolean; // include dumpster/haul-away fee
  demoPermit?: boolean; // some jurisdictions require demo permit
  // Framing material (contractor only)
  framingId?: string; // defaults to "pt" if not set
  // Labor market tier (contractor only)
  marketTierId?: string; // defaults to "suburban" if not set
  // 3D rendering (contractor only)
  rendering3dTier?: "none" | "basic" | "professional" | "premium";
  // Joist spacing (contractor only)
  joistSpacingIn?: 12 | 16 | 24; // on-center spacing in inches; defaults to 16
  // Footing spec (contractor only)
  footingDiameterIn?: 8 | 10 | 12 | 16; // tube footing diameter; defaults to 10"
  useHelicalPiers?: boolean;             // replace tube footings with helical piers
  // Railing detail (contractor only)
  postMountId?: "surface" | "fascia";
  postSpacingFt?: 4 | 6 | 8;   // on-center post spacing in feet
  railingHeightIn?: 36 | 42;   // 36" standard residential, 42" elevated/commercial
  // Multi-level deck (contractor + DIY)
  isMultiLevel?: boolean;
  level2SizeId?: string;  // same IDs as sizeId, or "custom"
  level2CustomSqFt?: number;
  // Deck height above grade (used by Material Takeoff for stair step calculation)
  deckHeightIn?: number; // inches above grade; defaults to 24
  // Homeowner markup overlay — optional contractor markup applied to homeowner totalLow/High
  homeownerMarkupTierId?: string; // if set, applies this markup tier to homeowner totals
  // Engineer fee (all paths)
  includeEngineer?: boolean;       // toggle: include structural engineer fee
  engineerCost?: number;           // dollar amount (from preset or custom entry)
  engineerCostMode?: "preset" | "custom"; // contractor-only: which input mode
}

export interface CalculatorResult {
  totalLow: number;
  totalHigh: number;
  totalMid: number;
  laborLow: number;
  laborHigh: number;
  materialsLow: number;
  materialsHigh: number;
  railingLow: number;
  railingHigh: number;
  footingLow: number;
  footingHigh: number;
  stairsLow: number;
  stairsHigh: number;
  stairRailingLow: number;
  stairRailingHigh: number;
  demolitionLow: number;
  demolitionHigh: number;
  demolitionLaborLow: number;
  demolitionLaborHigh: number;
  demolitionDisposalLow: number;
  demolitionDisposalHigh: number;
  demolitionPermitCost: number;
  framingOption: FramingOption;
  framingCostLow: number;
  framingCostHigh: number;
  // Joist spacing (contractor only)
  joistSpacingIn: 12 | 16 | 24;
  joistCount: number;          // number of joists (including end joists)
  joistLengthFt: number;       // span of each joist in feet
  joistBoardFeet: number;      // total board-feet of joist lumber
  joistSpacingCostDelta: number; // cost delta vs 16" OC baseline (can be negative)
  joistSpanWarning: {
    exceeded: boolean;
    spanFt: number;           // actual joist span (short deck dimension)
    maxAllowedFt: number;     // IRC R507.6 max for 2×10 @ selected spacing
    upgradeMaxFt: number;     // max span if upgraded to 2×12
    message: string;
  } | null;
  // Footing spec (contractor only)
  footingCount: number;
  footingDiameterIn: 8 | 10 | 12 | 16;
  useHelicalPiers: boolean;
  footingSpecCostLow: number;    // delta vs baseline 10" tube footing
  footingSpecCostHigh: number;
  // Brand / fastener / edge board (contractor only)
  deckingBrand: DeckingBrand | null;
  brandDeltaLow: number;
  brandDeltaHigh: number;
  fastenerSystem: "none" | "clip" | "cortex";
  hiddenFastenerCostLow: number;
  hiddenFastenerCostHigh: number;
  edgeBoardUpgradeLow: number;
  edgeBoardUpgradeHigh: number;
  rendering3dCostLow: number;
  rendering3dCostHigh: number;
  multiLevelPremiumLow: number;
  multiLevelPremiumHigh: number;
  level2SqFt: number;
  climatePremium: number;
  perSqFtLow: number;
  perSqFtHigh: number;
  breakdown: CostBreakdown[];
  regionMultiplier: number;
  complexityMultiplier: number;
  warnings: string[];
  tier: MaterialTier;
  region: Region;
  size: DeckSize;
  complexity: Complexity;
  railing: RailingSystem;
  // Railing detail (contractor only)
  railingPostCount: number;         // estimated post count based on LF / postSpacingFt
  railingPostMountCostLow: number;
  railingPostMountCostHigh: number;
  railingHeightPremiumLow: number;
  railingHeightPremiumHigh: number;
  railingDetailCostLow: number;     // combined post mount + height premium
  railingDetailCostHigh: number;
  marketTier: MarketTier;
  isDIY: boolean;
  isContractor: boolean;
  permitCost: number;
  engineerCost: number; // 0 if not included
  // Inputs echoed back for downstream use (e.g. Material Takeoff)
  railingLF: number;
  includeStairs: boolean;
  stairSteps: number;
  deckHeightIn: number;  // inches above grade (defaults to 24 if not provided)
  // DIY extras
  diy?: {
    skillLevel: typeof DIY_SKILL_LEVELS[number];
    wasteFactor: number;
    wastedMaterialCost: number;
    toolRentalLow: number;
    toolRentalHigh: number;
    selectedTools: ToolRentalOption[];
    permitCost: number;
    totalWithExtrasLow: number;
    totalWithExtrasHigh: number;
    estimatedWeekends: number;
    savingsVsHiring: number;
  };
  // Contractor extras
  contractor?: {
    demolitionCostLow: number;
    demolitionCostHigh: number;
    markupTier: typeof CONTRACTOR_MARKUP_TIERS[number];
    crewSize: typeof CREW_SIZES[number];
    materialCostRaw: number;
    laborCostRaw: number;
    materialWithMarkup: number;
    laborWithMarkup: number;
    overhead: number;
    totalBidLow: number;
    totalBidHigh: number;
    grossMarginPct: number;
    estimatedDays: number;
    subFootingsCost: number;
    perSqFtBidLow: number;
    perSqFtBidHigh: number;
  };
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const region = REGIONS.find((r) => r.id === inputs.regionId)!;
  // Support custom size / custom shape: create a synthetic DeckSize when sizeId === "custom" or "shape"
  const isCustomSize = inputs.sizeId === "custom" || inputs.sizeId === "shape";
  const customSqFt = inputs.customSqFt ?? 320;
  const size: DeckSize = isCustomSize
    ? { id: inputs.sizeId, label: inputs.sizeId === "shape" ? "Custom Shape" : "Custom", sqFt: customSqFt, dimensions: `${Math.round(Math.sqrt(customSqFt))} × ${Math.round(customSqFt / Math.round(Math.sqrt(customSqFt)))} ft (approx)` }
    : DECK_SIZES.find((s) => s.id === inputs.sizeId)!;
  const tier = MATERIAL_TIERS.find((t) => t.id === inputs.tierId)!;
  const complexity = COMPLEXITIES.find((c) => c.id === inputs.complexityId)!;
  // When railingId is null (user hasn't selected yet), use composite-select as the
  // display/label fallback but produce ZERO railing cost so the ticker visibly updates
  // on first card click regardless of which card is chosen.
  const railing = RAILING_SYSTEMS.find((r) => r.id === inputs.railingId)
    ?? RAILING_SYSTEMS.find((r) => r.id === "composite-select")!;
  const hasRailingSelection = inputs.railingId !== null;
  const isDIY = inputs.audience === "diy";
  const isContractor = inputs.audience === "contractor";

  // Base installed cost from lookup table (or interpolated for custom/shape size)
  const baseInstalled: { low: number; high: number } = isCustomSize
    ? {
        low:  Math.round(tier.installedPerSqFtMin * customSqFt),
        high: Math.round(tier.installedPerSqFtMax * customSqFt),
      }
    : INSTALLED_COST_TABLE[inputs.sizeId][inputs.tierId];
  const baseMaterials: { low: number; high: number } = isCustomSize
    ? {
        low:  Math.round(tier.materialPerSqFtMin * customSqFt),
        high: Math.round(tier.materialPerSqFtMax * customSqFt),
      }
    : MATERIALS_COST_TABLE[inputs.sizeId][inputs.tierId];

  // Regional multiplier applied to labor portion (~55% of total)
  const laborFraction = 0.55;
  const materialFraction = 1 - laborFraction;
  const regionMultiplier = region.laborMultiplier;
  const complexityMultiplier = complexity.laborMultiplier;
  const marketTier = MARKET_TIERS.find((m) => m.id === inputs.marketTierId) ?? MARKET_TIERS[1]; // default suburban
  const marketMultiplier = isContractor ? marketTier.laborMultiplier : 1.0;

  // Adjust for region and complexity
  const adjustedLow = isDIY
    ? baseMaterials.low
    : Math.round(
        baseInstalled.low * materialFraction +
          baseInstalled.low * laborFraction * regionMultiplier * complexityMultiplier * marketMultiplier
      );
  const adjustedHigh = isDIY
    ? baseMaterials.high
    : Math.round(
        baseInstalled.high * materialFraction +
          baseInstalled.high * laborFraction * regionMultiplier * complexityMultiplier * marketMultiplier
      );

  // Railing cost — 25% premium applied to all systems except cable and glass
  // Zero cost until user makes an explicit selection (hasRailingSelection)
  const railingLF = inputs.railingLF;
  const railingPremiumMultiplier = (railing.id === "cable" || railing.id === "glass") ? 1.0 : 1.25;
  const railingLow = hasRailingSelection
    ? (isDIY
        ? Math.round(railing.materialPerLFMin * railingLF * railingPremiumMultiplier)
        : Math.round(railing.installedPerLFMin * railingLF * railingPremiumMultiplier))
    : 0;
  const railingHigh = hasRailingSelection
    ? (isDIY
        ? Math.round(railing.materialPerLFMax * railingLF * railingPremiumMultiplier)
        : Math.round(railing.installedPerLFMax * railingLF * railingPremiumMultiplier))
    : 0;

  // ── Railing Detail (all paths — contractor overrides defaults, homeowner/DIY use defaults) ────
  // Post count: railingLF / postSpacingFt + 1 corner posts (estimate)
  const postSpacingFt = (inputs.postSpacingFt ?? 6) as 4 | 6 | 8;
  const railingHeightIn = (inputs.railingHeightIn ?? 36) as 36 | 42;
  const railingPostCount = hasRailingSelection
    ? Math.max(2, Math.round(railingLF / postSpacingFt) + 1)
    : 0;
  // Post mount style cost delta per post
  // Surface-mount: $8–$12/post (hardware + minor labor) — default for homeowner/DIY
  // Fascia-mount: $15–$22/post (more complex bracket + fascia board) — contractor override
  const postMountId = (inputs.postMountId ?? "surface") as "surface" | "fascia";
  const postMountDeltaLow  = postMountId === "fascia" ? 15 : 8;
  const postMountDeltaHigh = postMountId === "fascia" ? 22 : 12;
  const railingPostMountCostLow  = hasRailingSelection ? railingPostCount * postMountDeltaLow  : 0;
  const railingPostMountCostHigh = hasRailingSelection ? railingPostCount * postMountDeltaHigh : 0;
  // Height premium: 42" requires taller posts and more infill material
  // +$3–$5/LF over standard 36" height — default 36" means $0 for homeowner/DIY
  const railingHeightPremiumLow  = hasRailingSelection && railingHeightIn === 42 ? Math.round(railingLF * 3) : 0;
  const railingHeightPremiumHigh = hasRailingSelection && railingHeightIn === 42 ? Math.round(railingLF * 5) : 0;

  // Combined railing detail cost
  const railingDetailCostLow  = railingPostMountCostLow  + railingHeightPremiumLow;
  const railingDetailCostHigh = railingPostMountCostHigh + railingHeightPremiumHigh;

  // Footing cost based on region frost depth
  const footingCount = size.sqFt <= 200 ? 6 : size.sqFt <= 350 ? 10 : size.sqFt <= 500 ? 12 : 16;
  const frostDepth = region.frostDepthInches;
  let footingCostPerUnit = 68; // baseline 10" tube @ shallow frost
  if (frostDepth >= 36 && frostDepth < 48) footingCostPerUnit = 85;
  else if (frostDepth >= 48 && frostDepth < 60) footingCostPerUnit = 125;
  else if (frostDepth >= 60) footingCostPerUnit = 158;
  const footingLow = isDIY
    ? Math.round(footingCostPerUnit * footingCount * 0.4)
    : Math.round(footingCostPerUnit * footingCount * 1.2);
  const footingHigh = isDIY
    ? Math.round(footingCostPerUnit * footingCount * 0.7)
    : Math.round(footingCostPerUnit * footingCount * 2.0);

  // ── Contractor Footing Spec ──────────────────────────────────────────────
  // Footing diameter cost delta vs 10" baseline (tube footings).
  // Concrete volume scales with r²: 8"=50.3in², 10"=78.5in², 12"=113in², 16"=201in²
  // Installed cost per footing (materials + labor + tube form + concrete):
  //   8": $55–$90   (less concrete, faster drill, lighter load capacity)
  //   10": $68–$120  (baseline — most common residential)
  //   12": $90–$160  (heavier loads, larger decks, steel framing)
  //   16": $145–$240 (commercial-grade, high-load, frost-heave zones)
  // Sources: HomeGuide 2026, Angi 2026, contractor field data (Facebook Decking Pros Apr 2026)
  // Helical piers: $250–$450/pier installed (no excavation, instant load, expansive soils)
  // Sources: Foundation Supportworks, GoliathTech, contractor field data Apr 2026
  const footingDiameterIn = isContractor
    ? ((inputs.footingDiameterIn ?? 10) as 8 | 10 | 12 | 16)
    : 10;
  const useHelicalPiers = isContractor && (inputs.useHelicalPiers ?? false);

  // Per-footing cost for each diameter (low, high) — installed, contractor
  const FOOTING_DIAMETER_COST: Record<8 | 10 | 12 | 16, [number, number]> = {
    8:  [55,  90],
    10: [68,  120],  // baseline
    12: [90,  160],
    16: [145, 240],
  };
  // Helical pier cost per pier (installed, contractor)
  const HELICAL_PIER_COST: [number, number] = [250, 450];

  // Cost delta vs 10" baseline tube footing (or vs tube footing if switching to helical)
  let footingSpecCostLow = 0;
  let footingSpecCostHigh = 0;
  if (isContractor) {
    if (useHelicalPiers) {
      // Full replacement: helical pier cost - baseline 10" tube cost
      const baselineLow  = FOOTING_DIAMETER_COST[10][0] * footingCount;
      const baselineHigh = FOOTING_DIAMETER_COST[10][1] * footingCount;
      const helicalLow   = HELICAL_PIER_COST[0] * footingCount;
      const helicalHigh  = HELICAL_PIER_COST[1] * footingCount;
      footingSpecCostLow  = helicalLow  - baselineLow;
      footingSpecCostHigh = helicalHigh - baselineHigh;
    } else {
      // Diameter delta vs 10" baseline
      const [dLow,  dHigh]  = FOOTING_DIAMETER_COST[footingDiameterIn];
      const [bLow,  bHigh]  = FOOTING_DIAMETER_COST[10];
      footingSpecCostLow  = (dLow  - bLow)  * footingCount;
      footingSpecCostHigh = (dHigh - bHigh) * footingCount;
    }
  }

  // Stairs
  // Per-step rates are FULLY INSTALLED costs (stringers, treads, risers, hardware, concrete landing pad, labor).
  // Sources: HomeGuide 2026 ($30–$60/step PT materials-only; $100–$175/step installed),
  //          Angi 2026 ($60–$250/step installed), contractor field data (Facebook Decking Pros group).
  // DIY rates = materials only (treads, stringers, risers, hardware — no labor).
  // Contractor rates = full installed cost including labor, concrete landing pad, and hardware.
  const stairWidthFt = inputs.stairWidthFt ?? 4;
  const widthPremiumPerStep = Math.max(0, stairWidthFt - 4) * 150; // +$150/step per ft over 4ft base (contractor field data)
  const stairsLow = inputs.includeStairs
    ? isDIY
      ? inputs.stairSteps * (tier.id === "pt" ? 25 : tier.id === "composite" ? 50 : 65)   // materials only
      : inputs.stairSteps * ((tier.id === "pt" ? 100 : tier.id === "composite" ? 150 : 200) + widthPremiumPerStep) // fully installed
    : 0;
  const stairsHigh = inputs.includeStairs
    ? isDIY
      ? inputs.stairSteps * (tier.id === "pt" ? 50 : tier.id === "composite" ? 90 : 110)  // materials only
      : inputs.stairSteps * ((tier.id === "pt" ? 175 : tier.id === "composite" ? 250 : 400) + widthPremiumPerStep) // fully installed
    : 0;

  // Stair railing — uses same system as deck railing but with a 20% premium
  // to reflect angle cuts, rake hardware, and stricter code requirements on stairs.
  // Sources: HomeAdvisor, Angi, and contractor field data consistently show stair
  // railing running 15–25% more per LF than equivalent deck railing.
  const STAIR_RAILING_PREMIUM = 1.20;
  const stairRailingLF = inputs.includeStairs && inputs.includeStairRailing
    ? Math.round(inputs.stairSteps * 0.75 * 2) // ~0.75 LF of railing per step, both sides
    : 0;
  const stairRailingLow = stairRailingLF > 0
    ? (isDIY
        ? Math.round(railing.materialPerLFMin * stairRailingLF * railingPremiumMultiplier * STAIR_RAILING_PREMIUM)
        : Math.round(railing.installedPerLFMin * stairRailingLF * railingPremiumMultiplier * STAIR_RAILING_PREMIUM))
    : 0;
  const stairRailingHigh = stairRailingLF > 0
    ? (isDIY
        ? Math.round(railing.materialPerLFMax * stairRailingLF * railingPremiumMultiplier * STAIR_RAILING_PREMIUM)
        : Math.round(railing.installedPerLFMax * stairRailingLF * railingPremiumMultiplier * STAIR_RAILING_PREMIUM))
    : 0;

  // Demolition / removal cost (contractor only)
  // Sources: HomeGuide 2026, Angi 2026, contractor field data (Facebook Decking Pros group)
  // Labor: PT wood $5–$8/sqft, composite $6–$10/sqft, other $7–$11/sqft
  // Height premium: deck > 30" adds $1–$2/sqft
  // Disposal (dumpster): small deck $300–$450, medium $400–$600, large $550–$800
  // Demo permit (when required): $75 flat pass-through
  let demolitionLow = 0;
  let demolitionHigh = 0;
  let demolitionLaborLow = 0;
  let demolitionLaborHigh = 0;
  let demolitionDisposalLow = 0;
  let demolitionDisposalHigh = 0;
  let demolitionPermitCost = 0;
  if (isContractor && inputs.includeDemoRemoval) {
    const demoSqFt = isCustomSize ? (inputs.customSqFt ?? 320) : (DECK_SIZES.find(s => s.id === inputs.sizeId)?.sqFt ?? 320);
    const mat = inputs.demoMaterialType ?? "wood";
    const laborLowPerSqFt = mat === "composite" ? 6 : mat === "other" ? 7 : 5;
    const laborHighPerSqFt = mat === "composite" ? 10 : mat === "other" ? 11 : 8;
    // Height premium (deckHeightIn is stored in inputs but not yet in CalculatorInputs — use a proxy: if deck is elevated, add $1–$2)
    const heightPremiumLow = 0; // height data not in inputs yet; conservative
    const heightPremiumHigh = 0;
    demolitionLaborLow = Math.round(demoSqFt * (laborLowPerSqFt + heightPremiumLow));
    demolitionLaborHigh = Math.round(demoSqFt * (laborHighPerSqFt + heightPremiumHigh));
    demolitionDisposalLow = inputs.demoIncludeDisposal
      ? (demoSqFt <= 200 ? 300 : demoSqFt <= 400 ? 400 : 550)
      : 0;
    demolitionDisposalHigh = inputs.demoIncludeDisposal
      ? (demoSqFt <= 200 ? 450 : demoSqFt <= 400 ? 600 : 800)
      : 0;
    demolitionPermitCost = inputs.demoPermit ? 75 : 0;
    demolitionLow = demolitionLaborLow + demolitionDisposalLow + demolitionPermitCost;
    demolitionHigh = demolitionLaborHigh + demolitionDisposalHigh + demolitionPermitCost;
  }

  // Framing material cost (contractor only)
  // ── Joist spacing calculation (contractor only) ──────────────────────────────
  // Joists run perpendicular to the deck boards across the shorter dimension.
  // For a rectangular deck: joist span = shorter dimension, joist count = ceil(longer / spacing) + 1
  // Board-feet formula: count × span_ft × (1.5/12 × 9.25/12) × 12 = count × span_ft × (1.5 × 9.25 / 12)
  // Standard 2×10 joist: 1.5" thick × 9.25" wide
  // Cost delta vs 16" OC baseline: extra joists at ~$0.80–$1.20/board-foot (PT lumber 2026)
  // Sources: National Lumber Prices Apr 2026, IRC Table R507.6 (joist span tables), contractor field data.
  const joistSpacingIn: 12 | 16 | 24 = isContractor
    ? (inputs.joistSpacingIn ?? 16)
    : 16;
  // Estimate deck short/long dimensions from sqFt (use size.sqFt; assume ~4:3 aspect if no custom dims)
  const deckSqFt = size.sqFt;
  // Approximate dimensions: short side ≈ sqrt(sqFt * 3/4), long side ≈ sqrt(sqFt * 4/3)
  const deckShortFt = Math.round(Math.sqrt(deckSqFt * 0.75));
  const deckLongFt  = Math.round(deckSqFt / Math.max(deckShortFt, 1));
  const joistLengthFt = deckShortFt;  // joists span the short dimension
  const joistSpacingFt = joistSpacingIn / 12;
  const joistCount = Math.ceil(deckLongFt / joistSpacingFt) + 1; // +1 for end joist
  // Board-feet: count × length × (1.5" × 9.25") / 144 in² per sq ft × 12 (BF formula)
  const joistBoardFeet = Math.round(joistCount * joistLengthFt * (1.5 * 9.25) / 12);
  // Cost delta vs 16" OC baseline
  // Sources: National Lumber Prices Apr 2026 (~$1.50–$2.00/BF PT 2×10), RSMeans framing labor
  // Installed cost per BF = material ($1.50–$2.00) + labor ($1.00–$1.50) = $2.50–$3.50/BF
  const joistCount16 = Math.ceil(deckLongFt / (16 / 12)) + 1;
  const joistBF16    = joistCount16 * joistLengthFt * (1.5 * 9.25) / 12;
  const joistDeltaBF = joistBoardFeet - joistBF16;
  // Low end: $2.50/BF installed; High end: $3.50/BF installed
  // Applied to all paths — default 16" OC means joistDeltaBF = 0, so $0 for homeowner/DIY
  const joistSpacingCostDeltaLow  = Math.round(joistDeltaBF * 2.50);
  const joistSpacingCostDeltaHigh = Math.round(joistDeltaBF * 3.50);
  // For the single-value field used in display/print, use the midpoint
  const joistSpacingCostDelta = Math.round(joistDeltaBF * 3.00);

  // ── Material-Aware Joist Span Warning ────────────────────────────────────────
  // Span limits vary significantly by framing material.
  // Sources:
  //   PT/PWT: 2021 IRC Table R507.6 (SYP No.2, 2×10 primary / 2×12 upgrade)
  //   Steel:  Fortress Evolution & DeckFrame span tables (Apr 2026) — C3.5×1.5 section
  //   Aluminum: Wahoo Decks / Trex Elevations span tables (Apr 2026) — 4" I-joist
  type SpanEntry = { primary: number; upgrade: number; primaryLabel: string; upgradeLabel: string };
  const SPAN_TABLE: Record<string, Record<12 | 16 | 24, SpanEntry>> = {
    pt: {
      12: { primary: 19.5, upgrade: 23.6, primaryLabel: "2×10 SYP", upgradeLabel: "2×12 SYP" },
      16: { primary: 17.8, upgrade: 21.6, primaryLabel: "2×10 SYP", upgradeLabel: "2×12 SYP" },
      24: { primary: 14.7, upgrade: 17.9, primaryLabel: "2×10 SYP", upgradeLabel: "2×12 SYP" },
    },
    pwt: {
      // PWT (UC4B) is same species/size as PT but slightly denser — same IRC table applies
      12: { primary: 19.5, upgrade: 23.6, primaryLabel: "2×10 PWT", upgradeLabel: "2×12 PWT" },
      16: { primary: 17.8, upgrade: 21.6, primaryLabel: "2×10 PWT", upgradeLabel: "2×12 PWT" },
      24: { primary: 14.7, upgrade: 17.9, primaryLabel: "2×10 PWT", upgradeLabel: "2×12 PWT" },
    },
    steel: {
      // Fortress Evolution C3.5×1.5 galvanized steel joist (most common residential steel deck joist)
      // Spans are for 40 psf live + 10 psf dead load (IRC residential deck standard)
      12: { primary: 28.0, upgrade: 32.0, primaryLabel: "C3.5 steel joist", upgradeLabel: "C4 steel joist" },
      16: { primary: 26.0, upgrade: 30.0, primaryLabel: "C3.5 steel joist", upgradeLabel: "C4 steel joist" },
      24: { primary: 22.0, upgrade: 26.0, primaryLabel: "C3.5 steel joist", upgradeLabel: "C4 steel joist" },
    },
    aluminum: {
      // Wahoo Decks / Trex Elevations 4" aluminum I-joist
      12: { primary: 20.0, upgrade: 24.0, primaryLabel: "4\" alum. I-joist", upgradeLabel: "6\" alum. I-joist" },
      16: { primary: 18.0, upgrade: 22.0, primaryLabel: "4\" alum. I-joist", upgradeLabel: "6\" alum. I-joist" },
      24: { primary: 14.0, upgrade: 18.0, primaryLabel: "4\" alum. I-joist", upgradeLabel: "6\" alum. I-joist" },
    },
  };
  const framingIdForSpan = inputs.framingId ?? "pt";
  const spanEntry: SpanEntry = (
    SPAN_TABLE[framingIdForSpan]?.[joistSpacingIn] ??
    SPAN_TABLE["pt"][joistSpacingIn]
  );
  const maxAllowedFt = spanEntry.primary;
  const upgradeMaxFt = spanEntry.upgrade;
  const spanExceeded = isContractor && joistLengthFt > maxAllowedFt;
  const joistSpanWarning = isContractor ? {
    exceeded: spanExceeded,
    spanFt: joistLengthFt,
    maxAllowedFt,
    upgradeMaxFt,
    message: spanExceeded
      ? `Joist span of ${joistLengthFt}' exceeds the ${maxAllowedFt}' limit for ${spanEntry.primaryLabel} @ ${joistSpacingIn}" OC. ` +
        (joistLengthFt <= upgradeMaxFt
          ? `Upgrade to ${spanEntry.upgradeLabel} (max ${upgradeMaxFt}') or add an intermediate beam.`
          : `Span exceeds even ${spanEntry.upgradeLabel} limits (${upgradeMaxFt}') — intermediate beam and post required.`)
      : `Span of ${joistLengthFt}' is within the ${maxAllowedFt}' limit for ${spanEntry.primaryLabel} @ ${joistSpacingIn}" OC.`,
  } : null;

  // Standard PT framing is already baked into the base installed cost (tier.installedPerSqFtMin/Max).
  // For PWT, steel, and aluminum, we calculate the DELTA vs standard PT framing and add it.
  // The delta = (framingOption.materialCostPerSqFt - PT baseline) * sqFt * laborMultiplier adjustment.
  // PT baseline material cost per sqFt is ~$3.50–$5.50 (already in base cost).
  const framingOption = (FRAMING_OPTIONS.find(f => f.id === (inputs.framingId ?? "pt")) ?? FRAMING_OPTIONS[0]) as FramingOption;
  const PT_BASELINE_LOW = 3.50;
  const PT_BASELINE_HIGH = 5.50;
  const framingMaterialDeltaLow  = Math.max(0, framingOption.materialCostPerSqFt.low  - PT_BASELINE_LOW)  * size.sqFt;
  const framingMaterialDeltaHigh = Math.max(0, framingOption.materialCostPerSqFt.high - PT_BASELINE_HIGH) * size.sqFt;
  // Labor delta: framing labor is ~30% of total labor; apply the multiplier delta to that fraction
  const framingLaborFraction = 0.30;
  // Applied to all paths — default PT framing means laborMultiplier = 1.0, so delta = $0 for homeowner/DIY
  const framingLaborDeltaLow  = Math.round(adjustedLow  * laborFraction * framingLaborFraction * (framingOption.laborMultiplier - 1.0));
  const framingLaborDeltaHigh = Math.round(adjustedHigh * laborFraction * framingLaborFraction * (framingOption.laborMultiplier - 1.0));
  const framingCostLow  = Math.round(framingMaterialDeltaLow  + framingLaborDeltaLow);
  const framingCostHigh = Math.round(framingMaterialDeltaHigh + framingLaborDeltaHigh);

  // Multi-level structural premium
  // Sources: HomeAdvisor 2025 ($9–$12/sqft framing labor), O'Keefe Built, Legacy Decking,
  // Angi 2026 ($50/sqft avg for multi-level vs $30–$40 for single level).
  // Premium applies to the UPPER level sq ft only: extra rim joist, posts, ledger-to-ledger
  // connection, inter-level stair, and additional layout/engineering time.
  // ~70% labor, 30% materials split.
  const level2Size: DeckSize | null = inputs.isMultiLevel
    ? (inputs.level2SizeId === "custom"
        ? { id: "custom", label: "Custom", sqFt: inputs.level2CustomSqFt ?? 200, dimensions: "" }
        : (DECK_SIZES.find((s) => s.id === inputs.level2SizeId) ?? DECK_SIZES[2]))
    : null;
  const level2SqFt = level2Size?.sqFt ?? 0;
  // Base cost of upper level (materials + labor at same tier/region/complexity)
  const level2BaseLow = level2SqFt > 0
    ? Math.round(tier.installedPerSqFtMin * level2SqFt * materialFraction +
        tier.installedPerSqFtMin * level2SqFt * laborFraction * regionMultiplier * complexityMultiplier * marketMultiplier)
    : 0;
  const level2BaseHigh = level2SqFt > 0
    ? Math.round(tier.installedPerSqFtMax * level2SqFt * materialFraction +
        tier.installedPerSqFtMax * level2SqFt * laborFraction * regionMultiplier * complexityMultiplier * marketMultiplier)
    : 0;
  // Structural premium on upper level: +$8–$15/sqft
  const multiLevelPremiumLow  = level2SqFt > 0 ? level2BaseLow  + Math.round(8  * level2SqFt) : 0;
  const multiLevelPremiumHigh = level2SqFt > 0 ? level2BaseHigh + Math.round(15 * level2SqFt) : 0;

  // ── Brand / hidden fastener / edge board (contractor only) ─────────────────
  // Brand delta: additional material cost above base tier rate (can be negative for budget brands)
  // Sources: Advantage Lumber price chart (Apr 2026), rmfp.com (Apr 2026), DecksDirect (Feb 2026)
  const deckingBrand: DeckingBrand | null = isContractor && inputs.brandId
    ? (DECKING_BRANDS.find(b => b.id === inputs.brandId) ?? null)
    : null;
  const brandDeltaLow  = isContractor && deckingBrand ? Math.round(deckingBrand.materialDeltaLow  * size.sqFt) : 0;
  const brandDeltaHigh = isContractor && deckingBrand ? Math.round(deckingBrand.materialDeltaHigh * size.sqFt) : 0;

  // Hidden fasteners — system-specific pricing (contractor only, compatible boards only)
  // Generic clip system: +$1.50–$2.50/SF (hardware + snap-in labor)
  // Cortex by FastenMaster: +$0.50–$0.75/SF hardware + ~$0.75–$1.50/SF labor = $1.25–$2.25/SF
  //   Cortex is a screw+plug system (not a clip): drills, countersinks, and inserts color-matched plug.
  //   Retail kits ~$7/SF installed; contractor cost ~$1.25–$2.25/SF (hardware + labor premium).
  //   Sources: Home Depot Apr 2026, FastenMaster product page, contractor field data.
  const fastenerSystem: "none" | "clip" | "cortex" = (() => {
    if (!isContractor) return "none";
    if (inputs.fastenerSystemId && inputs.fastenerSystemId !== "none") return inputs.fastenerSystemId;
    if (inputs.includeHiddenFasteners) return "clip"; // legacy fallback
    return "none";
  })();
  const useHiddenFasteners = fastenerSystem !== "none"
    && (deckingBrand === null || deckingBrand.hiddenFastenerCompatible);
  const hiddenFastenerCostLow  = useHiddenFasteners
    ? Math.round((fastenerSystem === "cortex" ? 1.25 : 1.50) * size.sqFt)
    : 0;
  const hiddenFastenerCostHigh = useHiddenFasteners
    ? Math.round((fastenerSystem === "cortex" ? 2.25 : 2.50) * size.sqFt)
    : 0;

  // Grooved edge boards: required for hidden fasteners; +$0.50–$1.00/sq ft for edge boards only
  // (~15–20% of total sq ft is edge boards; grooved boards cost ~$3–$5/LF more than solid)
  // Auto-selected when hidden fasteners are on. Only applies to compatible boards.
  const useGroovedEdge = isContractor && (
    inputs.edgeBoardType === "grooved" ||
    (useHiddenFasteners) // hidden fasteners force grooved
  );
  const edgeBoardUpgradeLow  = useGroovedEdge ? Math.round(0.50 * size.sqFt) : 0;
  const edgeBoardUpgradeHigh = useGroovedEdge ? Math.round(1.00 * size.sqFt) : 0;

  // 3D rendering service cost (contractor only, pass-through line item)
  // Basic (1–2 views, standard quality): $199–$400
  // Professional (3–5 views, photo-realistic): $400–$800
  // Premium (full set + revision round): $800–$1,500
  // Sources: render3dquick.com Apr 2026, myarchitectai.com Apr 2026, DecksDirect 2026, contractor field data.
  const RENDERING_COSTS: Record<string, [number, number]> = {
    none:         [0,   0],
    basic:        [199, 400],
    professional: [400, 800],
    premium:      [800, 1500],
  };
  const renderingTier = isContractor ? (inputs.rendering3dTier ?? "none") : "none";
  const [rendering3dCostLow, rendering3dCostHigh] = RENDERING_COSTS[renderingTier] ?? [0, 0];

  // Climate premium (only for professional installs)
  const climatePremium = isDIY ? 0 : region.climatePremium;

  // Permit cost — included in all path totals so the ticker updates on selection
  // DIY: also added to totalWithExtrasLow/High (which adds waste + tool rental on top)
  //      but we keep it in totalLow/totalHigh as the base so the ticker reacts
  // Contractor: baseBidMid uses contractorPermitCost separately (not from totalLow)
  const permitCostBase = inputs.includePermit ? (inputs.permitCost ?? 350) : 0;

  // Engineer fee — pass-through on all paths (not marked up)
  const engineerCostBase = inputs.includeEngineer ? (inputs.engineerCost ?? 650) : 0;

  // Totals
  const baseTotalLow = adjustedLow + railingLow + footingLow + stairsLow + stairRailingLow + climatePremium + permitCostBase + engineerCostBase + demolitionLow + framingCostLow + multiLevelPremiumLow + brandDeltaLow + hiddenFastenerCostLow + edgeBoardUpgradeLow + rendering3dCostLow + joistSpacingCostDeltaLow + railingDetailCostLow + footingSpecCostLow;
  const baseTotalHigh = adjustedHigh + railingHigh + footingHigh + stairsHigh + stairRailingHigh + climatePremium + permitCostBase + engineerCostBase + demolitionHigh + framingCostHigh + multiLevelPremiumHigh + brandDeltaHigh + hiddenFastenerCostHigh + edgeBoardUpgradeHigh + rendering3dCostHigh + joistSpacingCostDeltaHigh + railingDetailCostHigh + footingSpecCostHigh;

  // Homeowner markup overlay: apply contractor markup tier to totalLow/High when enabled
  const homeownerMarkupTier = inputs.audience === "homeowner" && inputs.homeownerMarkupTierId
    ? CONTRACTOR_MARKUP_TIERS.find((m) => m.id === inputs.homeownerMarkupTierId)
    : null;
  const homeownerMarkupMultiplierLow = homeownerMarkupTier
    ? (1 + homeownerMarkupTier.materialMarkup * 0.45 + homeownerMarkupTier.laborMarkup * 0.55) * (1 + homeownerMarkupTier.overheadPct)
    : 1;
  // High end uses a slightly wider markup to reflect premium contractor variance
  const homeownerMarkupMultiplierHigh = homeownerMarkupTier
    ? (1 + (homeownerMarkupTier.materialMarkup + 0.05) * 0.45 + (homeownerMarkupTier.laborMarkup + 0.08) * 0.55) * (1 + homeownerMarkupTier.overheadPct + 0.03)
    : 1;

  const totalLow = Math.round(baseTotalLow * homeownerMarkupMultiplierLow);
  const totalHigh = Math.round(baseTotalHigh * homeownerMarkupMultiplierHigh);
  const totalMid = Math.round((totalLow + totalHigh) / 2);

  // Labor breakdown
  const laborLow = isDIY ? 0 : Math.round(adjustedLow * laborFraction);
  const laborHigh = isDIY ? 0 : Math.round(adjustedHigh * laborFraction);
  const materialsLow = isDIY ? adjustedLow : Math.round(adjustedLow * materialFraction);
  const materialsHigh = isDIY ? adjustedHigh : Math.round(adjustedHigh * materialFraction);

  const perSqFtLow = Math.round(totalLow / size.sqFt);
  const perSqFtHigh = Math.round(totalHigh / size.sqFt);

  // Breakdown for chart
  const breakdown: CostBreakdown[] = [
    {
      category: "Decking / Materials",
      pctOfTotal: 0,
      low: materialsLow,
      high: materialsHigh,
      note: `${tier.label} boards + substructure`,
    },
    ...(isDIY
      ? []
      : [
          {
            category: "Labor",
            pctOfTotal: 0,
            low: laborLow,
            high: laborHigh,
            note: `${region.label} labor rates (${complexity.label})`,
          },
        ]),
    {
      category: "Railing",
      pctOfTotal: 0,
      low: railingLow,
      high: railingHigh,
      note: `${railing.label} — ${railingLF} LF`,
    },
    {
      category: "Footings",
      pctOfTotal: 0,
      low: footingLow,
      high: footingHigh,
      note: `${footingCount} footings @ ${frostDepth}" frost depth`,
    },
    ...(inputs.includeStairs
      ? [
          {
            category: "Stairs",
            pctOfTotal: 0,
            low: stairsLow,
            high: stairsHigh,
            note: `${inputs.stairSteps}-step staircase`,
          },
        ]
      : []),
    ...(stairRailingLow > 0
      ? [
          {
            category: "Stair Railing",
            pctOfTotal: 0,
            low: stairRailingLow,
            high: stairRailingHigh,
            note: `${railing.label} — ${stairRailingLF} LF (both sides)`,
          },
        ]
      : []),
    ...(demolitionLow > 0
      ? [
          {
            category: "Demo & Removal",
            pctOfTotal: 0,
            low: demolitionLow,
            high: demolitionHigh,
            note: `Existing deck removal${inputs.demoIncludeDisposal ? " + disposal" : ""}`,
          },
        ]
      : []),
    ...(hiddenFastenerCostLow > 0
      ? [
          {
            category: "Hidden Fasteners",
            pctOfTotal: 0,
            low: hiddenFastenerCostLow,
            high: hiddenFastenerCostHigh,
            note: fastenerSystem === "cortex"
              ? `Cortex by FastenMaster (screw + color-matched plug) — ${size.sqFt} sq ft`
              : `Generic clip fastening system — ${size.sqFt} sq ft`,
          },
        ]
      : []),
    ...(edgeBoardUpgradeLow > 0
      ? [
          {
            category: "Grooved Edge Boards",
            pctOfTotal: 0,
            low: edgeBoardUpgradeLow,
            high: edgeBoardUpgradeHigh,
            note: `Grooved-edge board upgrade — ${size.sqFt} sq ft`,
          },
        ]
      : []),
    ...(rendering3dCostLow > 0
      ? [
          {
            category: "3D Rendering",
            pctOfTotal: 0,
            low: rendering3dCostLow,
            high: rendering3dCostHigh,
            note: renderingTier === "basic"
              ? "Basic: 1–2 views, standard quality — pass-through service"
              : renderingTier === "professional"
                ? "Professional: 3–5 photo-realistic views — pass-through service"
                : "Premium: full view set + revision round — pass-through service",
          },
        ]
      : []),
    ...(brandDeltaLow !== 0 || brandDeltaHigh !== 0
      ? [
          {
            category: deckingBrand ? `${deckingBrand.name} Upgrade` : "Brand Adjustment",
            pctOfTotal: 0,
            low: Math.min(brandDeltaLow, brandDeltaHigh),
            high: Math.max(brandDeltaLow, brandDeltaHigh),
            note: deckingBrand ? `${deckingBrand.warranty} warranty` : "",
          },
        ]
      : []),
    ...(climatePremium > 0
      ? [
          {
            category: "Climate Premium",
            pctOfTotal: 0,
            low: climatePremium,
            high: climatePremium,
            note: region.climateNotes[0] ?? "Regional climate adjustment",
          },
        ]
      : []),
  ];

  // Calculate percentages
  breakdown.forEach((item) => {
    item.pctOfTotal = Math.round(((item.low + item.high) / 2 / totalMid) * 100);
  });

  // Warnings
  const warnings: string[] = [];
  if (tier.id === "pt") {
    warnings.push(
      "PT lumber prices are 15–25% above 2024 levels due to Canadian softwood tariffs. Verify current pricing in-store — Home Depot and Lowe's do not publish PT prices online."
    );
  }
  if (region.id === "california") {
    warnings.push(
      "California permitting can reach $2,000+ in many jurisdictions. Labor rates are the highest nationally."
    );
  }
  if (complexity.id === "multi" || complexity.id === "custom") {
    warnings.push(
      "Multi-level and custom designs require engineering review in most jurisdictions. Budget an additional $500–$2,000 for structural drawings."
    );
  }
  if (inputs.railingId === "cable" || inputs.railingId === "glass") {
    warnings.push(
      "Cable and glass railing systems require specialized installation. Labor costs for these systems are significantly higher than composite or aluminum."
    );
  }

  // ── DIY extras ────────────────────────────────────────────────────────────
  let diyExtras: CalculatorResult["diy"] | undefined;
  if (isDIY) {
    const skillLevel = DIY_SKILL_LEVELS.find((s) => s.id === (inputs.skillLevelId ?? "intermediate"))!;
    const wasteFactor = skillLevel.wasteFactor;
    const wastedMaterialCost = Math.round(materialsLow * wasteFactor);

    const selectedToolIds = inputs.selectedTools ?? [];
    const selectedTools = TOOL_RENTAL_OPTIONS.filter((t) => selectedToolIds.includes(t.id));
    const toolRentalLow = selectedTools.reduce((sum, t) => sum + t.dailyRentLow * t.daysNeeded, 0);
    const toolRentalHigh = selectedTools.reduce((sum, t) => sum + t.dailyRentHigh * t.daysNeeded, 0);

    // permitCost is already included in totalLow/totalHigh via permitCostBase above
    const permitCost = inputs.includePermit ? (inputs.permitCost ?? 350) : 0;

    const totalWithExtrasLow = totalLow + wastedMaterialCost + toolRentalLow;
    const totalWithExtrasHigh = totalHigh + Math.round(materialsHigh * wasteFactor) + toolRentalHigh;

    // Savings vs hiring (compare to contractor-installed cost in the same market).
    // Uses marketMultiplier so high-cost metros show accurate savings potential.
    // DIY path does not set marketTierId, so marketMultiplier defaults to 1.0 (suburban baseline).
    const diyMarketMultiplier = MARKET_TIERS.find((m) => m.id === inputs.marketTierId)?.laborMultiplier ?? 1.0;
    const installedMid = Math.round(
      (baseInstalled.low * materialFraction + baseInstalled.low * laborFraction * regionMultiplier * complexityMultiplier * diyMarketMultiplier +
       baseInstalled.high * materialFraction + baseInstalled.high * laborFraction * regionMultiplier * complexityMultiplier * diyMarketMultiplier) / 2
    );
    const savingsVsHiring = Math.max(0, installedMid - Math.round((totalWithExtrasLow + totalWithExtrasHigh) / 2));

    const estimatedWeekends = Math.round(size.sqFt / 80 * skillLevel.timeMultiplier);

    diyExtras = {
      skillLevel,
      wasteFactor,
      wastedMaterialCost,
      toolRentalLow,
      toolRentalHigh,
      selectedTools,
      permitCost,
      totalWithExtrasLow,
      totalWithExtrasHigh,
      estimatedWeekends,
      savingsVsHiring,
    };
  }

  // ── Contractor extras ─────────────────────────────────────────────────────
  let contractorExtras: CalculatorResult["contractor"] | undefined;
  if (isContractor) {
    const useMarkup = inputs.includeMarkup !== false;
    const useCrew = inputs.includeCrew !== false;
    const markupTier = useMarkup
      ? CONTRACTOR_MARKUP_TIERS.find((m) => m.id === (inputs.markupTierId ?? "standard"))!
      : { ...CONTRACTOR_MARKUP_TIERS[0], materialMarkup: 0, laborMarkup: 0, overheadPct: 0, id: "none", label: "No Markup", description: "" };
    const crewSize = useCrew
      ? CREW_SIZES.find((c) => c.id === (inputs.crewSizeId ?? "two"))!
      : { ...CREW_SIZES[1], laborEfficiencyFactor: 1.0, id: "none", label: "Not specified" };

    // Include all cost components in the bid base (railing, footings, stairs, climate)
    // so the ticker updates when any of these change.
    const extrasMid = Math.round(
      (railingLow + railingHigh) / 2 +
      (footingLow + footingHigh) / 2 +
      (stairsLow + stairsHigh) / 2 +
      (stairRailingLow + stairRailingHigh) / 2 +
      climatePremium
    );
    const materialCostRaw = Math.round((materialsLow + materialsHigh) / 2);
    const laborCostRaw = Math.round((laborLow + laborHigh) / 2);

    const materialWithMarkup = Math.round(materialCostRaw * (1 + markupTier.materialMarkup));
    const laborWithMarkup = Math.round(laborCostRaw * (1 + markupTier.laborMarkup));
    const overhead = Math.round((materialWithMarkup + laborWithMarkup) * markupTier.overheadPct);

    // Apply markup to extras as well (railing, footings, stairs are billable line items)
    const extrasWithMarkup = Math.round(extrasMid * (1 + markupTier.materialMarkup));

    const subFootingsCost = inputs.subFootings ? Math.round((footingLow + footingHigh) / 2 * 1.15) : 0;
    // Permit is a pass-through cost on contractor bids (not marked up)
    const contractorPermitCost = inputs.includePermit ? (inputs.permitCost ?? 350) : 0;
    // Engineer fee is a pass-through cost on contractor bids (not marked up)
    const contractorEngineerCost = inputs.includeEngineer ? (inputs.engineerCost ?? 650) : 0;

    // Demo is a pass-through cost (not marked up, added at cost)
    const demolitionMid = Math.round((demolitionLow + demolitionHigh) / 2);
    // Framing upgrade cost — marked up like materials (it's a billable material upgrade)
    const framingMid = Math.round((framingCostLow + framingCostHigh) / 2);
    const framingWithMarkup = Math.round(framingMid * (1 + markupTier.materialMarkup));
    // Multi-level premium — marked up like materials (structural upgrade)
    const multiLevelMid = Math.round((multiLevelPremiumLow + multiLevelPremiumHigh) / 2);
    const multiLevelWithMarkup = multiLevelMid > 0 ? Math.round(multiLevelMid * (1 + markupTier.materialMarkup)) : 0;
    // Brand delta + hidden fasteners + grooved edge — marked up like materials
    const brandDeltaMid = Math.round((brandDeltaLow + brandDeltaHigh) / 2);
    const brandWithMarkup = brandDeltaMid !== 0 ? Math.round(brandDeltaMid * (1 + markupTier.materialMarkup)) : 0;
    const fastenerMid = Math.round((hiddenFastenerCostLow + hiddenFastenerCostHigh) / 2);
    const fastenerWithMarkup = fastenerMid > 0 ? Math.round(fastenerMid * (1 + markupTier.materialMarkup)) : 0;
    const edgeBoardMid = Math.round((edgeBoardUpgradeLow + edgeBoardUpgradeHigh) / 2);
    const edgeBoardWithMarkup = edgeBoardMid > 0 ? Math.round(edgeBoardMid * (1 + markupTier.materialMarkup)) : 0;
    const baseBidMid = materialWithMarkup + laborWithMarkup + overhead + extrasWithMarkup + subFootingsCost + contractorPermitCost + contractorEngineerCost + demolitionMid + framingWithMarkup + multiLevelWithMarkup + brandWithMarkup + fastenerWithMarkup + edgeBoardWithMarkup;
    const bidVariance = 0.08; // ±8% range
    const totalBidLow = Math.round(baseBidMid * (1 - bidVariance));
    const totalBidHigh = Math.round(baseBidMid * (1 + bidVariance));

    // Gross margin: revenue minus ALL actual costs (materials, labor, extras, pass-throughs).
    // extrasMid = railing + footings + stairs + stairRailing + climatePremium (actual cost before markup).
    // Pass-throughs (permit, demo, subFootings) are included at cost with no markup.
    const totalActualCost = materialCostRaw + laborCostRaw + extrasMid + subFootingsCost + contractorPermitCost + contractorEngineerCost + demolitionMid + framingMid + multiLevelMid + brandDeltaMid + fastenerMid + edgeBoardMid;
    const grossMarginPct = Math.round(
      ((baseBidMid - totalActualCost) / baseBidMid) * 100
    );

    // Estimated days: baseline 1 day per 40 sqFt for 2-person crew, adjusted by crew efficiency
    const estimatedDays = Math.max(1, Math.round((size.sqFt / 40 / crewSize.laborEfficiencyFactor) * complexity.laborMultiplier));

    contractorExtras = {
      demolitionCostLow: demolitionLow,
      demolitionCostHigh: demolitionHigh,
      markupTier,
      crewSize,
      materialCostRaw,
      laborCostRaw,
      materialWithMarkup,
      laborWithMarkup,
      overhead,
      totalBidLow,
      totalBidHigh,
      grossMarginPct,
      estimatedDays,
      subFootingsCost,
      perSqFtBidLow: Math.round(totalBidLow / size.sqFt),
      perSqFtBidHigh: Math.round(totalBidHigh / size.sqFt),
    };
  }

  return {
    totalLow,
    totalHigh,
    totalMid,
    laborLow,
    laborHigh,
    materialsLow,
    materialsHigh,
    railingLow,
    railingHigh,
    footingLow,
    footingHigh,
    footingCount,
    footingDiameterIn,
    useHelicalPiers,
    footingSpecCostLow,
    footingSpecCostHigh,
    stairsLow,
    stairsHigh,
    stairRailingLow,
    stairRailingHigh,
    demolitionLow,
    demolitionHigh,
    demolitionLaborLow,
    demolitionLaborHigh,
    demolitionDisposalLow,
    demolitionDisposalHigh,
    demolitionPermitCost,
    framingOption,
    framingCostLow,
    framingCostHigh,
    joistSpacingIn,
    joistCount,
    joistLengthFt,
    joistBoardFeet,
    joistSpacingCostDelta,
    joistSpanWarning,
    deckingBrand,
    brandDeltaLow,
    brandDeltaHigh,
    fastenerSystem,
    hiddenFastenerCostLow,
    hiddenFastenerCostHigh,
    edgeBoardUpgradeLow,
    edgeBoardUpgradeHigh,
    rendering3dCostLow,
    rendering3dCostHigh,
    multiLevelPremiumLow,
    multiLevelPremiumHigh,
    level2SqFt,
    climatePremium,
    perSqFtLow,
    perSqFtHigh,
    breakdown,
    regionMultiplier,
    complexityMultiplier,
    warnings,
    tier,
    region,
    size,
    complexity,
    railing,
    railingPostCount,
    railingPostMountCostLow,
    railingPostMountCostHigh,
    railingHeightPremiumLow,
    railingHeightPremiumHigh,
    railingDetailCostLow,
    railingDetailCostHigh,
    marketTier,
    isDIY,
    isContractor,
    permitCost: inputs.includePermit ? (inputs.permitCost ?? 350) : 0,
    engineerCost: engineerCostBase,
    // Echo inputs for downstream use
    railingLF: inputs.railingLF,
    includeStairs: inputs.includeStairs,
    stairSteps: inputs.stairSteps,
    deckHeightIn: inputs.deckHeightIn ?? 24,
    diy: diyExtras,
    contractor: contractorExtras,
  };
}

// ─── FORMATTING HELPERS ────────────────────────────────────────────────────────
export function formatCurrency(n: number): string {
  if (n >= 1000) {
    return "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return "$" + n.toLocaleString();
}

export function formatCurrencyFull(n: number): string {
  return "$" + n.toLocaleString();
}

export function formatRange(low: number, high: number): string {
  return `${formatCurrency(low)} – ${formatCurrency(high)}`;
}
