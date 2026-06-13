import Link from "next/link";
import { LineChart, Settings, Shield } from "lucide-react";
import { StatusDot } from "@/components/custod/ui";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="shell flex min-h-[60px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-heading text-xl text-foreground">
          <StatusDot status="green" />
          Custod
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 sm:flex">
            <Link href="/trends" className="button-ghost text-xs">
              <LineChart className="size-3.5" />
              Trends
            </Link>
            <Link href="/settings" className="button-ghost text-xs">
              <Settings className="size-3.5" />
              Settings
            </Link>
          </nav>
          <div className="custod-tag flex items-center gap-1.5 py-1.5 text-xs">
            <Shield className="size-3" />
            <span className="hidden md:inline">Titles &amp; URLs only</span>
            <span className="md:hidden">Private</span>
          </div>
        </div>
      </div>
    </header>
  );
}
