import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-field border border-transparent bg-input px-4 text-sm text-ink outline-none transition-colors placeholder:text-sand-900 focus-visible:border-copper focus-visible:ring-2 focus-visible:ring-copper/25 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
