import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg)/0.8)] backdrop-blur-xl">
      <div className="shell flex min-h-[60px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all group-hover:shadow-[0_0_28px_hsl(var(--primary)/0.7)]">
            <Image src="/logo.png" alt="Custod logo" width={36} height={36} className="h-7 w-auto" priority />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[hsl(var(--foreground))]">Custod</span>
        </Link>
        <div className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
          <Shield className="h-3 w-3" />
          Titles &amp; URLs only — no page content
        </div>
      </div>
    </header>
  );
}
