import Link from "next/link";
import { Search } from "lucide-react";
export default function NotFound() {
  return (
    <section className="mx-auto max-w-lg py-20 text-center">
      <Search className="mx-auto mb-6 size-10 text-primary" />
      <h1 className="text-3xl font-semibold tracking-tight">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Tautan mungkin telah berubah atau lowongan tidak lagi tersedia.
      </p>
      <Link
        href="/jobs"
        className="mt-7 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Jelajahi lowongan lain
      </Link>
    </section>
  );
}
