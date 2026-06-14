"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { NAV_LINKS } from "@/lib/custod-content";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // Signed-in visitors get a direct link to their dashboard; everyone else
  // sees "Log in".
  const accountHref = signedIn ? "/dashboard" : "/login";
  const accountLabel = signedIn ? "Dashboard" : "Log in";

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowser();
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) =>
      setSignedIn(Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

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
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight text-white"
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-lg bg-white"
              priority
            />
            Custod
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-white/85 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={accountHref}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:scale-[1.02] hover:bg-white/15"
            >
              {accountLabel}
            </Link>
            <Link
              href="/download"
              className="custod-primary-button rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:scale-[1.03] active:scale-[0.97]"
            >
              Add to Chrome
            </Link>
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
          "fixed right-5 top-3 z-50 transition-opacity duration-300 md:right-8",
          showFloatingCta ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <Link
          href="/download"
          className="custod-primary-button rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          Add to Chrome
        </Link>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75dvh] rounded-t-3xl bg-white p-6 text-[#0f172a]">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
              >
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
              <Link href={accountHref} className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
                {accountLabel}
              </Link>
            </nav>
            <Link
              href="/download"
              className="custod-primary-button mt-8 block w-full rounded-lg px-4 py-3 text-center text-sm font-medium text-white"
              onClick={() => setMenuOpen(false)}
            >
              Add to Chrome
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
