import { cn } from "@/lib/utils";

type CustodCardProps = React.ComponentProps<"div"> & {
  variant?: "default" | "gradient" | "glass";
};

export function CustodCard({
  className,
  variant = "default",
  ...props
}: CustodCardProps) {
  return (
    <div
      className={cn(
        variant === "default" && "custod-card",
        variant === "gradient" && "custod-card-gradient rounded-4xl p-6",
        variant === "glass" && "custod-glass rounded-4xl p-6",
        className,
      )}
      {...props}
    />
  );
}
