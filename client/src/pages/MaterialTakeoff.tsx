/**
 * MaterialTakeoff.tsx — Material Takeoff (Contractor Only)
 * Design: Precision Engineering — structured data table with inline editing.
 *
 * Phase 1: Deck Boards
 * Phase 2: Fasteners (Face Screws / Hidden Clips / Cortex)
 */

import { useState, useMemo, useEffect } from "react";
import {
  DECK_BOARD_SKUS,
  calculateBoardTakeoff,
  getDefaultSku,
  formatTakeoffCurrency,
  type BoardSku,
  FASTENER_SKUS,
  calculateFastenerTakeoff,
  getFastenerSkusForSystem,
  getDefaultFastenerSku,
  fastenerSystemLabel,
  type FastenerSystemId,
  LUMBER_SKUS,
  calculateLumberTakeoff,
  getLumberSkusByManufacturer,
  getDefaultLumberSku,
  estimateDeckDimensions,
  type LumberSku,
  CONCRETE_SKUS,
  POST_BASE_SKUS,
  calculateFootingTakeoff,
  getConcreteSkusByManufacturer,
  getPostBaseSkusByProductLine,
  getDefaultConcreteSku,
  getDefaultPostBaseSku,
  estimatePostCount,
  type ConcreteSku,
  type PostBaseSku,
  RAILING_SKUS,
  calculateRailingTakeoff,
  getRailingSkusByManufacturer,
  getRailingSkusByComponent,
  getDefaultRailingSkus,
  estimateRailingLF,
  type RailingSku,
  type RailingComponentType,
  STAIR_SKUS,
  calculateStairTakeoff,
  getStairSkusByComponent,
  getDefaultStairSkus,
  type StairSku,
  type StairComponentType,
  HARDWARE_SKUS,
  calculateHardwareTakeoff,
  getHardwareSkusByComponent,
  getDefaultHardwareSkus,
  type HardwareSku,
  type HardwareComponentType,
} from "@/lib/takeoffData";
import type { CalculatorResult } from "@/lib/deckData";

interface Props {
  result: CalculatorResult;
  onBack: () => void;
  onFinish: () => void;
}

const WASTE_OPTIONS = [
  { value: 0.05, label: "5% — Minimal waste (simple rectangle, no cuts)" },
  { value: 0.10, label: "10% — Standard waste (recommended)" },
  { value: 0.15, label: "15% — Complex cuts or diagonal pattern" },
  { value: 0.20, label: "20% — Picture-frame border + diagonal field" },
];

const LENGTH_OPTIONS = [12, 16, 20];

