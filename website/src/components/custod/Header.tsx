"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusDot } from "@/components/custod/StatusLamp";
import { NAV_LINKS } from "@/lib/custod-content";
import { cn } from "@/lib/utils";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 48);
      const downloadEl = document.getElementById("download-button");
      if (!downloadEl) return;
      const rect = downloadEl.getBoundingClientRect();
      setShowFloatingCta(rect.bottom < 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 px-5 transition-all duration-300 md:px-8",
          scrolled
            ? "border-b border-border bg-background/90 py-3 shadow-sm backdrop-blur-md"
            : "bg-background/60 py-5 backdrop-blur-sm",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-2xl text-foreground"
          >
            <StatusDot status="green" />
            Custod
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              href="mailto:hello@custod.app?subject=Custod%20Waitlist"
              className="custod-primary-button rounded-full px-5 py-2.5 text-sm font-semibold transition hover:scale-[1.03] active:scale-[0.97]"
            >
              Join waitlist
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed right-5 top-3 z-50 transition-all duration-300 md:right-8",
          showFloatingCta
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <Link
          href="mailto:hello@custod.app?subject=Custod%20Waitlist"
          className="custod-primary-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-md"
        >
          <StatusDot status="green" />
          Join waitlist
        </Link>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-custod-brown/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75dvh] rounded-t-[2rem] border-t border-border bg-card p-6 text-foreground shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-heading text-xl text-foreground">Custod</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-xl px-3 py-3 text-lg font-medium transition hover:bg-secondary"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              href="mailto:hello@custod.app?subject=Custod%20Waitlist"
              className="custod-primary-button mt-6 block w-full rounded-full px-4 py-3 text-center text-sm font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              Join waitlist
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
