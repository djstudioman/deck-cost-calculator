/**
 * DECK COST CALCULATOR — HOME PAGE
 * Design: Precision Engineering
 * - Dark navy (#0B1120) base, electric amber (#F59E0B) accent
 * - Wizard flow:
 *   Homeowner: Audience → Region → Size → Material → Complexity → Railing → Results
 *   DIYer:     Audience → Region → Size → Material → Complexity → Railing → Skill + Tools → Permit → Results
 *   Contractor: Audience → Region → Size → Material → Complexity → Railing → Markup + Crew → Sub-footings → Results
 * - Space Grotesk headings, JetBrains Mono for cost figures
 */

import { useState, useCallback, useMemo } from "react";
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
  calculate,
  formatCurrency,
  formatRange,
  type AudienceType,
  type CalculatorInputs,
  type CalculatorResult,
} from "@/lib/deckData";
import ResultsPanel from "@/components/ResultsPanel";
import StepCard from "@/components/StepCard";
import { cn } from "@/lib/utils";

// ─── STEP DEFINITIONS ──────────────────────────────────────────────────────────
// Shared steps 0–5 are the same for all audiences.
// Steps 6–7 branch by audience.

const SHARED_STEP_LABELS = [
  "Who are you?",
  "Your Region",
  "Deck Size",
  "Material Tier",
  "Complexity",
  "Railing & Extras",
];

const DIY_EXTRA_LABELS = ["Skill & Tools", "Permit"];
const CONTRACTOR_EXTRA_LABELS = ["Markup & Crew", "Subcontracting"];

function getStepLabels(audience: AudienceType): string[] {
  if (audience === "diy") return [...SHARED_STEP_LABELS, ...DIY_EXTRA_LABELS];
  if (audience === "contractor") return [...SHARED_STEP_LABELS, ...CONTRACTOR_EXTRA_LABELS];
  return SHARED_STEP_LABELS;
}

