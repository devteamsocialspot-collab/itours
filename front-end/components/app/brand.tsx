import Link from "next/link";
import { cn } from "@/lib/utils";

/** The text wordmark: itours.mn with the dot in copper. `suffix` names the back office ("partner", "ops"). */
export function Brand({ large, suffix, className }: { large?: boolean; suffix?: string; className?: string }) {
  return (
    <Link href="/" className={cn("brand", large && "brand-lg", className)}>
      itours<span>.</span>
      {suffix ?? "mn"}
    </Link>
  );
}
