import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-card border border-black/10 bg-card text-card-foreground shadow-card", className)} {...props} />;
}
