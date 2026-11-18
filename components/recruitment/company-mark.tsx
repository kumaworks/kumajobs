"use client";

import Image from "next/image";
import { useState } from "react";

export function CompanyMark({
  name,
  logoUrl,
  large = false,
}: {
  name: string;
  logoUrl?: string | null;
  large?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = logoUrl?.trim();
  const showLogo = Boolean(src && src !== failedUrl);

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/10 font-semibold uppercase tracking-tight ${showLogo ? "bg-white" : "bg-accent text-accent-foreground"} ${large ? "size-20 text-2xl" : "size-12 text-lg"}`}
    >
      {showLogo ? (
        <Image
          src={src!}
          alt=""
          width={large ? 80 : 48}
          height={large ? 80 : 48}
          className="size-full object-contain p-1"
          unoptimized
          onError={() => setFailedUrl(src!)}
        />
      ) : (
        name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((n) => n[0])
          .join("") || "K"
      )}
    </span>
  );
}