function getTotalSteps(audience: AudienceType): number {
  return getStepLabels(audience).length;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Shared inputs
  const [audience, setAudience] = useState<AudienceType>("homeowner");
  const [regionId, setRegionId] = useState("mid-atlantic");
  const [sizeId, setSizeId] = useState("320");
  const [tierId, setTierId] = useState("composite");
  const [complexityId, setComplexityId] = useState("standard");
  const [railingId, setRailingId] = useState("composite-select");
  const [railingLF, setRailingLF] = useState(52);
  const [includeStairs, setIncludeStairs] = useState(true);
  const [stairSteps, setStairSteps] = useState(4);

  // DIY-specific inputs
  const [skillLevelId, setSkillLevelId] = useState("intermediate");
  const [selectedTools, setSelectedTools] = useState<string[]>([
    "circular-saw", "post-hole-digger", "impact-driver",
  ]);
  const [includePermit, setIncludePermit] = useState(true);
  const [permitCost, setPermitCost] = useState(350);

  // Contractor-specific inputs
  const [markupTierId, setMarkupTierId] = useState("standard");
  const [crewSizeId, setCrewSizeId] = useState("two");
  const [subFootings, setSubFootings] = useState(false);

  const totalSteps = getTotalSteps(audience);
  const stepLabels = getStepLabels(audience);

  const inputs: CalculatorInputs = useMemo(
    () => ({
      audience,
      regionId,
      sizeId,
      tierId,
      complexityId,
      railingId,
      railingLF,
      includeStairs,
      stairSteps,
      skillLevelId,
      selectedTools,
      includePermit,
      permitCost,
      markupTierId,
      crewSizeId,
      subFootings,
    }),
    [
      audience, regionId, sizeId, tierId, complexityId, railingId, railingLF,
      includeStairs, stairSteps, skillLevelId, selectedTools, includePermit,
      permitCost, markupTierId, crewSizeId, subFootings,
    ]
  );

  const result: CalculatorResult = useMemo(() => calculate(inputs), [inputs]);

  const goNext = useCallback(() => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else setShowResults(true);
  }, [step, totalSteps]);

  const goBack = useCallback(() => {
    if (showResults) setShowResults(false);
    else if (step > 0) setStep((s) => s - 1);
  }, [step, showResults]);

  const restart = useCallback(() => {
    setStep(0);
    setShowResults(false);
  }, []);

  const toggleTool = (id: string) => {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // Live estimate label changes by audience
  const liveLabel = audience === "contractor" ? "Bid estimate" : "Live estimate";
  const liveRange = audience === "contractor" && result.contractor
    ? formatRange(result.contractor.totalBidLow, result.contractor.totalBidHigh)
    : audience === "diy" && result.diy
    ? formatRange(result.diy.totalWithExtrasLow, result.diy.totalWithExtrasHigh)
    : formatRange(result.totalLow, result.totalHigh);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col">
      {/* ── HEADER ── */}
      <header className="border-b border-white/[0.06] bg-[#0B1120]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="8" width="12" height="2" rx="1" fill="#0B1120"/>
                <rect x="1" y="4" width="12" height="2" rx="1" fill="#0B1120"/>
                <rect x="3" y="10" width="1.5" height="3" rx="0.75" fill="#0B1120"/>
                <rect x="9.5" y="10" width="1.5" height="3" rx="0.75" fill="#0B1120"/>
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              DeckCost <span className="text-amber-400">2026</span>
            </span>
          </div>

          {/* Live estimate ticker */}
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
              <span className="font-mono text-sm font-semibold text-amber-400">{liveRange}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </header>

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
            <p className="text-xs font-semibold tracking-widest text-amber-400 uppercase mb-1">
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
      {!showResults && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 mt-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500">
              Step {step + 1} of {totalSteps}
            </span>
            <span className="text-xs text-slate-400 font-medium">{stepLabels[step]}</span>
            {/* Audience badge on extra steps */}
            {step >= 6 && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-semibold",
                audience === "diy"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-blue-500/20 text-blue-400"
              )}>
                {audience === "diy" ? "DIYer" : "Contractor"}
              </span>
            )}
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                step >= 6 && audience === "diy" ? "bg-emerald-500" :
                step >= 6 && audience === "contractor" ? "bg-blue-500" :
                "bg-amber-500"
              )}
              animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <ResultsPanel result={result} onBack={goBack} onRestart={restart} />
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
                <StepCard
                  title="Who are you building for?"
                  subtitle="We'll tailor the estimate — and the questions — to your situation."
                  onNext={goNext}
                  nextLabel="Continue"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "homeowner" as AudienceType,
                        icon: "🏡",
                        label: "Homeowner",
                        desc: "Hiring a contractor. See full installed costs.",
                        extra: "6 questions",
                        color: "amber",
                      },
                      {
                        id: "diy" as AudienceType,
                        icon: "🔨",
                        label: "DIYer",
                        desc: "Doing it yourself. Materials + tool rental + permit.",
                        extra: "8 questions",
                        color: "emerald",
                      },
                      {
                        id: "contractor" as AudienceType,
                        icon: "📋",
                        label: "Contractor",
                        desc: "Bidding a project. Full markup, crew, and margin analysis.",
                        extra: "8 questions",
                        color: "blue",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setAudience(opt.id)}
                        className={cn(
                          "text-left p-4 rounded-lg border transition-all",
                          audience === opt.id
                            ? opt.color === "emerald"
                              ? "border-emerald-500 bg-emerald-500/10"
                              : opt.color === "blue"
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-amber-500 bg-amber-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
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
              )}

              {/* ── STEP 1: REGION ── */}
              {step === 1 && (
                <StepCard
                  title="Where is your deck?"
                  subtitle="Regional labor rates and climate factors significantly affect total cost."
                  onNext={goNext}
                  onBack={goBack}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REGIONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRegionId(r.id)}
                        className={cn(
                          "text-left p-3 rounded-lg border transition-all",
                          regionId === r.id
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
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
                              : r.laborMultiplier > 1.0 ? "text-amber-400"
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
                </StepCard>
              )}

              {/* ── STEP 2: SIZE ── */}
              {step === 2 && (
                <StepCard
                  title="How large is your deck?"
                  subtitle="Larger decks have lower per-sq-ft costs due to economies of scale."
                  onNext={goNext}
                  onBack={goBack}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          onClick={() => setSizeId(s.id)}
                          className={cn(
                            "text-left p-3 rounded-lg border transition-all",
                            sizeId === s.id
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-sm text-white">{s.label}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{s.sqFt} sq ft</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-mono text-amber-400">
                                {formatRange(est.low, est.high)}
                              </div>
                              <div className="text-xs text-slate-600">PT installed est.</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </StepCard>
              )}

              {/* ── STEP 3: MATERIAL TIER ── */}
              {step === 3 && (
                <StepCard
                  title="What material tier?"
                  subtitle="The single biggest driver of cost after labor."
                  onNext={goNext}
                  onBack={goBack}
                >
                  <div className="flex flex-col gap-3">
                    {MATERIAL_TIERS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTierId(t.id)}
                        className={cn(
                          "text-left p-4 rounded-lg border transition-all",
                          tierId === t.id
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
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
                            <div className="text-xs font-mono text-amber-400 font-semibold">
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
                      : "Multi-level and custom designs add 50–100% to labor costs."
                  }
                  onNext={goNext}
                  onBack={goBack}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMPLEXITIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setComplexityId(c.id)}
                        className={cn(
                          "text-left p-3 rounded-lg border transition-all",
                          complexityId === c.id
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
                        )}
                      >
                        <div className="font-semibold text-sm text-white">{c.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{c.description}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Labor: {c.laborPctRange}</span>
                          <span className={cn(
                            "text-xs font-mono font-semibold",
                            c.laborMultiplier > 1.5 ? "text-red-400"
                            : c.laborMultiplier > 1.1 ? "text-amber-400"
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

              {/* ── STEP 5: RAILING & EXTRAS ── */}
              {step === 5 && (
                <StepCard
                  title="Railing & extras"
                  subtitle="Railing can represent 15–30% of total project cost."
                  onNext={goNext}
                  onBack={goBack}
                  nextLabel={audience === "homeowner" ? "See My Estimate →" : "Continue →"}
                >
                  <div className="space-y-5">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Railing System</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {RAILING_SYSTEMS.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setRailingId(r.id)}
                            className={cn(
                              "text-left p-3 rounded-lg border transition-all",
                              railingId === r.id
                                ? "border-amber-500 bg-amber-500/10"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20"
                            )}
                          >
                            <div className="font-semibold text-sm text-white">{r.label}</div>
                            <div className="text-xs font-mono text-amber-400 mt-1">
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
                          onChange={(e) => setRailingLF(Number(e.target.value))}
                          className="flex-1 accent-amber-500" />
                        <span className="font-mono text-sm text-amber-400 w-16 text-right">{railingLF} LF</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Typical 16×20 deck: ~52 LF (three open sides)</div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Include Stairs?</div>
                        <button
                          onClick={() => setIncludeStairs((v) => !v)}
                          className={cn("relative w-10 h-5 rounded-full transition-colors", includeStairs ? "bg-amber-500" : "bg-white/20")}
                        >
                          <span className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                            includeStairs ? "translate-x-5" : "translate-x-0.5"
                          )} />
                        </button>
                      </div>
                      {includeStairs && (
                        <div className="flex items-center gap-3">
                          <input type="range" min={2} max={12} step={1} value={stairSteps}
                            onChange={(e) => setStairSteps(Number(e.target.value))}
                            className="flex-1 accent-amber-500" />
                          <span className="font-mono text-sm text-amber-400 w-20 text-right">{stairSteps} steps</span>
                        </div>
                      )}
                    </div>
                  </div>
                </StepCard>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  DIY-SPECIFIC STEPS 6–7
              ══════════════════════════════════════════════════════════════ */}

              {/* ── DIY STEP 6: SKILL LEVEL & TOOL RENTAL ── */}
              {step === 6 && audience === "diy" && (
                <StepCard
                  title="Your skill level & tools"
                  subtitle="Skill level affects material waste. Tool rental adds to your true project cost."
                  onNext={goNext}
                  onBack={goBack}
                  nextLabel="Continue →"
                >
                  <div className="space-y-6">
                    {/* Skill level */}
                    <div>
                      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                        Experience Level
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {DIY_SKILL_LEVELS.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSkillLevelId(s.id)}
                            className={cn(
                              "text-left p-3 rounded-lg border transition-all",
                              skillLevelId === s.id
                                ? "border-emerald-500 bg-emerald-500/10"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20"
                            )}
                          >
                            <div className="font-semibold text-sm text-white">{s.label}</div>
                            <div className="text-xs text-slate-400 mt-1">{s.description}</div>
                            <div className="mt-2 text-xs font-mono text-emerald-400">
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
                        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
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
                                  ? "border-emerald-500 bg-emerald-500/10"
                                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                                      checked ? "bg-emerald-500 border-emerald-500" : "border-white/30"
                                    )}>
                                      {checked && <span className="text-[8px] text-black font-bold">✓</span>}
                                    </div>
                                    <span className="font-semibold text-xs text-white">{t.label}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1 ml-5">{t.description}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-mono text-emerald-400">
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

              {/* ── DIY STEP 7: PERMIT ── */}
              {step === 7 && audience === "diy" && (
                <StepCard
                  title="Permit & inspection"
                  subtitle="Most jurisdictions require a building permit for decks over 200 sq ft or 30 inches off the ground."
                  onNext={goNext}
                  onBack={goBack}
                  nextLabel="See My Estimate →"
                >
                  <div className="space-y-5">
                    {/* Permit toggle */}
                    <div className={cn(
                      "p-4 rounded-lg border transition-all",
                      includePermit ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm text-white">Include building permit cost?</div>
                          <div className="text-xs text-slate-400 mt-1">
                            Typical range: $100–$500 depending on jurisdiction. California and major metros can reach $1,000+.
                            Pulling your own permit as a homeowner is legal in most states.
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            ⚠️ Skipping a permit can void homeowner's insurance and create issues at resale.
                          </div>
                        </div>
                        <button
                          onClick={() => setIncludePermit((v) => !v)}
                          className={cn(
                            "relative w-10 h-5 rounded-full transition-colors shrink-0 mt-1",
                            includePermit ? "bg-emerald-500" : "bg-white/20"
                          )}
                        >
                          <span className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                            includePermit ? "translate-x-5" : "translate-x-0.5"
                          )} />
                        </button>
                      </div>
                    </div>

                    {/* Permit cost slider */}
                    {includePermit && (
                      <div>
                        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                          Estimated Permit Cost
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range" min={100} max={1500} step={50}
                            value={permitCost}
                            onChange={(e) => setPermitCost(Number(e.target.value))}
                            className="flex-1 accent-emerald-500"
                          />
                          <span className="font-mono text-sm text-emerald-400 w-20 text-right">
                            ${permitCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {[
                            { label: "Rural / Small town", range: "$100–$250", value: 175 },
                            { label: "Suburban", range: "$250–$500", value: 350 },
                            { label: "Urban / CA", range: "$500–$1,500", value: 750 },
                          ].map((p) => (
                            <button
                              key={p.label}
                              onClick={() => setPermitCost(p.value)}
                              className={cn(
                                "p-2 rounded border text-left transition-all",
                                permitCost === p.value
                                  ? "border-emerald-500 bg-emerald-500/10"
                                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
                              )}
                            >
                              <div className="text-xs font-semibold text-white">{p.label}</div>
                              <div className="text-xs font-mono text-emerald-400">{p.range}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </StepCard>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  CONTRACTOR-SPECIFIC STEPS 6–7
              ══════════════════════════════════════════════════════════════ */}

              {/* ── CONTRACTOR STEP 6: MARKUP & CREW ── */}
              {step === 6 && audience === "contractor" && (
                <StepCard
                  title="Markup & crew size"
                  subtitle="Set your margin tier and crew to generate a bid range and gross margin estimate."
                  onNext={goNext}
                  onBack={goBack}
                  nextLabel="Continue →"
                >
                  <div className="space-y-6">
                    {/* Markup tier */}
                    <div>
                      <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
                        Margin Tier
                      </div>
                      <div className="flex flex-col gap-2">
                        {CONTRACTOR_MARKUP_TIERS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setMarkupTierId(m.id)}
                            className={cn(
                              "text-left p-4 rounded-lg border transition-all",
                              markupTierId === m.id
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-white">{m.label}</div>
                                <div className="text-xs text-slate-400 mt-1">{m.description}</div>
                              </div>
                              <div className="text-right shrink-0 space-y-0.5">
                                <div className="text-xs font-mono text-blue-400">
                                  Materials +{Math.round(m.materialMarkup * 100)}%
                                </div>
                                <div className="text-xs font-mono text-blue-300">
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
                      <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
                        Crew Size
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CREW_SIZES.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setCrewSizeId(c.id)}
                            className={cn(
                              "text-left p-3 rounded-lg border transition-all",
                              crewSizeId === c.id
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20"
                            )}
                          >
                            <div className="font-semibold text-xs text-white">{c.label}</div>
                            <div className="text-xs font-mono text-blue-400 mt-1">
                              {c.laborEfficiencyFactor}× efficiency
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </StepCard>
              )}

              {/* ── CONTRACTOR STEP 7: SUBCONTRACTING ── */}
              {step === 7 && audience === "contractor" && (
                <StepCard
                  title="Subcontracting"
                  subtitle="Indicate which work you plan to sub out. Subcontracted work is excluded from your markup."
                  onNext={goNext}
                  onBack={goBack}
                  nextLabel="See My Bid Estimate →"
                >
                  <div className="space-y-4">
                    {/* Sub footings toggle */}
                    <div className={cn(
                      "p-4 rounded-lg border transition-all",
                      subFootings ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/[0.03]"
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
                            <span className="font-mono text-blue-400">
                              {formatCurrency(result.footingLow)} – {formatCurrency(result.footingHigh)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSubFootings((v) => !v)}
                          className={cn(
                            "relative w-10 h-5 rounded-full transition-colors shrink-0 mt-1",
                            subFootings ? "bg-blue-500" : "bg-white/20"
                          )}
                        >
                          <span className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                            subFootings ? "translate-x-5" : "translate-x-0.5"
                          )} />
                        </button>
                      </div>
                    </div>

                    {/* Bid preview card */}
                    {result.contractor && (
                      <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
                        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
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
                          <div className="text-slate-400 font-semibold border-t border-white/10 pt-2">Total Bid Range</div>
                          <div className="font-mono text-right text-blue-400 font-semibold border-t border-white/10 pt-2">
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
