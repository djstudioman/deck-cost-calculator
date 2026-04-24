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
import CustomerEstimate from "@/components/CustomerEstimate";

interface ResultsPanelProps {
  result: CalculatorResult;
  onBack: () => void;
  onRestart: () => void;
  onChangeOrderUpdate?: (low: number, high: number) => void;
  onShowTakeoff?: () => void;
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
  const footingPill = result.isContractor
    ? result.useHelicalPiers
      ? `${result.footingCount} helical piers`
      : `${result.footingCount} × ${result.footingDiameterIn}" tube`
    : null;

  const fastenerLabel = result.isContractor
    ? result.fastenerSystem === "cortex" ? "Cortex"
    : result.fastenerSystem === "clip" ? "Clip System"
    : "Face Screws"
    : null;

  const brandPill = result.isContractor && result.deckingBrand
    ? result.deckingBrand.name
    : null;

  const basePills = [
    { label: "Region", value: result.region.label },
    { label: "Size", value: result.size.dimensions },
    { label: "Complexity", value: result.complexity.label },
    { label: "Railing", value: result.railing.label },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {basePills.map((p) => (
        <div key={p.label} className="text-xs bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1">
          <span className="text-slate-500">{p.label}: </span>
          <span className="text-slate-200">{p.value}</span>
        </div>
      ))}
      {brandPill && (
        <div className="text-xs bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">
          <span className="text-slate-500">Brand: </span>
          <span className="text-emerald-300">{brandPill}</span>
        </div>
      )}
      {fastenerLabel && (
        <div className={`text-xs border rounded-full px-3 py-1 ${
          result.fastenerSystem === "cortex"
            ? "bg-amber-500/10 border-amber-500/30"
            : result.fastenerSystem === "clip"
            ? "bg-sky-500/10 border-sky-500/30"
            : "bg-white/[0.05] border-white/[0.08]"
        }`}>
          <span className="text-slate-500">Fastening: </span>
          <span className={`${
            result.fastenerSystem === "cortex" ? "text-amber-300"
            : result.fastenerSystem === "clip" ? "text-sky-300"
            : "text-slate-400"
          }`}>{fastenerLabel}</span>
        </div>
      )}
      {footingPill && (
        <div className={`text-xs border rounded-full px-3 py-1 ${
          result.useHelicalPiers
            ? "bg-purple-500/10 border-purple-500/30"
            : "bg-white/[0.05] border-white/[0.08]"
        }`}>
          <span className="text-slate-500">Footings: </span>
          <span className={result.useHelicalPiers ? "text-purple-300" : "text-slate-200"}>{footingPill}</span>
        </div>
      )}
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
function ContractorPanel({ result, onBack, onRestart, onChangeOrderUpdate, onShowTakeoff }: ResultsPanelProps) {
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

  // Draw schedule editable percentages (stored as integers 0–100)
  const [drawPcts, setDrawPcts] = useState([30, 35, 25, 10]);
  const drawTotal = drawPcts.reduce((s, p) => s + p, 0);

  // Editable working days (seeded from calculated estimate)
  const [workingDays, setWorkingDays] = useState<number | null>(null);
  const adjustWorkingDays = (delta: number) => {
    setWorkingDays((prev) => Math.max(1, (prev ?? c.estimatedDays) + delta));
  };

  // Project start date & completion date
  const [startDate, setStartDate] = useState<string>("");
  const calcCompletionDate = (start: string, days: number): string => {
    if (!start) return "";
    const d = new Date(start + "T00:00:00");
    let remaining = days + 3; // +3 for concrete cure
    while (remaining > 0) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) remaining--; // skip weekends
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const setDrawPct = (idx: number, val: number) => {
    setDrawPcts((prev) => {
      const next = [...prev];
      next[idx] = Math.max(0, Math.min(100, val));
      return next;
    });
  };

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

      {/* ── DETAILED COST BREAKDOWN (contractor-only) ── */}
      {(() => {
        const [open, setOpen] = useState(true);
        const sqFt = result.size.sqFt;
        const mat = result.materialsLow + (result.materialsHigh - result.materialsLow) * 0.5; // mid materials
        const lab = result.laborLow + (result.laborHigh - result.laborLow) * 0.5; // mid labor
        const markupPct = c.markupTier.materialMarkup;
        const laborMarkupPct = c.markupTier.laborMarkup;
        const overheadPct = c.markupTier.overheadPct;

        // ── Granular material sub-lines (% splits from industry norms)
        const framingOpt = result.framingOption;
        const framingLabel = framingOpt.shortLabel;
        const joistSpacingNote = result.isContractor && result.joistSpacingIn ? ` · ${result.joistSpacingIn}" OC` : "";
        const framingNote = framingOpt.id === "pt"
          ? `Joists, beams, posts, ledger — standard PT${joistSpacingNote}`
          : framingOpt.id === "pwt"
          ? `UC4B/UC4C PWT joists, beams, posts, ledger${joistSpacingNote}`
          : framingOpt.id === "steel"
          ? `Galvanized/powder-coated steel joists & beams${joistSpacingNote}`
          : `Extruded aluminum framing system${joistSpacingNote}`;
        const matLines = [
          { label: "Decking boards",        pct: 0.45, note: `${result.tier.label} — ${sqFt} sq ft` },
          { label: `Framing (${framingLabel})`, pct: 0.30, note: framingNote },
          { label: "Fasteners & hardware",   pct: 0.15, note: "Screws, joist hangers, post bases" },
          { label: "Concrete & misc",        pct: 0.10, note: "Bags, adhesive, flashing" },
        ];

        // ── Granular labor sub-lines (% splits from phase breakdown)
        const labLines = [
          { label: "Site prep & layout",     pct: 0.10, note: "Demo, layout, staking" },
          { label: "Footings & framing",     pct: 0.30, note: "Dig, pour, post, joist" },
          { label: "Decking installation",   pct: 0.35, note: "Board layout, fastening" },
          { label: "Railing installation",   pct: 0.15, note: "Posts, balusters, cap rail" },
          { label: "Stairs & cleanup",       pct: 0.10, note: "Stringers, treads, punch-list" },
        ];

        // ── Scenario columns: Low / Mid / High
        // Low  = conservative (PT wood baseline, no extras, competitive markup)
        // Mid  = current estimate as configured
        // High = premium (current tier + 30% premium, full permit, premium markup)
        const bidMid = Math.round((c.totalBidLow + c.totalBidHigh) / 2);
        const bidLow = c.totalBidLow;
        const bidHigh = c.totalBidHigh;

        // Material and labor splits for mid scenario
        const matMid = c.materialCostRaw;
        const labMid = c.laborCostRaw;
        const matLow = Math.round(matMid * 0.80);
        const matHigh = Math.round(matMid * 1.30);
        const labLow = Math.round(labMid * 0.85);
        const labHigh = Math.round(labMid * 1.20);
        const railMid = Math.round((result.railingLow + result.railingHigh) / 2);
        const railLow = result.railingLow;
        const railHigh = result.railingHigh;
        const footMid = Math.round((result.footingLow + result.footingHigh) / 2);
        const footLow = result.footingLow;
        const footHigh = result.footingHigh;
        const stairMid = Math.round((result.stairsLow + result.stairsHigh) / 2);
        const stairLow = result.stairsLow;
        const stairHigh = result.stairsHigh;
        const permitVal = result.permitCost;
        const overheadMid = c.overhead;
        const overheadLow = Math.round(overheadMid * 0.80);
        const overheadHigh = Math.round(overheadMid * 1.25);
        const markupMid = Math.round((c.materialWithMarkup - c.materialCostRaw) + (c.laborWithMarkup - c.laborCostRaw));
        const markupLow = Math.round(markupMid * 0.75);
        const markupHigh = Math.round(markupMid * 1.35);

        // Framing upgrade sub-components (delta over standard PT)
        const framingUpgradeLow  = result.framingCostLow;
        const framingUpgradeHigh = result.framingCostHigh;
        const framingUpgradeMid  = Math.round((framingUpgradeLow + framingUpgradeHigh) / 2);
        const hasFramingUpgrade  = framingUpgradeMid > 0;

        // Demo & removal sub-components
        const demoLaborLow = result.demolitionLaborLow;
        const demoLaborHigh = result.demolitionLaborHigh;
        const demoLaborMid = Math.round((demoLaborLow + demoLaborHigh) / 2);
        const demoDisposalLow = result.demolitionDisposalLow;
        const demoDisposalHigh = result.demolitionDisposalHigh;
        const demoDisposalMid = Math.round((demoDisposalLow + demoDisposalHigh) / 2);
        const demoPermit = result.demolitionPermitCost;
        const demoLow = result.demolitionLow;
        const demoHigh = result.demolitionHigh;
        const demoMid = Math.round((demoLow + demoHigh) / 2);

        const fmt = (n: number) => n > 0 ? formatCurrency(n) : "—";
        const col = (low: number, mid: number, high: number) => ({ low, mid, high });

        const sections: { heading: string; accent: string; rows: { label: string; note: string; low: number; mid: number; high: number }[] }[] = [
          {
            heading: "Materials",
            accent: "#60A5FA",
            rows: matLines.map(l => ({
              label: l.label,
              note: l.note,
              low: Math.round(matLow * l.pct),
              mid: Math.round(matMid * l.pct),
              high: Math.round(matHigh * l.pct),
            })),
          },
          {
            heading: "Labor",
            accent: "#93C5FD",
            rows: labLines.map(l => ({
              label: l.label,
              note: l.note,
              low: Math.round(labLow * l.pct),
              mid: Math.round(labMid * l.pct),
              high: Math.round(labHigh * l.pct),
            })),
          },
          {
            heading: "Specialty & Site",
            accent: "#A78BFA",
            rows: [
              { label: "Railing system",    note: result.railing.label + " — " + result.railingLow + "–" + result.railingHigh, ...col(railLow, railMid, railHigh) },
              { label: "Footings",           note: `${result.footingCount} footings · ${result.region.frostDepthLabel} frost depth · based on deck size`, ...col(footLow, footMid, footHigh) },
              ...(stairMid > 0 ? [{ label: "Stairs", note: "Stringers, treads, risers", ...col(stairLow, stairMid, stairHigh) }] : []),
              ...(permitVal > 0 ? [{ label: "Permit & inspection", note: "Pass-through at cost", ...col(permitVal, permitVal, permitVal) }] : []),
              ...(demoMid > 0 ? [
                { label: "Demo labor",       note: `Tear-out · ${result.tier.id === "composite" ? "composite" : result.tier.id === "pvc" ? "PVC/other" : "PT wood"} deck`, ...col(demoLaborLow, demoLaborMid, demoLaborHigh) },
                ...(demoDisposalMid > 0 ? [{ label: "Disposal / haul-away", note: "Dumpster rental + landfill fees",           ...col(demoDisposalLow, demoDisposalMid, demoDisposalHigh) }] : []),
                ...(demoPermit > 0       ? [{ label: "Demo permit",          note: "Pass-through at cost (jurisdiction req.)",  ...col(demoPermit, demoPermit, demoPermit) }] : []),
              ] : []),
            ],
          },
          ...(hasFramingUpgrade ? [{
            heading: "Framing Upgrade",
            accent: "#38BDF8",
            rows: [
              {
                label: `${framingOpt.label} framing upgrade`,
                note: `Delta over standard PT · material + labor premium · marked up at ${Math.round(c.markupTier.materialMarkup * 100)}%`,
                ...col(framingUpgradeLow, framingUpgradeMid, framingUpgradeHigh),
              },
            ],
          }] : []),
          {
            heading: "Markup & Overhead",
            accent: "#F59E0B",
            rows: [
              { label: "Material markup",   note: `+${Math.round(markupPct * 100)}% on materials`, ...col(markupLow, markupMid, markupHigh) },
              { label: "Overhead",           note: `${Math.round(overheadPct * 100)}% of marked-up subtotal`, ...col(overheadLow, overheadMid, overheadHigh) },
            ],
          },
        ];

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl overflow-hidden"
          >
            {/* Header toggle */}
            <button
              onClick={() => setOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase text-left">Detailed Cost Breakdown</div>
                <div className="text-xs text-slate-500 mt-0.5 text-left">Granular line items · Low / Mid / High scenarios</div>
              </div>
              <span className={`text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
            </button>

            {open && (
              <div className="px-5 pb-5">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b border-white/[0.06] mb-1">
                  <div>Line Item</div>
                  <div className="w-16 text-right text-green-400">Low</div>
                  <div className="w-16 text-right text-blue-400">Mid</div>
                  <div className="w-16 text-right text-amber-400">High</div>
                </div>

                {sections.map((sec) => (
                  <div key={sec.heading} className="mt-3">
                    {/* Section heading */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: sec.accent }} />
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: sec.accent }}>{sec.heading}</div>
                    </div>
                    {sec.rows.map((row) => (
                      <div key={row.label} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 py-1.5 border-b border-white/[0.03] text-xs">
                        <div>
                          <div className="text-slate-300">{row.label}</div>
                          <div className="text-[10px] text-slate-600 mt-0.5">{row.note}</div>
                        </div>
                        <div className="w-16 text-right font-mono text-green-400/80">{fmt(row.low)}</div>
                        <div className="w-16 text-right font-mono text-blue-300 font-semibold">{fmt(row.mid)}</div>
                        <div className="w-16 text-right font-mono text-amber-400/80">{fmt(row.high)}</div>
                      </div>
                    ))}
                    {/* Section subtotal — negative mx bleeds bg to container edges; numbers stay on same grid as line items */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center py-2 mt-2 -mx-5 px-5 bg-amber-400/[0.07] border-y border-amber-400/25">
                      <div className="text-xs font-bold text-amber-300 tracking-widest uppercase">Subtotal</div>
                      <div className="w-16 text-right font-mono text-green-400 text-xs font-semibold">{fmt(sec.rows.reduce((s, r) => s + r.low, 0))}</div>
                      <div className="w-16 text-right font-mono text-blue-300 text-xs font-bold">{fmt(sec.rows.reduce((s, r) => s + r.mid, 0))}</div>
                      <div className="w-16 text-right font-mono text-amber-400 text-xs font-semibold">{fmt(sec.rows.reduce((s, r) => s + r.high, 0))}</div>
                    </div>
                  </div>
                ))}

                {/* Grand total row */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-t border-white/[0.08]" style={{paddingTop: '15px', marginTop: '13px', marginBottom: '10px'}}>
                  <div className="font-bold text-white" style={{fontSize: '19px'}}>Total Bid</div>
                  <div className="w-16 text-right font-mono text-green-400 font-bold" style={{fontSize: '14px'}}>{fmt(bidLow)}</div>
                  <div className="w-16 text-right font-mono text-blue-300 font-bold" style={{fontSize: '14px'}}>{fmt(bidMid)}</div>
                  <div className="w-16 text-right font-mono text-amber-400 font-bold" style={{fontSize: '14px'}}>{fmt(bidHigh)}</div>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 mt-1">
                  <div className="text-slate-600" style={{fontSize: '12px'}}>Per sq ft</div>
                  <div className="w-16 text-right font-mono text-green-400/60 text-[10px]">${Math.round(bidLow / sqFt)}</div>
                  <div className="w-16 text-right font-mono text-blue-300/70 text-[10px]">${Math.round(bidMid / sqFt)}</div>
                  <div className="w-16 text-right font-mono text-amber-400/60 text-[10px]">${Math.round(bidHigh / sqFt)}</div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-green-400/60" />
                    Low — Conservative estimate
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-blue-400/60" />
                    Mid — Current configuration
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                    High — Premium scenario
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })()}

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

      {/* ── JOB COSTING & SCHEDULING ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase">Job Costing &amp; Scheduling</div>
            <div className="text-xs text-slate-500 mt-0.5">Timeline, cash flow, and consumables</div>
          </div>
          <span className="text-lg">📅</span>
        </div>

        {/* ── SECTION 1: PROJECT TIMELINE ── */}
        {(() => {
          const totalDays = workingDays ?? c.estimatedDays;
          const isCustom = workingDays !== null && workingDays !== c.estimatedDays;
          // Phase breakdown (% of total days, rounded)
          const phases = [
            { label: "Site prep & layout",   pct: 0.10, color: "#64748B", note: "Marking, clearing, permit post" },
            { label: "Footings & framing",    pct: 0.30, color: "#F59E0B", note: "Dig, pour, cure, beam & joist" },
            { label: "Decking & stairs",      pct: 0.35, color: "#60A5FA", note: "Board install, stair stringers" },
            { label: "Railing & trim",        pct: 0.15, color: "#34D399", note: "Posts, balusters, cap rail" },
            { label: "Cleanup & inspection",  pct: 0.10, color: "#A78BFA", note: "Final punch list, permit close" },
          ];
          const phaseDays = phases.map((p) => ({ ...p, days: Math.max(1, Math.round(totalDays * p.pct)) }));
          // Calendar estimate: assume 5-day work weeks, add ~3 days for concrete cure wait
          const calendarDays = totalDays + 3;
          const calendarWeeks = Math.ceil(calendarDays / 5);
          return (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-slate-300">Project Timeline</div>
                {isCustom && (
                  <button
                    onClick={() => setWorkingDays(null)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors"
                  >Reset to estimate</button>
                )}
              </div>
              {/* Summary row — working days card is now editable */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <button
                      onClick={() => adjustWorkingDays(-1)}
                      className="w-5 h-5 rounded bg-white/[0.06] hover:bg-white/[0.14] text-slate-400 text-xs flex items-center justify-center transition-colors"
                    >-</button>
                    <input
                      type="number"
                      min={1}
                      value={totalDays}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= 1) setWorkingDays(v);
                      }}
                      className="w-10 text-center font-mono text-lg font-bold bg-transparent text-white border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => adjustWorkingDays(1)}
                      className="w-5 h-5 rounded bg-white/[0.06] hover:bg-white/[0.14] text-slate-400 text-xs flex items-center justify-center transition-colors"
                    >+</button>
                  </div>
                  <div className="text-[10px] text-slate-500">Working days</div>
                  {isCustom && <div className="text-[9px] text-amber-400 mt-0.5">est. {c.estimatedDays}d</div>}
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                  <div className="font-mono text-lg font-bold text-blue-300">{calendarWeeks}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Calendar weeks</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                  <div className="font-mono text-lg font-bold text-amber-300">{c.crewSize.size}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Crew size</div>
                </div>
              </div>
              {/* Gantt-style phase bar */}
              <div className="flex rounded-full overflow-hidden h-3 mb-3">
                {phaseDays.map((p) => (
                  <div
                    key={p.label}
                    style={{ width: `${(p.days / totalDays) * 100}%`, background: p.color }}
                    title={`${p.label}: ${p.days}d`}
                  />
                ))}
              </div>
              {/* Phase breakdown list */}
              <div className="space-y-1.5">
                {phaseDays.map((p) => (
                  <div key={p.label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-slate-300">{p.label}</span>
                      <span className="text-[10px] text-slate-600 ml-1.5">{p.note}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-400 shrink-0">{p.days}d</span>
                  </div>
                ))}
              </div>
              {/* Start date / completion date row */}
              <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[10px] text-slate-400 shrink-0">Start date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 min-w-0 bg-white/[0.06] border border-white/[0.10] rounded text-xs text-white px-2 py-1 [color-scheme:dark] cursor-pointer"
                    />
                  </div>
                  {startDate ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400">Est. completion</span>
                      <span className="font-mono text-xs font-bold text-green-400">
                        {calcCompletionDate(startDate, totalDays)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-600">Select a start date to see estimated completion</span>
                  )}
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-600">+3 days concrete cure time included. Completion skips weekends. Adjust working days above to add weather delays.</div>
            </div>
          );
        })()}

        <div className="border-t border-white/[0.06] my-4" />

        {/* ── SECTION 2: CASH FLOW DRAW SCHEDULE ── */}
        {(() => {
          const bidMid = Math.round((c.totalBidLow + c.totalBidHigh) / 2);
          const DRAW_META = [
            { label: "Deposit",       when: "Contract signing",  note: "Materials procurement & mobilization" },
            { label: "Framing draw",  when: "Framing complete",   note: "After footings, posts & joists pass inspection" },
            { label: "Decking draw",  when: "Decking complete",   note: "After boards, stairs & railing installed" },
            { label: "Final payment", when: "Final inspection",   note: "After permit closed & punch list complete" },
          ];
          const isBalanced = drawTotal === 100;
          return (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-slate-300">Cash Flow Draw Schedule</div>
                <div className={cn(
                  "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
                  isBalanced ? "text-green-400 bg-green-500/10" : "text-amber-400 bg-amber-500/10"
                )}>
                  {drawTotal}% {isBalanced ? "✓ balanced" : `→ needs ${100 - drawTotal > 0 ? "+" : ""}${100 - drawTotal}%`}
                </div>
              </div>
              <div className="space-y-2">
                {DRAW_META.map((d, i) => {
                  const pct = drawPcts[i];
                  const amount = Math.round(bidMid * (pct / 100));
                  return (
                    <div key={d.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-blue-400">{i + 1}</span>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">{d.label}</div>
                            <div className="text-[10px] text-slate-500">{d.when}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Editable % input */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setDrawPct(i, pct - 5)}
                              className="w-5 h-5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 text-xs flex items-center justify-center transition-colors"
                            >-</button>
                            <input
                              type="number"
                              min={0} max={100}
                              value={pct}
                              onChange={(e) => setDrawPct(i, parseInt(e.target.value) || 0)}
                              className="w-10 text-center font-mono text-xs bg-white/[0.06] border border-white/[0.10] rounded text-white py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[10px] text-slate-500">%</span>
                            <button
                              onClick={() => setDrawPct(i, pct + 5)}
                              className="w-5 h-5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 text-xs flex items-center justify-center transition-colors"
                            >+</button>
                          </div>
                          <div className="text-right w-20">
                            <div className="font-mono text-sm font-bold text-blue-300">{formatCurrency(amount)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500/50 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-600 mt-1">{d.note}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[10px] text-slate-600">Adjust percentages to match your contract terms. Total must equal 100%.</div>
                <button
                  onClick={() => setDrawPcts([30, 35, 25, 10])}
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors shrink-0 ml-2"
                >Reset to default</button>
              </div>
            </div>
          );
        })()}

        <div className="border-t border-white/[0.06] my-4" />

        {/* ── SECTION 3: CONSUMABLES & EQUIPMENT ── */}
        {(() => {
          const sqFt = result.size.sqFt;
          const isComposite = result.tier.id !== "pt";
          // Fasteners: composite needs hidden fasteners (~$0.80/sqft), PT uses screws (~$0.25/sqft)
          const fastenerCost = Math.round(sqFt * (isComposite ? 0.80 : 0.25));
          // Concrete: ~0.6 bags per footing inch of depth × footing count, $7/bag
          const footingCount = sqFt <= 200 ? 6 : sqFt <= 350 ? 10 : sqFt <= 500 ? 12 : 16;
          const concreteCost = Math.round(footingCount * 8 * 7); // 8 bags avg per footing × $7
          // Joist tape/flashing: ~$0.15/sqft
          const flashingCost = Math.round(sqFt * 0.15);
          // Saw blades & drill bits: flat estimate by complexity
          const bladesCost = result.complexity.id === "simple" ? 45 : result.complexity.id === "standard" ? 75 : result.complexity.id === "multi" ? 120 : 180;
          // Safety & PPE: flat per crew member
          const ppeCost = c.crewSize.size * 35;
          // Cleanup / dumpster: scales with sqft
          const dumpsterCost = sqFt <= 300 ? 250 : sqFt <= 500 ? 350 : 450;
          const items = [
            { label: "Fasteners",              amount: fastenerCost,  note: isComposite ? "Hidden clip system" : "Structural screws" },
            { label: "Concrete (footings)",    amount: concreteCost,  note: `${footingCount} footings × ~8 bags` },
            { label: "Joist tape & flashing",  amount: flashingCost,  note: "Moisture barrier, ledger flashing" },
            { label: "Blades & drill bits",    amount: bladesCost,    note: "Consumable cutting tools" },
            { label: "Safety & PPE",           amount: ppeCost,       note: `${c.crewSize.size} crew × $35` },
            { label: "Cleanup / dumpster",     amount: dumpsterCost,  note: "Debris removal & haul-away" },
          ];
          const totalConsumables = items.reduce((s, i) => s + i.amount, 0);
          const bidMid = Math.round((c.totalBidLow + c.totalBidHigh) / 2);
          const consumablesPct = Math.round((totalConsumables / bidMid) * 100);
          return (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-slate-300">Consumables &amp; Equipment</div>
                <div className="text-[10px] text-slate-500">Often missed in bids</div>
              </div>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-xs text-slate-300">{item.label}</span>
                      <span className="text-[10px] text-slate-600 ml-1.5">{item.note}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-400 shrink-0 ml-2">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Est. consumables total</div>
                  <div className="font-mono text-base font-bold text-white mt-0.5">{formatCurrency(totalConsumables)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">% of bid</div>
                  <div className={cn(
                    "font-mono text-base font-bold mt-0.5",
                    consumablesPct <= 3 ? "text-green-400" : consumablesPct <= 6 ? "text-amber-400" : "text-red-400"
                  )}>{consumablesPct}%</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-600">Consumables are rough estimates — verify against your actual supplier pricing. These are not included in the bid total above.</div>
            </div>
          );
        })()}

      </motion.div>

      {/* ── JOB SITE TOOLS ── */}
      <JobSiteToolsPanel result={result} />

      <Warnings warnings={result.warnings} />
      <Disclaimer text={`This bid estimate is generated from regional cost data as of Q1 2026 and is intended for <strong class="text-slate-400">preliminary bidding guidance only</strong>. Actual project costs depend on site conditions, material availability, subcontractor pricing, and local labor markets. Markup percentages are industry benchmarks — adjust to your actual overhead structure. Gross margin calculations do not account for income tax, equipment depreciation, or warranty reserves. Always perform a detailed takeoff before submitting a final bid. This tool does not constitute professional advice.`} />
      {/* Contractor action bar with both print modes */}
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
          style={{ background: "#60A5FA", color: "#0B1120" }}
        >
          Start Over
        </button>
        {onShowTakeoff && (
          <button
            onClick={onShowTakeoff}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-lg border transition-colors border-amber-500/40 text-amber-400 hover:border-amber-400/70 hover:bg-amber-400/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
            Material Takeoff
          </button>
        )}
        <div className="ml-auto flex gap-2">
          {/* Customer Proposal — prints the clean customer-facing view */}
          <button
            onClick={() => {
              document.body.classList.add("print-customer-mode");
              window.print();
              setTimeout(() => document.body.classList.remove("print-customer-mode"), 1000);
            }}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-lg border transition-colors border-emerald-500/40 text-emerald-400 hover:border-emerald-400/70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Customer Proposal
          </button>
          {/* Internal Bid Estimate — prints the full contractor view */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-lg border transition-colors border-blue-400/40 text-blue-400 hover:border-blue-400/70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Bid Estimate
          </button>
        </div>
      </motion.div>
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
      {/* Customer proposal print layer — shown only when body has .print-customer-mode */}
      {result.isContractor && <CustomerEstimate result={result} />}
    </>
  );
}

// ─── JOB SITE TOOLS PANEL ─────────────────────────────────────────────────────
function JobSiteToolsPanel({ result }: { result: CalculatorResult }) {
  const [activeTab, setActiveTab] = useState<"takeoff" | "pricechk" | "footings">("takeoff");

  // ── Lumber Yard Price Check state ──
  const [actualBoardPrice, setActualBoardPrice] = useState<string>("");
  const [actualJoistPrice, setActualJoistPrice] = useState<string>("");
  const [actualPostPrice, setActualPostPrice] = useState<string>("");

  const sqFt = result.size.sqFt;
  const isComposite = result.tier.id !== "pt";
  const isPVC = result.tier.id === "pvc";

  // ── QUANTITY TAKEOFF calculations ──
  // Decking boards: 5/4×6 PT = ~1.1 boards/sqft; composite = ~0.85 boards/sqft (wider planks)
  const boardsPerSqFt = isComposite ? 0.85 : 1.1;
  const deckBoardCount = Math.ceil(sqFt * boardsPerSqFt * 1.10); // +10% waste
  const deckBoardUnit = isComposite ? "composite planks (16 ft)" : "5/4×6 boards (16 ft)";

  // Joists: 16" OC → ~0.75 joists per linear foot of deck width
  const deckWidth = Math.sqrt(sqFt); // approximate square root for width
  const joistCount = Math.ceil((deckWidth / (16 / 12)) + 1);
  const joistLength = Math.ceil(Math.sqrt(sqFt)); // span length
  const framingMat = result.framingOption.id;
  const joistUnit = framingMat === "steel"
    ? `Steel joists (${joistLength} ft) — Fortress/DeckFrame`
    : framingMat === "aluminum"
    ? `Aluminum joists (${joistLength} ft) — Wahoo/Trex`
    : framingMat === "pwt"
    ? `2×8 PWT joists (${joistLength} ft) — UC4B`
    : `2×8 PT joists (${joistLength} ft)`;

  // Beams: 1 beam per 8 ft of deck length, 2 per span
  const deckLength = Math.ceil(sqFt / deckWidth);
  const beamCount = Math.ceil(deckLength / 8) * 2;

  // Posts: one per footing
  const footingCount = sqFt <= 200 ? 6 : sqFt <= 350 ? 10 : sqFt <= 500 ? 12 : 16;
  const postCount = footingCount;
  const postHeight = Math.ceil(result.region.frostDepthInches / 12) + 4; // frost depth + 4ft above grade

  // Ledger board: 1 per deck width
  const ledgerLF = Math.ceil(deckWidth);

  // Concrete bags: ~8 bags per footing
  const concreteBags = footingCount * 8;

  // Railing posts: 1 per 6 LF of railing
  const railingLF = result.contractor?.crewSize ? Math.ceil(deckWidth * 2 + deckLength) : Math.ceil(deckWidth * 2 + deckLength);
  const railingPosts = Math.ceil(railingLF / 6) + 1;

  // Fasteners
  const fastenerBoxes = isComposite
    ? Math.ceil(sqFt / 50)   // hidden clip boxes (~50 sqft/box)
    : Math.ceil(sqFt / 100); // screw boxes (~100 sqft/box)
  const fastenerUnit = isComposite ? "hidden clip boxes" : "structural screw boxes (5 lb)";

  // Joist hangers: 2 per joist + 4 for beams
  const joistHangers = joistCount * 2 + 4;

  const beamUnit = framingMat === "steel"
    ? `Steel beams (${joistLength} ft) — Fortress/DeckFrame`
    : framingMat === "aluminum"
    ? `Aluminum beams (${joistLength} ft) — Wahoo/Trex`
    : framingMat === "pwt"
    ? `2×10 PWT beams (${joistLength} ft) — UC4B`
    : `2×10 PT beams (${joistLength} ft)`;
  const postUnit = (framingMat === "steel" || framingMat === "aluminum")
    ? `Steel posts (${postHeight} ft)`
    : framingMat === "pwt"
    ? `6×6 PWT posts (${postHeight} ft) — UC4C`
    : `6×6 PT posts (${postHeight} ft)`;

  const takeoffItems = [
    { label: deckBoardUnit,            qty: deckBoardCount,  note: "+10% waste included" },
    { label: joistUnit,                qty: joistCount,      note: "16\" OC spacing" },
    { label: beamUnit,                 qty: beamCount,       note: "Double-ply beam spans" },
    { label: postUnit,                 qty: postCount,       note: "One per footing" },
    { label: `2×${Math.ceil(deckWidth)} PT ledger board`, qty: 1, note: "House attachment" },
    { label: "80 lb concrete bags",    qty: concreteBags,    note: `${footingCount} footings × 8 bags` },
    { label: fastenerUnit,             qty: fastenerBoxes,   note: isComposite ? "Hidden fastener system" : "Structural screws" },
    { label: "Joist hangers",          qty: joistHangers,    note: "Simpson LUS28 or equivalent" },
    { label: "Post bases / standoffs", qty: postCount,       note: "Simpson ABA66 or equivalent" },
    { label: "Railing posts",          qty: railingPosts,    note: "1 per 6 LF of railing" },
  ];

  // ── LUMBER YARD PRICE CHECK ──
  const estBoardPriceMin = result.tier.materialPerSqFtMin;
  const estBoardPriceMax = result.tier.materialPerSqFtMax;
  const estBoardMid = ((estBoardPriceMin + estBoardPriceMax) / 2).toFixed(2);

  const actualBoardNum = parseFloat(actualBoardPrice) || 0;
  const actualJoistNum = parseFloat(actualJoistPrice) || 0;
  const actualPostNum = parseFloat(actualPostPrice) || 0;

  // Estimated material cost from calculator
  const estMaterialCost = result.materialsLow;
  // Actual material cost estimate based on quoted prices
  const boardMaterialCost = actualBoardNum > 0 ? Math.round(actualBoardNum * sqFt) : 0;
  const joistMaterialCost = actualJoistNum > 0 ? Math.round(actualJoistNum * joistCount * joistLength) : 0;
  const postMaterialCost = actualPostNum > 0 ? Math.round(actualPostNum * postCount * postHeight) : 0;
  const actualTotalMaterial = boardMaterialCost + joistMaterialCost + postMaterialCost;
  const variance = actualTotalMaterial > 0 ? actualTotalMaterial - estMaterialCost : 0;
  const variancePct = estMaterialCost > 0 && actualTotalMaterial > 0
    ? Math.round((variance / estMaterialCost) * 100)
    : 0;

  // ── FOOTING LAYOUT ──
  const frostDepth = result.region.frostDepthInches;
  const footingDiameter = frostDepth <= 18 ? 10 : frostDepth <= 36 ? 12 : frostDepth <= 54 ? 14 : 16;
  const footingDepth = frostDepth + 6; // 6" below frost line
  const footingSpacingFt = Math.round((sqFt / footingCount) ** 0.5 * 10) / 10;

  // Grid layout suggestion
  const cols = sqFt <= 200 ? 2 : sqFt <= 350 ? 3 : sqFt <= 500 ? 4 : 4;
  const rows = Math.ceil(footingCount / cols);

  const tabs = [
    { id: "takeoff" as const,  label: "Qty Takeoff",    icon: "📋" },
    { id: "pricechk" as const, label: "Price Check",    icon: "🏪" },
    { id: "footings" as const, label: "Footing Layout", icon: "📐" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-5 mb-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase">Job Site Tools</div>
          <div className="text-xs text-slate-500 mt-0.5">Quantity takeoff, price check & footing layout</div>
        </div>
        <span className="text-lg">🔧</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-white/[0.03] rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === t.id
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: QUANTITY TAKEOFF ── */}
      {activeTab === "takeoff" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400">
              Based on <span className="text-white font-medium">{result.size.dimensions}</span> · <span className="text-white font-medium">{result.tier.shortLabel}</span> · <span className="text-white font-medium">{result.complexity.label}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {takeoffItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                <div className="font-mono text-sm font-bold text-amber-300 w-10 shrink-0 text-right">{item.qty}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-600">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-slate-600">Quantities are estimates based on standard span tables and 16" OC framing. Always verify against your actual site conditions and local code requirements.</div>
        </div>
      )}

      {/* ── TAB 2: LUMBER YARD PRICE CHECK ── */}
      {activeTab === "pricechk" && (
        <div>
          <div className="text-xs text-slate-400 mb-3">
            Enter your supplier quotes to compare against the calculator's estimate and see variance.
          </div>
          <div className="space-y-2 mb-4">
            {[
              { label: `Decking boards (per sq ft installed)`, placeholder: `est. $${estBoardMid}`, value: actualBoardPrice, onChange: setActualBoardPrice, note: result.tier.shortLabel },
              { label: `Framing (per linear foot)`,
                placeholder: framingMat === "steel" ? "est. $8–$14/lf" : framingMat === "aluminum" ? "est. $10–$18/lf" : framingMat === "pwt" ? "est. $2.20–$3.00" : "est. $1.80–$2.40",
                value: actualJoistPrice, onChange: setActualJoistPrice,
                note: framingMat === "steel" ? "Steel joists & beams" : framingMat === "aluminum" ? "Aluminum joists & beams" : framingMat === "pwt" ? "2×8 PWT joists & beams" : "2×8 PT joists & beams" },
              { label: `Posts (per linear foot)`,
                placeholder: (framingMat === "steel" || framingMat === "aluminum") ? "est. $12–$20/lf" : framingMat === "pwt" ? "est. $3.00–$4.50" : "est. $2.50–$3.50",
                value: actualPostPrice,  onChange: setActualPostPrice,
                note: (framingMat === "steel" || framingMat === "aluminum") ? "Steel posts" : framingMat === "pwt" ? "6×6 PWT posts" : "6×6 PT posts" },
            ].map((field) => (
              <div key={field.label} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white">{field.label}</div>
                    <div className="text-[10px] text-slate-600">{field.note}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-20 text-right font-mono text-xs bg-white/[0.06] border border-white/[0.10] rounded text-white px-2 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {actualTotalMaterial > 0 && (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
              <div className="text-xs font-semibold text-slate-300 mb-2">Variance Summary</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-mono text-sm font-bold text-slate-300">{formatCurrency(estMaterialCost)}</div>
                  <div className="text-[10px] text-slate-500">Calculator est.</div>
                </div>
                <div>
                  <div className="font-mono text-sm font-bold text-white">{formatCurrency(actualTotalMaterial)}</div>
                  <div className="text-[10px] text-slate-500">Your quote</div>
                </div>
                <div>
                  <div className={cn(
                    "font-mono text-sm font-bold",
                    variance > 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {variance > 0 ? "+" : ""}{formatCurrency(variance)} ({variancePct > 0 ? "+" : ""}{variancePct}%)
                  </div>
                  <div className="text-[10px] text-slate-500">Variance</div>
                </div>
              </div>
              {Math.abs(variancePct) > 15 && (
                <div className={cn(
                  "mt-2 text-[10px] px-2 py-1 rounded",
                  variance > 0 ? "text-red-300 bg-red-500/10" : "text-green-300 bg-green-500/10"
                )}>
                  {variance > 0
                    ? `⚠ Your quote is ${variancePct}% above estimate — consider adjusting your bid or sourcing alternative suppliers.`
                    : `✓ Your quote is ${Math.abs(variancePct)}% below estimate — you have room to tighten margin or improve competitiveness.`}
                </div>
              )}
            </div>
          )}
          {actualTotalMaterial === 0 && (
            <div className="text-[10px] text-slate-600 text-center py-4">Enter at least one supplier price above to see variance analysis.</div>
          )}
        </div>
      )}

      {/* ── TAB 3: FOOTING LAYOUT ── */}
      {activeTab === "footings" && (
        <div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: "Footing count",    value: `${footingCount}`,           note: `Based on ${result.size.sqFt} sq ft` },
              { label: "Footing diameter", value: `${footingDiameter}"`,        note: "Tube form size" },
              { label: "Footing depth",    value: `${footingDepth}"`,           note: `${frostDepth}" frost + 6" below` },
              { label: "Spacing (approx)", value: `${footingSpacingFt} ft OC`,  note: "Center-to-center" },
              { label: "Grid layout",      value: `${cols} × ${rows}`,          note: "Columns × rows" },
              { label: "Frost depth",      value: result.region.frostDepthLabel, note: result.region.label },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2.5">
                <div className="font-mono text-sm font-bold text-blue-300">{item.value}</div>
                <div className="text-[10px] text-white mt-0.5">{item.label}</div>
                <div className="text-[10px] text-slate-600">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-[10px]">
              <span className="text-amber-400 shrink-0">▸</span>
              <span className="text-slate-500">Use a <strong className="text-slate-400">{footingDiameter}" tube form</strong> at each location. Set bottom of footing at <strong className="text-slate-400">{footingDepth}"</strong> below grade.</span>
            </div>
            <div className="flex items-start gap-2 text-[10px]">
              <span className="text-amber-400 shrink-0">▸</span>
              <span className="text-slate-500">Pour <strong className="text-slate-400">~8 bags of 80 lb concrete</strong> per footing. Allow 24–48 hours cure before loading.</span>
            </div>
            <div className="flex items-start gap-2 text-[10px]">
              <span className="text-amber-400 shrink-0">▸</span>
              <span className="text-slate-500">Install <strong className="text-slate-400">post bases (Simpson ABA66)</strong> while concrete is wet. Check plumb and alignment before cure.</span>
            </div>
            <div className="flex items-start gap-2 text-[10px]">
              <span className="text-amber-400 shrink-0">▸</span>
              <span className="text-slate-500">Verify spacing with local inspector — some jurisdictions require engineered drawings for decks over 200 sq ft or 30" off grade.</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
