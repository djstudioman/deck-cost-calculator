/**
 * PrintEstimate — Hidden print-only layer rendered alongside ResultsPanel.
 * Design: Precision Engineering — clean white print layout, audience-specific sections.
 * Triggered by window.print(); shown only via @media print CSS.
 */
import { type CalculatorResult, formatRange, formatCurrency, formatCurrencyFull } from "@/lib/deckData";

interface Props {
  result: CalculatorResult;
}

export default function PrintEstimate({ result }: Props) {
  const isHomeowner = !result.isDIY && !result.isContractor;
  const isDIY = result.isDIY && !!result.diy;
  const isContractor = result.isContractor && !!result.contractor;
  const d = result.diy;
  const c = result.contractor;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div id="print-estimate" className="hidden print:block font-sans text-gray-900 bg-white p-8 max-w-[720px] mx-auto">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-1">DeckCost 2026</div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {isHomeowner && "Installed Cost Estimate"}
            {isDIY && "DIY Materials & Cost Estimate"}
            {isContractor && "Contractor Bid Estimate"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Generated {today} · Based on 2026 regional pricing data</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            {isHomeowner && "Total Installed"}
            {isDIY && "Total DIY Cost"}
            {isContractor && "Bid Range"}
          </div>
          <div className="text-3xl font-bold font-mono text-gray-900">
            {isHomeowner && formatRange(result.totalLow, result.totalHigh)}
            {isDIY && d && formatRange(d.totalWithExtrasLow, d.totalWithExtrasHigh)}
            {isContractor && c && formatRange(c.totalBidLow, c.totalBidHigh)}
          </div>
          {isHomeowner && (
            <div className="text-sm text-gray-500 mt-0.5">
              {formatCurrency(result.perSqFtLow)}–{formatCurrency(result.perSqFtHigh)}/sq ft
            </div>
          )}
          {isContractor && c && (
            <div className="text-sm text-gray-500 mt-0.5">
              {formatCurrency(c.perSqFtBidLow)}–{formatCurrency(c.perSqFtBidHigh)}/sq ft · {c.grossMarginPct}% gross margin
            </div>
          )}
        </div>
      </div>

      {/* ── PROJECT SPECS ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Project Specifications</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Region", value: result.region.label },
            { label: "Size", value: `${result.size.dimensions} (${result.size.sqFt} sq ft)` },
            { label: "Material", value: result.tier.label },
            { label: "Complexity", value: result.complexity.label },
            { label: "Railing", value: result.railing.label },
            { label: "Frost Depth", value: result.region.frostDepthLabel },
            { label: "Labor Rate", value: `${result.regionMultiplier.toFixed(2)}× national` },
            ...(result.isContractor ? [
              { label: "Framing", value: `${result.framingOption.shortLabel} · ${result.joistSpacingIn}" OC` },
              { label: "Joist Qty", value: `${result.joistCount} joists · ${result.joistLengthFt}' span · ${result.joistBoardFeet} BF` },
              ...(result.railingPostCount > 0 ? [
                { label: "Railing Posts", value: `${result.railingPostCount} posts · ${result.railingHeightPremiumLow > 0 ? '42"' : '36"'} ht · ${result.railingPostMountCostLow > result.railingPostCount * 10 ? "Fascia" : "Surface"} mount` },
              ] : []),
            ] : []),
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded p-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</div>
              <div className="text-xs font-semibold text-gray-800 mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COST BREAKDOWN TABLE ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Cost Breakdown</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Line Item</th>
              <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Notes</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Range</th>
            </tr>
          </thead>
          <tbody>
            {result.breakdown.map((item, i) => (
              <tr key={item.category} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="py-2 px-2 font-medium text-gray-800 text-xs">{item.category}</td>
                <td className="py-2 px-2 text-gray-500 text-xs">{item.note}</td>
                <td className="py-2 px-2 text-right font-mono text-xs font-semibold text-gray-900">
                  {formatRange(item.low, item.high)}
                </td>
              </tr>
            ))}
            {/* Railing spec info row — contractor only */}
            {result.isContractor && result.railingPostCount > 0 && (
              <tr className="border-t border-gray-200 bg-indigo-50">
                <td className="py-2 px-2 font-medium text-gray-700 text-xs">
                  Railing Spec
                </td>
                <td className="py-2 px-2 text-gray-600 text-xs">
                  <div>
                    {result.railingPostCount} posts · {result.railingPostMountCostLow > result.railingPostCount * 10 ? "Fascia mount" : "Surface mount"} · {result.railingHeightPremiumLow > 0 ? '42"' : '36"'} height
                  </div>
                  {result.railingDetailCostLow > 0 && (
                    <div className="mt-0.5 text-indigo-700 font-medium">
                      Spec upcharge: +{formatRange(result.railingPostMountCostLow + result.railingHeightPremiumLow, result.railingPostMountCostHigh + result.railingHeightPremiumHigh)}
                      {result.railingHeightPremiumLow > 0 && (
                        <span className="text-gray-500 font-normal"> (incl. 42" height premium)</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-2 px-2 text-right font-mono text-xs text-gray-400">—</td>
              </tr>
            )}
            {/* Framing spec info row — contractor only, no cost (informational) */}
            {result.isContractor && (
              <tr className={`border-t border-gray-200 ${
                result.joistSpanWarning?.exceeded ? "bg-amber-50" : "bg-blue-50"
              }`}>
                <td className="py-2 px-2 font-medium text-gray-700 text-xs">
                  Framing Spec ({result.framingOption.shortLabel})
                  {result.joistSpanWarning?.exceeded && (
                    <span className="ml-1 text-amber-700 font-bold">⚠ Span Alert</span>
                  )}
                </td>
                <td className="py-2 px-2 text-gray-600 text-xs">
                  <div>{result.joistSpacingIn}" OC · {result.joistCount} joists · {result.joistLengthFt}' span · {result.joistBoardFeet} BF total
                    {result.joistSpacingCostDelta !== 0 && (
                      <span className={result.joistSpacingCostDelta > 0 ? " text-amber-700" : " text-green-700"}>
                        {" "}({result.joistSpacingCostDelta > 0 ? "+" : ""}{formatCurrency(result.joistSpacingCostDelta)} vs 16" OC)
                      </span>
                    )}
                  </div>
                  {result.joistSpanWarning && (
                    <div className={`mt-1 text-xs ${
                      result.joistSpanWarning.exceeded ? "text-amber-800 font-medium" : "text-green-700"
                    }`}>
                      {result.joistSpanWarning.exceeded ? "⚠ " : "✓ "}
                      {result.joistSpanWarning.message}
                    </div>
                  )}
                  {result.joistSpanWarning?.exceeded && (
                    <div className="mt-0.5 text-[10px] text-gray-500">
                      IRC R507.6 max spans (SYP No.2 PT) @ {result.joistSpacingIn}" OC:
                      {" "}2×10 = {result.joistSpanWarning.maxAllowedFt}' · 2×12 = {result.joistSpanWarning.upgradeMaxFt}'
                    </div>
                  )}
                </td>
                <td className="py-2 px-2 text-right font-mono text-xs text-gray-400">—</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-900">
              <td className="py-2 px-2 font-bold text-sm text-gray-900" colSpan={2}>
                {isHomeowner && "Total Installed Cost"}
                {isDIY && "Total Materials + Extras"}
                {isContractor && "Total Bid Range"}
              </td>
              <td className="py-2 px-2 text-right font-mono font-bold text-sm text-gray-900">
                {isHomeowner && formatRange(result.totalLow, result.totalHigh)}
                {isDIY && d && formatRange(d.totalWithExtrasLow, d.totalWithExtrasHigh)}
                {isContractor && c && formatRange(c.totalBidLow, c.totalBidHigh)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── DIY EXTRAS ── */}
      {isDIY && d && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">DIY Extras</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="bg-gray-50">
                <td className="py-2 px-2 text-xs text-gray-700">Waste factor ({Math.round(d.wasteFactor * 100)}% overage)</td>
                <td className="py-2 px-2 text-right font-mono text-xs font-semibold">
                  +{formatCurrencyFull(d.wastedMaterialCost)}
                </td>
              </tr>
              {d.toolRentalLow > 0 && (
                <tr>
                  <td className="py-2 px-2 text-xs text-gray-700">Tool rental</td>
                  <td className="py-2 px-2 text-right font-mono text-xs font-semibold">
                    {formatRange(d.toolRentalLow, d.toolRentalHigh)}
                  </td>
                </tr>
              )}
              {d.permitCost > 0 && (
                <tr className="bg-gray-50">
                  <td className="py-2 px-2 text-xs text-gray-700">Building permit</td>
                  <td className="py-2 px-2 text-right font-mono text-xs font-semibold">
                    {formatCurrencyFull(d.permitCost)}
                  </td>
                </tr>
              )}
              <tr className="border-t border-gray-300">
                <td className="py-2 px-2 text-xs font-bold text-gray-900">vs. Hiring a contractor</td>
                <td className="py-2 px-2 text-right font-mono text-xs font-bold text-green-700">
                  Save ~{formatCurrencyFull(d.savingsVsHiring)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── CONTRACTOR BID CONSTRUCTION ── */}
      {isContractor && c && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Bid Construction</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Line Item</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Cost Basis</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">With Markup</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50">
                <td className="py-2 px-2 text-xs text-gray-700">Materials (+{Math.round(c.markupTier.materialMarkup * 100)}%)</td>
                <td className="py-2 px-2 text-right font-mono text-xs">{formatCurrency(c.materialCostRaw)}</td>
                <td className="py-2 px-2 text-right font-mono text-xs font-semibold">{formatCurrency(c.materialWithMarkup)}</td>
              </tr>
              <tr>
                <td className="py-2 px-2 text-xs text-gray-700">Labor (+{Math.round(c.markupTier.laborMarkup * 100)}%) · {c.crewSize.label}</td>
                <td className="py-2 px-2 text-right font-mono text-xs">{formatCurrency(c.laborCostRaw)}</td>
                <td className="py-2 px-2 text-right font-mono text-xs font-semibold">{formatCurrency(c.laborWithMarkup)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-2 text-xs text-gray-700">Overhead ({Math.round(c.markupTier.overheadPct * 100)}%)</td>
                <td className="py-2 px-2 text-right font-mono text-xs">—</td>
                <td className="py-2 px-2 text-right font-mono text-xs font-semibold">{formatCurrency(c.overhead)}</td>
              </tr>
              <tr className="border-t-2 border-gray-900">
                <td className="py-2 px-2 text-xs font-bold text-gray-900">Total Bid · {c.estimatedDays} crew days</td>
                <td className="py-2 px-2 text-right font-mono text-xs">{formatCurrency(c.materialCostRaw + c.laborCostRaw)}</td>
                <td className="py-2 px-2 text-right font-mono text-xs font-bold">{formatRange(c.totalBidLow, c.totalBidHigh)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── REGIONAL NOTES ── */}
      {result.region.climateNotes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Regional Climate Notes</h2>
          <ul className="text-xs text-gray-600 space-y-1">
            {result.region.climateNotes.map((note) => (
              <li key={note} className="flex gap-2"><span>•</span><span>{note}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* ── WARNINGS ── */}
      {result.warnings.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded p-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-yellow-700 mb-2">⚠ Pricing Alerts</h2>
          <ul className="text-xs text-yellow-800 space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i} className="flex gap-2"><span>•</span><span>{w}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* ── DISCLAIMER ── */}
      <div className="border-t border-gray-200 pt-4 mt-2">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          <strong className="text-gray-500">Important Disclaimer:</strong> This estimate is generated from regional cost data as of Q1 2026 and is intended for preliminary budgeting purposes only. Actual costs depend on site conditions, material availability, contractor pricing, and local labor markets. This tool does not constitute professional advice. Verify all figures with licensed contractors and your local building department before committing to a project budget.
        </p>
        <p className="text-[10px] text-gray-400 mt-2">
          DeckCost 2026 · deckcalc2026-axndupm8.manus.space · Data sourced from HomeAdvisor, HomeGuide, Advantage Lumber, BLS, and regional retailers.
        </p>
      </div>
    </div>
  );
}
