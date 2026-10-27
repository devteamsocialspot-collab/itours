import { CircleAlert, Check, Star } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { scoreTone } from "@/lib/utils";

/** The Expectation Score in its circle; "–" while a plan has no ratings. */
export function Score({ value, size = 40 }: { value: number | null | undefined; size?: number }) {
  return (
    <div className="score" style={{ width: size, height: size, background: scoreTone(value), fontSize: Math.round(size * 0.37) }}>
      {value ?? "–"}
    </div>
  );
}

/** A washed photo with its overlays kept outside the wash, per the design system's imagery rule. Other props go on the frame. */
export function Photo({ src, alt, className = "", children, ...props }: { src?: string | null; alt: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`photo ${className}`} {...props}>
      <div className="washed" style={{ position: "absolute", inset: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote photos at their own size, no loader configured */}
        {src ? <img src={src} alt={alt} loading="lazy" /> : <div className="photo-ph">{alt}</div>}
      </div>
      {children}
    </div>
  );
}

export const Pro = ({ children }: { children: ReactNode }) => (
  <div className="line line-pro">
    <Check size={14} strokeWidth={3} />
    <span>{children}</span>
  </div>
);

export const Con = ({ children }: { children: ReactNode }) => (
  <div className="line line-con">
    <CircleAlert size={14} strokeWidth={2.75} />
    <span>{children}</span>
  </div>
);

export function Stars({ stars, count }: { stars: number | null; count: number }) {
  if (stars == null) return null;
  return (
    <span className="row" style={{ gap: 3, fontSize: 12, color: "var(--color-cta-800)" }}>
      <Star size={12} fill="currentColor" strokeWidth={0} style={{ color: "var(--color-cta)" }} />
      {stars.toFixed(1)} ({count})
    </span>
  );
}

export function Bar({ value, warn, neutral }: { value: number; warn?: boolean; neutral?: boolean }) {
  return (
    <div className={`bar ${neutral ? "neutral" : ""}`}>
      <div style={{ width: `${value}%`, background: warn ? "var(--color-cta-500)" : undefined }} />
    </div>
  );
}
