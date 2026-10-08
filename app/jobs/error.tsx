"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
export default function PortalError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto max-w-lg rounded-3xl border bg-card p-10 text-center">
      <RefreshCw className="mx-auto mb-5 size-8 text-primary" />
      <h1 className="text-2xl font-semibold">Halaman belum dapat dimuat</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Periksa koneksi Anda dan coba lagi. Jika masalah berlanjut, silakan
        kembali beberapa saat lagi.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        Coba lagi
      </button>
      <Link
        href="/jobs"
        className="mt-5 block text-sm text-muted-foreground underline"
      >
        Kembali ke lowongan
      </Link>
    </section>
  );
}
