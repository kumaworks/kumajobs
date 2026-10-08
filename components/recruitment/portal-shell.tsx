"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { signOutCandidate } from "@/app/jobs/actions";
export type PortalTheme = "light" | "dark" | "system";

export function PortalShell({
  children,
  initialTheme = "system",
  signedIn = false,
}: {
  children: ReactNode;
  initialTheme?: PortalTheme;
  signedIn?: boolean;
}) {
  const [theme, setTheme] = useState(initialTheme);
  const pathname = usePathname();
  const account = pathname.includes("account");
  return (
    <div
      lang="id"
      data-theme={theme}
      className="jobs-portal min-h-screen bg-background text-foreground selection:bg-primary/20"
    >
      <a
        href="#portal-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-card focus:p-4"
      >
        Langsung ke konten
      </a>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link
            href="/jobs"
            aria-label="KumaWorks Jobs beranda"
            className="flex items-center gap-2.5"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ArrowUpRight className="size-6" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              KumaWorks
              <span className="ml-1.5 font-normal text-primary">Jobs</span>
            </span>
          </Link>
          <nav
            aria-label="Navigasi utama"
            className="order-3 flex w-full gap-6 text-sm font-medium sm:order-none sm:w-auto"
          >
            <Link
              href="/jobs"
              aria-current={
                pathname === "/jobs" || pathname === "/" ? "page" : undefined
              }
              className={`py-1 transition hover:text-primary ${!account ? "text-foreground" : "text-muted-foreground"}`}
            >
              Cari lowongan
            </Link>
            <Link
              href="/jobs/account"
              aria-current={account ? "page" : undefined}
              className={`py-1 transition hover:text-primary ${account ? "text-foreground" : "text-muted-foreground"}`}
            >
              Lamaran saya
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <div
              role="group"
              aria-label="Tema tampilan"
              className="flex rounded-full border bg-card p-1"
            >
              {(
                [
                  { value: "light", label: "Tema terang", Icon: Sun },
                  { value: "dark", label: "Tema gelap", Icon: Moon },
                  { value: "system", label: "Tema sistem", Icon: Monitor },
                ] as const
              ).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={theme === value}
                  onClick={() => {
                    setTheme(value);
                    document.cookie = `kuma_jobs_theme=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
                  }}
                  className={`flex size-8 items-center justify-center rounded-full transition ${theme === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
            {signedIn ? (
              <form action={signOutCandidate}>
                <button
                  title="Keluar"
                  aria-label="Keluar"
                  className="rounded-full border p-2 text-muted-foreground hover:bg-muted"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            ) : (
              <Link
                href="/jobs/login"
                className="hidden items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background sm:inline-flex"
              >
                Masuk <ArrowUpRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </header>
      <main
        id="portal-content"
        className="mx-auto min-h-[70vh] max-w-7xl px-5 py-8 sm:px-8 sm:py-12"
      >
        {children}
      </main>
      <footer className="mt-12 border-t">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
          <div>
            <p className="flex items-center gap-2 font-semibold">
              <BriefcaseBusiness className="size-4 text-primary" /> KumaWorks
              Jobs
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Langkah baru. Peluang baru. Masa depan Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <Link href="/jobs/account?tab=help" className="hover:text-primary">
              Bantuan & privasi
            </Link>
            <Link
              href="/jobs/account?tab=verification"
              className="hover:text-primary"
            >
              Kuma Verified
            </Link>
            <a
              href="https://kumaworks.id"
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              Untuk perusahaan <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
