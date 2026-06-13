import Link from "next/link";
import { FOOTER_GROUPS } from "@/lib/custod-content";

export function Footer() {
  return (
    <footer className="bg-secondary px-5 pb-10 pt-0 md:px-8">
      <div className="custod-footer-divider mx-auto h-0.5 max-w-7xl" />

      <div className="mx-auto grid max-w-7xl gap-10 py-12 md:grid-cols-[1.2fr_repeat(3,1fr)] md:gap-8">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-2xl text-foreground"
          >
            <span className="size-2.5 rounded-full bg-custod-status-green shadow-[0_0_10px_var(--custod-status-green-glow)]" />
            Custod
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Your silent guardian. A cross-platform check engine light for burnout
            — before you crash.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-custod-status-green" />
            Privacy-first · Multi-platform
          </div>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 font-heading text-lg text-foreground">{group.title}</h3>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Custod. All rights reserved.
        </p>
        <p className="text-sm text-muted-foreground">
          Not therapy. Not a mental health chatbot. Passive burnout detection only.
        </p>
      </div>
    </footer>
  );
}
