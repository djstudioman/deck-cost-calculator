/**
 * ResultsPanel — Audience-specific estimate results
 * Design: Precision Engineering (dark navy, amber/emerald/blue accent per audience)
 *
 * Homeowner: Installed cost, breakdown chart, regional factors, material profile, warnings
 * DIYer:     Materials cost + waste + tool rental + permit, savings vs hiring, weekend estimate
 * Contractor: Bid range, markup breakdown, gross margin, crew days, subcontracting note
 */
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
} from "@/lib/deckData";
import { cn } from "@/lib/utils";

interface ResultsPanelProps {
  result: CalculatorResult;
  onBack: () => void;
  onRestart: () => void;
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
      className="flex gap-3"
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
        className="ml-auto px-4 py-2.5 text-sm text-slate-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-colors"
      >
        Print / Save
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
function ContractorPanel({ result, onBack, onRestart }: ResultsPanelProps) {
  const c = result.contractor!;

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
              Bid Range Estimate
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-white">
              {formatRange(c.totalBidLow, c.totalBidHigh)}
            </div>
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

      <Warnings warnings={result.warnings} />
      <Disclaimer text={`This bid estimate is generated from regional cost data as of Q1 2026 and is intended for <strong class="text-slate-400">preliminary bidding guidance only</strong>. Actual project costs depend on site conditions, material availability, subcontractor pricing, and local labor markets. Markup percentages are industry benchmarks — adjust to your actual overhead structure. Gross margin calculations do not account for income tax, equipment depreciation, or warranty reserves. Always perform a detailed takeoff before submitting a final bid. This tool does not constitute professional advice.`} />
      <ActionButtons onBack={onBack} onRestart={onRestart} accent="#60A5FA" />
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function ResultsPanel(props: ResultsPanelProps) {
  const { result } = props;

  if (result.isDIY && result.diy) {
    return <DIYPanel {...props} />;
  }
  if (result.isContractor && result.contractor) {
    return <ContractorPanel {...props} />;
  }
  return <HomeownerPanel {...props} />;
}
