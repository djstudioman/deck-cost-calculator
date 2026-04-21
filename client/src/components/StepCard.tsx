/**
 * StepCard — Wizard step wrapper
 * Design: Precision Engineering (dark navy, amber accent)
 */
import { type ReactNode } from "react";

interface StepCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  showTapHint?: boolean;
}

export default function StepCard({
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = "Continue →",
  showTapHint = false,
}: StepCardProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>

      <div className="mb-6">{children}</div>

      {showTapHint && (
        <div className="mb-3 text-xs text-amber-400/70 animate-pulse text-center">
          Tap the selected option again to continue →
        </div>
      )}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors border border-white/10 rounded-lg hover:border-white/20"
          >
            ← Back
          </button>
        )}
        <button
          onClick={onNext}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0B1120] font-semibold text-sm rounded-lg transition-colors"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
