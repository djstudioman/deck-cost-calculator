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
    installedPerSqFtMin: 25,
    installedPerSqFtMax: 44,
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
    installedPerSqFtMin: 35,
    installedPerSqFtMax: 63,
    lifespan: "25–30 years",
    maintenance: "Minimal. Annual cleaning ~$50–$150/yr.",
    tariffImpact: "Less affected (domestic manufacturing). Trex confirmed 7.5–15% increases effective 2025.",
    color: "green",
  },
  {
    id: "pvc",
    label: "Premium PVC / Cable Rail",
    shortLabel: "Premium PVC",
    description: "TimberTech AZEK Vintage, Trex Transcend Lineage, Feeney CableRail. Top-tier aesthetics and durability.",
    examples: ["AZEK Vintage ($16.75/SF)", "Trex Transcend ($15.59/SF)", "Feeney CableRail ($55–$90/LF)"],
    materialPerSqFtMin: 25,
    materialPerSqFtMax: 45,
    installedPerSqFtMin: 60,
    installedPerSqFtMax: 133,
    lifespan: "30–50 years",
    maintenance: "Virtually none. Occasional cleaning ~$50/yr.",
    tariffImpact: "Minimal direct impact. Steel tariffs raised connector costs 10–15%.",
    color: "blue",
  },
];

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
    id: "multi",
    label: "Multi-Level",
    description: "Two or more levels, multiple stair runs, complex framing",
    laborMultiplier: 1.75,
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

export const RAILING_SYSTEMS: RailingSystem[] = [
  { id: "pt-wood", label: "PT Wood", materialPerLFMin: 10, materialPerLFMax: 20, installedPerLFMin: 20, installedPerLFMax: 45 },
  { id: "composite-select", label: "Composite (Trex Select / TimberTech)", materialPerLFMin: 22, materialPerLFMax: 35, installedPerLFMin: 38, installedPerLFMax: 65 },
  { id: "composite-premium", label: "Composite Premium (Trex Transcend)", materialPerLFMin: 35, materialPerLFMax: 50, installedPerLFMin: 50, installedPerLFMax: 80 },
  { id: "aluminum", label: "Aluminum Picket Railing", materialPerLFMin: 34, materialPerLFMax: 65, installedPerLFMin: 55, installedPerLFMax: 100 },
  { id: "cable", label: "Cable Rail (Feeney / Muzata)", materialPerLFMin: 40, materialPerLFMax: 90, installedPerLFMin: 75, installedPerLFMax: 175 },
  { id: "glass", label: "Glass (Framed)", materialPerLFMin: 80, materialPerLFMax: 200, installedPerLFMin: 150, installedPerLFMax: 350 },
];

