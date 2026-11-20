import Link from "next/link";
import { cn } from "@/lib/utils";

/** The logo (public/logo.png) on a white badge: its black lettering needs a light ground on the blue bar and dark footer. */
export function Brand({ large, className }: { large?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("brand", large && "brand-lg", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a 17 KB local PNG at its own size, nothing for next/image to do */}
      <img src="/logo.png" alt="itours.mn" width={320} height={68} />
    </Link>
  );
}
