import Link from "next/link";
import { Activity, Shield } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-white/85 backdrop-blur">
      <div className="shell flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">Custod</span>
        </Link>
        <div className="hidden items-center gap-2 rounded-full border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
          <Shield className="h-3.5 w-3.5" />
          Titles and URLs only
        </div>
      </div>
    </header>
  );
}
