/**
 * MaterialTakeoff.tsx — Step 11: Material Takeoff (Contractor Only)
 * Design: Precision Engineering — structured data table with inline editing.
 *
 * Phase 1: Deck Boards
 * Calculates exact board count from deck area, board dimensions, and waste factor.
 * Prices against brand-specific SKU rates. All fields are user-editable.
 */

import { useState, useMemo, useEffect } from "react";
import {
  DECK_BOARD_SKUS,
  calculateBoardTakeoff,
  getDefaultSku,
  formatTakeoffCurrency,
  type BoardSku,
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

  // ── Derive default brand/SKU from the estimate ──
  const defaultBrandId = result.deckingBrand?.id ?? "pt-wood";
  const preferGrooved = result.fastenerSystem !== "none" && result.fastenerSystem !== undefined;

  // ── State ──
  const [selectedSkuId, setSelectedSkuId] = useState<string>(() => {
    const def = getDefaultSku(defaultBrandId, preferGrooved);
    return def?.id ?? DECK_BOARD_SKUS[0].id;
  });
  const [boardLengthFt, setBoardLengthFt] = useState<number>(16);
  const [wasteFactor, setWasteFactor] = useState<number>(0.10);
  const [taxRate, setTaxRate] = useState<number>(0.06);
  const [boardsOverride, setBoardsOverride] = useState<number | null>(null);
  const [unitPriceOverride, setUnitPriceOverride] = useState<number | null>(null);

  // ── Selected SKU ──
  const selectedSku: BoardSku = useMemo(
    () => DECK_BOARD_SKUS.find(s => s.id === selectedSkuId) ?? DECK_BOARD_SKUS[0],
    [selectedSkuId]
  );

  // ── Takeoff calculation ──
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

  // ── Group SKUs by brand for the selector ──
  const skusByBrand = useMemo(() => {
    const groups: Record<string, BoardSku[]> = {};
    for (const sku of DECK_BOARD_SKUS) {
      if (!groups[sku.productLine]) groups[sku.productLine] = [];
      groups[sku.productLine].push(sku);
    }
    return groups;
  }, []);

  const isEdited = boardsOverride !== null || unitPriceOverride !== null;

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
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-6">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Deck Area</div>
          <div className="text-2xl font-bold text-white">{deckAreaSqFt.toLocaleString()} sq ft</div>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Dimensions</div>
          <div className="text-lg font-semibold text-slate-200">{result.size.dimensions}</div>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Material</div>
          <div className="text-lg font-semibold text-slate-200">{result.tier.label}</div>
        </div>
        {result.deckingBrand && (
          <>
            <div className="w-px h-10 bg-slate-700" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Brand (from estimate)</div>
              <div className="text-lg font-semibold text-emerald-400">{result.deckingBrand.name}</div>
            </div>
          </>
        )}
      </div>

      {/* ── Phase 1: Deck Boards ── */}
      <div className="bg-slate-800/60 border border-slate-600 rounded-xl overflow-hidden">
        <div className="bg-slate-700/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Phase 1</span>
            <span className="text-white font-semibold">Deck Boards</span>
          </div>
          <span className="text-xs text-slate-400">Category 1 of 7</span>
        </div>

        <div className="p-5 space-y-5">

          {/* SKU Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Board SKU / Product
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(skusByBrand).map(([productLine, skus]) => (
                <div key={productLine}>
                  <div className="text-xs text-slate-500 font-medium mb-1 px-1">{productLine}</div>
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
                        <div className="flex items-center gap-2 mt-0.5">
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
                          <div className="text-[11px] text-slate-500 mt-0.5">{sku.notes}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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
              <div className="text-xs text-slate-500 mt-1">Applied to materials only</div>
            </div>
          </div>

          {/* ── Takeoff Summary Table ── */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-700/40 text-xs font-bold tracking-widest uppercase text-slate-400">
              Takeoff Summary — {selectedSku.name}
            </div>
            <div className="divide-y divide-slate-700/50">

              {/* Calculation rows */}
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

              {/* Totals */}
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

          {/* Reset overrides */}
          {isEdited && (
            <button
              onClick={() => { setBoardsOverride(null); setUnitPriceOverride(null); }}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Reset to calculated values
            </button>
          )}

          {/* Coming next */}
          <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coming Next in Material Takeoff</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                "Fasteners (screws / clips / Cortex)",
                "Framing lumber (joists, beams, posts)",
                "Concrete & footings",
                "Railing (posts, balusters, rail)",
                "Stairs (stringers, treads, risers)",
                "Hardware & misc (hangers, flashing)",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-600 shrink-0">{i + 2}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
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
