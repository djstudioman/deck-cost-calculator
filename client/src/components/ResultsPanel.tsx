/**
 * ResultsPanel — Audience-specific estimate results
 * Design: Precision Engineering (dark navy, amber/emerald/blue accent per audience)
 *
 * Homeowner: Installed cost, breakdown chart, regional factors, material profile, warnings
 * DIYer:     Materials cost + waste + tool rental + permit, savings vs hiring, weekend estimate
 * Contractor: Bid range, markup breakdown, gross margin, crew days, subcontracting note
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  type CalculatorResult,
  formatCurrencyFull,
  formatRange,
  formatCurrency,
  MATERIAL_TIERS,
} from "@/lib/deckData";
import { cn } from "@/lib/utils";
import PrintEstimate from "@/components/PrintEstimate";

interface ResultsPanelProps {
  result: CalculatorResult;
  onBack: () => void;
  onRestart: () => void;
  onChangeOrderUpdate?: (low: number, high: number) => void;
}

const TIER_COLORS: Record<string, string> = {
  pt: "#F59E0B",
  composite: "#34D399",
  pvc: "#60A5FA",
};

const CATEGORY_COLORS = ["#F59E0B", "#60A5FA", "#34D399", "#A78BFA", "#F87171", "#FB923C"];
const DIY_COLORS = ["#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5", "#F87171", "#FCD34D"];
const CONTRACTOR_COLORS = ["#60A5FA", "#93C5FD", "#BFDBFE", "#A78BFA", "#F87171", "#FB923C"];

const CustomTooltip = ({ active, payload, accent }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#1E293B] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
        <div className="font-semibold text-white mb-1">{d.category}</div>
        <div className="font-mono" style={{ color: accent }}>{formatRange(d.low, d.high)}</div>
        <div className="text-slate-400 mt-0.5">{d.note}</div>
      </div>
    );
  }
  return null;
};

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────

function SummaryPills({ result }: { result: CalculatorResult }) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {[
        { label: "Region", value: result.region.label },
        { label: "Size", value: result.size.dimensions },
        { label: "Complexity", value: result.complexity.label },
        { label: "Railing", value: result.railing.label },
      ].map((p) => (
        <div key={p.label} className="text-xs bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1">
          <span className="text-slate-500">{p.label}: </span>
          <span className="text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function BreakdownChart({
  result,
  colors,
  accent,
}: {
  result: CalculatorResult;
  colors: string[];
  accent: string;
}) {
  const chartData = result.breakdown.map((item, i) => ({
    ...item,
    mid: Math.round((item.low + item.high) / 2),
    color: colors[i % colors.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-5"
    >
      <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-4">Cost Breakdown</div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
            <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="category" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip content={<CustomTooltip accent={accent} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="mid" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {result.breakdown.map((item, i) => (
          <div key={item.category} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
              <span className="text-slate-300">{item.category}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 hidden sm:block">{item.note}</span>
              <span className="font-mono font-medium" style={{ color: accent }}>
                {formatRange(item.low, item.high)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 space-y-2"
    >
      <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase">⚠ Pricing Alerts</div>
      {warnings.map((w, i) => (
        <p key={i} className="text-xs text-amber-200/70">{w}</p>
      ))}
    </motion.div>
  );
}

function Disclaimer({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-[#1E293B]/40 border border-white/[0.06] rounded-xl p-4"
    >
      <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">Important Disclaimer</div>
      <p className="text-xs text-slate-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />
    </motion.div>
  );
}

function ActionButtons({
  onBack,
  onRestart,
  accent,
}: {
  onBack: () => void;
  onRestart: () => void;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="flex gap-3 flex-wrap"
    >
      <button
        onClick={onBack}
        className="px-4 py-2.5 text-sm text-slate-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-colors"
      >
        ← Adjust Inputs
      </button>
      <button
        onClick={onRestart}
        className="px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors"
        style={{ background: accent, color: "#0B1120" }}
      >
        Start Over
      </button>
      <button
        onClick={() => window.print()}
        className="ml-auto flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-lg border transition-colors"
        style={{ borderColor: `${accent}66`, color: accent }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Download Estimate
      </button>
    </motion.div>
  );
}

// ─── HOMEOWNER PANEL ──────────────────────────────────────────────────────────
function HomeownerPanel({ result, onBack, onRestart }: ResultsPanelProps) {
  const tierColor = TIER_COLORS[result.tier.id] ?? "#F59E0B";
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 rounded-xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-1">
              Installed Cost Estimate
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-white">
              {formatRange(result.totalLow, result.totalHigh)}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {formatCurrency(result.perSqFtLow)}–{formatCurrency(result.perSqFtHigh)}/sq ft
              &nbsp;·&nbsp;{result.size.sqFt} sq ft
            </div>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}
          >
            {result.tier.shortLabel}
          </div>
        </div>
        <SummaryPills result={result} />
      </motion.div>

      <BreakdownChart result={result} colors={CATEGORY_COLORS} accent="#F59E0B" />

      {/* Permit line item */}
      {result.permitCost > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-4"
        >
          <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase mb-3">Permit &amp; Inspection</div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0 bg-amber-400" />
              <span className="text-slate-300">Building permit fee</span>
            </div>
            <span className="font-mono font-semibold text-amber-400">{formatCurrencyFull(result.permitCost)}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">Permit fees are typically passed through to the client. Confirm this is included in your contractor&apos;s quote.</div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-4">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">Regional Factors</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Labor multiplier</span>
              <span className={cn("font-mono font-semibold",
                result.regionMultiplier > 1.2 ? "text-red-400"
                : result.regionMultiplier > 1.0 ? "text-amber-400"
                : "text-green-400"
              )}>
                {result.regionMultiplier.toFixed(2)}×
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Frost depth</span>
              <span className="text-slate-200">{result.region.frostDepthLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Climate premium</span>
              <span className="font-mono text-slate-200">
                {result.climatePremium > 0 ? formatCurrencyFull(result.climatePremium) : "None"}
              </span>
            </div>
          </div>
          {result.region.climateNotes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1">
              {result.region.climateNotes.map((note) => (
                <div key={note} className="text-xs text-slate-500">• {note}</div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-4">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">Material Profile</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Lifespan</span>
              <span className="text-slate-200">{result.tier.lifespan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Maintenance</span>
              <span className="text-slate-200 text-right max-w-[160px]">{result.tier.maintenance}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="text-xs text-amber-500/80">⚠ Tariff Note</div>
            <div className="text-xs text-slate-500 mt-1">{result.tier.tariffImpact}</div>
          </div>
        </div>
      </motion.div>

      <Warnings warnings={result.warnings} />
      <Disclaimer text={`These estimates are derived from publicly available pricing data as of Q1 2026 and are intended for <strong class="text-slate-400">preliminary budgeting purposes only</strong>. Actual costs vary significantly based on local market conditions, site-specific factors, contractor availability, and material price volatility. <strong class="text-slate-400">Always obtain at least three contractor quotes</strong> before committing to a project. This tool does not constitute professional advice.`} />
      <ActionButtons onBack={onBack} onRestart={onRestart} accent="#F59E0B" />
    </div>
  );
}

// ─── DIY PANEL ────────────────────────────────────────────────────────────────
function DIYPanel({ result, onBack, onRestart }: ResultsPanelProps) {
  const d = result.diy!;
  const tierColor = "#34D399";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-[#0F2A1E] to-[#0B1120] border border-emerald-500/20 rounded-xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-semibold tracking-widest text-emerald-500/70 uppercase mb-1">
              DIY Materials + Extras Estimate
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-white">
              {formatRange(d.totalWithExtrasLow, d.totalWithExtrasHigh)}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              Materials + waste + tools + permit &nbsp;·&nbsp; {result.size.sqFt} sq ft
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {result.tier.shortLabel}
          </div>
        </div>
        <SummaryPills result={result} />

        {/* Savings callout */}
        {d.savingsVsHiring > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-xs text-emerald-400 font-semibold">
              💰 Estimated savings vs. hiring a contractor: <span className="font-mono text-lg text-emerald-300">{formatCurrency(d.savingsVsHiring)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Based on regional installed cost estimate for the same project.
            </div>
          </div>
        )}
      </motion.div>

      {/* Materials breakdown chart */}
      <BreakdownChart result={result} colors={DIY_COLORS} accent="#34D399" />

      {/* DIY-specific extras breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-5"
      >
        <div className="text-xs font-semibold tracking-wider text-emerald-400 uppercase mb-4">
          Full Cost Breakdown (Materials + Extras)
        </div>
        <div className="space-y-2 text-xs">
          {[
            {
              label: "Decking materials (base)",
              low: result.materialsLow,
              high: result.materialsHigh,
              note: `${result.tier.label} boards + substructure`,
              color: "#34D399",
            },
            {
              label: `Material waste (+${Math.round(d.wasteFactor * 100)}% — ${d.skillLevel.label})`,
              low: d.wastedMaterialCost,
              high: Math.round(result.materialsHigh * d.wasteFactor),
              note: "Cutting errors, learning curve, offcuts",
              color: "#6EE7B7",
            },
            {
              label: "Railing materials",
              low: result.railingLow,
              high: result.railingHigh,
              note: `${result.railing.label} — ${result.railing.label}`,
              color: "#A7F3D0",
            },
            {
              label: "Footings (materials + concrete)",
              low: result.footingLow,
              high: result.footingHigh,
              note: `${result.region.frostDepthLabel} frost depth`,
              color: "#D1FAE5",
            },
            ...(result.stairsLow > 0
              ? [{
                  label: "Stair materials",
                  low: result.stairsLow,
                  high: result.stairsHigh,
                  note: "Stringers, treads, hardware",
                  color: "#FCD34D",
                }]
              : []),
            ...(d.selectedTools.length > 0
              ? [{
                  label: `Tool rental (${d.selectedTools.length} tools)`,
                  low: d.toolRentalLow,
                  high: d.toolRentalHigh,
                  note: d.selectedTools.map((t) => t.label).join(", "),
                  color: "#F87171",
                }]
              : []),
            ...(d.permitCost > 0
              ? [{
                  label: "Building permit",
                  low: d.permitCost,
                  high: d.permitCost,
                  note: "Homeowner-pulled permit",
                  color: "#FB923C",
                }]
              : []),
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-slate-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 hidden sm:block text-right max-w-[180px] truncate">{item.note}</span>
                <span className="font-mono font-medium text-emerald-400">
                  {formatRange(item.low, item.high)}
                </span>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="font-semibold text-white">Total (all-in)</span>
            <span className="font-mono font-bold text-emerald-300 text-sm">
              {formatRange(d.totalWithExtrasLow, d.totalWithExtrasHigh)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Timeline + skill notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-4">
          <div className="text-xs font-semibold tracking-wider text-emerald-400 uppercase mb-3">
            Time Estimate
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Skill level</span>
              <span className="text-emerald-300 font-semibold">{d.skillLevel.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated weekends</span>
              <span className="font-mono text-white">{d.estimatedWeekends} weekends</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Waste factor</span>
              <span className="font-mono text-white">+{Math.round(d.wasteFactor * 100)}%</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1">
            {d.skillLevel.notes.map((n, i) => (
              <div key={i} className="text-xs text-slate-500">• {n}</div>
            ))}
          </div>
        </div>

        <div className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-4">
          <div className="text-xs font-semibold tracking-wider text-emerald-400 uppercase mb-3">
            Material Profile
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Lifespan</span>
              <span className="text-slate-200">{result.tier.lifespan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Maintenance</span>
              <span className="text-slate-200 text-right max-w-[160px]">{result.tier.maintenance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Region frost depth</span>
              <span className="text-slate-200">{result.region.frostDepthLabel}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="text-xs text-amber-500/80">⚠ Tariff Note</div>
            <div className="text-xs text-slate-500 mt-1">{result.tier.tariffImpact}</div>
          </div>
        </div>
      </motion.div>

      <Warnings warnings={result.warnings} />
      <Disclaimer text={`These are <strong class="text-slate-400">materials-only estimates</strong> for DIY builds as of Q1 2026. Tool rental costs are based on Home Depot / Sunbelt Rentals published rates. Permit costs vary widely by jurisdiction — verify with your local building department before starting. Waste factors are estimates; actual waste depends on your skill and design. This tool does not constitute professional advice. Always check local codes for setback, structural, and inspection requirements.`} />
      <ActionButtons onBack={onBack} onRestart={onRestart} accent="#34D399" />
    </div>
  );
}

// ─── CONTRACTOR PANEL ─────────────────────────────────────────────────────────
function ContractorPanel({ result, onBack, onRestart, onChangeOrderUpdate }: ResultsPanelProps) {
  const c = result.contractor!;

  // Change Order Estimator state
  // Each item: { qty, unit, costPerUnit low/high, laborPerUnit low/high }
  const CHANGE_ORDER_ITEMS = [
    {
      id: "extra-railing",
      label: "Additional Railing",
      icon: "🔩",
      unit: "LF",
      unitLabel: "linear feet",
      defaultQty: 20,
      minQty: 1,
      maxQty: 200,
      step: 1,
      matLow: result.railing.materialPerLFMin,
      matHigh: result.railing.materialPerLFMax,
      laborLow: result.railing.installedPerLFMin - result.railing.materialPerLFMin,
      laborHigh: result.railing.installedPerLFMax - result.railing.materialPerLFMax,
      note: `${result.railing.label} — matches existing railing system`,
    },
    {
      id: "extra-stairs",
      label: "Add Stair Section",
      icon: "🪜",
      unit: "steps",
      unitLabel: "steps",
      defaultQty: 4,
      minQty: 2,
      maxQty: 20,
      step: 1,
      matLow: result.tier.id === "pt" ? 30 : result.tier.id === "composite" ? 50 : 60,
      matHigh: result.tier.id === "pt" ? 60 : result.tier.id === "composite" ? 100 : 120,
      laborLow: 0,
      laborHigh: 0,
      note: `${result.tier.shortLabel} — matches existing deck material`,
    },
    {
      id: "deck-lighting",
      label: "Deck Lighting",
      icon: "💡",
      unit: "fixtures",
      unitLabel: "fixtures",
      defaultQty: 6,
      minQty: 1,
      maxQty: 30,
      step: 1,
      matLow: 45,
      matHigh: 120,
      laborLow: 35,
      laborHigh: 65,
      note: "Low-voltage LED deck lights — post caps, step lights, or recessed",
    },
    {
      id: "built-in-seating",
      label: "Built-In Bench Seating",
      icon: "🪑",
      unit: "LF",
      unitLabel: "linear feet",
      defaultQty: 12,
      minQty: 4,
      maxQty: 60,
      step: 2,
      matLow: 35,
      matHigh: 80,
      laborLow: 25,
      laborHigh: 55,
      note: `${result.tier.shortLabel} — framed bench with backrest`,
    },
    {
      id: "pergola",
      label: "Pergola / Shade Structure",
      icon: "⛱️",
      unit: "sq ft",
      unitLabel: "sq ft of coverage",
      defaultQty: 100,
      minQty: 50,
      maxQty: 400,
      step: 10,
      matLow: 12,
      matHigh: 30,
      laborLow: 10,
      laborHigh: 22,
      note: "PT wood or cedar pergola — materials + framing labor",
    },
    {
      id: "privacy-screen",
      label: "Privacy Screen / Lattice",
      icon: "🏗️",
      unit: "panels",
      unitLabel: "4×8 panels",
      defaultQty: 3,
      minQty: 1,
      maxQty: 20,
      step: 1,
      matLow: 120,
      matHigh: 350,
      laborLow: 80,
      laborHigh: 180,
      note: "Cedar or composite privacy panels with post framing",
    },
  ] as const;

  type ItemId = typeof CHANGE_ORDER_ITEMS[number]["id"];
  const [selectedItems, setSelectedItems] = useState<Set<ItemId>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(CHANGE_ORDER_ITEMS.map((i) => [i.id, i.defaultQty]))
  );
  const [copiedCO, setCopiedCO] = useState(false);

  // Custom free-form line items
  interface CustomLineItem { id: string; label: string; amount: number; }
  const [customItems, setCustomItems] = useState<CustomLineItem[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  const addCustomItem = () => {
    const amt = parseFloat(customAmount.replace(/[^0-9.]/g, ""));
    if (!customLabel.trim() || isNaN(amt) || amt <= 0) return;
    setCustomItems((prev) => [...prev, { id: `custom-${Date.now()}`, label: customLabel.trim(), amount: Math.round(amt) }]);
    setCustomLabel("");
    setCustomAmount("");
  };

  const removeCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleItem = (id: ItemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const setQty = (id: string, val: number, min: number, max: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.min(max, Math.max(min, val)) }));
  };

  // Compute totals for selected items (with contractor markup applied)
  const coLineItems = CHANGE_ORDER_ITEMS.filter((i) => selectedItems.has(i.id)).map((item) => {
    const qty = quantities[item.id];
    const rawMatMid = ((item.matLow + item.matHigh) / 2) * qty;
    const rawLaborMid = ((item.laborLow + item.laborHigh) / 2) * qty;
    const matMarked = Math.round(rawMatMid * (1 + c.markupTier.materialMarkup));
    const laborMarked = Math.round(rawLaborMid * (1 + c.markupTier.laborMarkup));
    const overhead = Math.round((matMarked + laborMarked) * c.markupTier.overheadPct);
    const totalMid = matMarked + laborMarked + overhead;
    const totalLow = Math.round(totalMid * 0.92);
    const totalHigh = Math.round(totalMid * 1.08);
    return { ...item, qty, totalLow, totalHigh, totalMid };
  });

  const customTotal = customItems.reduce((s, i) => s + i.amount, 0);
  const coGrandLow = coLineItems.reduce((s, i) => s + i.totalLow, 0) + customTotal;
  const coGrandHigh = coLineItems.reduce((s, i) => s + i.totalHigh, 0) + customTotal;

  // Notify parent whenever change order total changes so the live ticker updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onChangeOrderUpdate?.(coGrandLow, coGrandHigh);
  }, [coGrandLow, coGrandHigh]);

  const copyChangeOrder = () => {
    const lines = [
      "CHANGE ORDER ESTIMATE",
      `Project: ${result.size.sqFt} sq ft ${result.tier.shortLabel} deck — ${result.region.label}`,
      "",
      ...coLineItems.map((i) => `• ${i.label} (${i.qty} ${i.unit}): ${formatRange(i.totalLow, i.totalHigh)}`),
      ...customItems.map((i) => `• ${i.label}: ${formatCurrency(i.amount)}`),
      "",
      `TOTAL CHANGE ORDER: ${formatRange(coGrandLow, coGrandHigh)}`,
      `(Includes ${Math.round(c.markupTier.materialMarkup * 100)}% material markup, ${Math.round(c.markupTier.laborMarkup * 100)}% labor markup, ${Math.round(c.markupTier.overheadPct * 100)}% overhead)`,
    ].join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopiedCO(true);
      setTimeout(() => setCopiedCO(false), 2500);
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Hero bid card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-[#0F1A2A] to-[#0B1120] border border-blue-500/20 rounded-xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-semibold tracking-widest text-blue-400/70 uppercase mb-1">
              {coGrandLow > 0 ? "Bid + Change Orders" : "Bid Range Estimate"}
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-white">
              {formatRange(c.totalBidLow + coGrandLow, c.totalBidHigh + coGrandHigh)}
            </div>
            {coGrandLow > 0 && (
              <div className="text-xs text-blue-400/70 mt-0.5">
                Base bid {formatRange(c.totalBidLow, c.totalBidHigh)}
                &nbsp;+&nbsp;
                <span className="text-blue-300">CO {formatRange(coGrandLow, coGrandHigh)}</span>
              </div>
            )}
            <div className="text-sm text-slate-400 mt-1">
              {formatCurrency(c.perSqFtBidLow)}–{formatCurrency(c.perSqFtBidHigh)}/sq ft
              &nbsp;·&nbsp;{result.size.sqFt} sq ft
            </div>
          </div>
          <div className="text-right">
            <div className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold inline-block",
              c.grossMarginPct >= 30 ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : c.grossMarginPct >= 20 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}>
              {c.grossMarginPct}% gross margin
            </div>
            <div className="text-xs text-slate-500 mt-1">{c.markupTier.label}</div>
          </div>
        </div>
        <SummaryPills result={result} />
      </motion.div>

      {/* Bid construction table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-5"
      >
        <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase mb-4">
          Bid Construction
        </div>
        <div className="space-y-0">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 pb-2 border-b border-white/[0.06]">
            <div>Line Item</div>
            <div className="text-right">Cost Basis</div>
            <div className="text-right">With Markup</div>
          </div>

          {[
            {
              label: "Materials",
              basis: c.materialCostRaw,
              marked: c.materialWithMarkup,
              note: `+${Math.round(c.markupTier.materialMarkup * 100)}% markup`,
              color: "#60A5FA",
            },
            {
              label: "Labor",
              basis: c.laborCostRaw,
              marked: c.laborWithMarkup,
              note: `+${Math.round(c.markupTier.laborMarkup * 100)}% markup · ${c.crewSize.label}`,
              color: "#93C5FD",
            },
            {
              label: "Overhead",
              basis: 0,
              marked: c.overhead,
              note: `${Math.round(c.markupTier.overheadPct * 100)}% of marked-up cost`,
              color: "#BFDBFE",
            },
            ...(c.subFootingsCost > 0
              ? [{
                  label: "Footings (sub pass-through)",
                  basis: c.subFootingsCost,
                  marked: c.subFootingsCost,
                  note: "Subcontracted at cost + 15%",
                  color: "#A78BFA",
                }]
              : []),
            ...(result.permitCost > 0
              ? [{
                  label: "Permit & inspection",
                  basis: result.permitCost,
                  marked: result.permitCost,
                  note: "Passed through at cost",
                  color: "#FB923C",
                }]
              : []),
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-3 gap-2 py-2.5 border-b border-white/[0.04] text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                <div>
                  <div className="text-slate-200">{row.label}</div>
                  <div className="text-slate-600 text-[10px]">{row.note}</div>
                </div>
              </div>
              <div className="text-right font-mono text-slate-400">
                {row.basis > 0 ? formatCurrency(row.basis) : "—"}
              </div>
              <div className="text-right font-mono text-blue-300 font-semibold">
                {formatCurrency(row.marked)}
              </div>
            </div>
          ))}

          {/* Total row */}
          <div className="grid grid-cols-3 gap-2 pt-3 text-xs">
            <div className="font-semibold text-white">Total Bid</div>
            <div className="text-right font-mono text-slate-400">
              {formatCurrency(c.materialCostRaw + c.laborCostRaw)}
            </div>
            <div className="text-right font-mono text-blue-400 font-bold text-sm">
              {formatRange(c.totalBidLow, c.totalBidHigh)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Breakdown chart (base costs) */}
      <BreakdownChart result={result} colors={CONTRACTOR_COLORS} accent="#60A5FA" />

      {/* Project metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-4">
          <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase mb-3">
            Project Metrics
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Crew</span>
              <span className="text-blue-300 font-semibold">{c.crewSize.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated days on-site</span>
              <span className="font-mono text-white">{c.estimatedDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Complexity multiplier</span>
              <span className="font-mono text-white">{result.complexityMultiplier.toFixed(1)}×</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Regional labor rate</span>
              <span className={cn("font-mono font-semibold",
                result.regionMultiplier > 1.2 ? "text-red-400"
                : result.regionMultiplier > 1.0 ? "text-amber-400"
                : "text-green-400"
              )}>
                {result.regionMultiplier.toFixed(2)}×
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-4">
          <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase mb-3">
            Margin Analysis
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Gross margin</span>
              <span className={cn("font-mono font-bold text-sm",
                c.grossMarginPct >= 30 ? "text-green-400"
                : c.grossMarginPct >= 20 ? "text-amber-400"
                : "text-red-400"
              )}>
                {c.grossMarginPct}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Material markup</span>
              <span className="font-mono text-white">+{Math.round(c.markupTier.materialMarkup * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Labor markup</span>
              <span className="font-mono text-white">+{Math.round(c.markupTier.laborMarkup * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Overhead</span>
              <span className="font-mono text-white">{Math.round(c.markupTier.overheadPct * 100)}%</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="text-xs text-blue-400/80">📊 Sanity Check</div>
            <div className="text-xs text-slate-500 mt-1">
              Regional market rate: {formatCurrency(result.totalLow)}–{formatCurrency(result.totalHigh)} installed.
              Your bid is {c.totalBidLow > result.totalHigh ? "above" : c.totalBidHigh < result.totalLow ? "below" : "within"} market range.
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── MARGIN & BUSINESS INTELLIGENCE ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-5"
      >
        <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase mb-4">
          Business Intelligence
        </div>

        {/* Profitability tier badge */}
        {(() => {
          const pct = c.grossMarginPct;
          const tier =
            pct >= 35 ? { label: "Strong Margin", icon: "🟢", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" }
            : pct >= 25 ? { label: "Target Margin", icon: "🟡", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" }
            : pct >= 15 ? { label: "Thin Margin", icon: "🟠", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" }
            : { label: "Below Floor", icon: "🔴", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };
          const advice =
            pct >= 35 ? "Healthy margin. Room to sharpen pencil on competitive bids or invest in materials upgrade upsell."
            : pct >= 25 ? "On target. Protect this margin — scope creep and change orders are your biggest risk."
            : pct >= 15 ? "Margin is tight. Review overhead allocation and consider a higher markup tier."
            : "This job is below most contractors' floor. Revisit markup or pass on the bid.";
          return (
            <div className={cn("flex items-start gap-3 p-3 rounded-lg border mb-4", tier.bg)}>
              <span className="text-lg mt-0.5">{tier.icon}</span>
              <div>
                <div className={cn("font-semibold text-sm", tier.color)}>{tier.label} — {pct}% gross margin</div>
                <div className="text-xs text-slate-400 mt-1">{advice}</div>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Break-even analysis */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Break-Even Floor</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">True cost basis</span>
                <span className="font-mono text-white">{formatCurrency(c.materialCostRaw + c.laborCostRaw)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">With overhead only</span>
                <span className="font-mono text-white">{formatCurrency(Math.round((c.materialCostRaw + c.laborCostRaw) * (1 + c.markupTier.overheadPct)))}</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.06] pt-2">
                <span className="text-slate-400 font-semibold">Min. bid (break-even)</span>
                <span className="font-mono text-amber-400 font-bold">{formatCurrency(Math.round((c.materialCostRaw + c.laborCostRaw) * (1 + c.markupTier.overheadPct)))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Your bid vs. floor</span>
                <span className="font-mono text-green-400 font-semibold">
                  +{formatCurrency(Math.round(((c.totalBidLow + c.totalBidHigh) / 2) - (c.materialCostRaw + c.laborCostRaw) * (1 + c.markupTier.overheadPct)))} above
                </span>
              </div>
            </div>
          </div>

          {/* Effective hourly rate */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Effective Hourly Rate</div>
            {(() => {
              const crewCount = parseInt(c.crewSize.id === "solo" ? "1" : c.crewSize.id === "two" ? "2" : c.crewSize.id === "three" ? "3" : "4", 10);
              const totalManHours = c.estimatedDays * 8 * crewCount;
              const laborRevenue = c.laborWithMarkup;
              const effectiveRate = Math.round(laborRevenue / totalManHours);
              const industryBenchmark = 65; // $/hr national average for deck contractors
              const vsIndustry = effectiveRate - industryBenchmark;
              return (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Crew size</span>
                    <span className="font-mono text-white">{c.crewSize.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Est. man-hours</span>
                    <span className="font-mono text-white">{totalManHours} hrs</span>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.06] pt-2">
                    <span className="text-slate-400 font-semibold">Effective rate</span>
                    <span className={cn("font-mono font-bold text-sm",
                      effectiveRate >= 80 ? "text-green-400"
                      : effectiveRate >= 60 ? "text-amber-400"
                      : "text-red-400"
                    )}>${effectiveRate}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">vs. industry avg ($65/hr)</span>
                    <span className={cn("font-mono font-semibold",
                      vsIndustry >= 0 ? "text-green-400" : "text-red-400"
                    )}>{vsIndustry >= 0 ? "+" : ""}{vsIndustry}/hr</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </motion.div>

      {/* ── MATERIAL COMPARISON TABLE (client upsell tool) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase">Material Options — Client Comparison</div>
          <div className="text-xs text-slate-500 shrink-0">Upsell tool</div>
        </div>
        <div className="text-xs text-slate-500 mb-4">Share this with your client to illustrate the value of upgrading materials. Based on their {result.size.sqFt} sq ft deck.</div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left text-slate-500 font-semibold pb-2 pr-3">Material</th>
                <th className="text-right text-slate-500 font-semibold pb-2 px-2">Total Bid Range</th>
                <th className="text-right text-slate-500 font-semibold pb-2 px-2">Per Sq Ft</th>
                <th className="text-right text-slate-500 font-semibold pb-2 px-2">Lifespan</th>
                <th className="text-right text-slate-500 font-semibold pb-2 pl-2">Maintenance/yr</th>
              </tr>
            </thead>
            <tbody>
              {MATERIAL_TIERS.map((tier) => {
                const isSelected = tier.id === result.tier.id;
                const matMid = ((tier.materialPerSqFtMin + tier.materialPerSqFtMax) / 2) * result.size.sqFt;
                const laborMid = (result.laborLow + result.laborHigh) / 2;
                const rawCost = matMid + laborMid;
                const bidMid = Math.round(rawCost * (1 + c.markupTier.materialMarkup) + rawCost * c.markupTier.overheadPct);
                const bidLow = Math.round(bidMid * 0.92);
                const bidHigh = Math.round(bidMid * 1.08);
                const perSqFt = Math.round(bidMid / result.size.sqFt);
                const maintenanceCost = tier.id === "pt" ? "$200–$500" : tier.id === "composite" ? "$50–$150" : "~$50";
                const dotColor = tier.id === "pt" ? "#F59E0B" : tier.id === "composite" ? "#34D399" : "#60A5FA";
                return (
                  <tr
                    key={tier.id}
                    className={cn(
                      "border-b border-white/[0.04] transition-colors",
                      isSelected ? "bg-blue-500/5" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
                        <div>
                          <div className={cn("font-semibold", isSelected ? "text-white" : "text-slate-300")}>
                            {tier.shortLabel}
                            {isSelected && <span className="ml-1.5 text-[10px] text-blue-400 font-normal">(current)</span>}
                          </div>
                          <div className="text-slate-600 text-[10px] mt-0.5">{tier.examples[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-mono py-2.5 px-2">
                      <span className={isSelected ? "text-blue-300 font-semibold" : "text-slate-300"}>
                        {formatRange(bidLow, bidHigh)}
                      </span>
                    </td>
                    <td className="text-right font-mono py-2.5 px-2 text-slate-400">${perSqFt}/sf</td>
                    <td className="text-right py-2.5 px-2 text-slate-400">{tier.lifespan.split(" ")[0]}</td>
                    <td className="text-right py-2.5 pl-2 text-slate-400">{maintenanceCost}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06] text-xs text-slate-600">
          💡 Bid ranges include your current markup tier ({c.markupTier.label}). Labor costs held constant — only material cost changes.
        </div>
      </motion.div>

      {/* ── CHANGE ORDER ESTIMATOR ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase">Change Order Estimator</div>
          <div className="text-xs text-slate-500 shrink-0">Scope additions</div>
        </div>
        <div className="text-xs text-slate-500 mb-4">Select scope additions to instantly price them as a change order using your current markup tier.</div>

        {/* Item grid */}
        <div className="space-y-2">
          {CHANGE_ORDER_ITEMS.map((item) => {
            const isOn = selectedItems.has(item.id);
            const qty = quantities[item.id];
            // Quick preview price (unselected state)
            const previewMid = Math.round(
              (((item.matLow + item.matHigh) / 2) * item.defaultQty * (1 + c.markupTier.materialMarkup))
              + (((item.laborLow + item.laborHigh) / 2) * item.defaultQty * (1 + c.markupTier.laborMarkup))
            );
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-lg border transition-all",
                  isOn
                    ? "border-blue-500/50 bg-blue-500/5"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
                )}
              >
                {/* Header row — always visible */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-xs font-semibold", isOn ? "text-white" : "text-slate-300")}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-0.5">{item.note}</div>
                  </div>
                  <div className="text-right shrink-0">
                    {isOn ? (
                      <span className="text-xs font-mono text-blue-300 font-semibold">
                        {formatRange(
                          coLineItems.find((l) => l.id === item.id)?.totalLow ?? 0,
                          coLineItems.find((l) => l.id === item.id)?.totalHigh ?? 0
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">~{formatCurrency(previewMid)}</span>
                    )}
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                    isOn ? "bg-blue-500 border-blue-500" : "border-white/20"
                  )}>
                    {isOn && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </button>

                {/* Quantity controls — only when selected */}
                {isOn && (
                  <div className="px-3 pb-3 flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 shrink-0">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty(item.id, qty - item.step, item.minQty, item.maxQty)}
                        className="w-6 h-6 rounded border border-white/20 text-slate-400 hover:text-white hover:border-white/40 text-sm flex items-center justify-center transition-colors"
                      >−</button>
                      <span className="font-mono text-sm text-white w-12 text-center">{qty} {item.unit}</span>
                      <button
                        onClick={() => setQty(item.id, qty + item.step, item.minQty, item.maxQty)}
                        className="w-6 h-6 rounded border border-white/20 text-slate-400 hover:text-white hover:border-white/40 text-sm flex items-center justify-center transition-colors"
                      >+</button>
                    </div>
                    <span className="text-xs text-slate-600 ml-1">{item.unitLabel}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom line item entry */}
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Custom Line Item</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Description (e.g. Hot tub blocking)"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
              className="flex-1 min-w-0 bg-white/[0.04] border border-white/[0.12] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <input
              type="text"
              placeholder="$0"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
              className="w-20 bg-white/[0.04] border border-white/[0.12] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
            />
            <button
              onClick={addCustomItem}
              disabled={!customLabel.trim() || !customAmount.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >Add</button>
          </div>
          {customItems.length > 0 && (
            <div className="mt-2 space-y-1">
              {customItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">✏️</span>
                    <span className="text-xs text-slate-300 truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs text-blue-300 font-semibold">{formatCurrency(item.amount)}</span>
                    <button
                      onClick={() => removeCustomItem(item.id)}
                      className="w-4 h-4 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <svg fill="none" viewBox="0 0 10 10" className="w-2.5 h-2.5"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary footer — only when items selected */}
        {(coLineItems.length > 0 || customItems.length > 0) && (
          <div className="mt-4 pt-4 border-t border-white/[0.08]">
            <div className="space-y-1.5 mb-3">
              {coLineItems.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-slate-400">{item.icon} {item.label} × {item.qty} {item.unit}</span>
                  <span className="font-mono text-blue-300">{formatRange(item.totalLow, item.totalHigh)}</span>
                </div>
              ))}
              {customItems.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-slate-400">✏️ {item.label}</span>
                  <span className="font-mono text-blue-300">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div>
                <div className="text-xs text-slate-500">Total Change Order</div>
                <div className="font-mono text-lg font-bold text-white">{formatRange(coGrandLow, coGrandHigh)}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Markup: {Math.round(c.markupTier.materialMarkup * 100)}% mat / {Math.round(c.markupTier.laborMarkup * 100)}% labor / {Math.round(c.markupTier.overheadPct * 100)}% overhead
                </div>
              </div>
              <button
                onClick={copyChangeOrder}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                  copiedCO
                    ? "bg-green-500/20 border-green-500/40 text-green-400"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                )}
              >
                {copiedCO ? (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Copied!</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14"><rect x="1" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 4V2.5A1.5 1.5 0 015.5 1h7A1.5 1.5 0 0114 2.5v7A1.5 1.5 0 0112.5 11H11" stroke="currentColor" strokeWidth="1.2"/></svg> Copy Change Order</>
                )}
              </button>
            </div>
          </div>
        )}

        {coLineItems.length === 0 && customItems.length === 0 && (
          <div className="mt-3 text-center text-xs text-slate-600 py-2">
            Select scope additions above or add a custom line item to generate a change order total.
          </div>
        )}
      </motion.div>

      <Warnings warnings={result.warnings} />
      <Disclaimer text={`This bid estimate is generated from regional cost data as of Q1 2026 and is intended for <strong class="text-slate-400">preliminary bidding guidance only</strong>. Actual project costs depend on site conditions, material availability, subcontractor pricing, and local labor markets. Markup percentages are industry benchmarks — adjust to your actual overhead structure. Gross margin calculations do not account for income tax, equipment depreciation, or warranty reserves. Always perform a detailed takeoff before submitting a final bid. This tool does not constitute professional advice.`} />
      <ActionButtons onBack={onBack} onRestart={onRestart} accent="#60A5FA" />
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function ResultsPanel(props: ResultsPanelProps) {
  const { result } = props;

  return (
    <>
      {/* Screen UI */}
      {result.isDIY && result.diy ? (
        <DIYPanel {...props} />
      ) : result.isContractor && result.contractor ? (
        <ContractorPanel {...props} />
      ) : (
        <HomeownerPanel {...props} />
      )}
      {/* Print-only layer — hidden on screen, shown only via @media print */}
      <PrintEstimate result={result} />
    </>
  );
}
