import { cn } from "@/lib/utils";

type CustodInputProps = React.ComponentProps<"input"> & {
  label?: string;
  hint?: string;
};

export function CustodInput({ label, hint, className, id, ...props }: CustodInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label ? <span>{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "rounded-xl border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition",
          "placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

type CustodTextareaProps = React.ComponentProps<"textarea"> & {
  label?: string;
  hint?: string;
};

export function CustodTextarea({
  label,
  hint,
  className,
  id,
  ...props
}: CustodTextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label ? <span>{label}</span> : null}
      <textarea
        id={inputId}
        className={cn(
          "min-h-[88px] resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition",
          "placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
