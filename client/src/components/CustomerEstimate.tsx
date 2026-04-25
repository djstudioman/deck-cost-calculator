/**
 * CustomerEstimate — Customer-facing proposal print view for the contractor path.
 * Design: Clean, professional proposal — no internal markup, cost basis, or margin data.
 * Shows: scope summary, investment range, payment schedule, timeline, signature block.
 * Hidden from: all internal bid construction, markup %, overhead, joist specs, board-feet.
 *
 * Triggered by a separate "Customer Proposal" button that sets a CSS class on <body>
 * so only this layer prints (not the contractor estimate).
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { type CalculatorResult, formatRange, formatCurrency } from "@/lib/deckData";

interface Props {
  result: CalculatorResult;
}

function ScopeItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-400 text-xs mt-0.5 shrink-0">✓</span>
      <div>
        <span className="text-xs font-semibold text-gray-700">{label}: </span>
        <span className="text-xs text-gray-600">{value}</span>
      </div>
    </div>
  );
}

export default function CustomerEstimate({ result }: Props) {
  const c = result.contractor;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Validity date: 30 days from today
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);
  const validUntilStr = validUntil.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Editable fields — contractor fills in before printing
  const [companyName, setCompanyName] = useState("Your Company Name");
  const [contractorPhone, setContractorPhone] = useState("(555) 000-0000");
  const [contractorEmail, setContractorEmail] = useState("email@yourcompany.com");
  const [contractorLicense, setContractorLicense] = useState("Lic. #000000");
  const [clientName, setClientName] = useState("Client Name");
  const [clientAddress, setClientAddress] = useState("Project Address");
  const [projectNotes, setProjectNotes] = useState("");

  if (!c) return null;

  // Build scope items from result
  const scopeItems: { label: string; value: string }[] = [
    { label: "Deck size", value: `${result.size.dimensions} (${result.size.sqFt} sq ft)` },
    { label: "Decking material", value: result.tier.label + (result.deckingBrand ? ` — ${result.deckingBrand.name}` : "") },
    { label: "Framing", value: result.framingOption.label },
    { label: "Complexity", value: result.complexity.label },
  ];

  if (result.railing.id !== "none") {
    scopeItems.push({ label: "Railing system", value: result.railing.label });
  }

  if (result.fastenerSystem !== "none") {
    scopeItems.push({
      label: "Fastening system",
      value: result.fastenerSystem === "cortex" ? "Cortex by FastenMaster (concealed)" : "Hidden clip system (concealed)",
    });
  }

  if (result.edgeBoardUpgradeLow > 0) {
    scopeItems.push({ label: "Edge boards", value: "Grooved edge boards (picture-frame border)" });
  }

  if (result.useHelicalPiers) {
    scopeItems.push({ label: "Foundation", value: `${result.footingCount} helical piers (no excavation required)` });
  } else {
    scopeItems.push({ label: "Foundation", value: `${result.footingCount} concrete tube footings, ${result.footingDiameterIn}" diameter` });
  }

  if (result.stairsLow > 0) {
    // Find stair step count from the breakdown note
    const stairItem = result.breakdown.find(b => b.category === "Stairs");
    const stairNote = stairItem?.note ?? "";
    const stepsMatch = stairNote.match(/(\d+)-step/);
    const stepsLabel = stepsMatch ? `${stepsMatch[1]}-step staircase with treads and risers` : "Staircase with treads and risers";
    scopeItems.push({ label: "Stairs", value: stepsLabel });
  }

  if (result.permitCost > 0) {
    scopeItems.push({ label: "Permit & inspection", value: "Building permit pulled and inspections scheduled" });
  }

  if (result.engineerCost > 0) {
    scopeItems.push({ label: "Structural engineering", value: `Engineer review and stamped plans (${formatCurrency(result.engineerCost)})` });
  }

  if (result.demolitionLow > 0) {
    scopeItems.push({ label: "Demolition", value: "Removal and disposal of existing deck structure" });
  }

  // Payment schedule (3-draw)
  const totalMid = Math.round((c.totalBidLow + c.totalBidHigh) / 2);
  const deposit = Math.round(totalMid * 0.33);
  const framingDraw = Math.round(totalMid * 0.33);
  const finalDraw = totalMid - deposit - framingDraw;

  return createPortal(
    <div id="customer-estimate" className="font-sans text-gray-900 bg-white p-8 max-w-[900px] mx-auto">

      {/* ── EDITABLE FIELDS (screen only, hidden on print) ── */}
      <div className="print:hidden mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Fill in before printing — these fields appear on the proposal</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Company Name</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Phone</label>
            <input value={contractorPhone} onChange={e => setContractorPhone(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input value={contractorEmail} onChange={e => setContractorEmail(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">License #</label>
            <input value={contractorLicense} onChange={e => setContractorLicense(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Client Name</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Project Address</label>
            <input value={clientAddress} onChange={e => setClientAddress(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Additional Notes (optional)</label>
            <textarea value={projectNotes} onChange={e => setProjectNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Includes removal of existing concrete pad, owner supplies composite color selection..."
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400 resize-none" />
          </div>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between border-b-2 border-gray-900 pb-5 mb-6">
        <div>
          <div className="text-xl font-bold text-gray-900">{companyName}</div>
          <div className="text-xs text-gray-500 mt-1">{contractorPhone} · {contractorEmail}</div>
          <div className="text-xs text-gray-400 mt-0.5">{contractorLicense}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-1">Deck Construction Proposal</div>
          <div className="text-xs text-gray-500">Date: {today}</div>
          <div className="text-xs text-gray-500 mt-0.5">Valid until: {validUntilStr}</div>
        </div>
      </div>

      {/* ── CLIENT + PROJECT ── */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Prepared For</div>
          <div className="text-sm font-semibold text-gray-900">{clientName}</div>
          <div className="text-xs text-gray-500 mt-0.5">{clientAddress}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Project Summary</div>
          <div className="text-sm font-semibold text-gray-900">{result.size.dimensions} Deck — {result.tier.label}</div>
          <div className="text-xs text-gray-500 mt-0.5">{result.region.label} · {result.complexity.label}</div>
        </div>
      </div>

      {/* ── SCOPE OF WORK ── */}
      <div className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Scope of Work</h2>
        <div className="border border-gray-200 rounded-lg p-4">
          {scopeItems.map((item) => (
            <ScopeItem key={item.label} label={item.label} value={item.value} />
          ))}
          {projectNotes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 italic">{projectNotes}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── INVESTMENT SUMMARY ── */}
      <div className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Investment Summary</h2>
        <div className="border-2 border-gray-900 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700">Total Project Investment</div>
              <div className="text-xs text-gray-400 mt-0.5">{result.size.sqFt} sq ft · all labor, materials{result.permitCost > 0 ? ", permit" : ""}{result.engineerCost > 0 ? ", engineering" : ""} included</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono text-gray-900">{formatRange(c.totalBidLow, c.totalBidHigh)}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatCurrency(c.perSqFtBidLow)}–{formatCurrency(c.perSqFtBidHigh)}/sq ft installed
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Est. Timeline</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">{c.estimatedDays} crew days</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Permit</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">{result.permitCost > 0 ? "Included" : "Not included"}</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Warranty</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">
                {result.deckingBrand ? result.deckingBrand.warranty : result.tier.id === "pvc" ? "25-yr ltd" : result.tier.id === "composite" ? "25-yr ltd" : "1-yr labor"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PAYMENT SCHEDULE ── */}
      <div className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Payment Schedule</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Draw</th>
              <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">When Due</th>
              <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              <td className="py-2 px-2 text-xs font-semibold text-gray-800">1st Draw — Deposit</td>
              <td className="py-2 px-2 text-xs text-gray-500">Upon contract signing · materials ordered</td>
              <td className="py-2 px-2 text-right font-mono text-xs font-bold text-gray-900">{formatCurrency(deposit)}</td>
            </tr>
            <tr>
              <td className="py-2 px-2 text-xs font-semibold text-gray-800">2nd Draw — Framing</td>
              <td className="py-2 px-2 text-xs text-gray-500">Footings poured, framing complete</td>
              <td className="py-2 px-2 text-right font-mono text-xs font-bold text-gray-900">{formatCurrency(framingDraw)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 px-2 text-xs font-semibold text-gray-800">3rd Draw — Completion</td>
              <td className="py-2 px-2 text-xs text-gray-500">Project complete, punch-list signed off</td>
              <td className="py-2 px-2 text-right font-mono text-xs font-bold text-gray-900">{formatCurrency(finalDraw)}</td>
            </tr>
            <tr className="border-t-2 border-gray-900">
              <td className="py-2 px-2 text-xs font-bold text-gray-900" colSpan={2}>Total</td>
              <td className="py-2 px-2 text-right font-mono text-xs font-bold text-gray-900">{formatCurrency(totalMid)}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-gray-400 mt-2">* Final invoice adjusted to actual contract price. Payment schedule based on mid-range estimate.</p>
      </div>

      {/* ── SIGNATURE BLOCK ── */}
      <div className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Acceptance</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-gray-400 h-10 mb-1"></div>
            <div className="text-[10px] text-gray-500">Client Signature · Date</div>
            <div className="text-xs text-gray-700 mt-1 font-medium">{clientName}</div>
          </div>
          <div>
            <div className="border-b border-gray-400 h-10 mb-1"></div>
            <div className="text-[10px] text-gray-500">Contractor Signature · Date</div>
            <div className="text-xs text-gray-700 mt-1 font-medium">{companyName}</div>
          </div>
        </div>
      </div>

      {/* ── DISCLAIMER ── */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          This proposal is valid for 30 days from the date above. Pricing is based on current material costs and may be subject to adjustment if material prices change prior to contract execution. All work performed in accordance with local building codes. Contractor carries general liability insurance and workers' compensation. A signed contract and deposit are required to schedule work.
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          Estimate generated with DeckCost 2026 · {today}
        </p>
      </div>
    </div>,
    document.body
  );
}
