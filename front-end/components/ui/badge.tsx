import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-4", {
  variants: {
    variant: {
      default: "bg-sand-50 text-ink-soft",
      dark: "bg-ink text-sand-100",
      success: "bg-sage-50 text-sage-dark",
      accent: "bg-primary text-primary-foreground",
      outline: "border border-copper text-copper-dark",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
