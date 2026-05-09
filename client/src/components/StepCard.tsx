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
  accentBtnClass?: string;
}

export default function StepCard({
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = "Continue →",
  showTapHint = false,
  accentBtnClass = "accent-btn",
}: StepCardProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{subtitle}</p>}
      </div>

      <div className="mb-8">{children}</div>

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
          className={`flex-1 sm:flex-none px-6 py-2.5 ${accentBtnClass} font-semibold text-sm rounded-lg`}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
