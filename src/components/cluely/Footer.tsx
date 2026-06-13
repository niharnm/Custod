import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/cluely-assets";
import { FOOTER_GROUPS } from "@/lib/cluely-content";
import { cn } from "@/lib/utils";

const SOCIAL_LINKS = [
  { label: "Follow us on Twitter", href: "https://x.com/cluely" },
  { label: "Join us on Discord", href: "https://discord.gg/cluely" },
  { label: "Follow us on Instagram", href: "https://www.instagram.com/cluely/" },
  { label: "Follow us on GitHub", href: "https://github.com/cluely" },
] as const;

export function Footer() {
  return (
    <footer className="bg-cluely-secondary-blue px-5 pb-10 pt-0 md:px-8">
      <div className="cluely-footer-divider mx-auto h-[3px] max-w-7xl rounded-full" />

      <div className="mx-auto grid max-w-7xl gap-10 py-12 md:grid-cols-[1.2fr_repeat(3,1fr)] md:gap-8">
        <div>
          <Link href="/" className="relative mb-6 block h-6 w-[72px]">
            <Image
              src={ASSETS.wordmark}
              alt="Cluely"
              fill
              className="object-contain object-left [filter:brightness(0)]"
            />
          </Link>
          <div className="flex items-center gap-2 text-sm text-[#36393F]">
            <span className="size-2 rounded-full bg-cluely-status-green" />
            All systems operational
          </div>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 text-sm font-semibold text-[#19191D]">{group.title}</h3>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 text-sm text-[#36393F] transition hover:text-[#19191D]"
                  >
                    {link.label}
                    {link.badge ? (
                      <span className="rounded bg-[#3152F4] px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {link.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-[#C8D0E0] pt-8 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-[#626275]">
          <p>© 2026 Cluely. All rights reserved.</p>
          <Link
            href="https://cluely.com/subprocessors"
            className="mt-1 inline-block hover:text-[#19191D]"
          >
            List of subprocessors
          </Link>
        </div>

        <div className="flex flex-wrap gap-4">
          {SOCIAL_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "text-sm text-[#626275] transition hover:text-[#19191D]",
              )}
            >
              <span className="sr-only">{link.label}</span>
              <span aria-hidden>{link.label.replace(/^Follow us on |^Join us on /, "")}</span>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
