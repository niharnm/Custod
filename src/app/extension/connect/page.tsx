"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { claimAnonymousHistory } from "@/lib/device";

type Phase = "checking" | "connecting" | "connected" | "no-extension" | "signed-out";

const EXTENSION_SOURCE = "custod-extension";
const WEB_SOURCE = "custod-web";
const AUTH_SESSION = "CUSTOD_AUTH_SESSION";
const AUTH_SESSION_ACK = "CUSTOD_AUTH_SESSION_ACK";

export default function ExtensionConnectPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let acked = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.source === EXTENSION_SOURCE && event.data?.type === AUTH_SESSION_ACK) {
        acked = true;
        setPhase(event.data.ok ? "connected" : "no-extension");
      }
    }
    window.addEventListener("message", onMessage);

    (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        setPhase("signed-out");
        router.replace("/login?next=/extension/connect");
        return;
      }
      setEmail(session.user.email ?? null);
      setPhase("connecting");

      // Best-effort: fold any anonymous web history into this account too.
      void claimAnonymousHistory();

      // Hand the session to the content script, which relays it to the extension.
      window.postMessage(
        {
          source: WEB_SOURCE,
          type: AUTH_SESSION,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
        window.location.origin
      );

      // If no ACK arrives, the extension probably isn't installed/enabled.
      timer = setTimeout(() => {
        if (!acked) setPhase("no-extension");
      }, 2500);
    })();

    return () => {
      window.removeEventListener("message", onMessage);
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-white shadow-[0_0_24px_hsl(var(--primary)/0.5)]">
            <Image src="/logo.png" alt="Custod" width={40} height={40} className="h-8 w-auto" priority />
          </span>
          <span className="text-lg font-semibold tracking-tight">Custod</span>
        </Link>

        <div className="panel p-6">
          {phase === "connected" ? (
            <>
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--ok)/0.15)] text-2xl text-[hsl(var(--ok))]">
                ✓
              </div>
              <h1 className="text-xl font-semibold">Extension connected</h1>
              <p className="caption mt-2">
                {email ? <>Signed in as {email}. </> : null}
                Your scans now sync to your account. You can close this tab and open the Custod extension.
              </p>
            </>
          ) : phase === "no-extension" ? (
            <>
              <h1 className="text-xl font-semibold">Almost there</h1>
              <p className="caption mt-2">
                You&apos;re signed in{email ? ` as ${email}` : ""}, but we couldn&apos;t reach the Custod
                extension. Make sure it&apos;s installed and enabled, then reopen it — it should pick up
                your session automatically.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]" />
              <h1 className="text-xl font-semibold">Connecting the extension…</h1>
              <p className="caption mt-2">Linking your account to the Custod browser extension.</p>
            </>
          )}
        </div>

        <p className="caption mt-4">
          <Link href="/" className="font-medium text-[hsl(var(--foreground))] hover:underline">
            Go to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