// ─── INSTALLED COST LOOKUP TABLE ───────────────────────────────────────────────
// [sqFt][tier] = { low, high } installed cost (national baseline, before regional multiplier)
export const INSTALLED_COST_TABLE: Record<string, Record<string, { low: number; high: number }>> = {
  "100": {
    pt: { low: 2500, high: 4000 },
    composite: { low: 3500, high: 6000 },
    pvc: { low: 6000, high: 12000 },
  },
  "192": {
    pt: { low: 4800, high: 8000 },
    composite: { low: 7000, high: 12000 },
    pvc: { low: 12000, high: 22000 },
  },
  "320": {
    pt: { low: 8000, high: 14000 },
    composite: { low: 12000, high: 19000 },
    pvc: { low: 20000, high: 35000 },
  },
  "480": {
    pt: { low: 12000, high: 20000 },
    composite: { low: 18000, high: 28000 },
    pvc: { low: 30000, high: 55000 },
  },
  "600": {
    pt: { low: 15000, high: 25000 },
    composite: { low: 22000, high: 35000 },
    pvc: { low: 40000, high: 80000 },
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
  railingId: string;
  railingLF: number;
  includeStairs: boolean;
  stairSteps: number;
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
  markupMaterials?: boolean;
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
  isDIY: boolean;
  isContractor: boolean;
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
  const size = DECK_SIZES.find((s) => s.id === inputs.sizeId)!;
  const tier = MATERIAL_TIERS.find((t) => t.id === inputs.tierId)!;
  const complexity = COMPLEXITIES.find((c) => c.id === inputs.complexityId)!;
  const railing = RAILING_SYSTEMS.find((r) => r.id === inputs.railingId)!;
  const isDIY = inputs.audience === "diy";
  const isContractor = inputs.audience === "contractor";

  // Base installed cost from lookup table
  const baseInstalled = INSTALLED_COST_TABLE[inputs.sizeId][inputs.tierId];
  const baseMaterials = MATERIALS_COST_TABLE[inputs.sizeId][inputs.tierId];

  // Regional multiplier applied to labor portion (~55% of total)
  const laborFraction = 0.55;
  const materialFraction = 1 - laborFraction;
  const regionMultiplier = region.laborMultiplier;
  const complexityMultiplier = complexity.laborMultiplier;

  // Adjust for region and complexity
  const adjustedLow = isDIY
    ? baseMaterials.low
    : Math.round(
        baseInstalled.low * materialFraction +
          baseInstalled.low * laborFraction * regionMultiplier * complexityMultiplier
      );
  const adjustedHigh = isDIY
    ? baseMaterials.high
    : Math.round(
        baseInstalled.high * materialFraction +
          baseInstalled.high * laborFraction * regionMultiplier * complexityMultiplier
      );

  // Railing cost
  const railingLF = inputs.railingLF;
  const railingLow = isDIY
    ? Math.round(railing.materialPerLFMin * railingLF)
    : Math.round(railing.installedPerLFMin * railingLF);
  const railingHigh = isDIY
    ? Math.round(railing.materialPerLFMax * railingLF)
    : Math.round(railing.installedPerLFMax * railingLF);

  // Footing cost based on region frost depth
  const footingCount = size.sqFt <= 200 ? 6 : size.sqFt <= 350 ? 10 : size.sqFt <= 500 ? 12 : 16;
  const frostDepth = region.frostDepthInches;
  let footingCostPerUnit = 68; // baseline 24"
  if (frostDepth >= 36 && frostDepth < 48) footingCostPerUnit = 85;
  else if (frostDepth >= 48 && frostDepth < 60) footingCostPerUnit = 125;
  else if (frostDepth >= 60) footingCostPerUnit = 158;
  const footingLow = isDIY
    ? Math.round(footingCostPerUnit * footingCount * 0.4)
    : Math.round(footingCostPerUnit * footingCount * 1.2);
  const footingHigh = isDIY
    ? Math.round(footingCostPerUnit * footingCount * 0.7)
    : Math.round(footingCostPerUnit * footingCount * 2.0);

  // Stairs
  const stairsLow = inputs.includeStairs
    ? isDIY
      ? inputs.stairSteps * (tier.id === "pt" ? 15 : tier.id === "composite" ? 35 : 40)
      : inputs.stairSteps * (tier.id === "pt" ? 30 : tier.id === "composite" ? 50 : 60)
    : 0;
  const stairsHigh = inputs.includeStairs
    ? isDIY
      ? inputs.stairSteps * (tier.id === "pt" ? 30 : tier.id === "composite" ? 75 : 80)
      : inputs.stairSteps * (tier.id === "pt" ? 60 : tier.id === "composite" ? 100 : 120)
    : 0;

  // Climate premium (only for professional installs)
  const climatePremium = isDIY ? 0 : region.climatePremium;

  // Totals
  const totalLow = adjustedLow + railingLow + footingLow + stairsLow + climatePremium;
  const totalHigh = adjustedHigh + railingHigh + footingHigh + stairsHigh + climatePremium;
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
      category: "Decking & Materials",
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

    const permitCost = inputs.includePermit ? (inputs.permitCost ?? 350) : 0;

    const totalWithExtrasLow = totalLow + wastedMaterialCost + toolRentalLow + permitCost;
    const totalWithExtrasHigh = totalHigh + Math.round(materialsHigh * wasteFactor) + toolRentalHigh + permitCost;

    // Savings vs hiring (compare to homeowner installed cost)
    const installedMid = Math.round(
      (baseInstalled.low * materialFraction + baseInstalled.low * laborFraction * regionMultiplier * complexityMultiplier +
       baseInstalled.high * materialFraction + baseInstalled.high * laborFraction * regionMultiplier * complexityMultiplier) / 2
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

    const materialCostRaw = Math.round((materialsLow + materialsHigh) / 2);
    const laborCostRaw = Math.round((laborLow + laborHigh) / 2);

    const materialWithMarkup = Math.round(materialCostRaw * (1 + markupTier.materialMarkup));
    const laborWithMarkup = Math.round(laborCostRaw * (1 + markupTier.laborMarkup));
    const overhead = Math.round((materialWithMarkup + laborWithMarkup) * markupTier.overheadPct);

    const subFootingsCost = inputs.subFootings ? Math.round((footingLow + footingHigh) / 2 * 1.15) : 0;

    const baseBidMid = materialWithMarkup + laborWithMarkup + overhead + subFootingsCost;
    const bidVariance = 0.08; // ±8% range
    const totalBidLow = Math.round(baseBidMid * (1 - bidVariance));
    const totalBidHigh = Math.round(baseBidMid * (1 + bidVariance));

    const grossMarginPct = Math.round(
      ((baseBidMid - materialCostRaw - laborCostRaw) / baseBidMid) * 100
    );

    // Estimated days: baseline 1 day per 40 sqFt for 2-person crew, adjusted by crew efficiency
    const estimatedDays = Math.max(1, Math.round((size.sqFt / 40 / crewSize.laborEfficiencyFactor) * complexity.laborMultiplier));

    contractorExtras = {
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
    stairsLow,
    stairsHigh,
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
    isDIY,
    isContractor,
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
