"use client";

import { useState } from "react";
import { cn, initials } from "@/lib/utils";

/** A circle: the photo when there is one that loads, the initials otherwise. */
export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  // remembers which photo failed, so a new one gets its own try
  const [failed, setFailed] = useState<string | null>(null);
  const photo = src && src !== failed ? src : null;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-sand-300 text-xs font-bold text-ink-soft",
        className,
      )}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote avatars, no loader needed
        <img src={photo} alt="" className="size-full object-cover" onError={() => setFailed(photo)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
