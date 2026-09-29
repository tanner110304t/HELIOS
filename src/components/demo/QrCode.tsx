"use client";

import QRCode from "qrcode";
import { useMemo, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/**
 * Environment-aware QR code.
 *
 * Points at `${origin}${path}` where origin is NEXT_PUBLIC_SITE_URL if set,
 * otherwise whatever host is serving this page. On Vercel that is the
 * deployment URL, so the code "just works" once deployed. On localhost a
 * phone can't reach it, so we say so.
 */

const noop = () => () => {};
const getOrigin = () => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || window.location.origin;

function useOrigin() {
  return useSyncExternalStore(noop, getOrigin, () => null);
}

function qrPath(text: string) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = modules.size;
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { d, size };
}

export function useTargetUrl(path: string) {
  const origin = useOrigin();
  return origin ? `${origin}${path}` : null;
}

export function QrCode({ path, className }: { path: string; className?: string }) {
  const url = useTargetUrl(path);
  const qr = useMemo(() => (url ? qrPath(url) : null), [url]);

  return (
    <div className={cn("aspect-square", className)}>
      {qr ? (
        <svg
          viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`}
          role="img"
          aria-label={`QR code linking to ${url}`}
          shapeRendering="crispEdges"
          className="size-full"
        >
          <rect x="-2" y="-2" width={qr.size + 4} height={qr.size + 4} fill="#fff" />
          <path d={qr.d} fill="var(--color-ink)" />
        </svg>
      ) : (
        <div className="size-full animate-pulse rounded-lg bg-paper-2" />
      )}
    </div>
  );
}

export function QrTargetNote({ path }: { path: string }) {
  const url = useTargetUrl(path);
  if (!url) return <span className="inline-block h-4" />;
  const local = /\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(url);
  return (
    <span className="block">
      <span className="break-all font-mono text-[11px] text-muted">{url.replace(/^https?:\/\//, "")}</span>
      {local && (
        <span className="mt-1 block text-[11px] leading-snug text-warn">
          Localhost — phones can&apos;t open this. Use the deployed URL (see README).
        </span>
      )}
    </span>
  );
}
