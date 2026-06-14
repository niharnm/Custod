import Image from "next/image";
import Link from "next/link";
import { FOOTER_GROUPS } from "@/lib/custod-content";

export function Footer() {
  return (
    <footer className="bg-custod-secondary px-5 pb-10 pt-0 md:px-8">
      <div className="custod-footer-divider mx-auto h-[3px] max-w-7xl rounded-full" />

      <div className="mx-auto grid max-w-7xl gap-10 py-12 md:grid-cols-[1.2fr_repeat(3,1fr)] md:gap-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-heading text-2xl font-semibold text-[#0f172a]"
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-lg border border-[#e2e8f0] bg-white"
            />
            Custod
          </Link>
          <p className="mt-3 max-w-xs text-sm text-custod-muted">
            Your silent guardian. A cross-platform check engine light for burnout
            — before you crash.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#334155]">
            <span className="size-2 rounded-full bg-custod-status-green shadow-[0_0_8px_#22C55E]" />
            Privacy-first · Multi-platform
          </div>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 text-sm font-semibold text-[#0f172a]">
              {group.title}
            </h3>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#475569] transition hover:text-[#0f172a]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-[#CBD5E1] pt-8 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-custod-muted">
          © {new Date().getFullYear()} Custod. All rights reserved.
        </p>
        <p className="text-sm text-custod-muted">
          Not therapy. Not a mental health chatbot. Passive burnout detection only.
        </p>
      </div>
    </footer>
  );
}
