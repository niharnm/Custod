"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ASSETS } from "@/lib/cluely-assets";
import { NAV_LINKS } from "@/lib/cluely-content";
import { cn } from "@/lib/utils";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const onScroll = () => {
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
      <header className="absolute inset-x-0 top-0 z-50 px-5 text-white md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between py-5">
          <Link href="/" className="relative block h-6 w-[72px]">
            <Image
              src={ASSETS.wordmark}
              alt="Cluely"
              fill
              className="object-contain object-left"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-white/90 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="https://apps.apple.com/app/cluely"
              className="group flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm transition hover:scale-[1.02] hover:bg-white/15"
            >
              <span className="text-xs leading-tight">
                Download on the
                <br />
                <span className="font-semibold">App Store</span>
              </span>
            </Link>
            <button
              type="button"
              className="cluely-purple-button rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:scale-[1.03] active:scale-[0.97]"
            >
              Get the desktop app
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed right-5 top-[calc(var(--header-v2-top,0px)+10px)] z-50 transition-opacity duration-300 md:right-8",
          showFloatingCta ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          type="button"
          className="cluely-purple-button relative overflow-hidden rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          <span className="relative z-10">Get the desktop app</span>
          <Image
            src={ASSETS.shimmer}
            alt=""
            fill
            className="object-cover opacity-30"
            aria-hidden
          />
        </button>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75dvh] rounded-t-3xl bg-white p-6 text-[#19191D]">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              className="cluely-purple-button mt-8 w-full rounded-lg px-4 py-3 text-sm font-medium text-white"
            >
              Get the desktop app
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
