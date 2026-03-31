/**
 * ResultsPanel — Full estimate results with Recharts breakdown
 * Design: Precision Engineering (dark navy, amber accent)
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

const CATEGORY_COLORS = [
  "#F59E0B",
  "#60A5FA",
  "#34D399",
  "#A78BFA",
  "#F87171",
  "#FB923C",
];

// Custom tooltip for the bar chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#1E293B] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
        <div className="font-semibold text-white mb-1">{d.category}</div>
        <div className="text-amber-400 font-mono">
          {formatRange(d.low, d.high)}
        </div>
        <div className="text-slate-400 mt-0.5">{d.note}</div>
      </div>
    );
  }
  return null;
};

export default function ResultsPanel({ result, onBack, onRestart }: ResultsPanelProps) {
  const tierColor = TIER_COLORS[result.tier.id] ?? "#F59E0B";

  const chartData = result.breakdown.map((item, i) => ({
    ...item,
    mid: Math.round((item.low + item.high) / 2),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── MAIN ESTIMATE CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 rounded-xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-1">
              {result.isDIY ? "Materials-Only Estimate" : "Installed Cost Estimate"}
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

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { label: "Region", value: result.region.label },
            { label: "Size", value: result.size.dimensions },
            { label: "Complexity", value: result.complexity.label },
            { label: "Railing", value: result.railing.label },
          ].map((p) => (
            <div
              key={p.label}
              className="text-xs bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1"
            >
              <span className="text-slate-500">{p.label}: </span>
              <span className="text-slate-200">{p.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── COST BREAKDOWN CHART ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-5"
      >
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-4">
          Cost Breakdown
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) => formatCurrency(v)}
                tick={{ fill: "#64748B", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="mid" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown table */}
        <div className="mt-4 space-y-2">
          {result.breakdown.map((item, i) => (
            <div key={item.category} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                <span className="text-slate-300">{item.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 hidden sm:block">{item.note}</span>
                <span className="font-mono text-amber-400 font-medium">
                  {formatRange(item.low, item.high)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── REGIONAL CONTEXT ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-4">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
            Regional Factors
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Labor multiplier</span>
              <span
                className={cn(
                  "font-mono font-semibold",
                  result.regionMultiplier > 1.2 ? "text-red-400" : result.regionMultiplier > 1.0 ? "text-amber-400" : "text-green-400"
                )}
              >
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
                <div key={note} className="text-xs text-slate-500">
                  • {note}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1E293B]/60 border border-white/[0.08] rounded-xl p-4">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
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
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="text-xs text-amber-500/80">⚠ Tariff Note</div>
            <div className="text-xs text-slate-500 mt-1">{result.tier.tariffImpact}</div>
          </div>
        </div>
      </motion.div>

      {/* ── WARNINGS ── */}
      {result.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 space-y-2"
        >
          <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
            ⚠ Pricing Alerts
          </div>
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-200/70">
              {w}
            </p>
          ))}
        </motion.div>
      )}

      {/* ── DISCLAIMER ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-[#1E293B]/40 border border-white/[0.06] rounded-xl p-4"
      >
        <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">
          Important Disclaimer
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          These estimates are derived from publicly available pricing data as of Q1 2026 and are intended for <strong className="text-slate-400">preliminary budgeting purposes only</strong>. Actual costs vary significantly based on local market conditions, site-specific factors, contractor availability, and material price volatility. PT lumber prices in particular are highly volatile and should be verified in-store. <strong className="text-slate-400">Always obtain at least three contractor quotes</strong> before committing to a project. Consult local building officials regarding permit requirements, setback rules, and structural requirements. This tool does not constitute professional advice.
        </p>
      </motion.div>

      {/* ── ACTIONS ── */}
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
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0B1120] font-semibold text-sm rounded-lg transition-colors"
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
    </div>
  );
}
