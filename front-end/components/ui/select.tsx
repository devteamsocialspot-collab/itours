import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ponytail: native <select> styled like Input — swap for a Radix Select when search/groups are needed
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-field border border-transparent bg-input pl-4 pr-10 text-sm text-ink outline-none transition-colors focus-visible:border-copper focus-visible:ring-2 focus-visible:ring-copper/25 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
    </div>
  );
}
