/**
 * DECK COST CALCULATOR — HOME PAGE
 * Design: Precision Engineering
 * - Dark navy (#0F172A) base, electric amber (#F59E0B) accent
 * - Wizard flow: Audience → Region → Size → Material → Complexity → Railing → Results
 * - Recharts cost breakdown, persistent estimate ticker
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
  calculate,
  formatCurrency,
  formatCurrencyFull,
  formatRange,
  type AudienceType,
  type CalculatorInputs,
  type CalculatorResult,
} from "@/lib/deckData";
import ResultsPanel from "@/components/ResultsPanel";
import StepCard from "@/components/StepCard";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "Who are you?",
  "Your Region",
  "Deck Size",
  "Material Tier",
  "Complexity",
  "Railing & Extras",
];

export default function Home() {
  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Inputs state
  const [audience, setAudience] = useState<AudienceType>("homeowner");
  const [regionId, setRegionId] = useState("mid-atlantic");
  const [sizeId, setSizeId] = useState("320");
  const [tierId, setTierId] = useState("composite");
  const [complexityId, setComplexityId] = useState("standard");
  const [railingId, setRailingId] = useState("composite-select");
  const [railingLF, setRailingLF] = useState(52);
  const [includeStairs, setIncludeStairs] = useState(true);
  const [stairSteps, setStairSteps] = useState(4);

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
    }),
    [audience, regionId, sizeId, tierId, complexityId, railingId, railingLF, includeStairs, stairSteps]
  );

  const result: CalculatorResult = useMemo(() => calculate(inputs), [inputs]);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else setShowResults(true);
  }, [step]);

  const goBack = useCallback(() => {
    if (showResults) {
      setShowResults(false);
    } else if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step, showResults]);

  const restart = useCallback(() => {
    setStep(0);
    setShowResults(false);
  }, []);

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
            <span className="font-bold text-sm tracking-tight text-white">DeckCost <span className="text-amber-400">2026</span></span>
          </div>

          {/* Live estimate ticker */}
          <AnimatePresence mode="wait">
            <motion.div
              key={result.totalMid}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-slate-500 hidden sm:block">Live estimate</span>
              <span className="font-mono text-sm font-semibold text-amber-400">
                {formatRange(result.totalLow, result.totalHigh)}
              </span>
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
              Step {step + 1} of {TOTAL_STEPS}
            </span>
            <span className="text-xs text-slate-400 font-medium">{STEP_LABELS[step]}</span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
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
              {/* ── STEP 0: AUDIENCE ── */}
              {step === 0 && (
                <StepCard
                  title="Who are you building for?"
                  subtitle="We'll tailor the estimate to your situation."
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
                      },
                      {
                        id: "diy" as AudienceType,
                        icon: "🔨",
                        label: "DIYer",
                        desc: "Doing it yourself. Materials-only pricing.",
                      },
                      {
                        id: "contractor" as AudienceType,
                        icon: "📋",
                        label: "Contractor",
                        desc: "Bidding a project. Full cost breakdown.",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setAudience(opt.id)}
                        className={cn(
                          "text-left p-4 rounded-lg border transition-all",
                          audience === opt.id
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
                        )}
                      >
                        <div className="text-2xl mb-2">{opt.icon}</div>
                        <div className="font-semibold text-sm text-white">{opt.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{opt.desc}</div>
                        {audience === opt.id && (
                          <div className="mt-2 text-xs text-amber-400 font-medium">✓ Selected</div>
                        )}
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
                            <div
                              className={cn(
                                "text-xs font-mono font-semibold",
                                r.laborMultiplier > 1.2
                                  ? "text-red-400"
                                  : r.laborMultiplier > 1.0
                                  ? "text-amber-400"
                                  : "text-green-400"
                              )}
                            >
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
                      const baseInstalled = {
                        "100": { low: 2500, high: 4000 },
                        "192": { low: 4800, high: 8000 },
                        "320": { low: 8000, high: 14000 },
                        "480": { low: 12000, high: 20000 },
                        "600": { low: 15000, high: 25000 },
                      }[s.id] ?? { low: 0, high: 0 };
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
                                {formatRange(baseInstalled.low, baseInstalled.high)}
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
                                <span
                                  key={ex}
                                  className="text-xs bg-white/[0.06] text-slate-400 px-2 py-0.5 rounded"
                                >
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
                            <div className="text-xs font-mono text-slate-300 mt-1">
                              ${t.installedPerSqFtMin}–${t.installedPerSqFtMax}
                            </div>
                            <div className="text-xs text-slate-600">installed/SF</div>
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
                  subtitle="Multi-level and custom designs add 50–100% to labor costs."
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
                          <span
                            className={cn(
                              "text-xs font-mono font-semibold",
                              c.laborMultiplier > 1.5
                                ? "text-red-400"
                                : c.laborMultiplier > 1.1
                                ? "text-amber-400"
                                : "text-green-400"
                            )}
                          >
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
                  nextLabel="See My Estimate →"
                >
                  <div className="space-y-5">
                    {/* Railing type */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Railing System
                      </div>
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
                            <div className="text-xs text-slate-500">
                              ${r.installedPerLFMin}–${r.installedPerLFMax}/LF installed
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Railing LF */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Railing Length
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={10}
                          max={200}
                          step={2}
                          value={railingLF}
                          onChange={(e) => setRailingLF(Number(e.target.value))}
                          className="flex-1 accent-amber-500"
                        />
                        <span className="font-mono text-sm text-amber-400 w-16 text-right">
                          {railingLF} LF
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Typical 16×20 deck: ~52 LF (three open sides)
                      </div>
                    </div>

                    {/* Stairs */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Include Stairs?
                        </div>
                        <button
                          onClick={() => setIncludeStairs((v) => !v)}
                          className={cn(
                            "relative w-10 h-5 rounded-full transition-colors",
                            includeStairs ? "bg-amber-500" : "bg-white/20"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                              includeStairs ? "translate-x-5" : "translate-x-0.5"
                            )}
                          />
                        </button>
                      </div>
                      {includeStairs && (
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={2}
                            max={12}
                            step={1}
                            value={stairSteps}
                            onChange={(e) => setStairSteps(Number(e.target.value))}
                            className="flex-1 accent-amber-500"
                          />
                          <span className="font-mono text-sm text-amber-400 w-20 text-right">
                            {stairSteps} steps
                          </span>
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