export default function MaterialTakeoff({ result, onBack, onFinish }: Props) {
  const deckAreaSqFt = result.size.sqFt;

  // ── Derive defaults from the estimate ──
  const defaultBrandId = result.deckingBrand?.id ?? "pt-wood";
  const fastenerSystemId: FastenerSystemId =
    result.fastenerSystem === "clip" || result.fastenerSystem === "cortex"
      ? result.fastenerSystem
      : "none";
  const preferGrooved = fastenerSystemId !== "none";

  // ── Phase 1 state ──
  const [selectedSkuId, setSelectedSkuId] = useState<string>(() => {
    const def = getDefaultSku(defaultBrandId, preferGrooved);
    return def?.id ?? DECK_BOARD_SKUS[0].id;
  });
  const [boardLengthFt, setBoardLengthFt] = useState<number>(16);
  const [wasteFactor, setWasteFactor] = useState<number>(0.10);
  const [taxRate, setTaxRate] = useState<number>(0.06);
  const [boardsOverride, setBoardsOverride] = useState<number | null>(null);
  const [unitPriceOverride, setUnitPriceOverride] = useState<number | null>(null);
  // Which manufacturer accordion is open in Phase 1
  const [expandedBoardBrand, setExpandedBoardBrand] = useState<string | null>(() => {
    const def = getDefaultSku(defaultBrandId, preferGrooved) ?? DECK_BOARD_SKUS[0];
    return def.manufacturer;
  });

  // ── Phase 2 state ──
  const [fastenerSkuId, setFastenerSkuId] = useState<string>(() => {
    return getDefaultFastenerSku(fastenerSystemId, deckAreaSqFt).id;
  });
  const [fastenerQtyOverride, setFastenerQtyOverride] = useState<number | null>(null);
  const [fastenerPriceOverride, setFastenerPriceOverride] = useState<number | null>(null);
  // Which brand accordion is open (null = all collapsed)
  const [expandedFastenerBrand, setExpandedFastenerBrand] = useState<string | null>(() => {
    const defaultSku = getDefaultFastenerSku(fastenerSystemId, deckAreaSqFt);
    return defaultSku.brand;
  });

  // ── Phase 1: Selected SKU ──
  const selectedSku: BoardSku = useMemo(
    () => DECK_BOARD_SKUS.find(s => s.id === selectedSkuId) ?? DECK_BOARD_SKUS[0],
    [selectedSkuId]
  );

  // ── Phase 1: Takeoff calculation ──
  const takeoff = useMemo(() => calculateBoardTakeoff({
    deckAreaSqFt,
    sku: selectedSku,
    boardLengthFt,
    wasteFactor,
    boardsOverride: boardsOverride ?? undefined,
    unitPriceOverride: unitPriceOverride ?? undefined,
    taxRate,
  }), [deckAreaSqFt, selectedSku, boardLengthFt, wasteFactor, boardsOverride, unitPriceOverride, taxRate]);

  // Reset overrides when SKU or length changes
  useEffect(() => {
    setBoardsOverride(null);
    setUnitPriceOverride(null);
  }, [selectedSkuId, boardLengthFt]);

  // ── Phase 2: Fastener takeoff ──
  const fastenerTakeoff = useMemo(() => calculateFastenerTakeoff({
    deckAreaSqFt,
    systemId: fastenerSystemId,
    selectedSkuId: fastenerSkuId,
    qtyOverride: fastenerQtyOverride ?? undefined,
    unitPriceOverride: fastenerPriceOverride ?? undefined,
    taxRate,
  }), [deckAreaSqFt, fastenerSystemId, fastenerSkuId, fastenerQtyOverride, fastenerPriceOverride, taxRate]);

  // Reset fastener overrides when SKU changes
  useEffect(() => {
    setFastenerQtyOverride(null);
    setFastenerPriceOverride(null);
  }, [fastenerSkuId]);

  // ── Phase 1: Group SKUs by brand for the selector ──
  const skusByBrand = useMemo(() => {
    const groups: Record<string, BoardSku[]> = {};
    DECK_BOARD_SKUS.forEach(sku => {
      if (!groups[sku.manufacturer]) groups[sku.manufacturer] = [];
      groups[sku.manufacturer].push(sku);
    });
    return groups;
  }, []);

  // ── Phase 2: Fastener SKUs for selected system ──
  const fastenerSkusForSystem = useMemo(
    () => getFastenerSkusForSystem(fastenerSystemId),
    [fastenerSystemId]
  );

  const isPhase1Edited = boardsOverride !== null || unitPriceOverride !== null;
  const isFastenerEdited = fastenerQtyOverride !== null || fastenerPriceOverride !== null;

  // ── Phase 3 state ──
  const { widthFt: defaultWidthFt, lengthFt: defaultLengthFt } = estimateDeckDimensions(deckAreaSqFt);
  const defaultJoistSpacingIn: number =
    result.joistSpacingIn === 12 || result.joistSpacingIn === 16 || result.joistSpacingIn === 24
      ? result.joistSpacingIn
      : 16;
  const [joistSpacingIn, setJoistSpacingIn] = useState<number>(defaultJoistSpacingIn);
  const [deckWidthFt, setDeckWidthFt] = useState<number>(defaultWidthFt);
  const [deckLengthFt, setDeckLengthFt] = useState<number>(defaultLengthFt);
  const [joistSkuId, setJoistSkuId] = useState<string>(getDefaultLumberSku().id);
  const [joistLengthFt, setJoistLengthFt] = useState<number>(16);
  const [joistQtyOverride, setJoistQtyOverride] = useState<number | null>(null);
  const [joistPriceOverride, setJoistPriceOverride] = useState<number | null>(null);
  const [rimQtyOverride, setRimQtyOverride] = useState<number | null>(null);
  const [rimPriceOverride, setRimPriceOverride] = useState<number | null>(null);
  // Accordion state for Phase 3
  const [expandedLumberBrand, setExpandedLumberBrand] = useState<string | null>(() => getDefaultLumberSku().manufacturer);

  const joistSku: LumberSku = useMemo(
    () => LUMBER_SKUS.find(s => s.id === joistSkuId) ?? getDefaultLumberSku(),
    [joistSkuId]
  );

  const lumberTakeoff = useMemo(() => calculateLumberTakeoff({
    deckAreaSqFt,
    deckWidthFt,
    deckLengthFt,
    joistSpacingIn,
    joistSku,
    joistLengthFt,
    rimSku: joistSku, // same size for rim
    joistQtyOverride: joistQtyOverride ?? undefined,
    joistPriceOverride: joistPriceOverride ?? undefined,
    rimQtyOverride: rimQtyOverride ?? undefined,
    rimPriceOverride: rimPriceOverride ?? undefined,
    taxRate,
  }), [deckAreaSqFt, deckWidthFt, deckLengthFt, joistSpacingIn, joistSku, joistLengthFt, joistQtyOverride, joistPriceOverride, rimQtyOverride, rimPriceOverride, taxRate]);

  useEffect(() => {
    setJoistQtyOverride(null);
    setJoistPriceOverride(null);
    setRimQtyOverride(null);
    setRimPriceOverride(null);
  }, [joistSkuId, joistLengthFt, joistSpacingIn]);

  const lumberSkusByManufacturer = useMemo(() => getLumberSkusByManufacturer(), []);
  const isPhase3Edited = joistQtyOverride !== null || joistPriceOverride !== null || rimQtyOverride !== null || rimPriceOverride !== null;

  // ── Phase 4 state ──
  const [postCount, setPostCount] = useState<number>(() => estimatePostCount(deckAreaSqFt));
  const [tubeDiameterIn, setTubeDiameterIn] = useState<number>(10);
  const [footingDepthFt, setFootingDepthFt] = useState<number>(3.5);
  const [concreteSkuId, setConcreteSkuId] = useState<string>(getDefaultConcreteSku().id);
  const [postBaseSkuId, setPostBaseSkuId] = useState<string>(getDefaultPostBaseSku().id);
  const [concreteQtyOverride, setConcreteQtyOverride] = useState<number | null>(null);
  const [concretePriceOverride, setConcretePriceOverride] = useState<number | null>(null);
  const [postBaseQtyOverride, setPostBaseQtyOverride] = useState<number | null>(null);
  const [postBasePriceOverride, setPostBasePriceOverride] = useState<number | null>(null);
  const [expandedConcreteBrand, setExpandedConcreteBrand] = useState<string | null>(getDefaultConcreteSku().manufacturer);
  const [expandedPostBaseLine, setExpandedPostBaseLine] = useState<string | null>(getDefaultPostBaseSku().productLine);

  const concreteSku: ConcreteSku = useMemo(
    () => CONCRETE_SKUS.find(s => s.id === concreteSkuId) ?? getDefaultConcreteSku(),
    [concreteSkuId]
  );
  const postBaseSku: PostBaseSku = useMemo(
    () => POST_BASE_SKUS.find(s => s.id === postBaseSkuId) ?? getDefaultPostBaseSku(),
    [postBaseSkuId]
  );

  const footingTakeoff = useMemo(() => calculateFootingTakeoff({
    postCount,
    tubeDiameterIn,
    footingDepthFt,
    concreteSku,
    postBaseSku,
    concreteQtyOverride: concreteQtyOverride ?? undefined,
    concretePriceOverride: concretePriceOverride ?? undefined,
    postBaseQtyOverride: postBaseQtyOverride ?? undefined,
    postBasePriceOverride: postBasePriceOverride ?? undefined,
    taxRate,
  }), [postCount, tubeDiameterIn, footingDepthFt, concreteSku, postBaseSku, concreteQtyOverride, concretePriceOverride, postBaseQtyOverride, postBasePriceOverride, taxRate]);

  useEffect(() => {
    setConcreteQtyOverride(null);
    setConcretePriceOverride(null);
  }, [concreteSkuId, tubeDiameterIn, footingDepthFt, postCount]);

  useEffect(() => {
    setPostBaseQtyOverride(null);
    setPostBasePriceOverride(null);
  }, [postBaseSkuId, postCount]);

  const concreteSkusByManufacturer = useMemo(() => getConcreteSkusByManufacturer(), []);
  const postBaseSkusByProductLine = useMemo(() => getPostBaseSkusByProductLine(), []);
  const isPhase4Edited = concreteQtyOverride !== null || concretePriceOverride !== null || postBaseQtyOverride !== null || postBasePriceOverride !== null;

  // ── Phase 5 state ──
  const [railingBrand, setRailingBrand] = useState<"Trex" | "TimberTech">("Trex");
  const defaultRailing = useMemo(() => getDefaultRailingSkus(railingBrand), [railingBrand]);
  const [railingLF, setRailingLF] = useState<number>(() => estimateRailingLF(deckWidthFt, deckLengthFt));
  const [postSpacingFt, setPostSpacingFt] = useState<number>(6);
  const [postSkuId, setPostSkuId] = useState<string>(defaultRailing.postSku.id);
  const [topRailSkuId, setTopRailSkuId] = useState<string>(defaultRailing.topRailSku.id);
  const [bottomRailSkuId, setBottomRailSkuId] = useState<string>(defaultRailing.bottomRailSku.id);
  const [balustrSkuId, setBalustrSkuId] = useState<string>(defaultRailing.balustrSku.id);
  const [postCapSkuId, setPostCapSkuId] = useState<string>(defaultRailing.postCapSku.id);
  const [railPostQtyOverride, setRailPostQtyOverride] = useState<number | null>(null);
  const [railTopQtyOverride, setRailTopQtyOverride] = useState<number | null>(null);
  const [railBottomQtyOverride, setRailBottomQtyOverride] = useState<number | null>(null);
  const [railBalustrQtyOverride, setRailBalustrQtyOverride] = useState<number | null>(null);
  const [railCapQtyOverride, setRailCapQtyOverride] = useState<number | null>(null);
  const [expandedRailingBrand, setExpandedRailingBrand] = useState<string | null>("Trex");
  const [expandedRailingComponent, setExpandedRailingComponent] = useState<RailingComponentType | null>("post-sleeve");

  // When brand changes, reset all SKU selections to new brand defaults
  useEffect(() => {
    const d = getDefaultRailingSkus(railingBrand);
    setPostSkuId(d.postSku.id);
    setTopRailSkuId(d.topRailSku.id);
    setBottomRailSkuId(d.bottomRailSku.id);
    setBalustrSkuId(d.balustrSku.id);
    setPostCapSkuId(d.postCapSku.id);
    setRailPostQtyOverride(null);
    setRailTopQtyOverride(null);
    setRailBottomQtyOverride(null);
    setRailBalustrQtyOverride(null);
    setRailCapQtyOverride(null);
    setExpandedRailingBrand(railingBrand);
    setExpandedRailingComponent("post-sleeve");
  }, [railingBrand]);

  const postRailSku: RailingSku = useMemo(() => RAILING_SKUS.find(s => s.id === postSkuId) ?? defaultRailing.postSku, [postSkuId, defaultRailing]);
  const topRailSku: RailingSku = useMemo(() => RAILING_SKUS.find(s => s.id === topRailSkuId) ?? defaultRailing.topRailSku, [topRailSkuId, defaultRailing]);
  const bottomRailSku: RailingSku = useMemo(() => RAILING_SKUS.find(s => s.id === bottomRailSkuId) ?? defaultRailing.bottomRailSku, [bottomRailSkuId, defaultRailing]);
  const balustrSku: RailingSku = useMemo(() => RAILING_SKUS.find(s => s.id === balustrSkuId) ?? defaultRailing.balustrSku, [balustrSkuId, defaultRailing]);
  const postCapRailSku: RailingSku = useMemo(() => RAILING_SKUS.find(s => s.id === postCapSkuId) ?? defaultRailing.postCapSku, [postCapSkuId, defaultRailing]);

  const railingTakeoff = useMemo(() => calculateRailingTakeoff({
    railingLF,
    postSpacingFt,
    postSku: postRailSku,
    topRailSku,
    bottomRailSku,
    balustrSku,
    postCapSku: postCapRailSku,
    postQtyOverride: railPostQtyOverride ?? undefined,
    topRailQtyOverride: railTopQtyOverride ?? undefined,
    bottomRailQtyOverride: railBottomQtyOverride ?? undefined,
    balustrQtyOverride: railBalustrQtyOverride ?? undefined,
    postCapQtyOverride: railCapQtyOverride ?? undefined,
    taxRate,
  }), [railingLF, postSpacingFt, postRailSku, topRailSku, bottomRailSku, balustrSku, postCapRailSku, railPostQtyOverride, railTopQtyOverride, railBottomQtyOverride, railBalustrQtyOverride, railCapQtyOverride, taxRate]);

  const railingSkusByManufacturer = useMemo(() => getRailingSkusByManufacturer(), []);
  const isPhase5Edited = railPostQtyOverride !== null || railTopQtyOverride !== null || railBottomQtyOverride !== null || railBalustrQtyOverride !== null || railCapQtyOverride !== null;

  // ── Phase 6 state ──
  const defaultStair = useMemo(() => getDefaultStairSkus(), []);
  const [deckHeightIn, setDeckHeightIn] = useState<number>(48);
  const [stairWidthIn, setStairWidthIn] = useState<number>(36);
  const [riseIn, setRiseIn] = useState<number>(7);
  const [runIn, setRunIn] = useState<number>(10);
  const [treadSkuId, setTreadSkuId] = useState<string>(defaultStair.treadSku.id);
  const [stringerSkuId, setStringerSkuId] = useState<string>(defaultStair.stringerSku.id);
  const [stringerBracketSkuId, setStringerBracketSkuId] = useState<string>(defaultStair.stringerBracketSku.id);
  const [treadHardwareSkuId, setTreadHardwareSkuId] = useState<string>(defaultStair.treadHardwareSku.id);
  const [stairStepOverride, setStairStepOverride] = useState<number | null>(null);
  const [stairStringerOverride, setStairStringerOverride] = useState<number | null>(null);
  const [stairTreadQtyOverride, setStairTreadQtyOverride] = useState<number | null>(null);
  const [stairBracketQtyOverride, setStairBracketQtyOverride] = useState<number | null>(null);
  const [stairHardwareQtyOverride, setStairHardwareQtyOverride] = useState<number | null>(null);
  const [expandedStairComponent, setExpandedStairComponent] = useState<StairComponentType | null>("tread");

  const treadSku: StairSku = useMemo(() => STAIR_SKUS.find(s => s.id === treadSkuId) ?? defaultStair.treadSku, [treadSkuId, defaultStair]);
  const stringerSku: StairSku = useMemo(() => STAIR_SKUS.find(s => s.id === stringerSkuId) ?? defaultStair.stringerSku, [stringerSkuId, defaultStair]);
  const stringerBracketSku: StairSku = useMemo(() => STAIR_SKUS.find(s => s.id === stringerBracketSkuId) ?? defaultStair.stringerBracketSku, [stringerBracketSkuId, defaultStair]);
  const treadHardwareSku: StairSku = useMemo(() => STAIR_SKUS.find(s => s.id === treadHardwareSkuId) ?? defaultStair.treadHardwareSku, [treadHardwareSkuId, defaultStair]);

  const stairTakeoff = useMemo(() => calculateStairTakeoff({
    deckHeightIn,
    stairWidthIn,
    riseIn,
    runIn,
    treadSku,
    stringerSku,
    stringerBracketSku,
    treadHardwareSku,
    stepCountOverride: stairStepOverride ?? undefined,
    stringerCountOverride: stairStringerOverride ?? undefined,
    treadQtyOverride: stairTreadQtyOverride ?? undefined,
    stringerBracketQtyOverride: stairBracketQtyOverride ?? undefined,
    treadHardwareQtyOverride: stairHardwareQtyOverride ?? undefined,
    taxRate,
  }), [deckHeightIn, stairWidthIn, riseIn, runIn, treadSku, stringerSku, stringerBracketSku, treadHardwareSku, stairStepOverride, stairStringerOverride, stairTreadQtyOverride, stairBracketQtyOverride, stairHardwareQtyOverride, taxRate]);

  const isPhase6Edited = stairStepOverride !== null || stairStringerOverride !== null || stairTreadQtyOverride !== null || stairBracketQtyOverride !== null || stairHardwareQtyOverride !== null;

  // ── Phase 7 state ──
  const defaultHardware = useMemo(() => getDefaultHardwareSkus(), []);
  const [joistHangerSkuId, setJoistHangerSkuId] = useState<string>(defaultHardware.joistHangerSku.id);
  const [hwPostCapSkuId, setHwPostCapSkuId] = useState<string>(defaultHardware.postCapSku.id);
  const [ledgerFlashingSkuId, setLedgerFlashingSkuId] = useState<string>(defaultHardware.ledgerFlashingSku.id);
  const [structuralScrewSkuId, setStructuralScrewSkuId] = useState<string>(defaultHardware.structuralScrewSku.id);
  const [joistTapeSkuId, setJoistTapeSkuId] = useState<string>(defaultHardware.joistTapeSku.id);
  const [hwJoistHangerQtyOverride, setHwJoistHangerQtyOverride] = useState<number | null>(null);
  const [hwPostCapQtyOverride, setHwPostCapQtyOverride] = useState<number | null>(null);
  const [hwLedgerFlashingQtyOverride, setHwLedgerFlashingQtyOverride] = useState<number | null>(null);
  const [hwStructuralScrewQtyOverride, setHwStructuralScrewQtyOverride] = useState<number | null>(null);
  const [hwJoistTapeQtyOverride, setHwJoistTapeQtyOverride] = useState<number | null>(null);
  const [expandedHwComponent, setExpandedHwComponent] = useState<HardwareComponentType | null>("joist-hanger");
  const [ledgerLF, setLedgerLF] = useState<number>(() => Math.max(deckWidthFt, deckLengthFt));

  const joistHangerSku: HardwareSku = useMemo(() => HARDWARE_SKUS.find(s => s.id === joistHangerSkuId) ?? defaultHardware.joistHangerSku, [joistHangerSkuId, defaultHardware]);
  const hwPostCapSku: HardwareSku = useMemo(() => HARDWARE_SKUS.find(s => s.id === hwPostCapSkuId) ?? defaultHardware.postCapSku, [hwPostCapSkuId, defaultHardware]);
  const ledgerFlashingSku: HardwareSku = useMemo(() => HARDWARE_SKUS.find(s => s.id === ledgerFlashingSkuId) ?? defaultHardware.ledgerFlashingSku, [ledgerFlashingSkuId, defaultHardware]);
  const structuralScrewSku: HardwareSku = useMemo(() => HARDWARE_SKUS.find(s => s.id === structuralScrewSkuId) ?? defaultHardware.structuralScrewSku, [structuralScrewSkuId, defaultHardware]);
  const joistTapeSku: HardwareSku = useMemo(() => HARDWARE_SKUS.find(s => s.id === joistTapeSkuId) ?? defaultHardware.joistTapeSku, [joistTapeSkuId, defaultHardware]);

  const hardwareTakeoff = useMemo(() => calculateHardwareTakeoff({
    joistCount: lumberTakeoff.joistCount,
    postCount,
    ledgerLF,
    joistHangerSku,
    postCapSku: hwPostCapSku,
    ledgerFlashingSku,
    structuralScrewSku,
    joistTapeSku,
    joistHangerQtyOverride: hwJoistHangerQtyOverride ?? undefined,
    postCapQtyOverride: hwPostCapQtyOverride ?? undefined,
    ledgerFlashingQtyOverride: hwLedgerFlashingQtyOverride ?? undefined,
    structuralScrewQtyOverride: hwStructuralScrewQtyOverride ?? undefined,
    joistTapeQtyOverride: hwJoistTapeQtyOverride ?? undefined,
    taxRate,
  }), [lumberTakeoff.joistCount, postCount, ledgerLF, joistHangerSku, hwPostCapSku, ledgerFlashingSku, structuralScrewSku, joistTapeSku, hwJoistHangerQtyOverride, hwPostCapQtyOverride, hwLedgerFlashingQtyOverride, hwStructuralScrewQtyOverride, hwJoistTapeQtyOverride, taxRate]);

  const isPhase7Edited = hwJoistHangerQtyOverride !== null || hwPostCapQtyOverride !== null || hwLedgerFlashingQtyOverride !== null || hwStructuralScrewQtyOverride !== null || hwJoistTapeQtyOverride !== null;

  // ── Grand total ──
  const grandTotal = takeoff.total + fastenerTakeoff.total + lumberTakeoff.total + footingTakeoff.total + railingTakeoff.total + stairTakeoff.total + hardwareTakeoff.total;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold tracking-widest uppercase text-amber-400">Contractor · Material Takeoff</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Material Takeoff</h2>
        <p className="text-sm text-slate-400 mt-1">
          Exact quantities and brand-specific pricing for your build. Edit any field to dial in your actual costs.
        </p>
      </div>

      {/* ── Deck area summary ── */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center gap-4 sm:gap-6">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Deck Area</div>
          <div className="text-2xl font-bold text-white">{deckAreaSqFt.toLocaleString()} sq ft</div>
        </div>
        <div className="w-px h-10 bg-slate-700 hidden sm:block" />
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Dimensions</div>
          <div className="text-lg font-semibold text-slate-200">{result.size.dimensions}</div>
        </div>
        <div className="w-px h-10 bg-slate-700 hidden sm:block" />
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Material</div>
          <div className="text-lg font-semibold text-slate-200">{result.tier.label}</div>
        </div>
        <div className="w-px h-10 bg-slate-700 hidden sm:block" />
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Fastening</div>
          <div className="text-lg font-semibold text-slate-200">{fastenerSystemLabel(fastenerSystemId)}</div>
        </div>
        {result.deckingBrand && (
          <>
            <div className="w-px h-10 bg-slate-700 hidden sm:block" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Brand (from estimate)</div>
              <div className="text-lg font-semibold text-emerald-400">{result.deckingBrand.name}</div>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PHASE 1: DECK BOARDS
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/60 border border-slate-600 rounded-xl overflow-hidden">
        <div className="bg-slate-700/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Phase 1</span>
            <span className="text-white font-semibold">Deck Boards</span>
          </div>
          <span className="text-xs text-slate-400">Category 1 of 7</span>
        </div>

        <div className="p-5 space-y-5">

          {/* SKU Selector — product-line accordion */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Brand &amp; Product
            </label>
            <div className="space-y-2">
              {Object.entries(skusByBrand).map(([productLine, skus]) => {
                const isOpen = expandedBoardBrand === productLine;
                const hasSelected = skus.some(s => s.id === selectedSkuId);
                return (
                  <div key={productLine} className={`rounded-xl border transition-all ${
                    hasSelected ? "border-amber-500/60" : "border-slate-600"
                  }`}>
                    {/* Accordion header */}
                    <button
                      onClick={() => setExpandedBoardBrand(isOpen ? null : productLine)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${
                          hasSelected ? "text-amber-300" : "text-slate-200"
                        }`}>{productLine}</span>
                        {hasSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Selected</span>
                        )}
                        <span className="text-xs text-slate-500">{skus.length} product line{skus.length !== 1 ? "s" : ""}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Accordion body */}
                    {isOpen && (
                      <div className="px-3 pb-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {skus.map(sku => (
                            <button
                              key={sku.id}
                              onClick={() => setSelectedSkuId(sku.id)}
                              className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                                selectedSkuId === sku.id
                                  ? "border-amber-500 bg-amber-500/10 text-white"
                                  : "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-500"
                              }`}
                            >
                              <div className="text-sm font-medium">{sku.name}</div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-slate-400">
                                  {formatTakeoffCurrency(sku.contractorPricePerBoard[16])}/16' board
                                </span>
                                {sku.grooved && (
                                  <span className="text-[10px] font-semibold text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded">GROOVED</span>
                                )}
                                {sku.solidOnly && (
                                  <span className="text-[10px] font-semibold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">SOLID ONLY</span>
                                )}
                              </div>
                              {sku.notes && (
                                <div className="text-[11px] text-slate-500 mt-0.5 italic">{sku.notes}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Board Length + Waste Factor + Tax Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Board Length */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Board Length
              </label>
              <div className="flex gap-2">
                {LENGTH_OPTIONS.map(len => (
                  <button
                    key={len}
                    onClick={() => setBoardLengthFt(len)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      boardLengthFt === len
                        ? "border-amber-500 bg-amber-500/10 text-amber-300"
                        : "border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {len}'
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatTakeoffCurrency(selectedSku.contractorPricePerBoard[boardLengthFt] ?? 0)} / board · {takeoff.coveragePerBoard} sq ft coverage
              </div>
            </div>

            {/* Waste Factor */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Waste Factor
              </label>
              <select
                value={wasteFactor}
                onChange={e => setWasteFactor(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                {WASTE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="text-xs text-slate-500 mt-1">
                Net: {deckAreaSqFt} sq ft → Gross: {takeoff.grossAreaSqFt} sq ft
              </div>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Sales Tax Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={15}
                  step={0.25}
                  value={(taxRate * 100).toFixed(2)}
                  onChange={e => setTaxRate(Math.max(0, Math.min(0.15, Number(e.target.value) / 100)))}
                  className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                />
                <span className="text-slate-400 text-sm font-medium">%</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Applied to all material phases</div>
            </div>
          </div>

          {/* ── Takeoff Summary Table ── */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-700/40 text-xs font-bold tracking-widest uppercase text-slate-400">
              Takeoff Summary — {selectedSku.name}
            </div>
            <div className="divide-y divide-slate-700/50">
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Deck area (net)</span>
                <span className="text-center text-slate-300">{deckAreaSqFt.toLocaleString()} sq ft</span>
                <span className="text-right text-slate-500 text-xs">base</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Waste factor</span>
                <span className="text-center text-slate-300">+{(wasteFactor * 100).toFixed(0)}%</span>
                <span className="text-right text-slate-300">{takeoff.grossAreaSqFt} sq ft gross</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Coverage / board</span>
                <span className="text-center text-slate-300">{takeoff.coveragePerBoard} sq ft</span>
                <span className="text-right text-slate-500 text-xs">{selectedSku.actualWidthIn}" face × {boardLengthFt}'</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm bg-slate-800/40">
                <span className="text-slate-300 font-semibold">Boards needed</span>
                <span className="text-center">
                  <input
                    type="number"
                    min={1}
                    value={boardsOverride ?? takeoff.boardsNeeded}
                    onChange={e => setBoardsOverride(Math.max(1, parseInt(e.target.value) || takeoff.boardsNeeded))}
                    className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400"
                  />
                </span>
                <span className="text-right">
                  {boardsOverride !== null && boardsOverride !== takeoff.boardsNeeded && (
                    <span className="text-xs text-amber-400">calc: {takeoff.boardsNeeded}</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm bg-slate-800/40">
                <span className="text-slate-300 font-semibold">Unit price / board</span>
                <span className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.25}
                      value={(unitPriceOverride ?? takeoff.unitPrice).toFixed(2)}
                      onChange={e => setUnitPriceOverride(Math.max(0, Number(e.target.value)))}
                      className="w-24 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </span>
                <span className="text-right">
                  {unitPriceOverride !== null && (
                    <span className="text-xs text-amber-400">list: {formatTakeoffCurrency(selectedSku.contractorPricePerBoard[boardLengthFt] ?? 0)}</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Subtotal (materials)</span>
                <span />
                <span className="text-right text-slate-200 font-semibold">{formatTakeoffCurrency(takeoff.subtotal)}</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Sales tax ({(taxRate * 100).toFixed(2)}%)</span>
                <span />
                <span className="text-right text-slate-300">{formatTakeoffCurrency(takeoff.taxAmount)}</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-3 bg-slate-700/30">
                <span className="text-white font-bold text-base">Total — Deck Boards</span>
                <span />
                <span className="text-right text-emerald-400 font-bold text-xl">{formatTakeoffCurrency(takeoff.total)}</span>
              </div>
            </div>
          </div>

          {isPhase1Edited && (
            <button
              onClick={() => { setBoardsOverride(null); setUnitPriceOverride(null); }}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Reset to calculated values
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PHASE 2: FASTENERS
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/60 border border-slate-600 rounded-xl overflow-hidden">
        <div className="bg-slate-700/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Phase 2</span>
            <span className="text-white font-semibold">Fasteners</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
              fastenerSystemId === "cortex"
                ? "bg-purple-500/20 text-purple-300"
                : fastenerSystemId === "clip"
                ? "bg-sky-500/20 text-sky-300"
                : "bg-slate-600/50 text-slate-400"
            }`}>
              {fastenerSystemLabel(fastenerSystemId)}
            </span>
          </div>
          <span className="text-xs text-slate-400">Category 2 of 7</span>
        </div>

        <div className="p-5 space-y-5">

          {/* System info banner */}
          <div className={`rounded-lg p-3 text-sm border ${
            fastenerSystemId === "cortex"
              ? "bg-purple-500/5 border-purple-500/20 text-purple-200"
              : fastenerSystemId === "clip"
              ? "bg-sky-500/5 border-sky-500/20 text-sky-200"
              : "bg-slate-700/30 border-slate-600/50 text-slate-300"
          }`}>
            {fastenerSystemId === "cortex" && (
              <><strong>Cortex by FastenMaster</strong> — Screw + color-matched plug system. Drills, countersinks, and inserts a flush plug over each screw head. No visible fasteners. Requires a grooved or solid board.</>
            )}
            {fastenerSystemId === "clip" && (
              <><strong>Hidden Clip System</strong> — Snap-in clips sit in the board groove and attach to the joist. No face screws visible. Requires grooved-edge boards. Coverage: ~1.8 clips/sq ft at 16" OC.</>
            )}
            {fastenerSystemId === "none" && (
              <><strong>Face Screw Install</strong> — Standard #10 × 3" screws driven through the face of each board into the joist. ~4 screws/sq ft at 16" OC with 6" boards.</>
            )}
          </div>

          {/* SKU Selector — brand accordion */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Brand &amp; Pack Size
            </label>
            {fastenerSkusForSystem.length === 0 ? (
              <div className="text-sm text-slate-500 italic">No fastener SKUs available for this system.</div>
            ) : (
              <div className="space-y-2">
                {Array.from(new Set(fastenerSkusForSystem.map(s => s.brand))).map(brand => {
                  const brandSkus = fastenerSkusForSystem.filter(s => s.brand === brand);
                  const isOpen = expandedFastenerBrand === brand;
                  const hasSelected = brandSkus.some(s => s.id === fastenerSkuId);
                  return (
                    <div key={brand} className={`rounded-xl border transition-all ${
                      hasSelected ? "border-amber-500/60" : "border-slate-600"
                    }`}>
                      {/* Accordion header */}
                      <button
                        onClick={() => setExpandedFastenerBrand(isOpen ? null : brand)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold ${
                            hasSelected ? "text-amber-300" : "text-slate-200"
                          }`}>{brand}</span>
                          {hasSelected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Selected</span>
                          )}
                          <span className="text-xs text-slate-500">{brandSkus.length} option{brandSkus.length !== 1 ? "s" : ""}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Accordion body */}
                      {isOpen && (
                        <div className="px-3 pb-3 space-y-2">
                          {brandSkus.map(sku => (
                            <button
                              key={sku.id}
                              onClick={() => setFastenerSkuId(sku.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                                fastenerSkuId === sku.id
                                  ? "border-amber-500 bg-amber-500/10 text-white"
                                  : "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-500"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white">{sku.name}</div>
                                  <div className="text-xs text-slate-400 mt-1">{sku.description}</div>
                                  {sku.notes && (
                                    <div className="text-[11px] text-slate-500 mt-0.5 italic">{sku.notes}</div>
                                  )}
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <div className="text-sm font-bold text-amber-300">{formatTakeoffCurrency(sku.contractorPricePerUnit)}</div>
                                  <div className="text-xs text-slate-500">per {sku.unit}</div>
                                  <div className="text-xs text-slate-500">{sku.qtyPerUnit.toLocaleString()} {sku.systemId === "none" ? "screws" : sku.systemId === "clip" ? "clips" : "plugs"}</div>
                                  <div className="text-[11px] text-emerald-500 font-medium mt-0.5">~{sku.coverageSqFtPerUnit} sq ft</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Fastener Takeoff Table ── */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-700/40 text-xs font-bold tracking-widest uppercase text-slate-400">
              Takeoff Summary — {fastenerTakeoff.sku.name}
            </div>
            <div className="divide-y divide-slate-700/50">
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Deck area (net)</span>
                <span className="text-center text-slate-300">{deckAreaSqFt.toLocaleString()} sq ft</span>
                <span className="text-right text-slate-500 text-xs">base</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Waste buffer</span>
                <span className="text-center text-slate-300">+5%</span>
                <span className="text-right text-slate-300">{fastenerTakeoff.grossAreaSqFt} sq ft</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Coverage / {fastenerTakeoff.sku.unit}</span>
                <span className="text-center text-slate-300">{fastenerTakeoff.sku.coverageSqFtPerUnit} sq ft</span>
                <span className="text-right text-slate-500 text-xs">{fastenerTakeoff.sku.qtyPerUnit.toLocaleString()} {fastenerSystemId === "none" ? "screws" : fastenerSystemId === "clip" ? "clips" : "plugs"}</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm bg-slate-800/40">
                <span className="text-slate-300 font-semibold">{fastenerTakeoff.sku.unit === "bucket" ? "Buckets" : fastenerTakeoff.sku.unit === "pack" ? "Packs" : "Boxes"} needed</span>
                <span className="text-center">
                  <input
                    type="number"
                    min={1}
                    value={fastenerQtyOverride ?? fastenerTakeoff.unitsNeeded}
                    onChange={e => setFastenerQtyOverride(Math.max(1, parseInt(e.target.value) || fastenerTakeoff.unitsNeeded))}
                    className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400"
                  />
                </span>
                <span className="text-right">
                  {fastenerQtyOverride !== null && fastenerQtyOverride !== fastenerTakeoff.unitsNeeded && (
                    <span className="text-xs text-amber-400">calc: {fastenerTakeoff.unitsNeeded}</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm bg-slate-800/40">
                <span className="text-slate-300 font-semibold">Unit price / {fastenerTakeoff.sku.unit}</span>
                <span className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.25}
                      value={(fastenerPriceOverride ?? fastenerTakeoff.unitPrice).toFixed(2)}
                      onChange={e => setFastenerPriceOverride(Math.max(0, Number(e.target.value)))}
                      className="w-24 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </span>
                <span className="text-right">
                  {fastenerPriceOverride !== null && (
                    <span className="text-xs text-amber-400">list: {formatTakeoffCurrency(fastenerTakeoff.sku.contractorPricePerUnit)}</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Subtotal (materials)</span>
                <span />
                <span className="text-right text-slate-200 font-semibold">{formatTakeoffCurrency(fastenerTakeoff.subtotal)}</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span className="text-slate-400">Sales tax ({(taxRate * 100).toFixed(2)}%)</span>
                <span />
                <span className="text-right text-slate-300">{formatTakeoffCurrency(fastenerTakeoff.taxAmount)}</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-3 bg-slate-700/30">
                <span className="text-white font-bold text-base">Total — Fasteners</span>
                <span />
                <span className="text-right text-emerald-400 font-bold text-xl">{formatTakeoffCurrency(fastenerTakeoff.total)}</span>
              </div>
            </div>
          </div>

          {isFastenerEdited && (
            <button
              onClick={() => { setFastenerQtyOverride(null); setFastenerPriceOverride(null); }}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Reset to calculated values
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PHASE 3: FRAMING LUMBER
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/60 border border-slate-600 rounded-xl overflow-hidden">
        <div className="bg-slate-700/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Phase 3</span>
            <span className="text-white font-semibold">Framing Lumber</span>
          </div>
          <span className="text-xs text-slate-400">Category 3 of 7</span>
        </div>

        <div className="p-5 space-y-5">

          {/* Deck Dimensions + Joist Spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Deck Width (ft)</label>
              <input
                type="number" min={4} max={100} step={1}
                value={deckWidthFt}
                onChange={e => setDeckWidthFt(Math.max(4, parseInt(e.target.value) || defaultWidthFt))}
                className="w-full bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              />
              <div className="text-[11px] text-slate-500 mt-1">Joist span direction</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Deck Length (ft)</label>
              <input
                type="number" min={4} max={200} step={1}
                value={deckLengthFt}
                onChange={e => setDeckLengthFt(Math.max(4, parseInt(e.target.value) || defaultLengthFt))}
                className="w-full bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              />
              <div className="text-[11px] text-slate-500 mt-1">Joist run direction</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Joist Spacing</label>
              <div className="flex gap-2">
                {[12, 16, 24].map(sp => (
                  <button
                    key={sp}
                    onClick={() => setJoistSpacingIn(sp)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      joistSpacingIn === sp
                        ? "border-amber-500 bg-amber-500/10 text-amber-300"
                        : "border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {sp}"
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">On center (inches)</div>
            </div>
          </div>

          {/* Joist Length */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Joist Length</label>
            <div className="flex gap-2">
              {[8, 10, 12, 16, 20].map(len => (
                <button
                  key={len}
                  onClick={() => setJoistLengthFt(len)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    joistLengthFt === len
                      ? "border-amber-500 bg-amber-500/10 text-amber-300"
                      : "border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {len}'
                </button>
              ))}
            </div>
          </div>

          {/* Brand Accordion — Lumber SKU selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Brand &amp; Size
            </label>
            <div className="space-y-2">
              {Object.entries(lumberSkusByManufacturer).map(([mfr, skus]) => {
                const isOpen = expandedLumberBrand === mfr;
                const hasSelected = skus.some(s => s.id === joistSkuId);
                return (
                  <div key={mfr} className={`rounded-xl border transition-all ${
                    hasSelected ? "border-amber-500/60" : "border-slate-600"
                  }`}>
                    <button
                      onClick={() => setExpandedLumberBrand(isOpen ? null : mfr)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${
                          hasSelected ? "text-amber-300" : "text-slate-200"
                        }`}>{mfr}</span>
                        {hasSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Selected</span>
                        )}
                        <span className="text-xs text-slate-500">{skus.length} size{skus.length !== 1 ? "s" : ""}</span>
                      </div>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2">
                        {skus.map(sku => (
                          <button
                            key={sku.id}
                            onClick={() => setJoistSkuId(sku.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                              joistSkuId === sku.id
                                ? "border-amber-500 bg-amber-500/10 text-white"
                                : "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white">{sku.nominalSize} — {sku.productLine}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{sku.species} · {sku.treatment} · {sku.grade}</div>
                                {sku.notes && <div className="text-[11px] text-slate-500 mt-0.5 italic">{sku.notes}</div>}
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <div className="text-sm font-bold text-amber-300">${sku.contractorPricePerLF.toFixed(2)}/LF</div>
                                <div className="text-xs text-slate-500">{sku.boardFeetPerLF.toFixed(2)} BF/LF</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Takeoff Table */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-700/40 text-xs font-bold tracking-widest uppercase text-slate-400">
              Framing Takeoff
            </div>
            {/* Header */}
            <div className="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700">
              <span>Item</span><span className="text-center">Qty</span><span className="text-right">Amount</span>
            </div>
            {/* Field Joists */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Field joists ({joistSpacingIn}" OC)</span>
              <span className="text-center">
                <input
                  type="number" min={1}
                  value={joistQtyOverride ?? lumberTakeoff.joistCount}
                  onChange={e => setJoistQtyOverride(Math.max(1, parseInt(e.target.value) || lumberTakeoff.joistCount))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400"
                />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(lumberTakeoff.joistSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{joistSku.nominalSize} × {joistLengthFt}' @ ${joistSku.contractorPricePerLF.toFixed(2)}/LF</span>
              <span className="text-center">{lumberTakeoff.joistBoardFeet} BF</span>
              <span className="text-right">{formatTakeoffCurrency(lumberTakeoff.joistUnitPrice)}/pc</span>
            </div>
            {/* Rim Joists */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Rim joists (2 pcs × {deckLengthFt}')</span>
              <span className="text-center">
                <input
                  type="number" min={1}
                  value={rimQtyOverride ?? lumberTakeoff.rimCount}
                  onChange={e => setRimQtyOverride(Math.max(1, parseInt(e.target.value) || lumberTakeoff.rimCount))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400"
                />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(lumberTakeoff.rimSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{joistSku.nominalSize} × {deckLengthFt}' @ ${joistSku.contractorPricePerLF.toFixed(2)}/LF</span>
              <span className="text-center">{lumberTakeoff.rimBoardFeet} BF</span>
              <span className="text-right">{formatTakeoffCurrency(lumberTakeoff.rimUnitPrice)}/pc</span>
            </div>
            {/* Subtotal */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Subtotal (materials)</span>
              <span className="text-center text-xs text-slate-500">{lumberTakeoff.totalBoardFeet} BF total</span>
              <span className="text-right text-slate-200 font-semibold">{formatTakeoffCurrency(lumberTakeoff.subtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Sales tax ({(taxRate * 100).toFixed(2)}%)</span>
              <span />
              <span className="text-right text-slate-300">{formatTakeoffCurrency(lumberTakeoff.taxAmount)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-3 bg-slate-700/30">
              <span className="text-white font-bold text-base">Total — Framing Lumber</span>
              <span />
              <span className="text-right text-emerald-400 font-bold text-xl">{formatTakeoffCurrency(lumberTakeoff.total)}</span>
            </div>
          </div>

          {isPhase3Edited && (
            <button
              onClick={() => { setJoistQtyOverride(null); setJoistPriceOverride(null); setRimQtyOverride(null); setRimPriceOverride(null); }}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Reset to calculated values
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PHASE 4: CONCRETE & FOOTINGS
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/60 border border-slate-600 rounded-xl overflow-hidden">
        <div className="bg-slate-700/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Phase 4</span>
            <span className="text-white font-semibold">Concrete &amp; Footings</span>
          </div>
          <span className="text-xs text-slate-400">Category 4 of 7</span>
        </div>

        <div className="p-5 space-y-5">

          {/* Post count + tube diameter + depth */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Post Count</label>
              <input
                type="number" min={1} max={100} step={1}
                value={postCount}
                onChange={e => setPostCount(Math.max(1, parseInt(e.target.value) || 4))}
                className="w-full bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              />
              <div className="text-[11px] text-slate-500 mt-1">Est. from deck area: {estimatePostCount(deckAreaSqFt)}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Tube Diameter</label>
              <div className="flex gap-2">
                {[8, 10, 12, 16].map(d => (
                  <button
                    key={d}
                    onClick={() => setTubeDiameterIn(d)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      tubeDiameterIn === d
                        ? "border-amber-500 bg-amber-500/10 text-amber-300"
                        : "border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {d}"
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Tube form diameter (inches)</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Footing Depth (ft)</label>
              <input
                type="number" min={1} max={8} step={0.5}
                value={footingDepthFt}
                onChange={e => setFootingDepthFt(Math.max(1, Number(e.target.value) || 3.5))}
                className="w-full bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              />
              <div className="text-[11px] text-slate-500 mt-1">Below frost line depth</div>
            </div>
          </div>

          {/* Volume info */}
          <div className="bg-slate-900/40 border border-slate-700 rounded-lg px-4 py-3 flex flex-wrap gap-4 text-sm">
            <div><span className="text-slate-500">Volume / footing: </span><span className="text-slate-200 font-semibold">{footingTakeoff.volumePerFootingCuFt} cu ft</span></div>
            <div><span className="text-slate-500">Bags / footing: </span><span className="text-slate-200 font-semibold">{footingTakeoff.bagsPerFooting} bags</span></div>
            <div><span className="text-slate-500">Total bags (calc): </span><span className="text-slate-200 font-semibold">{footingTakeoff.totalBagsCalc} bags</span><span className="text-slate-500 text-xs ml-1">(+10% waste)</span></div>
          </div>

          {/* Concrete brand accordion */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Concrete Mix — Brand &amp; Product</label>
            <div className="space-y-2">
              {Object.entries(concreteSkusByManufacturer).map(([mfr, skus]) => {
                const isOpen = expandedConcreteBrand === mfr;
                const hasSelected = skus.some(s => s.id === concreteSkuId);
                return (
                  <div key={mfr} className={`rounded-xl border transition-all ${
                    hasSelected ? "border-amber-500/60" : "border-slate-600"
                  }`}>
                    <button
                      onClick={() => setExpandedConcreteBrand(isOpen ? null : mfr)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${
                          hasSelected ? "text-amber-300" : "text-slate-200"
                        }`}>{mfr}</span>
                        {hasSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Selected</span>
                        )}
                        <span className="text-xs text-slate-500">{skus.length} product{skus.length !== 1 ? "s" : ""}</span>
                      </div>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2">
                        {skus.map(sku => (
                          <button
                            key={sku.id}
                            onClick={() => setConcreteSkuId(sku.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                              concreteSkuId === sku.id
                                ? "border-amber-500 bg-amber-500/10 text-white"
                                : "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">{sku.name}</span>
                                  {sku.isFastSetting && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">No-Mix</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">{sku.description}</div>
                                {sku.notes && <div className="text-[11px] text-slate-500 mt-0.5 italic">{sku.notes}</div>}
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <div className="text-sm font-bold text-amber-300">${sku.contractorPricePerBag.toFixed(2)}/bag</div>
                                <div className="text-xs text-slate-500">{sku.yieldCuFt} cu ft</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Post base accordion */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Post Base Hardware — Simpson Strong-Tie</label>
            <div className="space-y-2">
              {Object.entries(postBaseSkusByProductLine).map(([line, skus]) => {
                const isOpen = expandedPostBaseLine === line;
                const hasSelected = skus.some(s => s.id === postBaseSkuId);
                return (
                  <div key={line} className={`rounded-xl border transition-all ${
                    hasSelected ? "border-amber-500/60" : "border-slate-600"
                  }`}>
                    <button
                      onClick={() => setExpandedPostBaseLine(isOpen ? null : line)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${
                          hasSelected ? "text-amber-300" : "text-slate-200"
                        }`}>{line}</span>
                        {hasSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Selected</span>
                        )}
                        <span className="text-xs text-slate-500">{skus.length} size{skus.length !== 1 ? "s" : ""}</span>
                      </div>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2">
                        {skus.map(sku => (
                          <button
                            key={sku.id}
                            onClick={() => setPostBaseSkuId(sku.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                              postBaseSkuId === sku.id
                                ? "border-amber-500 bg-amber-500/10 text-white"
                                : "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">{sku.name}</span>
                                  {sku.adjustable && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Adjustable</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">{sku.description}</div>
                                {sku.notes && <div className="text-[11px] text-slate-500 mt-0.5 italic">{sku.notes}</div>}
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <div className="text-sm font-bold text-amber-300">${sku.contractorPriceEach.toFixed(2)}/ea</div>
                                <div className="text-xs text-slate-500">{sku.postSize}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Takeoff table */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-700/40 text-xs font-bold tracking-widest uppercase text-slate-400">
              Footings Takeoff
            </div>
            <div className="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700">
              <span>Item</span><span className="text-center">Qty</span><span className="text-right">Amount</span>
            </div>
            {/* Concrete bags */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Concrete bags ({concreteSku.bagWeightLb} lb)</span>
              <span className="text-center">
                <input
                  type="number" min={1}
                  value={concreteQtyOverride ?? footingTakeoff.totalBagsEdited}
                  onChange={e => setConcreteQtyOverride(Math.max(1, parseInt(e.target.value) || footingTakeoff.totalBagsCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400"
                />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(footingTakeoff.concreteSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{concreteSku.productLine} · {concreteSku.yieldCuFt} cu ft/bag</span>
              <span className="text-center">{footingTakeoff.bagsPerFooting} bags/footing</span>
              <span className="text-right">${footingTakeoff.concretePricePerBag.toFixed(2)}/bag</span>
            </div>
            {/* Post bases */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Post bases ({postBaseSku.postSize})</span>
              <span className="text-center">
                <input
                  type="number" min={1}
                  value={postBaseQtyOverride ?? footingTakeoff.postBaseCount}
                  onChange={e => setPostBaseQtyOverride(Math.max(1, parseInt(e.target.value) || footingTakeoff.postBaseCount))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400"
                />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(footingTakeoff.postBaseSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{postBaseSku.name}</span>
              <span />
              <span className="text-right">${footingTakeoff.postBasePriceEach.toFixed(2)}/ea</span>
            </div>
            {/* Subtotal */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Subtotal (materials)</span>
              <span />
              <span className="text-right text-slate-200 font-semibold">{formatTakeoffCurrency(footingTakeoff.subtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Sales tax ({(taxRate * 100).toFixed(2)}%)</span>
              <span />
              <span className="text-right text-slate-300">{formatTakeoffCurrency(footingTakeoff.taxAmount)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-3 bg-slate-700/30">
              <span className="text-white font-bold text-base">Total — Concrete &amp; Footings</span>
              <span />
              <span className="text-right text-emerald-400 font-bold text-xl">{formatTakeoffCurrency(footingTakeoff.total)}</span>
            </div>
          </div>

          {isPhase4Edited && (
            <button
              onClick={() => { setConcreteQtyOverride(null); setConcretePriceOverride(null); setPostBaseQtyOverride(null); setPostBasePriceOverride(null); }}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Reset to calculated values
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PHASE 5: RAILING
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/60 border border-slate-600 rounded-xl overflow-hidden">
        <div className="bg-slate-700/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Phase 5</span>
            <span className="text-white font-semibold">Railing</span>
          </div>
          <span className="text-xs text-slate-400">Category 5 of 7</span>
        </div>

        <div className="p-5 space-y-5">

          {/* Brand toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Railing Brand</label>
            <div className="flex gap-3">
              {(["Trex", "TimberTech"] as const).map(brand => (
                <button
                  key={brand}
                  onClick={() => setRailingBrand(brand)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    railingBrand === brand
                      ? "border-amber-500 bg-amber-500/10 text-amber-300"
                      : "border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {brand === "Trex" ? "Trex Transcend" : "TimberTech Impression"}
                </button>
              ))}
            </div>
          </div>

          {/* Railing LF + post spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Railing Linear Footage</label>
              <input
                type="number" min={1} step={1}
                value={railingLF}
                onChange={e => setRailingLF(Math.max(1, parseInt(e.target.value) || railingLF))}
                className="w-full bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              />
              <div className="text-[11px] text-slate-500 mt-1">Est. from deck dimensions: {estimateRailingLF(deckWidthFt, deckLengthFt)} LF</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Post Spacing</label>
              <div className="flex gap-2">
                {[6, 8].map(s => (
                  <button
                    key={s}
                    onClick={() => setPostSpacingFt(s)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      postSpacingFt === s
                        ? "border-amber-500 bg-amber-500/10 text-amber-300"
                        : "border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {s}' OC
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Posts: {railingTakeoff.postCountCalc} estimated</div>
            </div>
          </div>

          {/* Component accordions — one per component type within the selected brand */}
          {([
            { type: "post-sleeve" as RailingComponentType, label: "Post Sleeves", skuId: postSkuId, setSkuId: setPostSkuId },
            { type: "top-rail" as RailingComponentType, label: "Top Rail", skuId: topRailSkuId, setSkuId: setTopRailSkuId },
            { type: "bottom-rail" as RailingComponentType, label: "Bottom Rail", skuId: bottomRailSkuId, setSkuId: setBottomRailSkuId },
            { type: "baluster" as RailingComponentType, label: "Balusters", skuId: balustrSkuId, setSkuId: setBalustrSkuId },
            { type: "post-cap" as RailingComponentType, label: "Post Caps", skuId: postCapSkuId, setSkuId: setPostCapSkuId },
          ]).map(({ type, label, skuId, setSkuId }) => {
            const skus = getRailingSkusByComponent(railingBrand, type);
            const isOpen = expandedRailingComponent === type;
            const hasSelected = skus.some(s => s.id === skuId);
            return (
              <div key={type} className={`rounded-xl border transition-all ${
                hasSelected ? "border-amber-500/60" : "border-slate-600"
              }`}>
                <button
                  onClick={() => setExpandedRailingComponent(isOpen ? null : type)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${
                      hasSelected ? "text-amber-300" : "text-slate-200"
                    }`}>{label}</span>
                    {hasSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Selected</span>
                    )}
                    <span className="text-xs text-slate-500">{skus.length} option{skus.length !== 1 ? "s" : ""}</span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 space-y-2">
                    {skus.map(sku => (
                      <button
                        key={sku.id}
                        onClick={() => setSkuId(sku.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                          skuId === sku.id
                            ? "border-amber-500 bg-amber-500/10 text-white"
                            : "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-white">{sku.name}</span>
                              {sku.color && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-600/60 text-slate-300">{sku.color}</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{sku.description}</div>
                            {sku.notes && <div className="text-[11px] text-slate-500 mt-0.5 italic">{sku.notes}</div>}
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <div className="text-sm font-bold text-amber-300">${sku.contractorPricePerUnit.toFixed(2)}/{sku.unit}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Takeoff table */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-700/40 text-xs font-bold tracking-widest uppercase text-slate-400">
              Railing Takeoff
            </div>
            <div className="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700">
              <span>Item</span><span className="text-center">Qty</span><span className="text-right">Amount</span>
            </div>
            {/* Post sleeves */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Post sleeves</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={railPostQtyOverride ?? railingTakeoff.postCountEdited}
                  onChange={e => setRailPostQtyOverride(Math.max(1, parseInt(e.target.value) || railingTakeoff.postCountCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(railingTakeoff.postSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{postRailSku.name}</span>
              <span />
              <span className="text-right">${railingTakeoff.postUnitPrice.toFixed(2)}/ea</span>
            </div>
            {/* Top rail */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Top rail sections</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={railTopQtyOverride ?? railingTakeoff.topRailSectionsEdited}
                  onChange={e => setRailTopQtyOverride(Math.max(1, parseInt(e.target.value) || railingTakeoff.topRailSectionsCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(railingTakeoff.topRailSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{topRailSku.name}</span>
              <span />
              <span className="text-right">${railingTakeoff.topRailUnitPrice.toFixed(2)}/section</span>
            </div>
            {/* Bottom rail */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Bottom rail sections</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={railBottomQtyOverride ?? railingTakeoff.bottomRailSectionsEdited}
                  onChange={e => setRailBottomQtyOverride(Math.max(1, parseInt(e.target.value) || railingTakeoff.bottomRailSectionsCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(railingTakeoff.bottomRailSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{bottomRailSku.name}</span>
              <span />
              <span className="text-right">${railingTakeoff.bottomRailUnitPrice.toFixed(2)}/section</span>
            </div>
            {/* Balusters */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Balusters</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={railBalustrQtyOverride ?? railingTakeoff.balustrCountEdited}
                  onChange={e => setRailBalustrQtyOverride(Math.max(1, parseInt(e.target.value) || railingTakeoff.balustrCountCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(railingTakeoff.balustrSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{balustrSku.name}</span>
              <span className="text-center text-slate-600">~2 per LF</span>
              <span className="text-right">${railingTakeoff.balustrUnitPrice.toFixed(2)}/ea</span>
            </div>
            {/* Post caps */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Post caps</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={railCapQtyOverride ?? railingTakeoff.postCapCountEdited}
                  onChange={e => setRailCapQtyOverride(Math.max(1, parseInt(e.target.value) || railingTakeoff.postCapCountCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(railingTakeoff.postCapSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{postCapRailSku.name}</span>
              <span />
              <span className="text-right">${railingTakeoff.postCapUnitPrice.toFixed(2)}/ea</span>
            </div>
            {/* Subtotal */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Subtotal (materials)</span>
              <span />
              <span className="text-right text-slate-200 font-semibold">{formatTakeoffCurrency(railingTakeoff.subtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Sales tax ({(taxRate * 100).toFixed(2)}%)</span>
              <span />
              <span className="text-right text-slate-300">{formatTakeoffCurrency(railingTakeoff.taxAmount)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-3 bg-slate-700/30">
              <span className="text-white font-bold text-base">Total — Railing</span>
              <span />
              <span className="text-right text-emerald-400 font-bold text-xl">{formatTakeoffCurrency(railingTakeoff.total)}</span>
            </div>
          </div>

          {isPhase5Edited && (
            <button
              onClick={() => { setRailPostQtyOverride(null); setRailTopQtyOverride(null); setRailBottomQtyOverride(null); setRailBalustrQtyOverride(null); setRailCapQtyOverride(null); }}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Reset to calculated values
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PHASE 6: STAIRS
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/60 border border-slate-600 rounded-xl overflow-hidden">
        <div className="bg-slate-700/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Phase 6</span>
            <span className="text-white font-semibold">Stairs</span>
          </div>
          <span className="text-xs text-slate-400">Category 6 of 7</span>
        </div>

        <div className="p-5 space-y-5">

          {/* Stair geometry inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Deck Height (in)</label>
              <input type="number" min={12} max={240} step={1}
                value={deckHeightIn}
                onChange={e => setDeckHeightIn(Math.max(12, parseInt(e.target.value) || 48))}
                className="w-full bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400" />
              <div className="text-[11px] text-slate-500 mt-1">Total rise above grade</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Stair Width</label>
              <div className="flex gap-2">
                {[36, 48].map(w => (
                  <button key={w} onClick={() => setStairWidthIn(w)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      stairWidthIn === w ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                    }`}>{w}"</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Rise per Step (in)</label>
              <div className="flex gap-2">
                {[6.5, 7, 7.5].map(r => (
                  <button key={r} onClick={() => setRiseIn(r)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      riseIn === r ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                    }`}>{r}"</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Run per Step (in)</label>
              <div className="flex gap-2">
                {[10, 11, 12].map(r => (
                  <button key={r} onClick={() => setRunIn(r)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      runIn === r ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                    }`}>{r}"</button>
                ))}
              </div>
            </div>
          </div>

          {/* Geometry summary */}
          <div className="bg-slate-900/40 border border-slate-700 rounded-lg px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div><div className="text-lg font-bold text-amber-300">{stairTakeoff.stepCountCalc}</div><div className="text-[11px] text-slate-500 uppercase tracking-wider">Steps</div></div>
            <div><div className="text-lg font-bold text-amber-300">{stairTakeoff.stringerCountCalc}</div><div className="text-[11px] text-slate-500 uppercase tracking-wider">Stringers</div></div>
            <div><div className="text-lg font-bold text-amber-300">{stairTakeoff.stringerLengthFt} ft</div><div className="text-[11px] text-slate-500 uppercase tracking-wider">Stringer Length</div></div>
            <div><div className="text-lg font-bold text-amber-300">{stairWidthIn}"</div><div className="text-[11px] text-slate-500 uppercase tracking-wider">Stair Width</div></div>
          </div>

          {/* Component accordions */}
          {([
            { type: "tread" as StairComponentType, label: "Stair Treads", skuId: treadSkuId, setSkuId: setTreadSkuId },
            { type: "stringer" as StairComponentType, label: "Stringers", skuId: stringerSkuId, setSkuId: setStringerSkuId },
            { type: "stringer-bracket" as StairComponentType, label: "Stringer Brackets & Hardware", skuId: stringerBracketSkuId, setSkuId: setStringerBracketSkuId },
            { type: "tread-hardware" as StairComponentType, label: "Tread Fasteners", skuId: treadHardwareSkuId, setSkuId: setTreadHardwareSkuId },
          ]).map(({ type, label, skuId, setSkuId }) => {
            const skus = getStairSkusByComponent(type);
            const isOpen = expandedStairComponent === type;
            const hasSelected = skus.some(s => s.id === skuId);
            return (
              <div key={type} className={`rounded-xl border transition-all ${
                hasSelected ? "border-amber-500/60" : "border-slate-600"
              }`}>
                <button
                  onClick={() => setExpandedStairComponent(isOpen ? null : type)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${hasSelected ? "text-amber-300" : "text-slate-200"}`}>{label}</span>
                    {hasSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Selected</span>
                    )}
                    <span className="text-xs text-slate-500">{skus.length} option{skus.length !== 1 ? "s" : ""}</span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 space-y-2">
                    {skus.map(sku => (
                      <button key={sku.id} onClick={() => setSkuId(sku.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                          skuId === sku.id
                            ? "border-amber-500 bg-amber-500/10 text-white"
                            : "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-500"
                        }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-600/60 text-slate-400">{sku.manufacturer}</span>
                              <span className="text-sm font-medium text-white">{sku.name.replace(sku.manufacturer + " ", "")}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{sku.description}</div>
                            {sku.notes && <div className="text-[11px] text-slate-500 mt-0.5 italic">{sku.notes}</div>}
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <div className="text-sm font-bold text-amber-300">${sku.contractorPricePerUnit.toFixed(2)}/{sku.unit}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Takeoff table */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-700/40 text-xs font-bold tracking-widest uppercase text-slate-400">Stair Takeoff</div>
            <div className="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700">
              <span>Item</span><span className="text-center">Qty</span><span className="text-right">Amount</span>
            </div>
            {/* Steps / Treads */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Stair treads</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={stairTreadQtyOverride ?? stairTakeoff.treadQtyEdited}
                  onChange={e => setStairTreadQtyOverride(Math.max(1, parseInt(e.target.value) || stairTakeoff.treadQtyCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(stairTakeoff.treadSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{treadSku.name.split(" — ")[0]}</span>
              <span /><span className="text-right">${stairTakeoff.treadUnitPrice.toFixed(2)}/ea</span>
            </div>
            {/* Stringers */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Stringers</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={stairStringerOverride ?? stairTakeoff.stringerCountEdited}
                  onChange={e => setStairStringerOverride(Math.max(1, parseInt(e.target.value) || stairTakeoff.stringerCountCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(stairTakeoff.stringerSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{stringerSku.name.split(" — ")[0]}</span>
              <span /><span className="text-right">${stairTakeoff.stringerUnitPrice.toFixed(2)}/ea · ~{stairTakeoff.stringerLengthFt} ft ea</span>
            </div>
            {/* Stringer brackets */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Stringer brackets</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={stairBracketQtyOverride ?? stairTakeoff.stringerBracketQtyEdited}
                  onChange={e => setStairBracketQtyOverride(Math.max(1, parseInt(e.target.value) || stairTakeoff.stringerBracketQtyCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(stairTakeoff.stringerBracketSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{stringerBracketSku.name.split(" — ")[0]}</span>
              <span /><span className="text-right">${stairTakeoff.stringerBracketUnitPrice.toFixed(2)}/ea</span>
            </div>
            {/* Tread hardware */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Tread fasteners</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={stairHardwareQtyOverride ?? stairTakeoff.treadHardwareQtyEdited}
                  onChange={e => setStairHardwareQtyOverride(Math.max(1, parseInt(e.target.value) || stairTakeoff.treadHardwareQtyCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(stairTakeoff.treadHardwareSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{treadHardwareSku.name.split(" — ")[0]}</span>
              <span /><span className="text-right">${stairTakeoff.treadHardwareUnitPrice.toFixed(2)}/{treadHardwareSku.unit}</span>
            </div>
            {/* Subtotals */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Subtotal (materials)</span><span />
              <span className="text-right text-slate-200 font-semibold">{formatTakeoffCurrency(stairTakeoff.subtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Sales tax ({(taxRate * 100).toFixed(2)}%)</span><span />
              <span className="text-right text-slate-300">{formatTakeoffCurrency(stairTakeoff.taxAmount)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-3 bg-slate-700/30">
              <span className="text-white font-bold text-base">Total — Stairs</span><span />
              <span className="text-right text-emerald-400 font-bold text-xl">{formatTakeoffCurrency(stairTakeoff.total)}</span>
            </div>
          </div>

          {isPhase6Edited && (
            <button
              onClick={() => { setStairStepOverride(null); setStairStringerOverride(null); setStairTreadQtyOverride(null); setStairBracketQtyOverride(null); setStairHardwareQtyOverride(null); }}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >Reset to calculated values</button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PHASE 7: HARDWARE & MISC
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/60 border border-slate-600 rounded-xl overflow-hidden">
        <div className="bg-slate-700/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Phase 7</span>
            <span className="text-white font-semibold">Hardware &amp; Misc</span>
          </div>
          <span className="text-xs text-amber-400 font-semibold">Final Category</span>
        </div>

        <div className="p-5 space-y-5">

          {/* Ledger LF input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Ledger Board Length (ft)</label>
              <input type="number" min={1} step={1}
                value={ledgerLF}
                onChange={e => setLedgerLF(Math.max(1, parseInt(e.target.value) || ledgerLF))}
                className="w-full bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400" />
              <div className="text-[11px] text-slate-500 mt-1">Est. from deck dimensions: {Math.max(deckWidthFt, deckLengthFt)} ft</div>
            </div>
            <div className="bg-slate-900/40 border border-slate-700 rounded-lg px-4 py-3 flex flex-col justify-center gap-1">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">Auto-calculated from Phase 3</div>
              <div className="text-sm text-slate-300">Joist count: <span className="text-amber-300 font-bold">{lumberTakeoff.joistCount}</span></div>
              <div className="text-sm text-slate-300">Post count: <span className="text-amber-300 font-bold">{postCount}</span></div>
            </div>
          </div>

          {/* Component accordions */}
          {([
            { type: "joist-hanger" as HardwareComponentType, label: "Joist Hangers", skuId: joistHangerSkuId, setSkuId: setJoistHangerSkuId },
            { type: "post-cap" as HardwareComponentType, label: "Post Caps & Bases", skuId: hwPostCapSkuId, setSkuId: setHwPostCapSkuId },
            { type: "ledger-flashing" as HardwareComponentType, label: "Ledger Flashing", skuId: ledgerFlashingSkuId, setSkuId: setLedgerFlashingSkuId },
            { type: "structural-screw" as HardwareComponentType, label: "Structural Screws & Anchors", skuId: structuralScrewSkuId, setSkuId: setStructuralScrewSkuId },
            { type: "joist-tape" as HardwareComponentType, label: "Joist & Beam Tape", skuId: joistTapeSkuId, setSkuId: setJoistTapeSkuId },
          ]).map(({ type, label, skuId, setSkuId }) => {
            const skus = getHardwareSkusByComponent(type);
            const isOpen = expandedHwComponent === type;
            const hasSelected = skus.some(s => s.id === skuId);
            return (
              <div key={type} className={`rounded-xl border transition-all ${
                hasSelected ? "border-amber-500/60" : "border-slate-600"
              }`}>
                <button
                  onClick={() => setExpandedHwComponent(isOpen ? null : type)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${hasSelected ? "text-amber-300" : "text-slate-200"}`}>{label}</span>
                    {hasSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Selected</span>
                    )}
                    <span className="text-xs text-slate-500">{skus.length} option{skus.length !== 1 ? "s" : ""}</span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 space-y-2">
                    {skus.map(sku => (
                      <button key={sku.id} onClick={() => setSkuId(sku.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                          skuId === sku.id
                            ? "border-amber-500 bg-amber-500/10 text-white"
                            : "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-500"
                        }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-600/60 text-slate-400">{sku.manufacturer}</span>
                              <span className="text-sm font-medium text-white">{sku.name.replace(sku.manufacturer + " ", "")}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{sku.description}</div>
                            {sku.notes && <div className="text-[11px] text-slate-500 mt-0.5 italic">{sku.notes}</div>}
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <div className="text-sm font-bold text-amber-300">${sku.contractorPricePerUnit.toFixed(2)}/{sku.unit}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Takeoff table */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-700/40 text-xs font-bold tracking-widest uppercase text-slate-400">Hardware Takeoff</div>
            <div className="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700">
              <span>Item</span><span className="text-center">Qty</span><span className="text-right">Amount</span>
            </div>
            {/* Joist hangers */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Joist hangers</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={hwJoistHangerQtyOverride ?? hardwareTakeoff.joistHangerQtyEdited}
                  onChange={e => setHwJoistHangerQtyOverride(Math.max(1, parseInt(e.target.value) || hardwareTakeoff.joistHangerQtyCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(hardwareTakeoff.joistHangerSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{joistHangerSku.name}</span>
              <span /><span className="text-right">${hardwareTakeoff.joistHangerUnitPrice.toFixed(2)}/ea</span>
            </div>
            {/* Post caps */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Post caps / bases</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={hwPostCapQtyOverride ?? hardwareTakeoff.postCapQtyEdited}
                  onChange={e => setHwPostCapQtyOverride(Math.max(1, parseInt(e.target.value) || hardwareTakeoff.postCapQtyCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(hardwareTakeoff.postCapSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{hwPostCapSku.name}</span>
              <span /><span className="text-right">${hardwareTakeoff.postCapUnitPrice.toFixed(2)}/ea</span>
            </div>
            {/* Ledger flashing */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Ledger flashing</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={hwLedgerFlashingQtyOverride ?? hardwareTakeoff.ledgerFlashingQtyEdited}
                  onChange={e => setHwLedgerFlashingQtyOverride(Math.max(1, parseInt(e.target.value) || hardwareTakeoff.ledgerFlashingQtyCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(hardwareTakeoff.ledgerFlashingSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{ledgerFlashingSku.name}</span>
              <span /><span className="text-right">${hardwareTakeoff.ledgerFlashingUnitPrice.toFixed(2)}/{ledgerFlashingSku.unit}</span>
            </div>
            {/* Structural screws */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Structural screws</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={hwStructuralScrewQtyOverride ?? hardwareTakeoff.structuralScrewQtyEdited}
                  onChange={e => setHwStructuralScrewQtyOverride(Math.max(1, parseInt(e.target.value) || hardwareTakeoff.structuralScrewQtyCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(hardwareTakeoff.structuralScrewSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{structuralScrewSku.name}</span>
              <span /><span className="text-right">${hardwareTakeoff.structuralScrewUnitPrice.toFixed(2)}/{structuralScrewSku.unit}</span>
            </div>
            {/* Joist tape */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-slate-700/50">
              <span className="text-slate-400">Joist &amp; beam tape</span>
              <span className="text-center">
                <input type="number" min={1}
                  value={hwJoistTapeQtyOverride ?? hardwareTakeoff.joistTapeQtyEdited}
                  onChange={e => setHwJoistTapeQtyOverride(Math.max(1, parseInt(e.target.value) || hardwareTakeoff.joistTapeQtyCalc))}
                  className="w-20 text-center bg-slate-700 border border-slate-500 text-amber-300 font-bold text-sm rounded px-2 py-0.5 focus:outline-none focus:border-amber-400" />
              </span>
              <span className="text-right text-slate-300">{formatTakeoffCurrency(hardwareTakeoff.joistTapeSubtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-1.5 text-xs text-slate-500 border-b border-slate-700/30">
              <span className="pl-2 text-slate-600">{joistTapeSku.name}</span>
              <span /><span className="text-right">${hardwareTakeoff.joistTapeUnitPrice.toFixed(2)}/{joistTapeSku.unit}</span>
            </div>
            {/* Subtotals */}
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Subtotal (materials)</span><span />
              <span className="text-right text-slate-200 font-semibold">{formatTakeoffCurrency(hardwareTakeoff.subtotal)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
              <span className="text-slate-400">Sales tax ({(taxRate * 100).toFixed(2)}%)</span><span />
              <span className="text-right text-slate-300">{formatTakeoffCurrency(hardwareTakeoff.taxAmount)}</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-3 bg-slate-700/30">
              <span className="text-white font-bold text-base">Total — Hardware</span><span />
              <span className="text-right text-emerald-400 font-bold text-xl">{formatTakeoffCurrency(hardwareTakeoff.total)}</span>
            </div>
          </div>

          {isPhase7Edited && (
            <button
              onClick={() => { setHwJoistHangerQtyOverride(null); setHwPostCapQtyOverride(null); setHwLedgerFlashingQtyOverride(null); setHwStructuralScrewQtyOverride(null); setHwJoistTapeQtyOverride(null); }}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >Reset to calculated values</button>
          )}
        </div>
      </div>

      {/* ── FINAL GRAND TOTAL ── */}
      <div className="bg-gradient-to-r from-emerald-900/40 to-slate-800/80 border border-emerald-500/50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-1">Complete Material Takeoff</div>
            <div className="text-base font-semibold text-white">All 7 Phases · Tax Included</div>
            <div className="text-xs text-slate-400 mt-1">Boards · Fasteners · Framing · Footings · Railing · Stairs · Hardware</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-emerald-400">{formatTakeoffCurrency(grandTotal)}</div>
            <div className="text-xs text-slate-400 mt-1">Materials only · excludes labor</div>
          </div>
        </div>
        {/* Phase breakdown */}
        <div className="mt-4 pt-4 border-t border-emerald-800/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="text-slate-500">Ph 1 Boards: <span className="text-slate-300">{formatTakeoffCurrency(takeoff.total)}</span></div>
          <div className="text-slate-500">Ph 2 Fasteners: <span className="text-slate-300">{formatTakeoffCurrency(fastenerTakeoff.total)}</span></div>
          <div className="text-slate-500">Ph 3 Framing: <span className="text-slate-300">{formatTakeoffCurrency(lumberTakeoff.total)}</span></div>
          <div className="text-slate-500">Ph 4 Footings: <span className="text-slate-300">{formatTakeoffCurrency(footingTakeoff.total)}</span></div>
          <div className="text-slate-500">Ph 5 Railing: <span className="text-slate-300">{formatTakeoffCurrency(railingTakeoff.total)}</span></div>
          <div className="text-slate-500">Ph 6 Stairs: <span className="text-slate-300">{formatTakeoffCurrency(stairTakeoff.total)}</span></div>
          <div className="text-slate-500">Ph 7 Hardware: <span className="text-slate-300">{formatTakeoffCurrency(hardwareTakeoff.total)}</span></div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:border-slate-500 hover:text-white transition-all"
        >
          ← Back to Estimate
        </button>
        <button
          onClick={onFinish}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all"
        >
          Done ✓
        </button>
      </div>
    </div>
  );
}
