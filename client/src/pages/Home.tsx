/**
 * DECK COST CALCULATOR — HOME PAGE
 * Design: Precision Engineering
 * - Dark navy (#0B1120) base, electric amber (#F59E0B) accent
 * - Wizard flow:
 *   Homeowner: Audience → Region → Size → Material → Complexity → Railing → Results
 *   DIYer:     Audience → Region → Size → Material → Complexity → Railing → Skill + Tools → Permit → Results
 *   Contractor: Audience → Region → Size → Material → Complexity → Railing → Markup + Crew → Sub-footings → Framing → Permit → Results
 * - Space Grotesk headings, JetBrains Mono for cost figures
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  REGIONS,
  DECK_SIZES,
  MATERIAL_TIERS,
  COMPLEXITIES,
  RAILING_SYSTEMS,
  TOOL_RENTAL_OPTIONS,
  DIY_SKILL_LEVELS,
  CONTRACTOR_MARKUP_TIERS,
  CREW_SIZES,
  FRAMING_OPTIONS,
  MARKET_TIERS,
  DECKING_BRANDS,
  ENGINEER_FEE_PRESETS,
  calculate,
  formatCurrency,
  formatRange,
  type AudienceType,
  type CalculatorInputs,
  type CalculatorResult,
} from "@/lib/deckData";
import ResultsPanel from "@/components/ResultsPanel";
import MaterialTakeoff from "@/pages/MaterialTakeoff";
import StepCard from "@/components/StepCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  saveEstimate,
  loadAllEstimates,
  deleteEstimate,
  renameEstimate,
  updateEstimateNotes,
  encodeEstimateToUrl,
  decodeEstimateFromUrl,
  clearUrlParam,
  formatSavedDate,
  type EstimateSnapshot,
} from "@/lib/estimateStorage";

// ─── STEP DEFINITIONS ──────────────────────────────────────────────────────────
// Shared steps 0–5 are the same for all audiences.
// Steps 6–7 branch by audience.

// Base shared steps (0–4): Audience, Region, Size, Material, Complexity
const SHARED_BASE_LABELS = [
  "Who are you?",
  "Your Region",
  "Deck Size",
  "Material Tier",
  "Complexity",
];

function getStepLabels(audience: AudienceType): string[] {
  // Step 5 is contractor-only (Framing System).
  // DIY and homeowner skip it in navigation but we still need step 6 to be Railing for all audiences.
  // We pad with an empty string at index 5 so the step numbers stay aligned;
  // the progress bar filters it out for display.
  if (audience === "diy")
    // Step 5 empty (contractor-only framing slot), step 6 DIY Framing, step 7 Railing, step 8 Skill, step 9 Permit
    return [...SHARED_BASE_LABELS, "", "Framing System", "Railing & Extras", "Skill & Tools", "Permit & Fees"];
  if (audience === "contractor")
    return [...SHARED_BASE_LABELS, "Framing System", "Railing & Extras", "Markup & Crew", "Permit & Fees", "Extras"];
  // homeowner: step 5 empty, step 6 empty (DIY-only framing slot), step 7 Railing, step 8 Permit
  return [...SHARED_BASE_LABELS, "", "", "Railing & Extras", "Permit & Fees"];
}

function getTotalSteps(audience: AudienceType): number {
  return getStepLabels(audience).length;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showTakeoff, setShowTakeoff] = useState(false);
  const [changeOrderDelta, setChangeOrderDelta] = useState<{ low: number; high: number }>({ low: 0, high: 0 });
  // Tracks which step has had its selection "confirmed" (i.e. clicked once already).
  // First click on a card selects it; second click on the already-selected card advances.
  const [confirmedStep, setConfirmedStep] = useState<number | null>(null);

  // Save/load estimate state
  const [savedEstimates, setSavedEstimates] = useState<EstimateSnapshot[]>(() => loadAllEstimates());
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");

  // Shared inputs
  const [audience, setAudience] = useState<AudienceType>("homeowner");
  const [regionId, setRegionId] = useState("mid-atlantic");
  const [sizeId, setSizeId] = useState("320");
  const [tierId, setTierId] = useState("composite");
  const [complexityId, setComplexityId] = useState("standard");
  const [railingId, setRailingId] = useState<string | null>("pt-wood");
  const [confirmedRailing, setConfirmedRailing] = useState(false);
  const [railingLF, setRailingLF] = useState(() => {
    const sqFt = DECK_SIZES.find(s => s.id === "320")?.sqFt ?? 320;
    return Math.round(Math.sqrt(sqFt) * 3);
  });
  const [deckHeightIn, setDeckHeightIn] = useState(24); // inches off ground
  const [includeRailing, setIncludeRailing] = useState(true);
  const [includeStairs, setIncludeStairs] = useState(true);
  const [stairSteps, setStairSteps] = useState(4);
  const [stairWidthFt, setStairWidthFt] = useState(4);
  const [includeStairRailing, setIncludeStairRailing] = useState(false);

  // DIY-specific inputs
  const [skillLevelId, setSkillLevelId] = useState("intermediate");
  const [selectedTools, setSelectedTools] = useState<string[]>([
    "circular-saw", "post-hole-digger", "impact-driver",
  ]);
  const [includePermit, setIncludePermit] = useState(true);
  const [permitCost, setPermitCost] = useState(350);
  // Engineer fee (all paths)
  const [includeEngineer, setIncludeEngineer] = useState(false);
  const [engineerCost, setEngineerCost] = useState(650); // default to Plan Review & Stamp
  const [engineerCostMode, setEngineerCostMode] = useState<"preset" | "custom">("preset"); // contractor-only
  const [engineerCustomInput, setEngineerCustomInput] = useState(""); // raw text for custom input

  // Homeowner-specific: optional contractor markup overlay
  const [homeownerShowMarkup, setHomeownerShowMarkup] = useState(false);
  const [homeownerMarkupTierId, setHomeownerMarkupTierId] = useState("standard");
  // Contractor-specific inputs
  const [markupTierId, setMarkupTierId] = useState("standard");
  const [includeCrew, setIncludeCrew] = useState(true);
  const [crewSizeId, setCrewSizeId] = useState("two");
  const [includeMarkup, setIncludeMarkup] = useState(false); // default off — contractor adds markup explicitly
  const [subFootings, setSubFootings] = useState(false);
  // Custom size (contractor only)
  const [customWidth, setCustomWidth] = useState<number>(20);
  const [customLength, setCustomLength] = useState<number>(20);
  const customSqFt = customWidth * customLength;
  // Framing system (contractor only)
  const [framingId, setFramingId] = useState("pt");
  const [joistSpacingIn, setJoistSpacingIn] = useState<12 | 16 | 24>(16);
  // Labor market tier (contractor only)
  const [marketTierId, setMarketTierId] = useState("suburban");
  // Multi-level deck (contractor + DIY)
  const [isMultiLevel, setIsMultiLevel] = useState(false);
  const [level2SizeId, setLevel2SizeId] = useState("192");
  const [level2CustomWidth, setLevel2CustomWidth] = useState<number>(16);
  const [level2CustomLength, setLevel2CustomLength] = useState<number>(12);
  const level2CustomSqFt = level2CustomWidth * level2CustomLength;

  // Decking brand / hidden fasteners / edge board (contractor only)
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [includeHiddenFasteners, setIncludeHiddenFasteners] = useState(false);
  const [fastenerSystemId, setFastenerSystemId] = useState<"none" | "clip" | "cortex">("none");
  const [edgeBoardType, setEdgeBoardType] = useState<"solid" | "grooved">("solid");

  // 3D rendering (contractor only)
  const [rendering3dTier, setRendering3dTier] = useState<"none" | "basic" | "professional" | "premium">("none");

  // Railing detail (contractor only)
  const [postMountId, setPostMountId] = useState<"surface" | "fascia">("surface");
  const [postSpacingFt, setPostSpacingFt] = useState<4 | 6 | 8>(6);
  const [railingHeightIn, setRailingHeightIn] = useState<36 | 42>(36);

  // Footing spec (contractor only)
  const [footingDiameterIn, setFootingDiameterIn] = useState<8 | 10 | 12 | 16>(10);
  const [useHelicalPiers, setUseHelicalPiers] = useState(false);

  // Demo / removal (contractor only)
  const [includeDemoRemoval, setIncludeDemoRemoval] = useState(false);
  const [demoMaterialType, setDemoMaterialType] = useState<"wood" | "composite" | "other">("wood");
  const [demoIncludeDisposal, setDemoIncludeDisposal] = useState(true);
  const [demoPermit, setDemoPermit] = useState(false);

  const totalSteps = getTotalSteps(audience);
  const stepLabels = getStepLabels(audience);

  // Scroll to top on every step change — works for all audience paths on mobile
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, showResults, showTakeoff]);

  // Auto-update railingLF whenever deck size changes.
  // For custom sizes, use actual dimensions (width + 2*length = 3 exposed sides).
  // For preset sizes, fall back to the sqrt heuristic.
  useEffect(() => {
    if (sizeId === "custom") {
      setRailingLF(Math.round(customWidth + 2 * customLength));
    } else {
      const sizeSqFt = DECK_SIZES.find(s => s.id === sizeId)?.sqFt ?? 320;
      setRailingLF(Math.round(Math.sqrt(sizeSqFt) * 3));
    }
  }, [sizeId, customWidth, customLength]);


  const inputs: CalculatorInputs = useMemo(
    () => ({
      audience,
      regionId,
      sizeId,
      tierId,
      complexityId,
      railingId: includeRailing ? railingId : null,
      railingLF,
      includeStairs,
      stairSteps,
      stairWidthFt,
      includeStairRailing,
      skillLevelId,
      selectedTools,
      includePermit,
      permitCost,
      markupTierId,
      includeMarkup,
      homeownerMarkupTierId: homeownerShowMarkup ? homeownerMarkupTierId : undefined,
      crewSizeId,
      includeCrew,
      subFootings,
      customSqFt: sizeId === "custom" ? customSqFt : undefined,
      includeDemoRemoval,
      demoMaterialType,
      demoIncludeDisposal,
      demoPermit,
      framingId,
      joistSpacingIn,
      marketTierId,
      isMultiLevel,
      level2SizeId: isMultiLevel ? level2SizeId : undefined,
      level2CustomSqFt: isMultiLevel && level2SizeId === "custom" ? level2CustomSqFt : undefined,
      brandId,
      includeHiddenFasteners: fastenerSystemId !== "none",
      fastenerSystemId,
      edgeBoardType,
      rendering3dTier,
      postMountId,
      postSpacingFt,
      railingHeightIn,
      footingDiameterIn,
      useHelicalPiers,
      deckHeightIn,
      includeEngineer,
      engineerCost,
      engineerCostMode,
    }),
    [
      audience, regionId, sizeId, tierId, complexityId, railingId, includeRailing, railingLF,
      includeStairs, stairSteps, stairWidthFt, includeStairRailing, skillLevelId, selectedTools, includePermit,
      permitCost, markupTierId, includeMarkup, homeownerMarkupTierId, homeownerShowMarkup, crewSizeId, includeCrew, subFootings, customSqFt,
      includeDemoRemoval, demoMaterialType, demoIncludeDisposal, demoPermit, framingId, joistSpacingIn, marketTierId,
      isMultiLevel, level2SizeId, level2CustomWidth, level2CustomLength,
      brandId, fastenerSystemId, edgeBoardType, rendering3dTier,
      postMountId, postSpacingFt, railingHeightIn,
      footingDiameterIn, useHelicalPiers, deckHeightIn,
      includeEngineer, engineerCost, engineerCostMode,
    ]
  );

  const result: CalculatorResult = useMemo(() => calculate(inputs), [inputs]);

  const goNext = useCallback(() => {
    setConfirmedStep(null); // reset confirmation for the next step
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else setShowResults(true);
  }, [step, totalSteps]);

  // Call this from every single-select card handler.
  // First call: marks the step as confirmed (highlights the card).
  // Second call on the same already-selected option: advances.
  const selectOrAdvance = useCallback(
    (isAlreadySelected: boolean, selectFn: () => void) => {
      if (isAlreadySelected && confirmedStep === step) {
        goNext();
      } else {
        selectFn();
        setConfirmedStep(step);
      }
    },
    [confirmedStep, step, goNext]
  );

  // After Complexity (step 4):
  // - Contractor: step 4 → step 5 (Contractor Framing) — normal goNext
  // - DIY: step 4 → step 6 (DIY Framing) — skip contractor-only step 5
  // - Homeowner: step 4 → step 7 (Railing) — skip both framing steps (5 & 6)
  const goNextFromComplexity = useCallback(() => {
    setConfirmedStep(null);
    if (audience === "contractor") {
      goNext();
    } else if (audience === "diy") {
      // Skip contractor-only step 5, land on DIY Framing at step 6
      if (step + 2 < totalSteps) setStep((s) => s + 2);
      else setShowResults(true);
    } else {
      // Homeowner: skip both framing steps (5 & 6), land on Railing at step 7
      if (step + 3 < totalSteps) setStep((s) => s + 3);
      else setShowResults(true);
    }
  }, [audience, step, totalSteps, goNext]);

  // Variant of selectOrAdvance for the Complexity step — double-tap uses goNextFromComplexity
  const selectOrAdvanceFromComplexity = useCallback(
    (isAlreadySelected: boolean, selectFn: () => void) => {
      if (isAlreadySelected && confirmedStep === step) {
        goNextFromComplexity();
      } else {
        selectFn();
        setConfirmedStep(step);
      }
    },
    [confirmedStep, step, goNextFromComplexity]
  );

  const goBack = useCallback(() => {
    setConfirmedStep(null);
    if (showTakeoff) {
      setShowTakeoff(false);
    } else if (showResults) {
      setShowResults(false);
    } else if (step === 7 && audience === "homeowner") {
      // Homeowner at Railing (step 7): skip back over both framing slots (6 & 5) → Complexity (step 4)
      setStep(4);
    } else if (step === 7 && audience === "diy") {
      // DIY at Railing (step 7): go back to DIY Framing (step 6) — normal
      setStep(6);
    } else if (step === 6 && audience === "diy") {
      // DIY at Framing (step 6): skip back over contractor-only step 5 → Complexity (step 4)
      setStep(4);
    } else if (step === 6 && audience === "contractor") {
      // Contractor at Railing (step 6): go back to Contractor Framing (step 5) — normal
      setStep(5);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  }, [step, audience, showResults, showTakeoff]);

  const restart = useCallback(() => {
    setStep(0);
    setShowResults(false);
    setShowTakeoff(false);
    setConfirmedStep(null);
    setConfirmedRailing(false);
    setIncludeMarkup(false); // default off
    setIncludeCrew(true);
  }, []);

  const toggleTool = (id: string) => {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // ─── SAVE / LOAD ESTIMATE ───────────────────────────────────────────────────
  // On mount: check if URL contains an encoded estimate and restore it
  useState(() => {
    const hasParam = new URLSearchParams(window.location.search).has("e");
    const snap = decodeEstimateFromUrl();
    if (!snap) {
      if (hasParam) {
        // Param was present but failed to decode — malformed share link
        clearUrlParam();
        setTimeout(() => toast.error("This share link appears to be invalid or expired. Starting a fresh estimate."), 100);
      }
      return;
    }
    clearUrlParam();
    setAudience(snap.audience);
    setRegionId(snap.regionId);
    setSizeId(snap.sizeId);
    setTierId(snap.tierId);
    setComplexityId(snap.complexityId);
    setRailingId(snap.railingId);
    setRailingLF(snap.railingLF);
    setDeckHeightIn(snap.deckHeightIn);
    setIncludeRailing(snap.includeRailing);
    setIncludeStairs(snap.includeStairs);
    setStairSteps(snap.stairSteps);
    setStairWidthFt(snap.stairWidthFt);
    setIncludeStairRailing(snap.includeStairRailing);
    setSkillLevelId(snap.skillLevelId);
    setSelectedTools(snap.selectedTools);
    setIncludePermit(snap.includePermit);
    setPermitCost(snap.permitCost);
    setMarkupTierId(snap.markupTierId);
    setIncludeMarkup(snap.includeMarkup);
    setCrewSizeId(snap.crewSizeId);
    setIncludeCrew(snap.includeCrew);
    setSubFootings(snap.subFootings);
    setFramingId(snap.framingId ?? "pt");
    setJoistSpacingIn((snap.joistSpacingIn ?? 16) as 12 | 16 | 24);
    setMarketTierId(snap.marketTierId ?? "suburban");
    setCustomWidth(snap.customWidth);
    setCustomLength(snap.customLength);
    setIsMultiLevel(snap.isMultiLevel ?? false);
    setLevel2SizeId(snap.level2SizeId ?? "192");
    setLevel2CustomWidth(snap.level2CustomWidth ?? 16);
    setLevel2CustomLength(snap.level2CustomLength ?? 12);
    setBrandId(snap.brandId ?? undefined);
    setIncludeHiddenFasteners(snap.includeHiddenFasteners ?? false);
    setFastenerSystemId(snap.fastenerSystemId ?? "none");
    setEdgeBoardType(snap.edgeBoardType ?? "solid");
    setRendering3dTier((snap.rendering3dTier as "none" | "basic" | "professional" | "premium") ?? "none");
    setPostMountId((snap.postMountId as "surface" | "fascia") ?? "surface");
    setPostSpacingFt((snap.postSpacingFt as 4 | 6 | 8) ?? 6);
    setRailingHeightIn((snap.railingHeightIn as 36 | 42) ?? 36);
    setFootingDiameterIn((snap.footingDiameterIn as 8 | 10 | 12 | 16) ?? 10);
    setUseHelicalPiers(snap.useHelicalPiers ?? false);
    setIncludeEngineer(snap.includeEngineer ?? false);
    setEngineerCost(snap.engineerCost ?? 650);
    setEngineerCostMode((snap.engineerCostMode as "preset" | "custom") ?? "preset");
    // Jump straight to results
    setShowResults(true);
  });

  const handleRestoreEstimate = useCallback((snap: EstimateSnapshot) => {
    setAudience(snap.audience);
    setRegionId(snap.regionId);
    setSizeId(snap.sizeId);
    setTierId(snap.tierId);
    setComplexityId(snap.complexityId);
    setRailingId(snap.railingId);
    setRailingLF(snap.railingLF);
    setDeckHeightIn(snap.deckHeightIn);
    setIncludeRailing(snap.includeRailing);
    setIncludeStairs(snap.includeStairs);
    setStairSteps(snap.stairSteps);
    setStairWidthFt(snap.stairWidthFt);
    setIncludeStairRailing(snap.includeStairRailing);
    setSkillLevelId(snap.skillLevelId);
    setSelectedTools(snap.selectedTools);
    setIncludePermit(snap.includePermit);
    setPermitCost(snap.permitCost);
    setMarkupTierId(snap.markupTierId);
    setIncludeMarkup(snap.includeMarkup);
    setCrewSizeId(snap.crewSizeId);
    setIncludeCrew(snap.includeCrew);
    setSubFootings(snap.subFootings);
    setFramingId(snap.framingId ?? "pt");
    setJoistSpacingIn((snap.joistSpacingIn ?? 16) as 12 | 16 | 24);
    setMarketTierId(snap.marketTierId ?? "suburban");
    setCustomWidth(snap.customWidth);
    setCustomLength(snap.customLength);
    setIsMultiLevel(snap.isMultiLevel ?? false);
    setLevel2SizeId(snap.level2SizeId ?? "192");
    setLevel2CustomWidth(snap.level2CustomWidth ?? 16);
    setLevel2CustomLength(snap.level2CustomLength ?? 12);
    setBrandId(snap.brandId ?? undefined);
    setIncludeHiddenFasteners(snap.includeHiddenFasteners ?? false);
    setFastenerSystemId(snap.fastenerSystemId ?? "none");
    setEdgeBoardType(snap.edgeBoardType ?? "solid");
    setRendering3dTier((snap.rendering3dTier as "none" | "basic" | "professional" | "premium") ?? "none");
    setPostMountId((snap.postMountId as "surface" | "fascia") ?? "surface");
    setPostSpacingFt((snap.postSpacingFt as 4 | 6 | 8) ?? 6);
    setRailingHeightIn((snap.railingHeightIn as 36 | 42) ?? 36);
    setFootingDiameterIn((snap.footingDiameterIn as 8 | 10 | 12 | 16) ?? 10);
    setUseHelicalPiers(snap.useHelicalPiers ?? false);
    setIncludeEngineer(snap.includeEngineer ?? false);
    setEngineerCost(snap.engineerCost ?? 650);
    setEngineerCostMode((snap.engineerCostMode as "preset" | "custom") ?? "preset");
    setStep(0);
    setShowResults(true);
    setShowSavedPanel(false);
    setConfirmedStep(null);
  }, []);

  const handleSaveEstimate = useCallback(() => {
    const label = saveLabel.trim() || `Estimate ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const snap = saveEstimate({
      name: label,
      audience, regionId, sizeId, tierId, complexityId,
      railingId, railingLF, deckHeightIn, includeRailing,
      includeStairs, stairSteps, stairWidthFt, includeStairRailing,
      skillLevelId, selectedTools, includePermit, permitCost,
      markupTierId, includeMarkup, crewSizeId, includeCrew, subFootings,
      framingId,
      joistSpacingIn,
      marketTierId,
      customWidth, customLength,
      isMultiLevel,
      level2SizeId,
      level2CustomWidth,
      level2CustomLength,
      brandId,
      includeHiddenFasteners: fastenerSystemId !== "none",
      fastenerSystemId,
      edgeBoardType,
      rendering3dTier,
      postMountId,
      postSpacingFt,
      railingHeightIn,
      footingDiameterIn,
      useHelicalPiers,
      includeEngineer,
      engineerCost,
      engineerCostMode,
      totalLow: result.totalLow,
      totalHigh: result.totalHigh,
    });
    setSavedEstimates(loadAllEstimates());
    setSaveLabel("");
    setShowSaveInput(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    return snap;
  }, [
    saveLabel, audience, regionId, sizeId, tierId, complexityId,
    railingId, railingLF, deckHeightIn, includeRailing,
    includeStairs, stairSteps, stairWidthFt, includeStairRailing,
    skillLevelId, selectedTools, includePermit, permitCost,
    markupTierId, includeMarkup, crewSizeId, includeCrew, subFootings,
    framingId, marketTierId, customWidth, customLength,
    isMultiLevel, level2SizeId, level2CustomWidth, level2CustomLength,
    brandId, fastenerSystemId, edgeBoardType, rendering3dTier,
    postMountId, postSpacingFt, railingHeightIn,
    footingDiameterIn, useHelicalPiers,
    includeEngineer, engineerCost, engineerCostMode, result,
  ]);

  const handleCopyLink = useCallback((snap: EstimateSnapshot) => {
    const url = encodeEstimateToUrl(snap);
    // Bug 2 fix: update address bar so the copied URL matches what's shown
    window.history.replaceState({}, "", url);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(snap.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleDeleteEstimate = useCallback((id: string) => {
    deleteEstimate(id);
    setSavedEstimates(loadAllEstimates());
  }, []);

  const handleRenameEstimate = useCallback((id: string, name: string) => {
    renameEstimate(id, name);
    setSavedEstimates(loadAllEstimates());
  }, []);

  const handleOpenNotes = useCallback((snap: EstimateSnapshot) => {
    setEditingNotesId(snap.id);
    setNotesInput(snap.notes ?? "");
  }, []);

  const handleSaveNotes = useCallback((id: string) => {
    updateEstimateNotes(id, notesInput);
    setSavedEstimates(loadAllEstimates());
    setEditingNotesId(null);
  }, [notesInput]);

  // ─── PER-PATHWAY ACCENT COLOR SYSTEM ───────────────────────────────────────
  // CSS custom properties are injected on the root div via the `accentStyle` object.
  // All accent-bearing elements use CSS variable utility classes (accent-border,
  // accent-text, etc.) so the browser can smoothly transition between colors.
  const ACCENT_VARS: Record<AudienceType, React.CSSProperties> = {
    homeowner: {
      "--deck-accent":        "#F59E0B",  // amber-500
      "--deck-accent-light":  "#FBBF24",  // amber-400
      "--deck-accent-dim":    "rgba(245,158,11,0.10)",
      "--deck-accent-dimmer": "rgba(245,158,11,0.20)",
    } as React.CSSProperties,
    diy: {
      "--deck-accent":        "#10B981",  // emerald-500
      "--deck-accent-light":  "#34D399",  // emerald-400
      "--deck-accent-dim":    "rgba(16,185,129,0.10)",
      "--deck-accent-dimmer": "rgba(16,185,129,0.20)",
    } as React.CSSProperties,
    contractor: {
      "--deck-accent":        "#3B82F6",  // blue-500
      "--deck-accent-light":  "#60A5FA",  // blue-400
      "--deck-accent-dim":    "rgba(59,130,246,0.10)",
      "--deck-accent-dimmer": "rgba(59,130,246,0.20)",
    } as React.CSSProperties,
  };
  const accentStyle = ACCENT_VARS[audience];

  // Shared CSS variable utility class aliases for readability
  // NOTE: selectedBorder/selectedBg use direct Tailwind color classes (not CSS vars)
  // because direct classes produce the vivid, clearly-visible border the original design had.
  const SELECTED_CARD: Record<AudienceType, { border: string; bg: string }> = {
    homeowner: { border: "border-amber-500",   bg: "bg-amber-500/10"   },
    diy:       { border: "border-emerald-500", bg: "bg-emerald-500/10" },
    contractor:{ border: "border-blue-500",    bg: "bg-blue-500/10"    },
  };
  const sel = SELECTED_CARD[audience];

  const ac = {
    border:       "accent-border",
    bg:           "accent-bg",
    bgSolid:      "accent-bg-solid",
    text:         "accent-text",
    textSelected: "accent-text-sel",
    accent:       "accent-range",
    progressBar:  "accent-progress",
    badgeBg:      "accent-bg-dimmer",
    badgeText:    "accent-text",
    btnClass:     "accent-btn",
  };

  // Live estimate label changes by audience
  // For homeowner path, apply markup multiplier to live ticker if toggle is on
  const homeownerActiveTier = homeownerShowMarkup
    ? CONTRACTOR_MARKUP_TIERS.find((t) => t.id === homeownerMarkupTierId) ?? null
    : null;
  const homeownerTickerLow = homeownerActiveTier
    ? Math.round(result.totalLow * (1 + homeownerActiveTier.materialMarkup * 0.45 + homeownerActiveTier.laborMarkup * 0.55) * (1 + homeownerActiveTier.overheadPct))
    : result.totalLow;
  const homeownerTickerHigh = homeownerActiveTier
    ? Math.round(result.totalHigh * (1 + homeownerActiveTier.materialMarkup * 0.45 + homeownerActiveTier.laborMarkup * 0.55) * (1 + homeownerActiveTier.overheadPct) * 1.08)
    : result.totalHigh;

  const liveLabel = audience === "contractor"
    ? "Bid estimate"
    : audience === "homeowner" && homeownerShowMarkup && homeownerActiveTier
    ? `With ${homeownerActiveTier.label} markup`
    : "Live estimate";
  const liveRange = audience === "contractor" && result.contractor
    ? formatRange(
        result.contractor.totalBidLow + changeOrderDelta.low,
        result.contractor.totalBidHigh + changeOrderDelta.high
      )
    : audience === "diy" && result.diy
    ? formatRange(result.diy.totalWithExtrasLow, result.diy.totalWithExtrasHigh)
    : audience === "homeowner"
    ? formatRange(homeownerTickerLow, homeownerTickerHigh)
    : formatRange(result.totalLow, result.totalHigh);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col deck-accent-transition" style={accentStyle}>
      {/* ── HEADER ── */}
      <header className="border-b border-white/[0.06] bg-[#0B1120]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded ${ac.bgSolid} flex items-center justify-center`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="8" width="12" height="2" rx="1" fill="#0B1120"/>
                <rect x="1" y="4" width="12" height="2" rx="1" fill="#0B1120"/>
                <rect x="3" y="10" width="1.5" height="3" rx="0.75" fill="#0B1120"/>
                <rect x="9.5" y="10" width="1.5" height="3" rx="0.75" fill="#0B1120"/>
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              DeckCost <span className={ac.text}>2026</span>
            </span>
          </div>

          {/* Live estimate ticker + Save button */}
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={liveRange}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-slate-500 hidden sm:block">{liveLabel}</span>
                <span className={`font-mono text-sm font-semibold ${ac.text}`}>{liveRange}</span>
              </motion.div>
            </AnimatePresence>

            {/* Saved estimates button */}
            <button
              onClick={() => setShowSavedPanel((v) => !v)}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-xs text-slate-400 hover:text-white"
              title="Saved estimates"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 2h9v9.5L6.5 9.5 2 11.5V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:block">Save</span>
              {savedEstimates.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${ac.bgSolid} text-[9px] font-bold text-[#0B1120] flex items-center justify-center`}>
                  {savedEstimates.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── SAVED ESTIMATES PANEL ── */}
      <AnimatePresence>
        {showSavedPanel && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-14 right-0 left-0 sm:left-auto sm:right-4 z-40 sm:w-96 bg-[#0f1929] border border-white/10 shadow-2xl rounded-b-xl sm:rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-white">Saved Estimates</span>
              <button onClick={() => setShowSavedPanel(false)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
            </div>

            {/* Save current estimate */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
              {!showSaveInput ? (
                <button
                  onClick={() => setShowSaveInput(true)}
                  className={`w-full py-2 rounded-lg text-xs font-semibold ${ac.btnClass} transition-all`}
                >
                  {justSaved ? "✓ Saved!" : "+ Save current estimate"}
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Label (e.g. Smith backyard)"
                    value={saveLabel}
                    onChange={(e) => setSaveLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEstimate(); if (e.key === "Escape") setShowSaveInput(false); }}
                    className="flex-1 text-xs bg-white/[0.06] border border-white/10 rounded px-2 py-1.5 text-white placeholder-slate-600 outline-none focus:border-white/20"
                  />
                  <button onClick={handleSaveEstimate} className={`px-3 py-1.5 rounded text-xs font-semibold ${ac.btnClass}`}>Save</button>
                  <button onClick={() => setShowSaveInput(false)} className="px-2 py-1.5 rounded text-xs text-slate-500 hover:text-white">Cancel</button>
                </div>
              )}
            </div>

            {/* Saved list */}
            <div className="max-h-72 overflow-y-auto">
              {savedEstimates.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-600">No saved estimates yet.</div>
              ) : (
                savedEstimates.map((snap) => (
                  <div key={snap.id} className="px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{snap.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {snap.audience.charAt(0).toUpperCase() + snap.audience.slice(1)} · {formatSavedDate(snap.savedAt)}
                        </div>
                        <div className={`text-[11px] font-mono font-semibold mt-1 ${ac.text}`}>
                          {formatRange(snap.totalLow, snap.totalHigh)}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleRestoreEstimate(snap)}
                          className="px-2 py-1 rounded text-[10px] bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="Load estimate"
                        >Load</button>
                        <button
                          onClick={() => handleCopyLink(snap)}
                          className="px-2 py-1 rounded text-[10px] bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="Copy shareable link"
                        >{copiedId === snap.id ? "✓" : "🔗"}</button>
                        <button
                          onClick={() => handleOpenNotes(snap)}
                          className={`px-2 py-1 rounded text-[10px] transition-colors ${
                            snap.notes ? "bg-white/10 text-slate-300 hover:text-white" : "bg-white/[0.06] text-slate-500 hover:text-slate-300"
                          }`}
                          title={snap.notes ? "Edit notes" : "Add notes"}
                        >✎</button>
                        <button
                          onClick={() => handleDeleteEstimate(snap.id)}
                          className="px-2 py-1 rounded text-[10px] bg-white/[0.06] hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >×</button>
                      </div>
                    </div>

                    {/* Notes display */}
                    {snap.notes && editingNotesId !== snap.id && (
                      <div className="mt-2 text-[10px] text-slate-400 italic bg-white/[0.03] rounded px-2 py-1.5 leading-relaxed">
                        {snap.notes}
                      </div>
                    )}

                    {/* Notes editor */}
                    {editingNotesId === snap.id && (
                      <div className="mt-2 space-y-1.5">
                        <textarea
                          autoFocus
                          rows={3}
                          placeholder="Add context (e.g. Client wants composite, budget is tight)"
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Escape") setEditingNotesId(null); }}
                          className="w-full text-[10px] bg-white/[0.06] border border-white/10 rounded px-2 py-1.5 text-white placeholder-slate-600 outline-none focus:border-white/20 resize-none leading-relaxed"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleSaveNotes(snap.id)}
                            className={`px-3 py-1 rounded text-[10px] font-semibold ${ac.btnClass}`}
                          >Save note</button>
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="px-2 py-1 rounded text-[10px] text-slate-500 hover:text-white"
                          >Cancel</button>
                          {snap.notes && (
                            <button
                              onClick={() => { updateEstimateNotes(snap.id, ""); setSavedEstimates(loadAllEstimates()); setEditingNotesId(null); }}
                              className="px-2 py-1 rounded text-[10px] text-red-500/60 hover:text-red-400"
                            >Clear</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      {!showResults && step === 0 && (
        <div
          className="relative h-52 sm:h-64 overflow-hidden"
          style={{
            backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663066822338/Axndupm86CWsSZU8jNMGcP/deck-hero-bg-X2ycG7ddgwPUE4fLGzrHi9.webp)`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/60 via-[#0B1120]/40 to-[#0B1120]" />
          <div className="relative z-10 h-full flex flex-col justify-end px-4 sm:px-6 pb-6 max-w-6xl mx-auto w-full">
            <p className={`text-xs font-semibold tracking-widest ${ac.text} uppercase mb-1`}>
              2026 Pricing Data
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Deck Building Cost Calculator
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Localized estimates from real 2026 pricing data — materials, labor, regional rates, and tariff impacts.
            </p>
          </div>
        </div>
      )}

      {/* ── PROGRESS BAR ── */}
      {!showResults && !showTakeoff && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 mt-4">
          {(() => {
            // For DIY/homeowner, step 5 is a hidden skip slot — exclude it from the visible count
            const visibleLabels = stepLabels.filter((l) => l !== "");
            const visibleIndex = stepLabels.slice(0, step + 1).filter((l) => l !== "").length;
            const currentLabel = stepLabels[step] || stepLabels[step - 1] || "";
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500">
                    Step {visibleIndex} of {visibleLabels.length}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{currentLabel}</span>
                  {step >= 3 && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold",
                      `${ac.badgeBg} ${ac.badgeText}`
                    )}>
                      {audience === "diy" ? "DIYer" : audience === "contractor" ? "Contractor" : "Homeowner"}
                    </span>
                  )}
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", ac.progressBar)}
                    animate={{ width: `${(visibleIndex / visibleLabels.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {showTakeoff ? (
            <motion.div
              key="takeoff"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <MaterialTakeoff
                result={result}
                onBack={() => setShowTakeoff(false)}
                onFinish={() => setShowTakeoff(false)}
              />
            </motion.div>
          ) : showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <ResultsPanel
                result={result}
                onBack={() => { setChangeOrderDelta({ low: 0, high: 0 }); goBack(); }}
                onRestart={() => { setChangeOrderDelta({ low: 0, high: 0 }); restart(); }}
                onChangeOrderUpdate={(low, high) => setChangeOrderDelta({ low, high })}
                onShowTakeoff={audience === "contractor" ? () => setShowTakeoff(true) : undefined}
                homeownerShowMarkup={homeownerShowMarkup}
                homeownerMarkupTierId={homeownerMarkupTierId}
                onHomeownerMarkupToggle={setHomeownerShowMarkup}
                onHomeownerMarkupTierChange={setHomeownerMarkupTierId}
              />

              {/* ── SAVE ESTIMATE PROMPT ── */}
              <div className="max-w-2xl mx-auto px-4 pb-10 mt-2">
                <div className={`rounded-xl border ${
                  justSaved ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-white/10 bg-white/[0.03]"
                } p-4 transition-colors duration-500`} style={{borderRadius: '15px', marginTop: '17px'}}>
                  {justSaved ? (
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 text-lg">✓</span>
                      <div>
                        <div className="text-sm font-semibold text-emerald-300">Estimate saved!</div>
                        <div className="text-xs text-slate-400 mt-0.5">Find it anytime using the Save button in the header.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">Save this estimate</div>
                        <div className="text-xs text-slate-400 mt-0.5">Bookmark it or get a shareable link to return and adjust later.</div>
                      </div>
                      {showSaveInput ? (
                        <div className="flex gap-2 items-center">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Label (optional)"
                            value={saveLabel}
                            onChange={(e) => setSaveLabel(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveEstimate(); if (e.key === "Escape") setShowSaveInput(false); }}
                            className="text-xs bg-white/[0.06] border border-white/10 rounded px-2 py-1.5 text-white placeholder-slate-600 outline-none focus:border-white/20 w-36"
                          />
                          <button
                            onClick={handleSaveEstimate}
                            className={`px-3 py-1.5 rounded text-xs font-semibold ${ac.btnClass} shrink-0`}
                          >Save</button>
                          <button
                            onClick={() => setShowSaveInput(false)}
                            className="text-xs text-slate-500 hover:text-white px-1"
                          >✕</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setShowSaveInput(true)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${ac.btnClass}`}
                          >Save estimate</button>
                          <button
                            onClick={() => { const snap = handleSaveEstimate(); if (snap) handleCopyLink(snap); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10"
                          >Save &amp; copy link</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >

              {/* ══════════════════════════════════════════════════════════════
                  SHARED STEPS 0–5
              ══════════════════════════════════════════════════════════════ */}

              {/* ── STEP 0: AUDIENCE ── */}
              {step === 0 && (
                <>
                <StepCard
                  title="Who are you?"
                  subtitle="We'll tailor the estimate — and the questions — to your situation."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  nextLabel="Continue"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "homeowner" as AudienceType,
                        icon: "🏡",
                        label: "Homeowner",
                        desc: "Hiring a contractor. See full installed costs.",
                        extra: "7 questions",
                        color: "amber",
                      },
                      {
                        id: "diy" as AudienceType,
                        icon: "🔨",
                        label: "DIYer",
                        desc: "Doing it yourself. Materials + tool rental + permit.",
                        extra: "9 questions",
                        color: "emerald",
                      },
                      {
        id: "contractor" as AudienceType,
              icon: "📋",
              label: "Contractor",
              desc: "Bidding a project. Full markup, crew, and margin analysis.",
              extra: "10 questions",
                        color: "blue",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => selectOrAdvance(audience === opt.id, () => setAudience(opt.id as AudienceType))}
                        className={cn(
                          "text-left p-4 rounded-lg border transition-all",
                          audience === opt.id
                            ? opt.color === "emerald"
                              ? "border-emerald-500 bg-emerald-500/10"
                              : opt.color === "blue"
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-amber-500 bg-amber-500/10"
                            : "border-white/20 bg-white/[0.03] hover:border-white/30"
                        )}
                      >
                        <div className="text-2xl mb-2">{opt.icon}</div>
                        <div className="font-semibold text-sm text-white">{opt.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{opt.desc}</div>
                        <div className={cn(
                          "text-xs mt-2 font-medium",
                          audience === opt.id
                            ? opt.color === "emerald" ? "text-emerald-400"
                              : opt.color === "blue" ? "text-blue-400"
                              : "text-amber-400"
                            : "text-slate-600"
                        )}>
                          {audience === opt.id ? "✓ Selected" : opt.extra}
                        </div>
                      </button>
                    ))}
                  </div>
                </StepCard>

                {/* DEV SHORTCUT — only visible in development builds */}
                {import.meta.env.DEV && <div className="max-w-2xl mx-auto mt-3 text-center">
                  <button
                    onClick={() => {
                      setAudience("contractor");
                      setRegionId("mid-atlantic");
                      setSizeId("320");
                      setTierId("composite");
                      setComplexityId("standard");
                      setRailingId("composite");
                      setIncludeRailing(true);
                      setIncludeStairs(true);
                      setMarkupTierId("standard");
                      setIncludeCrew(true);
                      setIncludePermit(true);
                      setStep(0);
                      setShowTakeoff(false);
                      setShowResults(true);
                    }}
                    className="text-xs text-amber-500/60 hover:text-amber-400 border border-dashed border-amber-500/20 hover:border-amber-500/40 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ⚡ Dev: jump to contractor estimate
                  </button>
                </div>}
                </>
              )}

              {/* ── STEP 1: REGION ── */}
              {step === 1 && (
                <StepCard
                  title="Where is your deck?"
                  subtitle="Regional labor rates and climate factors significantly affect total cost."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  accentBtnClass={ac.btnClass}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REGIONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { setRegionId(r.id); setConfirmedStep(step); }}
                        className={cn(
                          "text-left p-3 rounded-lg border transition-all",
                          regionId === r.id
                            ? `${sel.border} ${sel.bg}`
                            : "border-white/20 bg-white/[0.03] hover:border-white/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-sm text-white">{r.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{r.states}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={cn(
                              "text-xs font-mono font-semibold",
                              r.laborMultiplier > 1.2 ? "text-red-400"
                              : r.laborMultiplier > 1.0 ? ac.text
                              : "text-green-400"
                            )}>
                              {r.laborMultiplier.toFixed(2)}×
                            </div>
                            <div className="text-xs text-slate-600">labor</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Frost: {r.frostDepthLabel}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Market Tier — contractor only */}
                  {audience === "contractor" && (
                    <div className="mt-4">
                      <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider mb-2`}>
                        Labor Market Tier
                      </div>
                      <div className="text-xs text-slate-400 mb-3">
                        Adjust for your local labor market — affects labor cost only, not materials.
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {MARKET_TIERS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setMarketTierId(m.id)}
                            className={cn(
                              "text-left p-3 rounded-lg border transition-all",
                              marketTierId === m.id
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/20 bg-white/[0.03] hover:border-white/30"
                            )}
                          >
                            <div className="text-lg mb-1">{m.icon}</div>
                            <div className="font-semibold text-xs text-white leading-tight">{m.shortLabel}</div>
                            <div className={cn(
                              "text-xs font-mono font-bold mt-1",
                              m.laborMultiplier < 1 ? "text-emerald-400"
                              : m.laborMultiplier > 1 ? "text-amber-400"
                              : "text-blue-400"
                            )}>
                              {m.laborMultiplier < 1 ? "-" : m.laborMultiplier > 1 ? "+" : ""}
                              {Math.abs(Math.round((m.laborMultiplier - 1) * 100))}% labor
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 leading-tight">{m.examples}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </StepCard>
              )}

              {/* ── STEP 2: SIZE ── */}
              {step === 2 && (
                <StepCard
                  title="How large is your deck?"
                  subtitle="Larger decks have lower per-sq-ft costs due to economies of scale."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  accentBtnClass={ac.btnClass}
                >
                  <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    {DECK_SIZES.map((s) => {
                      const baseInstalled: Record<string, { low: number; high: number }> = {
                        "100": { low: 2500, high: 4000 },
                        "192": { low: 4800, high: 8000 },
                        "320": { low: 8000, high: 14000 },
                        "480": { low: 12000, high: 20000 },
                        "600": { low: 15000, high: 25000 },
                      };
                      const est = baseInstalled[s.id] ?? { low: 0, high: 0 };
                      return (
                        <button
                          key={s.id}
                          onClick={() => selectOrAdvance(sizeId === s.id, () => setSizeId(s.id))}
                          className={cn(
                            "text-left p-3 rounded-lg border transition-all",
                            sizeId === s.id
                              ? `${sel.border} ${sel.bg}`
                              : "border-white/20 bg-white/[0.03] hover:border-white/30"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-sm text-white">{s.label}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{s.sqFt} sq ft</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-xs font-mono ${ac.text}`}>
                                {formatRange(est.low, est.high)}
                              </div>
                              <div className="text-xs text-slate-600">PT installed est.</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom size card — contractor only */}
                    {audience === "contractor" && (
                      <div
                        className={cn(
                          "col-span-1 sm:col-span-2 p-3 rounded-lg border transition-all",
                          sizeId === "custom"
                            ? `${sel.border} ${sel.bg}`
                            : "border-white/20 bg-white/[0.03] hover:border-white/30"
                        )}
                      >
                        <button
                          className="w-full text-left"
                          onClick={() => {
                            if (sizeId !== "custom") setSizeId("custom");
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm text-white">Custom Size</div>
                              <div className="text-xs text-slate-500 mt-0.5">Enter exact dimensions</div>
                            </div>
                            <div className="text-right">
                              {sizeId === "custom" && (
                                <div className={`text-xs font-mono ${ac.text}`}>{customSqFt} sq ft</div>
                              )}
                              <div className="text-xs text-slate-600">contractor only</div>
                            </div>
                          </div>
                        </button>
                        {sizeId === "custom" && (
                          <div className="mt-3 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Width (ft)</label>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setCustomWidth((w) => Math.max(4, w - 1))}
                                  className="w-7 h-7 rounded bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors"
                                >−</button>
                                <input
                                  type="number"
                                  min={4} max={100}
                                  value={customWidth}
                                  onChange={(e) => setCustomWidth(Math.max(4, Math.min(100, Number(e.target.value) || 4)))}
                                  className="flex-1 text-center font-mono text-sm bg-white/[0.06] border border-white/10 rounded text-white py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  onClick={() => setCustomWidth((w) => Math.min(100, w + 1))}
                                  className="w-7 h-7 rounded bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors"
                                >+</button>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Length (ft)</label>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setCustomLength((l) => Math.max(4, l - 1))}
                                  className="w-7 h-7 rounded bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors"
                                >−</button>
                                <input
                                  type="number"
                                  min={4} max={200}
                                  value={customLength}
                                  onChange={(e) => setCustomLength(Math.max(4, Math.min(200, Number(e.target.value) || 4)))}
                                  className="flex-1 text-center font-mono text-sm bg-white/[0.06] border border-white/10 rounded text-white py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  onClick={() => setCustomLength((l) => Math.min(200, l + 1))}
                                  className="w-7 h-7 rounded bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors"
                                >+</button>
                              </div>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className={`font-mono text-base font-bold ${ac.text}`}>{customWidth} × {customLength} = {customSqFt} sq ft</span>
                              <div className="text-[10px] text-slate-500 mt-0.5">Live estimate updates as you type</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>{/* end main size grid */}
                  {/* Multi-level toggle — contractor only */}
                  {audience === "contractor" && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-white/10 bg-white/[0.03]">
                        <div>
                          <div className="text-sm font-semibold text-white">Multi-level deck?</div>
                          <div className="text-xs text-slate-400 mt-0.5">Two or more levels with separate framing</div>
                        </div>
                        <button
                          onClick={() => setIsMultiLevel((v) => !v)}
                          className={cn(
                            "relative w-11 h-6 rounded-full transition-colors",
                            isMultiLevel ? ac.btnClass : "bg-white/10"
                          )}
                        >
                          <span className={cn(
                            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                            isMultiLevel ? "translate-x-5" : "translate-x-0"
                          )} />
                        </button>
                      </div>

                      {isMultiLevel && (
                        <div className="space-y-2">
                          <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>Upper / second level size</div>
                          <div className="grid grid-cols-2 gap-2">
                            {DECK_SIZES.map((s) => {
                              const baseInstalled: Record<string, { low: number; high: number }> = {
                                "100": { low: 2500, high: 4000 },
                                "192": { low: 4800, high: 8000 },
                                "320": { low: 8000, high: 14000 },
                                "480": { low: 12000, high: 20000 },
                                "600": { low: 15000, high: 25000 },
                              };
                              const est = baseInstalled[s.id] ?? { low: 0, high: 0 };
                              return (
                                <button
                                  key={s.id}
                                  onClick={() => setLevel2SizeId(s.id)}
                                  className={cn(
                                    "text-left p-3 rounded-lg border transition-all",
                                    level2SizeId === s.id
                                      ? `${sel.border} ${sel.bg}`
                                      : "border-white/20 bg-white/[0.03] hover:border-white/30"
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="font-semibold text-sm text-white">{s.label}</div>
                                      <div className="text-xs text-slate-500 mt-0.5">{s.sqFt} sq ft</div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-xs font-mono ${ac.text}`}>
                                        {formatRange(est.low, est.high)}
                                      </div>
                                      <div className="text-xs text-slate-600">PT installed est.</div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                            {/* Custom upper level size */}
                            <div className={cn(
                              "col-span-1 sm:col-span-2 p-3 rounded-lg border transition-all",
                              level2SizeId === "custom"
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/20 bg-white/[0.03] hover:border-white/30"
                            )}>
                              <button className="w-full text-left" onClick={() => setLevel2SizeId("custom")}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-sm text-white">Custom Size</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Enter exact dimensions</div>
                                  </div>
                                  {level2SizeId === "custom" && (
                                    <div className={`text-xs font-mono ${ac.text}`}>{level2CustomSqFt} sq ft</div>
                                  )}
                                </div>
                              </button>
                              {level2SizeId === "custom" && (
                                <div className="mt-3 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Width (ft)</label>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => setLevel2CustomWidth((w) => Math.max(4, w - 1))} className="w-7 h-7 rounded bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors">−</button>
                                      <input type="number" min={4} max={100} value={level2CustomWidth}
                                        onChange={(e) => setLevel2CustomWidth(Math.max(4, Math.min(100, Number(e.target.value) || 4)))}
                                        className="flex-1 text-center font-mono text-sm bg-white/[0.06] border border-white/10 rounded text-white py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <button onClick={() => setLevel2CustomWidth((w) => Math.min(100, w + 1))} className="w-7 h-7 rounded bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors">+</button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Length (ft)</label>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => setLevel2CustomLength((l) => Math.max(4, l - 1))} className="w-7 h-7 rounded bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors">−</button>
                                      <input type="number" min={4} max={200} value={level2CustomLength}
                                        onChange={(e) => setLevel2CustomLength(Math.max(4, Math.min(200, Number(e.target.value) || 4)))}
                                        className="flex-1 text-center font-mono text-sm bg-white/[0.06] border border-white/10 rounded text-white py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <button onClick={() => setLevel2CustomLength((l) => Math.min(200, l + 1))} className="w-7 h-7 rounded bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors">+</button>
                                    </div>
                                  </div>
                                  <div className="col-span-2 text-center">
                                    <span className={`font-mono text-base font-bold ${ac.text}`}>{level2CustomWidth} × {level2CustomLength} = {level2CustomSqFt} sq ft</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {result.multiLevelPremiumLow > 0 && (
                            <div className={`text-xs font-mono ${ac.text} text-right`}>
                              +{formatRange(result.multiLevelPremiumLow, result.multiLevelPremiumHigh)} upper level est.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  </div>{/* end flex column */}
                </StepCard>
              )}

              {/* ── STEP 3: MATERIAL TIER ── */}
              {step === 3 && (
                <StepCard
                  title="What material tier?"
                  subtitle="The single biggest driver of cost after labor."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  accentBtnClass={ac.btnClass}
                >
                  <div className="flex flex-col gap-3">
                    {MATERIAL_TIERS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => selectOrAdvance(tierId === t.id, () => {
                          setTierId(t.id);
                          // Reset brand when switching tiers so incompatible brands don't persist
                          if (audience === "contractor") {
                            const compatible = DECKING_BRANDS.filter(b => b.tierIds.includes(t.id));
                            if (brandId && !compatible.find(b => b.id === brandId)) {
                              setBrandId(undefined);
                            }
                          }
                        })}
                        className={cn(
                          "text-left p-4 rounded-lg border transition-all",
                          tierId === t.id
                            ? `${sel.border} ${sel.bg}`
                            : "border-white/20 bg-white/[0.03] hover:border-white/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-white">{t.label}</div>
                            <div className="text-xs text-slate-400 mt-1">{t.description}</div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {t.examples.map((ex) => (
                                <span key={ex} className="text-xs bg-white/[0.06] text-slate-400 px-2 py-0.5 rounded">
                                  {ex}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-xs font-mono ${ac.text} font-semibold`}>
                              ${t.materialPerSqFtMin}–${t.materialPerSqFtMax}
                            </div>
                            <div className="text-xs text-slate-600">materials/SF</div>
                            {audience !== "diy" && (
                              <>
                                <div className="text-xs font-mono text-slate-300 mt-1">
                                  ${t.installedPerSqFtMin}–${t.installedPerSqFtMax}
                                </div>
                                <div className="text-xs text-slate-600">installed/SF</div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex gap-4 text-xs text-slate-500">
                          <span>⏳ {t.lifespan}</span>
                          <span>🔧 {t.maintenance}</span>
                        </div>
                      </button>
                    ))}

                    {/* ── Contractor-only: Brand, Hidden Fasteners, Edge Board ── */}
                    {audience === "contractor" && (tierId === "composite" || tierId === "pvc") && (() => {
                      const brandsForTier = DECKING_BRANDS.filter(b => b.tierIds.includes(tierId));
                      const selectedBrand = brandsForTier.find(b => b.id === brandId) ?? null;
                      const fastenerBlocked = selectedBrand !== null && !selectedBrand.hiddenFastenerCompatible;
                      return (
                        <div className="mt-2 p-4 rounded-lg border border-amber-500/30 bg-amber-500/[0.04] space-y-4">
                          <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>Product Spec (Contractor)</div>

                          {/* Brand selector */}
                          <div>
                            <div className="text-xs text-slate-400 mb-2">Brand / Product Line</div>
                            <div className="grid grid-cols-1 gap-2">
                              {/* "No specific brand" option */}
                              <button
                                onClick={() => setBrandId(undefined)}
                                className={cn(
                                  "text-left px-3 py-2 rounded-md border text-xs transition-all",
                                  brandId === undefined
                                    ? `${sel.border} ${sel.bg} text-white`
                                    : "border-white/15 bg-white/[0.02] text-slate-400 hover:border-white/25"
                                )}
                              >
                                <span className="font-medium">No specific brand</span>
                                <span className="text-slate-500 ml-2">Use tier baseline pricing</span>
                              </button>
                              {brandsForTier.map((b) => {
                                const cLow = (b as { materialCostLow: number }).materialCostLow;
                                const cHigh = (b as { materialCostHigh: number }).materialCostHigh;
                                return (
                                  <button
                                    key={b.id}
                                    onClick={() => setBrandId(b.id)}
                                    className={cn(
                                      "text-left px-3 py-2 rounded-md border transition-all",
                                      brandId === b.id
                                        ? `${sel.border} ${sel.bg}`
                                        : "border-white/15 bg-white/[0.02] hover:border-white/25"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div>
                                        <span className="text-xs font-semibold text-white">{b.name}</span>
                                        {!b.hiddenFastenerCompatible && (
                                          <span className="ml-2 text-xs text-slate-500">(solid boards only)</span>
                                        )}
                                      </div>
                                      <span className="text-xs font-mono shrink-0 text-amber-400">
                                        ${cLow.toFixed(2)}–${cHigh.toFixed(2)}/SF
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">{b.description}</div>
                                    <div className="text-xs text-slate-600 mt-0.5">Warranty: {b.warranty}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Hidden fastener system selector */}
                          <div>
                            <div className="text-xs font-semibold text-white mb-1.5">Fastening System</div>
                            {fastenerBlocked && (
                              <div className="text-xs text-slate-500 mb-2">
                                {selectedBrand?.name} uses solid boards — hidden fastener systems not compatible.
                              </div>
                            )}
                            <div className="grid grid-cols-1 gap-2">
                              {([
                                {
                                  id: "none" as const,
                                  label: "Standard Face Screws",
                                  sub: "Traditional visible screws. Fastest install, lowest cost.",
                                  price: "Included",
                                  blocked: false,
                                },
                                {
                                  id: "clip" as const,
                                  label: "Generic Clip System",
                                  sub: "Snap-in clips between boards. No visible fasteners.",
                                  price: "+$1.50–$2.50/SF",
                                  blocked: fastenerBlocked,
                                },
                                {
                                  id: "cortex" as const,
                                  label: "Cortex by FastenMaster",
                                  sub: "Screw + color-matched plug system. Works on all boards incl. perimeter & stairs. TORX® ttap® drive.",
                                  price: "+$1.25–$2.25/SF",
                                  blocked: fastenerBlocked,
                                },
                              ]).map((opt) => (
                                <button
                                  key={opt.id}
                                  disabled={opt.blocked}
                                  onClick={() => {
                                    if (opt.blocked) return;
                                    setFastenerSystemId(opt.id);
                                    // Auto-set grooved edge when switching to a hidden system
                                    if (opt.id !== "none") setEdgeBoardType("grooved");
                                    else setEdgeBoardType("solid");
                                  }}
                                  className={cn(
                                    "text-left px-3 py-2 rounded-md border transition-all",
                                    opt.blocked
                                      ? "border-white/10 bg-white/[0.02] opacity-40 cursor-not-allowed"
                                      : fastenerSystemId === opt.id
                                        ? `${sel.border} ${sel.bg}`
                                        : "border-white/15 bg-white/[0.02] hover:border-white/25"
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-white">{opt.label}</span>
                                    <span className={cn(
                                      "text-xs font-mono shrink-0",
                                      opt.id === "none" ? "text-slate-400" : "text-amber-400"
                                    )}>{opt.price}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Edge board type */}
                          <div>
                            <div className="text-xs font-semibold text-white mb-1.5">Edge / Border Boards</div>
                            <div className="grid grid-cols-2 gap-2">
                              {(["solid", "grooved"] as const).map((type) => {
                                const isForced = type === "grooved" && fastenerSystemId !== "none" && !fastenerBlocked;
                                return (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      if (isForced) return; // can't unset grooved when hidden fasteners on
                                      setEdgeBoardType(type);
                                    }}
                                    className={cn(
                                      "text-left px-3 py-2 rounded-md border text-xs transition-all",
                                      edgeBoardType === type || isForced
                                        ? `${sel.border} ${sel.bg}`
                                        : "border-white/15 bg-white/[0.02] hover:border-white/25"
                                    )}
                                  >
                                    <div className="font-semibold text-white capitalize">{type}</div>
                                    <div className="text-slate-500 mt-0.5">
                                      {type === "solid"
                                        ? "Standard face-screw install. Best for picture-frame borders."
                                        : isForced
                                          ? "Required for hidden fasteners. +$0.50–$1.00/SF"
                                          : "Grooved-edge upgrade. +$0.50–$1.00/SF"}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </StepCard>
              )}

              {/* ── STEP 4: COMPLEXITY ── */}
              {step === 4 && (
                <StepCard
                  title="Deck complexity"
                  subtitle={
                    audience === "diy"
                      ? "More complex designs require more skill, time, and tools."
                      : "Angled and custom designs add 50–110% to labor costs."
                  }
                  onNext={goNextFromComplexity}
                  onBack={goBack}
                  showTapHint={confirmedStep === step}
                  accentBtnClass={ac.btnClass}
                >
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {COMPLEXITIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectOrAdvanceFromComplexity(complexityId === c.id, () => setComplexityId(c.id))}
                        className={cn(
                          "text-left p-3 rounded-lg border transition-all",
                          complexityId === c.id
                            ? `${sel.border} ${sel.bg}`
                            : "border-white/20 bg-white/[0.03] hover:border-white/30"
                        )}
                      >
                        <div className="font-semibold text-sm text-white">{c.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{c.description}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Labor: {c.laborPctRange}</span>
                          <span className={cn(
                            "text-xs font-mono font-semibold",
                            c.laborMultiplier > 1.5 ? "text-red-400"
                            : c.laborMultiplier > 1.1 ? ac.text
                            : "text-green-400"
                          )}>
                            {c.laborMultiplier === 1 ? "Baseline" : `+${Math.round((c.laborMultiplier - 1) * 100)}% labor`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </StepCard>
              )}

              {/* ── CONTRACTOR STEP 5: FRAMING SYSTEM ── */}
              {step === 5 && audience === "contractor" && (
                <StepCard
                  title="Framing system"
                  subtitle="The structural framing is the skeleton of your deck. Material choice affects cost, longevity, and installation time."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="Continue →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-3">
                    <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider mb-1`}>Select framing material</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FRAMING_OPTIONS.map((f) => {
                        const isSelected = framingId === f.id;
                        const costDelta = isSelected
                          ? (result.framingCostLow === 0 && result.framingCostHigh === 0
                              ? "Included in base"
                              : `+${formatRange(result.framingCostLow, result.framingCostHigh)}`)
                          : null;
                        return (
                          <button
                            key={f.id}
                            onClick={() => selectOrAdvance(framingId === f.id, () => setFramingId(f.id))}
                            className={cn(
                              "text-left p-4 rounded-lg border transition-all",
                              isSelected
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/20 bg-white/[0.03] hover:border-white/30"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{f.icon}</span>
                                <div>
                                  <div className="font-semibold text-sm text-white">{f.label}</div>
                                  {f.badge && (
                                    <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${ac.bgSolid} text-[#0B1120]`}>
                                      {f.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && costDelta && (
                                <span className={`text-xs font-mono font-semibold ${ac.text} shrink-0`}>{costDelta}</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 leading-relaxed mb-2">{f.description}</div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                              <div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pros</div>
                                {f.pros.slice(0, 2).map((p, i) => (
                                  <div key={i} className="text-[10px] text-slate-400 leading-tight">+ {p}</div>
                                ))}
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cons</div>
                                {f.cons.slice(0, 2).map((c, i) => (
                                  <div key={i} className="text-[10px] text-slate-400 leading-tight">− {c}</div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="text-[10px] text-slate-500">Lifespan: <span className="text-slate-400">{f.lifespan}</span></div>
                              <div className={`text-[10px] font-mono ${isSelected ? ac.text : "text-slate-500"}`}>
                                ${f.materialCostPerSqFt.low}–${f.materialCostPerSqFt.high}/sqft material
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {/* Cost impact note */}
                    {framingId !== "pt" && (
                      <div className={`text-xs ${ac.text} bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mt-1`}>
                        <span className="font-semibold">Framing upgrade cost: </span>
                        {result.framingCostLow === 0 && result.framingCostHigh === 0
                          ? "No additional cost over standard PT"
                          : `${formatRange(result.framingCostLow, result.framingCostHigh)} added to your bid (marked up at your margin tier)`
                        }
                      </div>
                    )}

                    {/* Joist spacing selector */}
                    <div className="pt-1">
                      <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider mb-2`}>Joist Spacing (on-center)</div>
                      <div className="grid grid-cols-3 gap-2">
                        {([12, 16, 24] as const).map((spacing) => {
                          const isSelected = joistSpacingIn === spacing;
                          // Joist count and board-feet for this spacing option (same math as deckData.ts)
                          const deckSqFt = result.size.sqFt;
                          const shortFt = Math.round(Math.sqrt(deckSqFt * 0.75));
                          const longFt  = Math.round(deckSqFt / Math.max(shortFt, 1));
                          const count   = Math.ceil(longFt / (spacing / 12)) + 1;
                          const bf      = Math.round(count * shortFt * (1.5 * 9.25) / 12);
                          const count16 = Math.ceil(longFt / (16 / 12)) + 1;
                          const bf16    = Math.round(count16 * shortFt * (1.5 * 9.25) / 12);
                          const deltaBF = bf - bf16;
                          const deltaCost = Math.round(deltaBF * 1.50);
                          return (
                            <button
                              key={spacing}
                              onClick={() => setJoistSpacingIn(spacing)}
                              className={cn(
                                "text-left px-3 py-3 rounded-lg border transition-all",
                                isSelected
                                  ? `${sel.border} ${sel.bg}`
                                  : "border-white/20 bg-white/[0.03] hover:border-white/30"
                              )}
                            >
                              <div className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>{spacing}" OC</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{count} joists</div>
                              <div className="text-[10px] text-slate-500">{bf} BF</div>
                              {spacing !== 16 && (
                                <div className={cn(
                                  "text-[10px] font-mono mt-1",
                                  deltaCost > 0 ? "text-amber-400" : "text-green-400"
                                )}>
                                  {deltaCost > 0 ? `+${formatCurrency(deltaCost)}` : formatCurrency(deltaCost)}
                                </div>
                              )}
                              {spacing === 16 && (
                                <div className="text-[10px] text-slate-500 mt-1">Baseline</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                        <span className="text-slate-400 font-medium">Selected: </span>
                        {joistSpacingIn === 12 && "12\" OC — required for composite decking, heavy loads, or spans over 12\'. More lumber, stronger floor feel."}
                        {joistSpacingIn === 16 && "16\" OC — IRC standard for most residential decks. Best balance of cost and stiffness."}
                        {joistSpacingIn === 24 && "24\" OC — allowed for shorter spans with 2×10+ joists. Reduces lumber cost but may feel springy underfoot."}
                      </div>
                      {result.joistSpacingCostDelta !== 0 && (
                        <div className={`text-xs mt-1 font-mono ${result.joistSpacingCostDelta > 0 ? ac.text : "text-green-400"}`}>
                          {result.joistSpacingCostDelta > 0
                            ? `+${formatCurrency(result.joistSpacingCostDelta)} vs 16" OC baseline (${result.joistCount} joists × ${result.joistLengthFt}' = ${result.joistBoardFeet} BF)`
                            : `${formatCurrency(result.joistSpacingCostDelta)} vs 16" OC baseline (${result.joistCount} joists × ${result.joistLengthFt}' = ${result.joistBoardFeet} BF)`
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── BEAM SPAN WARNING ── */}
                  {result.joistSpanWarning && (
                    <div className={`mt-4 rounded-lg border px-4 py-3 flex gap-3 items-start ${
                      result.joistSpanWarning.exceeded
                        ? "bg-amber-950/40 border-amber-500/50"
                        : "bg-emerald-950/30 border-emerald-600/40"
                    }`}>
                      <span className="text-lg leading-none mt-0.5">
                        {result.joistSpanWarning.exceeded ? "⚠️" : "✅"}
                      </span>
                      <div className="flex-1">
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                          result.joistSpanWarning.exceeded ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {result.joistSpanWarning.exceeded ? "Span Limit Exceeded — IRC R507.6" : "Span OK — IRC R507.6"}
                        </div>
                        <div className={`text-xs leading-relaxed ${
                          result.joistSpanWarning.exceeded ? "text-amber-200" : "text-emerald-200"
                        }`}>
                          {result.joistSpanWarning.message}
                        </div>
                        {result.joistSpanWarning.exceeded && (
                          <div className="text-xs text-slate-400 mt-1.5">
                            Max spans (SYP No.2 PT): 2×10 = {result.joistSpanWarning.maxAllowedFt}' · 2×12 = {result.joistSpanWarning.upgradeMaxFt}' at {result.joistSpacingIn}" OC
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </StepCard>
              )}

              {/* ── DIY STEP 6: FRAMING SYSTEM ── */}
              {step === 6 && audience === "diy" && (
                <StepCard
                  title="Framing system"
                  subtitle="The structural framing is the skeleton of your deck. Material choice affects cost, longevity, and installation time."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="Continue →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-3">
                    <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider mb-1`}>Select framing material</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FRAMING_OPTIONS.map((f) => {
                        const isSelected = framingId === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => selectOrAdvance(framingId === f.id, () => setFramingId(f.id))}
                            className={cn(
                              "text-left p-4 rounded-lg border transition-all",
                              isSelected
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/20 bg-white/[0.03] hover:border-white/30"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{f.icon}</span>
                                <div>
                                  <div className="font-semibold text-sm text-white">{f.label}</div>
                                  {f.badge && (
                                    <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${ac.bgSolid} text-[#0B1120]`}>
                                      {f.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 leading-relaxed mb-2">{f.description}</div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                              <div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pros</div>
                                {f.pros.slice(0, 2).map((p, i) => (
                                  <div key={i} className="text-[10px] text-slate-400 leading-tight">+ {p}</div>
                                ))}
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cons</div>
                                {f.cons.slice(0, 2).map((c, i) => (
                                  <div key={i} className="text-[10px] text-slate-400 leading-tight">− {c}</div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="text-[10px] text-slate-500">Lifespan: <span className="text-slate-400">{f.lifespan}</span></div>
                              <div className={`text-[10px] font-mono ${isSelected ? ac.text : "text-slate-500"}`}>
                                ${f.materialCostPerSqFt.low}–${f.materialCostPerSqFt.high}/sqft material
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </StepCard>
              )}

              {/* ── STEP 7: RAILING & EXTRAS ── */}
              {/* ── HOMEOWNER: simplified plain-English variant ── */}
              {step === 7 && audience === "homeowner" && (
                <StepCard
                  title="Railing & stairs"
                  subtitle="Just a few quick questions — we'll handle the details."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="Continue →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-6">

                    {/* Q1: Deck height — plain picture cards */}
                    <div>
                      <div className="text-sm font-semibold text-slate-200 mb-3">How high is your deck off the ground?</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { label: "Ground level",        sub: "Under 2 ft — like a patio",       heightIn: 18,  requiresRailing: false },
                          { label: "Raised",              sub: "2–4 ft off the ground",            heightIn: 42,  requiresRailing: true  },
                          { label: "High / second story", sub: "4 ft or more off the ground",      heightIn: 72,  requiresRailing: true  },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => {
                              setDeckHeightIn(opt.heightIn);
                              if (opt.requiresRailing) setIncludeRailing(true);
                              setConfirmedStep(step);
                            }}
                            className={cn(
                              "text-left p-3 rounded-lg border transition-all",
                              deckHeightIn === opt.heightIn
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/20 bg-white/[0.03] hover:border-white/30"
                            )}
                          >
                            <div className="font-semibold text-sm text-white">{opt.label}</div>
                            <div className="text-xs text-slate-400 mt-1">{opt.sub}</div>
                            {opt.requiresRailing && (
                              <div className="text-xs text-amber-400 mt-1">Railing required by code</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q2: Include railing? (only shown when ground-level) */}
                    {deckHeightIn < 30 && (
                      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Add railing anyway?</div>
                          <div className="text-xs text-slate-400 mt-0.5">Optional at this height — some homeowners add it for looks or resale value</div>
                        </div>
                        <button
                          onClick={() => setIncludeRailing(v => !v)}
                          className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0 ml-4", includeRailing ? ac.bgSolid : "bg-white/20")}
                        >
                          <span className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform"
                            style={{ transform: includeRailing ? 'translateX(20px)' : 'translateX(2px)' }} />
                        </button>
                      </div>
                    )}

                    {/* Q3: Railing style — friendly names, no LF */}
                    {includeRailing && (
                      <div>
                        <div className="text-sm font-semibold text-slate-200 mb-3">What railing style are you thinking?</div>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: "pt-wood",           label: "Basic & budget",   sub: "Painted or stained wood posts and balusters — clean and functional",         badge: "Most affordable" },
                            { id: "composite-select",  label: "Mid-range",        sub: "Low-maintenance composite or aluminum — popular choice for most homes",      badge: "Most popular"    },
                            { id: "cable",             label: "Premium look",     sub: "Cable, glass, or high-end composite — modern aesthetic, maximum views",      badge: "Premium"         },
                          ].map((opt) => {
                            const sys = RAILING_SYSTEMS.find(r => r.id === opt.id)!;
                            // Auto-set railingLF from deck size when a style is picked.
                            // For custom sizes use actual perimeter (width + 2*length); otherwise sqrt heuristic.
                            const autoLF = sizeId === "custom"
                              ? Math.round(customWidth + 2 * customLength)
                              : Math.round(Math.sqrt(DECK_SIZES.find(s => s.id === sizeId)?.sqFt ?? 320) * 3);
                            return (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setRailingId(opt.id);
                                  setRailingLF(autoLF);
                                  setConfirmedRailing(true);
                                  setConfirmedStep(step);
                                }}
                                className={cn(
                                  "text-left p-3 rounded-lg border transition-all",
                                  railingId === opt.id
                                    ? `${sel.border} ${sel.bg}`
                                    : "border-white/20 bg-white/[0.03] hover:border-white/30"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-sm text-white">{opt.label}</div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ac.badgeBg} ${ac.badgeText}`}>{opt.badge}</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">{opt.sub}</div>
                                <div className={`text-xs font-mono ${ac.text} mt-1`}>
                                  ${sys.installedPerLFMin}–${sys.installedPerLFMax}/ft installed
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Q4: Stairs — simple yes/no + step count */}
                    <div>
                      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Do you need stairs?</div>
                          <div className="text-xs text-slate-400 mt-0.5">Steps from the deck down to the yard or patio</div>
                        </div>
                        <button
                          onClick={() => setIncludeStairs(v => !v)}
                          className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0 ml-4", includeStairs ? ac.bgSolid : "bg-white/20")}
                        >
                          <span className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform"
                            style={{ transform: includeStairs ? 'translateX(20px)' : 'translateX(2px)' }} />
                        </button>
                      </div>
                      {includeStairs && (
                        <div className="mt-3 px-1">
                          <div className="text-sm font-semibold text-slate-300 mb-2">How many steps?</div>
                          <div className="flex items-center gap-3">
                            <input type="range" min={2} max={18} step={1} value={stairSteps}
                              onChange={(e) => setStairSteps(Number(e.target.value))}
                              className={`flex-1 ${ac.accent}`} />
                            <span className={`font-mono text-sm ${ac.text} w-20 text-right shrink-0`}>
                              {stairSteps} {stairSteps === 1 ? "step" : "steps"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">A typical raised deck needs 4–6 steps. A second-story deck may need 10–14.</div>
                        </div>
                      )}
                    </div>

                  </div>
                </StepCard>
              )}

              {/* ── DIY / CONTRACTOR: full-detail railing step ── */}
              {/* Contractor Railing is at step 6; DIY Railing is at step 7 */}
              {((step === 6 && audience === "contractor") || (step === 7 && audience === "diy")) && (
                <StepCard
                  title="Railing & extras"
                  subtitle="Railing can represent 15–30% of total project cost."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="Continue →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-5">

                    {/* Deck height selector */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deck Height Off Ground</div>
                      <div className="flex items-center gap-3">
                        <input type="range" min={6} max={120} step={6} value={deckHeightIn}
                          onChange={(e) => {
                            const h = Number(e.target.value);
                            setDeckHeightIn(h);
                            // If raised above 30", railing becomes required — force it on
                            if (h >= 30) setIncludeRailing(true);
                          }}
                          className={`flex-1 ${ac.accent}`} />
                        <span className={`font-mono text-sm ${ac.text} w-20 text-right shrink-0`}>
                          {deckHeightIn < 12 ? `${deckHeightIn}"` : `${Math.floor(deckHeightIn / 12)}' ${deckHeightIn % 12 > 0 ? `${deckHeightIn % 12}"` : ''}`.trim()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Most ground-level decks: 18–24". Raised decks: 36"–8'+</div>
                    </div>

                    {/* Low-deck railing banner */}
                    {deckHeightIn < 30 && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-400 text-base shrink-0">⚠️</span>
                          <div>
                            <div className="text-xs font-semibold text-amber-300">Railing not required by code at this height</div>
                            <div className="text-xs text-slate-400 mt-0.5">IRC requires guardrails on decks 30" or more above grade. You can still add railing for aesthetics or resale value.</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm font-semibold text-slate-300">Include railing anyway?</span>
                          <button
                            onClick={() => {
                              setIncludeRailing(v => !v);
                              if (includeRailing) {
                                // Turning off — clear visual selection
                                setConfirmedRailing(false);
                              }
                            }}
                            className={cn("relative w-10 h-5 rounded-full transition-colors", includeRailing ? ac.bgSolid : "bg-white/20")}
                          >
                            <span
                              className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform"
                              style={{ transform: includeRailing ? 'translateX(20px)' : 'translateX(2px)' }}
                            />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Railing system grid + length — only shown when railing is included */}
                    {includeRailing && (
                      <>
                      <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Railing System</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {RAILING_SYSTEMS.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              if (!confirmedRailing) {
                                // First interaction: select and mark confirmed
                                setRailingId(r.id);
                                setConfirmedRailing(true);
                                setConfirmedStep(step);
                              } else {
                                selectOrAdvance(railingId === r.id, () => setRailingId(r.id));
                              }
                            }}
                            className={cn(
                              "text-left p-3 rounded-lg border transition-all",
                              railingId === r.id
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/20 bg-white/[0.03] hover:border-white/30"
                            )}
                          >
                            <div className="font-semibold text-sm text-white">{r.label}</div>
                            <div className={`text-xs font-mono ${ac.text} mt-1`}>
                              ${r.materialPerLFMin}–${r.materialPerLFMax}/LF materials
                            </div>
                            {audience !== "diy" && (
                              <div className="text-xs text-slate-500">
                                ${r.installedPerLFMin}–${r.installedPerLFMax}/LF installed
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Railing Length</div>
                      <div className="flex items-center gap-3">
                        <input type="range" min={10} max={200} step={2} value={railingLF}
                          id={`railing-lf-slider-${audience}`}
                          onChange={(e) => setRailingLF(Number(e.target.value))}
                          className={`flex-1 ${ac.accent}`} />
                        <span className={`font-mono text-sm ${ac.text} w-16 text-right`}>{railingLF} LF</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Estimated for {DECK_SIZES.find(s => s.id === sizeId)?.dimensions ?? "your deck"}: ~{railingLF} LF (three open sides)
                      </div>
                    </div>
                      </>
                    )}

                    {/* ── CONTRACTOR RAILING SPEC ── */}
                    {audience === "contractor" && includeRailing && (
                      <div className={`rounded-lg border ${sel.border} bg-white/[0.03] p-4 space-y-5`}>
                        <div className={`text-xs font-bold uppercase tracking-wider ${ac.text}`}>Railing Spec (Contractor)</div>

                        {/* Post Mount Style */}
                        <div>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Post Mount Style</div>
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { id: "surface" as const, label: "Surface Mount", sub: "Post bolted to deck surface. Faster install.", delta: "+$8–$12/post" },
                              { id: "fascia"  as const, label: "Fascia Mount",  sub: "Post through fascia board. Cleaner look.",  delta: "+$15–$22/post" },
                            ]).map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setPostMountId(opt.id)}
                                className={cn(
                                  "text-left p-3 rounded-lg border transition-all",
                                  postMountId === opt.id
                                    ? `${sel.border} ${sel.bg}`
                                    : "border-white/20 bg-white/[0.03] hover:border-white/30"
                                )}
                              >
                                <div className="font-semibold text-sm text-white">{opt.label}</div>
                                <div className={`text-xs font-mono ${ac.text} mt-0.5`}>{opt.delta}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Post Spacing */}
                        <div>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Post Spacing (OC)</div>
                          <div className="grid grid-cols-3 gap-2">
                            {([4, 6, 8] as const).map((spacing) => {
                              const postCount = Math.max(2, Math.round(railingLF / spacing) + 1);
                              return (
                                <button
                                  key={spacing}
                                  onClick={() => setPostSpacingFt(spacing)}
                                  className={cn(
                                    "text-left p-3 rounded-lg border transition-all",
                                    postSpacingFt === spacing
                                      ? `${sel.border} ${sel.bg}`
                                      : "border-white/20 bg-white/[0.03] hover:border-white/30"
                                  )}
                                >
                                  <div className="font-semibold text-sm text-white">{spacing}' OC</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{postCount} posts est.</div>
                                  {spacing === 4 && <div className="text-xs text-slate-500">Max rigidity</div>}
                                  {spacing === 6 && <div className="text-xs text-slate-500">IRC standard</div>}
                                  {spacing === 8 && <div className="text-xs text-slate-500">Fewer posts</div>}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Railing Height */}
                        <div>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Railing Height</div>
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { h: 36 as const, label: '36"', sub: 'Standard residential (IRC R507.2)', badge: '' },
                              { h: 42 as const, label: '42"', sub: 'Elevated decks / commercial code', badge: `+$${Math.round(railingLF * 3)}–$${Math.round(railingLF * 5)}` },
                            ]).map((opt) => (
                              <button
                                key={opt.h}
                                onClick={() => setRailingHeightIn(opt.h)}
                                className={cn(
                                  "text-left p-3 rounded-lg border transition-all",
                                  railingHeightIn === opt.h
                                    ? `${sel.border} ${sel.bg}`
                                    : "border-white/20 bg-white/[0.03] hover:border-white/30"
                                )}
                              >
                                <div className="font-semibold text-sm text-white">{opt.label}</div>
                                {opt.badge && <div className={`text-xs font-mono ${ac.text} mt-0.5`}>{opt.badge}</div>}
                                <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Post count summary */}
                        <div className="text-xs text-slate-400 border-t border-white/10 pt-3">
                          <span className="text-slate-300 font-medium">{result.railingPostCount} posts</span>
                          {" "}estimated · {postSpacingFt}' OC · {postMountId === "fascia" ? "Fascia mount" : "Surface mount"} · {railingHeightIn}" height
                          {result.railingDetailCostLow > 0 && (
                            <span className={`ml-2 font-mono ${ac.text}`}>
                              +{formatCurrency(result.railingDetailCostLow)}–{formatCurrency(result.railingDetailCostHigh)} spec upcharge
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-slate-300">Include Stairs?</div>
                          <button
                          onClick={() => setIncludeStairs((v) => !v)}
                          className={cn("relative w-10 h-5 rounded-full transition-colors", includeStairs ? ac.bgSolid : "bg-white/20")}
                        >
                          <span className={cn(
                            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                           )}
                           style={{ transform: includeStairs ? 'translateX(20px)' : 'translateX(2px)' }}
                           />
                        </button>
                      </div>
                       {includeStairs && (
                         <>
                         <div className="space-y-3 mt-1">
                           <div className="flex items-center gap-3">
                             <span className="text-xs text-slate-400 w-16 shrink-0">Steps</span>
                             <input type="range" min={2} max={18} step={1} value={stairSteps}
                               onChange={(e) => setStairSteps(Number(e.target.value))}
                               className={`flex-1 ${ac.accent}`} />
                             <span className={`font-mono text-sm ${ac.text} w-16 text-right`}>{stairSteps} steps</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className="text-xs text-slate-400 w-16 shrink-0">Width</span>
                             <div className="flex flex-1 gap-1">
                               {[4,5,6,7,8].map(w => (
                                 <button
                                   key={w}
                                   onClick={() => setStairWidthFt(w)}
                                   className={cn(
                                     "flex-1 py-1 rounded text-xs font-semibold border transition-colors",
                                     stairWidthFt === w
                                       ? `${ac.bgSolid} ${ac.border} text-white`
                                       : `bg-white/5 border-white/[0.18] text-slate-400`
                                   )}
                                 >{w}ft</button>
                               ))}
                             </div>
                             <span className={`font-mono text-sm ${ac.text} w-16 text-right`}>
                               {stairWidthFt === 4 ? 'base' : `+$${(stairWidthFt - 4) * 100}/step`}
                             </span>
                           </div>
                         </div>
                         </>
                         )}
                         {includeStairs && (
                         <>
                         {/* Stair railing toggle */}
                         <div className="flex items-center justify-between pt-1">
                           <div>
                             <div className="text-sm font-semibold text-slate-300 pt-2 mt-1 mb-1.5">Include stair railing</div>
                             <div className="text-xs text-slate-500 mt-0.5">Matches your deck railing system</div>
                           </div>
                           <button
                             onClick={() => setIncludeStairRailing(v => !v)}
                             className={cn("relative w-10 h-5 rounded-full transition-colors", includeStairRailing ? ac.bgSolid : "bg-white/20")}
                           >
                             <span
                               className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform"
                               style={{ transform: includeStairRailing ? 'translateX(20px)' : 'translateX(2px)' }}
                             />
                           </button>
                         </div>
                         </>
                       )}
                    </div>
                  </div>
                </StepCard>
              )}

               {/* ════════════════════════════════════════════════════════════
                  DIY-SPECIFIC STEPS 8–9
              ════════════════════════════════════════════════════════════ */}

              {/* ── DIY STEP 8: SKILL LEVEL & TOOL RENTAL ── */}
              {step === 8 && audience === "diy" && (
                <StepCard
                  title="Your skill level & tools"
                  subtitle="Skill level affects material waste. Tool rental adds to your true project cost."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="Continue →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-6">
                    {/* Skill level */}
                    <div>
                      <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider mb-3`}>
                        Experience Level
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {DIY_SKILL_LEVELS.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => selectOrAdvance(skillLevelId === s.id, () => setSkillLevelId(s.id))}
                            className={cn(
                              "text-left p-3 rounded-lg border transition-all",
                              skillLevelId === s.id
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/20 bg-white/[0.03] hover:border-white/30"
                            )}
                          >
                            <div className="font-semibold text-sm text-white">{s.label}</div>
                            <div className="text-xs text-slate-400 mt-1">{s.description}</div>
                            <div className={`mt-2 text-xs font-mono ${ac.text}`}>
                              +{Math.round(s.wasteFactor * 100)}% waste
                            </div>
                            {s.notes.map((n, i) => (
                              <div key={i} className="text-xs text-slate-500 mt-1 leading-tight">• {n}</div>
                            ))}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tool rental */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>
                          Tool Rental (select what you need to rent)
                        </div>
                        <div className="text-xs text-slate-500">
                          {selectedTools.length} selected
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        Uncheck tools you already own. Costs are per-rental from Home Depot / Sunbelt.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {TOOL_RENTAL_OPTIONS.map((t) => {
                          const checked = selectedTools.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggleTool(t.id)}
                              className={cn(
                                "text-left p-3 rounded-lg border transition-all",
                                checked
                                  ? `${sel.border} ${sel.bg}`
                                  : "border-white/20 bg-white/[0.03] hover:border-white/30"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                                      checked ? `${ac.bgSolid} ${ac.border}` : "border-white/30"
                                    )}>
                                      {checked && <span className="text-[8px] text-white font-bold">✓</span>}
                                    </div>
                                    <span className="font-semibold text-xs text-white">{t.label}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1 ml-5">{t.description}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className={`text-xs font-mono ${ac.text}`}>
                                    ${t.dailyRentLow}–${t.dailyRentHigh}/day
                                  </div>
                                  <div className="text-xs text-slate-600">{t.daysNeeded}d needed</div>
                                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                                    ≈ ${t.dailyRentLow * t.daysNeeded}–${t.dailyRentHigh * t.daysNeeded}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </StepCard>
              )}

              {/* ── DIY STEP 9: PERMIT ── */}
              {step === 9 && audience === "diy" && (
                <StepCard
                  title="Permit & Fees"
                  subtitle="Most jurisdictions require a building permit for decks over 200 sq ft or 30 inches off the ground."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="See My Estimate →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-4">
                    <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>
                      Select your permit situation
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* No permit card */}
                      <button
                        onClick={() => selectOrAdvance(!includePermit, () => { setIncludePermit(false); setPermitCost(0); })}
                        className={cn(
                          "p-4 rounded-lg border text-left transition-all col-span-2",
                          !includePermit
                            ? "border-slate-400 bg-slate-500/10"
                            : "border-white/20 bg-white/[0.03] hover:border-white/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">🚫</span>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-white">No permit needed</div>
                            <div className="text-xs text-slate-400 mt-1">
                              Ground-level decks under 30" high, or decks under 200 sq ft, are exempt from permits in many jurisdictions. Verify with your local building department.
                            </div>
                            <div className="text-xs text-slate-500 mt-1">$0 permit cost</div>
                          </div>
                          {!includePermit && <div className="text-xs text-slate-300 shrink-0">✓ Selected</div>}
                        </div>
                      </button>

                      {/* Jurisdiction cards */}
                      {[
{ label: "Rural / Small town", desc: "Low-density areas, rural counties", range: "$200–$500", value: 350, icon: "🌾" },
                         { label: "Suburban", desc: "Most metro suburbs and mid-size cities", range: "$500–$1,000", value: 700, icon: "🏘️" },
                         { label: "Urban / Major metro", desc: "Dense cities, strict code enforcement", range: "$1,000–$2,000", value: 1500, icon: "🏙️" },
                         { label: "California / High-cost", desc: "CA jurisdictions, NYC, Seattle, etc.", range: "$2,000–$4,000+", value: 3000, icon: "💰" },
                      ].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => selectOrAdvance(includePermit && permitCost === p.value, () => { setIncludePermit(true); setPermitCost(p.value); })}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            includePermit && permitCost === p.value
                              ? `${sel.border} ${sel.bg}`
                              : "border-white/20 bg-white/[0.03] hover:border-white/30"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{p.icon}</span>
                            <div className="text-xs font-semibold text-white">{p.label}</div>
                          </div>
                          <div className="text-xs text-slate-400">{p.desc}</div>
                          <div className={`text-sm font-mono ${ac.text} mt-2`}>{p.range}</div>
                          {includePermit && permitCost === p.value && (
                            <div className={`text-xs ${ac.textSelected} mt-1`}>✓ Selected</div>
                          )}
                        </button>
                      ))}
                    </div>
                    {includePermit && (
                      <div className="text-xs text-slate-500 pt-1">
                        ⚠️ Pulling your own permit as a homeowner is legal in most states. Skipping a required permit can void homeowner's insurance and create issues at resale.
                      </div>
                    )}

                    {/* ── ENGINEER FEE (DIY) ── */}
                    <div className="pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>Structural Engineer Fee</div>
                          <div className="text-xs text-slate-500 mt-0.5">Required in many jurisdictions for custom or elevated decks</div>
                        </div>
                        <button
                          onClick={() => setIncludeEngineer((v) => !v)}
                          className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0", includeEngineer ? ac.bgSolid : "bg-white/20")}
                          aria-label="Toggle engineer fee"
                        >
                          <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                            style={{ transform: includeEngineer ? 'translateX(20px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>
                      {includeEngineer && (
                        <div className="grid grid-cols-1 gap-2">
                          {ENGINEER_FEE_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => selectOrAdvance(engineerCost === preset.fee, () => setEngineerCost(preset.fee))}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all",
                                engineerCost === preset.fee ? `${sel.border} ${sel.bg}` : "border-white/20 bg-white/[0.03] hover:border-white/30"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-white">{preset.label}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{preset.typical}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className={`text-sm font-mono font-semibold ${ac.text}`}>{preset.range}</div>
                                  {engineerCost === preset.fee && <div className={`text-xs ${ac.textSelected}`}>✓ Selected</div>}
                                </div>
                              </div>
                            </button>
                          ))}
                          <div className="text-xs text-slate-500 mt-1">
                            If your jurisdiction requires stamped plans, you'll need to hire a structural engineer before your permit is approved.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </StepCard>
              )}

              {/* ── HOMEOWNER STEP 8: PERMIT ── */}
              {step === 8 && audience === "homeowner" && (
                <StepCard
                  title="Permit & Fees"
                  subtitle="Most jurisdictions require a building permit for decks over 200 sq ft or 30 inches off the ground."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="See My Estimate →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-3">
                    <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>Select your permit situation</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => selectOrAdvance(!includePermit, () => { setIncludePermit(false); setPermitCost(0); })}
                        className={cn(
                          "p-4 rounded-lg border text-left transition-all col-span-2",
                          !includePermit ? "border-slate-400 bg-slate-500/10" : "border-white/20 bg-white/[0.03] hover:border-white/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">🚫</span>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-white">No permit needed</div>
                            <div className="text-xs text-slate-400 mt-1">Ground-level decks under 30" high, or decks under 200 sq ft, are exempt from permits in many jurisdictions. Verify with your local building department.</div>
                            <div className="text-xs text-slate-500 mt-1">$0 permit cost</div>
                          </div>
                          {!includePermit && <div className="text-xs text-slate-300 shrink-0">✓ Selected</div>}
                        </div>
                      </button>
                      {[{ label: "Rural / Small town", value: 300, range: "$150–$500", icon: "🏘️" }, { label: "Suburban", value: 700, range: "$400–$1,000", icon: "🏡" }, { label: "Urban / Major metro", value: 1200, range: "$800–$1,600", icon: "🏙️" }, { label: "California / High-cost", value: 2000, range: "$1,200–$3,000+", icon: "☀️" }].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => selectOrAdvance(includePermit && permitCost === p.value, () => { setIncludePermit(true); setPermitCost(p.value); })}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            includePermit && permitCost === p.value ? `${sel.border} ${sel.bg}` : "border-white/20 bg-white/[0.03] hover:border-white/30"
                          )}
                        >
                          <div className="text-lg mb-1">{p.icon}</div>
                          <div className="font-semibold text-xs text-white">{p.label}</div>
                          <div className={`text-sm font-mono ${ac.text} mt-2`}>{p.range}</div>
                          {includePermit && permitCost === p.value && <div className={`text-xs ${ac.textSelected} mt-1`}>✓ Selected</div>}
                        </button>
                      ))}
                    </div>
                    {includePermit && (
                      <div className="text-xs text-slate-500 pt-1">⚠️ Your contractor typically handles permit pulling. Confirm this is included in their quote — some contractors charge separately for permit fees.</div>
                    )}

                    {/* ── ENGINEER FEE (HOMEOWNER) ── */}
                    <div className="pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>Structural Engineer Fee</div>
                          <div className="text-xs text-slate-500 mt-0.5">Required in many jurisdictions for custom or elevated decks</div>
                        </div>
                        <button
                          onClick={() => setIncludeEngineer((v) => !v)}
                          className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0", includeEngineer ? ac.bgSolid : "bg-white/20")}
                          aria-label="Toggle engineer fee"
                        >
                          <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                            style={{ transform: includeEngineer ? 'translateX(20px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>
                      {includeEngineer && (
                        <div className="grid grid-cols-1 gap-2">
                          {ENGINEER_FEE_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => selectOrAdvance(engineerCost === preset.fee, () => setEngineerCost(preset.fee))}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all",
                                engineerCost === preset.fee ? `${sel.border} ${sel.bg}` : "border-white/20 bg-white/[0.03] hover:border-white/30"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-white">{preset.label}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{preset.typical}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className={`text-sm font-mono font-semibold ${ac.text}`}>{preset.range}</div>
                                  {engineerCost === preset.fee && <div className={`text-xs ${ac.textSelected}`}>✓ Selected</div>}
                                </div>
                              </div>
                            </button>
                          ))}
                          <div className="text-xs text-slate-500 mt-1">
                            Your contractor typically arranges engineering. Confirm whether this is included in their quote or billed separately.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </StepCard>
              )}

                  {/* ════════════════════════════════════════════════════════
                  CONTRACTOR-SPECIFIC STEPS 7–9
              ════════════════════════════════════════════════════════════ */}

              {/* ── CONTRACTOR STEP 7: MARKUP & CREW ── */}
              {step === 7 && audience === "contractor" && (
                <StepCard
                  title="Markup & crew size"
                  subtitle="Set your margin tier and crew to generate a bid range and gross margin estimate."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="Continue →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-6">
                    {/* Markup tier */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>Margin Tier</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{includeMarkup ? "On" : "Off"}</span>
                          <button
                            onClick={() => setIncludeMarkup(!includeMarkup)}
                            className={cn(
                              "relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none",
                              includeMarkup ? ac.bgSolid : "bg-white/20"
                            )}
                          >
                            <span
                              className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                              style={{ transform: includeMarkup ? 'translateX(20px)' : 'translateX(2px)' }}
                            />
                          </button>
                        </div>
                      </div>
                      {!includeMarkup && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-3">
                          <span className="text-amber-400 text-sm mt-0.5">⚠</span>
                          <div className="text-xs text-amber-300">
                            <span className="font-semibold">Markup disabled.</span> Your bid will reflect cost-only pricing — no profit margin, overhead recovery, or contingency. This will produce a below-market bid. Only use this for internal cost estimates.
                          </div>
                        </div>
                      )}
                      <div className={cn("flex flex-col gap-2 transition-opacity", !includeMarkup && "opacity-30 pointer-events-none")}>
                        {CONTRACTOR_MARKUP_TIERS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => selectOrAdvance(markupTierId === m.id, () => setMarkupTierId(m.id))}
                            className={cn(
                              "text-left p-4 rounded-lg border transition-all",
                              markupTierId === m.id
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/20 bg-white/[0.03] hover:border-white/30"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-white">{m.label}</div>
                                <div className="text-xs text-slate-400 mt-1">{m.description}</div>
                              </div>
                              <div className="text-right shrink-0 space-y-0.5">
                                <div className={`text-xs font-mono ${ac.text}`}>
                                  Materials +{Math.round(m.materialMarkup * 100)}%
                                </div>
                                <div className={`text-xs font-mono ${ac.text} opacity-80`}>
                                  Labor +{Math.round(m.laborMarkup * 100)}%
                                </div>
                                <div className="text-xs text-slate-500">
                                  Overhead {Math.round(m.overheadPct * 100)}%
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Crew size */}
                    <div>
                       <div className="flex items-center justify-between mb-3">
                         <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>Crew Size</div>
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-400">{includeCrew ? "On" : "Off"}</span>
                           <button
                             onClick={() => setIncludeCrew(!includeCrew)}
                             className={cn(
                               "relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none",
                               includeCrew ? ac.bgSolid : "bg-white/20"
                             )}
                           >
                             <span
                               className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                               style={{ transform: includeCrew ? 'translateX(20px)' : 'translateX(2px)' }}
                             />
                           </button>
                         </div>
                       </div>
                       <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2 transition-opacity", !includeCrew && "opacity-30 pointer-events-none")}>
                        {CREW_SIZES.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => selectOrAdvance(crewSizeId === c.id, () => setCrewSizeId(c.id))}
                            className={cn(
                              "text-left p-3 rounded-lg border transition-all",
                              crewSizeId === c.id
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/20 bg-white/[0.03] hover:border-white/30"
                            )}
                          >
                            <div className="font-semibold text-xs text-white">{c.label}</div>
                            <div className={`text-xs font-mono ${ac.text} mt-1`}>
                              {c.laborEfficiencyFactor}× efficiency
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </StepCard>
              )}

              {/* ── CONTRACTOR STEP 9: EXTRAS ── */}
              {step === 9 && audience === "contractor" && (
                <StepCard
                  title="Extras & subcontracting"
                  subtitle="Indicate demo, subcontracted work, and other add-ons. Subcontracted items are excluded from your markup."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="See My Estimate →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-4">
                    {/* ── FOOTING SPEC (contractor only) ── */}
                    <div className={`p-4 rounded-lg border ${ac.border} bg-white/[0.03]`}>
                      <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider mb-3`}>Footing Spec (Contractor)</div>

                      {/* Helical pier toggle */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="font-semibold text-sm text-white">Use Helical Piers?</div>
                          <div className="text-xs text-slate-400 mt-1">
                            Replaces concrete tube footings. No excavation needed — ideal for expansive soils,
                            high frost zones, or sites with limited access. Installed cost: $250–$450/pier.
                          </div>
                          {useHelicalPiers && (
                            <div className={`text-xs font-mono ${ac.text} mt-1`}>
                              {result.footingCount} piers ·{" "}
                              {result.footingSpecCostLow >= 0
                                ? `+${formatCurrency(result.footingSpecCostLow)} to +${formatCurrency(result.footingSpecCostHigh)} vs tube footings`
                                : `saves ${formatCurrency(Math.abs(result.footingSpecCostHigh))}–${formatCurrency(Math.abs(result.footingSpecCostLow))} vs tube footings`
                              }
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setUseHelicalPiers((v) => !v)}
                          className={cn(
                            "relative w-10 h-5 rounded-full transition-colors shrink-0 mt-1",
                            useHelicalPiers ? ac.bgSolid : "bg-white/20"
                          )}
                        >
                          <span
                            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                            style={{ transform: useHelicalPiers ? 'translateX(20px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>

                      {/* Footing diameter selector — hidden when helical piers selected */}
                      {!useHelicalPiers && (
                        <div>
                          <div className="text-xs text-slate-400 mb-2">Tube Footing Diameter</div>
                          <div className="grid grid-cols-4 gap-2">
                            {([8, 10, 12, 16] as const).map((d) => {
                              const costs: Record<8|10|12|16, [number,number]> = {
                                8:  [55,  90],
                                10: [68,  120],
                                12: [90,  160],
                                16: [145, 240],
                              };
                              const [lo, hi] = costs[d];
                              const isBase = d === 10;
                              const delta = (lo - 68) * result.footingCount;
                              return (
                                <button
                                  key={d}
                                  onClick={() => setFootingDiameterIn(d)}
                                  className={cn(
                                    "p-3 rounded-lg border text-left transition-all",
                                    footingDiameterIn === d
                                      ? `${sel.border} ${sel.bg}`
                                      : "border-white/20 bg-white/[0.03] hover:border-white/30"
                                  )}
                                >
                                  <div className="font-semibold text-sm text-white">{d}"</div>
                                  <div className={`text-xs font-mono mt-0.5 ${
                                    isBase ? 'text-slate-400' :
                                    delta > 0 ? 'text-amber-400' : 'text-emerald-400'
                                  }`}>
                                    {isBase ? 'Baseline' :
                                     delta > 0 ? `+${formatCurrency(delta)}` :
                                     `−${formatCurrency(Math.abs(delta))}`}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">${lo}–${hi}/ea</div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            {result.footingCount} footings · {result.footingDiameterIn}" diameter · based on deck size ·{" "}
                            {result.footingSpecCostLow === 0
                              ? "Baseline pricing"
                              : result.footingSpecCostLow > 0
                                ? `+${formatCurrency(result.footingSpecCostLow)}–+${formatCurrency(result.footingSpecCostHigh)} vs 10" baseline`
                                : `saves ${formatCurrency(Math.abs(result.footingSpecCostHigh))}–${formatCurrency(Math.abs(result.footingSpecCostLow))} vs 10" baseline`
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sub footings toggle */}
                    <div className={cn(
                      "p-4 rounded-lg border transition-all",
                      subFootings ? `${sel.border} ${sel.bg}` : "border-white/20 bg-white/[0.03]"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm text-white">Sub out footings / concrete work?</div>
                          <div className="text-xs text-slate-400 mt-1">
                            Many deck contractors sub concrete work to a foundation specialist.
                            Subcontracted footings are passed through at cost + 15% coordination fee,
                            and excluded from your labor markup.
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            Typical footing sub cost for this project:{" "}
                            <span className={`font-mono ${ac.text}`}>
                              {formatCurrency(result.footingLow)} – {formatCurrency(result.footingHigh)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSubFootings((v) => !v)}
                          className={cn(
                            "relative w-10 h-5 rounded-full transition-colors shrink-0 mt-1",
                            subFootings ? ac.bgSolid : "bg-white/20"
                          )}
                        >
                          <span className={cn(
                            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                           )}
                           style={{ transform: subFootings ? 'translateX(20px)' : 'translateX(2px)' }}
                           />
                        </button>
                      </div>
                    </div>

                    {/* Demo / Removal toggle */}
                    <div className={cn(
                      "p-4 rounded-lg border transition-all",
                      includeDemoRemoval ? `${sel.border} ${sel.bg}` : "border-white/20 bg-white/[0.03]"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-white">Include demo & removal of existing deck?</div>
                          <div className="text-xs text-slate-400 mt-1">
                            Adds labor, disposal, and optional demo permit to your bid.
                            Pricing based on 2026 HomeGuide & Angi data.
                          </div>
                        </div>
                        <button
                          onClick={() => setIncludeDemoRemoval((v) => !v)}
                          className={cn(
                            "relative w-10 h-5 rounded-full transition-colors shrink-0 mt-1",
                            includeDemoRemoval ? ac.bgSolid : "bg-white/20"
                          )}
                        >
                          <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                            style={{ transform: includeDemoRemoval ? 'translateX(20px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>

                      {includeDemoRemoval && (
                        <div className="mt-4 space-y-3">
                          {/* Existing material type */}
                          <div>
                            <div className="text-xs text-slate-400 mb-2">Existing deck material</div>
                            <div className="grid grid-cols-3 gap-2">
                              {(["wood", "composite", "other"] as const).map((mat) => (
                                <button
                                  key={mat}
                                  onClick={() => setDemoMaterialType(mat)}
                                  className={cn(
                                    "p-2 rounded border text-xs font-medium transition-all",
                                    demoMaterialType === mat
                                      ? `${sel.border} ${sel.bg} text-white`
                                      : "border-white/20 text-slate-400 hover:border-white/40"
                                  )}
                                >
                                  {mat === "wood" ? "PT Wood" : mat === "composite" ? "Composite" : "Other / Unknown"}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Disposal toggle */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-300">Include disposal / dumpster?</div>
                              <div className="text-xs text-slate-500">Haul-away fee: {result.demolitionLow > 0 ? `+${formatCurrency(demoMaterialType === "composite" ? (result.size.sqFt <= 200 ? 300 : result.size.sqFt <= 400 ? 400 : 550) : (result.size.sqFt <= 200 ? 300 : result.size.sqFt <= 400 ? 400 : 550))} – ${formatCurrency(result.size.sqFt <= 200 ? 450 : result.size.sqFt <= 400 ? 600 : 800)}` : "$300–$800 depending on size"}</div>
                            </div>
                            <button
                              onClick={() => setDemoIncludeDisposal((v) => !v)}
                              className={cn(
                                "relative w-10 h-5 rounded-full transition-colors shrink-0",
                                demoIncludeDisposal ? ac.bgSolid : "bg-white/20"
                              )}
                            >
                              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                                style={{ transform: demoIncludeDisposal ? 'translateX(20px)' : 'translateX(2px)' }}
                              />
                            </button>
                          </div>

                          {/* Demo permit toggle */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-300">Demo permit required?</div>
                              <div className="text-xs text-slate-500">Some jurisdictions require a permit for deck removal (+$75 pass-through)</div>
                            </div>
                            <button
                              onClick={() => setDemoPermit((v) => !v)}
                              className={cn(
                                "relative w-10 h-5 rounded-full transition-colors shrink-0",
                                demoPermit ? ac.bgSolid : "bg-white/20"
                              )}
                            >
                              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                                style={{ transform: demoPermit ? 'translateX(20px)' : 'translateX(2px)' }}
                              />
                            </button>
                          </div>

                          {/* Demo cost preview */}
                          <div className={`text-xs font-mono ${ac.text} pt-1`}>
                            Demo & removal cost: {formatRange(result.demolitionLow, result.demolitionHigh)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3D Rendering option */}
                    <div className={cn(
                      "p-4 rounded-lg border transition-all",
                      rendering3dTier !== "none" ? `${sel.border} ${sel.bg}` : "border-white/20 bg-white/[0.03]"
                    )}>
                      <div className="font-semibold text-sm text-white mb-1">3D Rendering Service</div>
                      <div className="text-xs text-slate-400 mb-3">
                        Add a professional 3D visualization of the deck to your bid. Passed through at cost — helps clients approve faster and reduces change orders.
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {([
                          {
                            id: "none" as const,
                            label: "No rendering",
                            sub: "Proceed without a 3D visualization.",
                            price: "—",
                          },
                          {
                            id: "basic" as const,
                            label: "Basic",
                            sub: "1–2 rendered views, standard quality. Good for simple rectangular decks.",
                            price: "$199–$400",
                          },
                          {
                            id: "professional" as const,
                            label: "Professional",
                            sub: "3–5 photo-realistic views with materials shown. Best for most projects.",
                            price: "$400–$800",
                          },
                          {
                            id: "premium" as const,
                            label: "Premium",
                            sub: "Full view set + one revision round. Ideal for multi-level or complex builds.",
                            price: "$800–$1,500",
                          },
                        ]).map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setRendering3dTier(opt.id)}
                            className={cn(
                              "text-left px-3 py-2 rounded-md border transition-all",
                              rendering3dTier === opt.id
                                ? `${sel.border} ${sel.bg}`
                                : "border-white/15 bg-white/[0.02] hover:border-white/25"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-white">{opt.label}</span>
                              <span className={cn(
                                "text-xs font-mono shrink-0",
                                opt.id === "none" ? "text-slate-500" : "text-amber-400"
                              )}>{opt.price}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bid preview card */}
                    {result.contractor && (
                      <div className={`p-4 rounded-lg border ${sel.border} bg-opacity-5 ${sel.bg}`}>
                        <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider mb-3`}>
                          Bid Preview
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                          <div className="text-slate-400">Materials (with markup)</div>
                          <div className="font-mono text-right text-white">
                            {formatCurrency(result.contractor.materialWithMarkup)}
                          </div>
                          <div className="text-slate-400">Labor (with markup)</div>
                          <div className="font-mono text-right text-white">
                            {formatCurrency(result.contractor.laborWithMarkup)}
                          </div>
                          <div className="text-slate-400">Overhead</div>
                          <div className="font-mono text-right text-white">
                            {formatCurrency(result.contractor.overhead)}
                          </div>
                          {subFootings && (
                            <>
                              <div className="text-slate-400">Footing sub (pass-through)</div>
                              <div className="font-mono text-right text-white">
                                {formatCurrency(result.contractor.subFootingsCost)}
                              </div>
                            </>
                          )}
                          {includeDemoRemoval && (
                            <>
                              <div className="text-slate-400">Demo & removal</div>
                              <div className="font-mono text-right text-white">
                                {formatRange(result.demolitionLow, result.demolitionHigh)}
                              </div>
                            </>
                          )}
                          {rendering3dTier !== "none" && (
                            <>
                              <div className="text-slate-400">3D rendering (pass-through)</div>
                              <div className="font-mono text-right text-white">
                                {formatRange(result.rendering3dCostLow, result.rendering3dCostHigh)}
                              </div>
                            </>
                          )}
                          <div className="text-slate-400 font-semibold border-t border-white/[0.18] pt-2">Total Bid Range</div>
                          <div className={`font-mono text-right ${ac.text} font-semibold border-t border-white/[0.18] pt-2`}>
                            {formatRange(result.contractor.totalBidLow, result.contractor.totalBidHigh)}
                          </div>
                          <div className="text-slate-400">Gross Margin</div>
                          <div className={cn(
                            "font-mono text-right font-semibold",
                            result.contractor.grossMarginPct >= 30 ? "text-green-400"
                            : result.contractor.grossMarginPct >= 20 ? "text-amber-400"
                            : "text-red-400"
                          )}>
                            {result.contractor.grossMarginPct}%
                          </div>
                          <div className="text-slate-400">Est. crew days</div>
                          <div className="font-mono text-right text-white">
                            {result.contractor.estimatedDays} days
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </StepCard>
              )}

              {/* ── CONTRACTOR STEP 8: PERMIT ── */}
              {step === 8 && audience === "contractor" && (
                <StepCard
                  title="Permit & Fees"
                  subtitle="Most jurisdictions require a building permit for decks over 200 sq ft or 30 inches off the ground."
                  onNext={goNext}
                  showTapHint={confirmedStep === step}
                  onBack={goBack}
                  nextLabel="Continue →"
                  accentBtnClass={ac.btnClass}
                >
                  <div className="space-y-3">
                    <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>Select your permit situation</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => selectOrAdvance(!includePermit, () => { setIncludePermit(false); setPermitCost(0); })}
                        className={cn(
                          "p-4 rounded-lg border text-left transition-all col-span-2",
                          !includePermit ? "border-slate-400 bg-slate-500/10" : "border-white/20 bg-white/[0.03] hover:border-white/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">🚫</span>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-white">No permit needed</div>
                            <div className="text-xs text-slate-400 mt-1">Ground-level decks under 30" high, or decks under 200 sq ft, are exempt from permits in many jurisdictions. Verify with your local building department.</div>
                            <div className="text-xs text-slate-500 mt-1">$0 permit cost</div>
                          </div>
                          {!includePermit && <div className="text-xs text-slate-300 shrink-0">✓ Selected</div>}
                        </div>
                      </button>
                      {[{ label: "Rural / Small town", value: 300, range: "$150–$500", icon: "🏘️" }, { label: "Suburban", value: 700, range: "$400–$1,000", icon: "🏡" }, { label: "Urban / Major metro", value: 1200, range: "$800–$1,600", icon: "🏙️" }, { label: "California / High-cost", value: 2000, range: "$1,200–$3,000+", icon: "☀️" }].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => selectOrAdvance(includePermit && permitCost === p.value, () => { setIncludePermit(true); setPermitCost(p.value); })}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            includePermit && permitCost === p.value ? `${sel.border} ${sel.bg}` : "border-white/20 bg-white/[0.03] hover:border-white/30"
                          )}
                        >
                          <div className="text-lg mb-1">{p.icon}</div>
                          <div className="font-semibold text-xs text-white">{p.label}</div>
                          <div className={`text-sm font-mono ${ac.text} mt-2`}>{p.range}</div>
                          {includePermit && permitCost === p.value && <div className={`text-xs ${ac.textSelected} mt-1`}>✓ Selected</div>}
                        </button>
                      ))}
                    </div>
                    {includePermit && (
                      <div className="text-xs text-slate-500 pt-1">⚠️ Permit fees are typically passed through to the client at cost. Confirm whether your quote includes permit pulling as a line item or as a separate charge.</div>
                    )}

                    {/* ── ENGINEER FEE (CONTRACTOR) ── */}
                    <div className="pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className={`text-xs font-semibold ${ac.text} uppercase tracking-wider`}>Structural Engineer Fee</div>
                          <div className="text-xs text-slate-500 mt-0.5">Pass-through line item — not marked up</div>
                        </div>
                        <button
                          onClick={() => setIncludeEngineer((v) => !v)}
                          className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0", includeEngineer ? ac.bgSolid : "bg-white/20")}
                          aria-label="Toggle engineer fee"
                        >
                          <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                            style={{ transform: includeEngineer ? 'translateX(20px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>
                      {includeEngineer && (
                        <div className="space-y-3">
                          {/* Mode switcher: Use average vs My engineer */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEngineerCostMode("preset")}
                              className={cn(
                                "flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                                engineerCostMode === "preset" ? `${sel.border} ${sel.bg} text-white` : "border-white/20 text-slate-400 hover:border-white/30"
                              )}
                            >
                              Use average
                            </button>
                            <button
                              onClick={() => setEngineerCostMode("custom")}
                              className={cn(
                                "flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                                engineerCostMode === "custom" ? `${sel.border} ${sel.bg} text-white` : "border-white/20 text-slate-400 hover:border-white/30"
                              )}
                            >
                              My engineer
                            </button>
                          </div>

                          {engineerCostMode === "preset" ? (
                            <div className="grid grid-cols-1 gap-2">
                              {ENGINEER_FEE_PRESETS.map((preset) => (
                                <button
                                  key={preset.id}
                                  onClick={() => selectOrAdvance(engineerCost === preset.fee, () => setEngineerCost(preset.fee))}
                                  className={cn(
                                    "p-3 rounded-lg border text-left transition-all",
                                    engineerCost === preset.fee ? `${sel.border} ${sel.bg}` : "border-white/20 bg-white/[0.03] hover:border-white/30"
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-white">{preset.label}</div>
                                      <div className="text-xs text-slate-400 mt-0.5">{preset.typical}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className={`text-sm font-mono font-semibold ${ac.text}`}>{preset.range}</div>
                                      {engineerCost === preset.fee && <div className={`text-xs ${ac.textSelected}`}>✓ Selected</div>}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs text-slate-400">Enter the exact fee your engineer charges:</div>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  placeholder="650"
                                  value={engineerCustomInput}
                                  onChange={(e) => {
                                    setEngineerCustomInput(e.target.value);
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val >= 0) setEngineerCost(val);
                                  }}
                                  className="w-full pl-7 pr-3 py-2 rounded-lg bg-white/[0.05] border border-white/20 text-white text-sm font-mono focus:outline-none focus:border-amber-500/60 placeholder:text-slate-600"
                                />
                              </div>
                              <div className="text-xs text-slate-500">This will appear as a pass-through line item in your bid.</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </StepCard>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-4 px-4 sm:px-6 text-center">
        <p className="text-xs text-slate-600">
          Estimates based on{" "}
          <em>The Complete Guide to Deck Building Costs in 2026</em>. Data sourced from HomeAdvisor, HomeGuide, Advantage Lumber, BLS, and regional retailers.{" "}
          <strong className="text-slate-500">For budgeting purposes only.</strong> Verify all pricing with local contractors and suppliers before committing.
        </p>
      </footer>
    </div>
  );
}
