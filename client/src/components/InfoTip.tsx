/**
 * InfoTip — lightweight inline tooltip for plain-language jargon explanations
 * Design: Precision Engineering (dark navy, amber accent)
 * Usage: <InfoTip text="Pressure-treated lumber — the most common deck framing material." />
 */
import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTipProps {
  text: string;
  /** Optional: position the tooltip to the left instead of right */
  left?: boolean;
  className?: string;
}

export default function InfoTip({ text, left = false, className }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on outside click / tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
    >
      <Info className="w-3 h-3 text-slate-500 hover:text-slate-300 transition-colors cursor-help shrink-0" />
      {open && (
        <span
          className={cn(
            "absolute z-50 bottom-full mb-1.5 w-52 rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-sm px-3 py-2 text-xs text-slate-300 leading-relaxed shadow-xl pointer-events-none",
            left ? "right-0" : "left-0"
          )}
        >
          {text}
          {/* Arrow */}
          <span
            className={cn(
              "absolute top-full border-4 border-transparent border-t-slate-900/95",
              left ? "right-2" : "left-2"
            )}
          />
        </span>
      )}
    </span>
  );
}
