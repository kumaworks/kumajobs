import Link from "next/link";
import { CompanyMark } from "./company-mark";
export { CompanyMark } from "./company-mark";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CircleArrowRight,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import {
  employmentLabels,
  workModeLabels,
  type PublicJob,
} from "@/lib/recruitment/domain";

export type JobFilters = {
  q?: string;
  location?: string;
  employment?: string;
  mode?: string;
  page?: string;
  company?: string;
};
const periods: Record<string, string> = {
  month: "bulan",
  year: "tahun",
  hour: "jam",
  day: "hari",
  week: "minggu",
};
export function salaryLabel(salary: NonNullable<PublicJob["salary"]>) {
  return `${salary.currency} ${salary.min.toLocaleString("id-ID")}–${salary.max.toLocaleString("id-ID")} / ${periods[salary.period] ?? salary.period}`;
}
export function JobCard({ job }: { job: PublicJob }) {
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="group flex h-full flex-col rounded-3xl border bg-card p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <CompanyMark name={job.company} logoUrl={job.companyLogoUrl} />
        <ArrowUpRight className="size-5 text-muted-foreground transition group-hover:text-primary" />
      </div>
      <p className="mt-5 text-sm font-medium text-muted-foreground">
        {job.company}
      </p>
      <h3 className="mt-1.5 text-xl font-semibold leading-snug tracking-tight group-hover:text-primary">
        {job.title}
      </h3>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        {job.location}
      </p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-muted px-3 py-1.5">
          {employmentLabels[job.employmentType]}
        </span>
        <span className="rounded-full bg-accent px-3 py-1.5 text-accent-foreground">
          {workModeLabels[job.workMode]}
        </span>
      </div>
      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs font-medium">
            {job.salary ? salaryLabel(job.salary) : "Lihat detail posisi"}
          </p>
          <ArrowRight className="size-4 shrink-0 text-primary" />
        </div>
      </div>
    </Link>
  );
}
export function JobDiscovery({
  jobs,
  filters = {},
}: {
  jobs: PublicJob[];
  filters?: JobFilters;
}) {
  const filtered = Boolean(
    filters.q ||
    filters.location ||
    filters.employment ||
    filters.mode ||
    filters.company,
  );
  const page = Math.max(
    0,
    Math.min(10000, Math.floor(Number(filters.page)) || 0),
  );
  function pageLink(next: number) {
    return `/jobs?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined)), page: String(next) })}#lowongan`;
  }
  return (
    <div>
      <section className="relative grid items-center gap-10 overflow-hidden pb-10 pt-2 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:pb-14">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> Ruang baru
            untuk potensi Anda
          </p>
          <h1 className="max-w-2xl text-5xl font-medium leading-[1.07] tracking-[-0.055em] sm:text-6xl lg:text-[4.6rem]">
            Pekerjaan baru.
            <br />
            <span className="text-primary">Cerita baru.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Temukan tempat yang tepat untuk langkah berikutnya. Jelajahi
            peluang, tunjukkan potensi, dan tumbuh bersama.
          </p>
          <a
            href="#lowongan"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold"
          >
            Mulai jelajahi peluang <ArrowDown className="size-4 text-primary" />
          </a>
        </div>
        <div
          aria-hidden="true"
          className="relative hidden h-[340px] overflow-hidden rounded-[2rem] bg-[#dceacb] p-8 text-[#183a2b] sm:block"
        >
          <div className="absolute -right-14 -top-24 size-96 rounded-full border-[45px] border-[#c5dbaf]" />
          <div className="absolute -bottom-44 -left-20 size-96 rounded-full border-[45px] border-[#c5dbaf]" />
          <div className="relative flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Arah baru, mulai di sini
            </span>
            <Sparkles className="size-6" />
          </div>
          <div className="relative mt-9 flex items-center gap-4">
            <span className="flex size-20 items-center justify-center rounded-[1.4rem] bg-[#234b36] text-[#d8f2b5] shadow-lg">
              <ArrowUpRight className="size-12" strokeWidth={1.5} />
            </span>
            <p className="text-3xl font-medium leading-tight tracking-tight">
              Saatnya
              <br />
              bertumbuh.
            </p>
          </div>
          <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between rounded-2xl border border-white/80 bg-white/75 px-5 py-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#e6efd9] p-2">
                <Check className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  Satu profil. Banyak peluang.
                </p>
                <p className="mt-1 text-xs text-[#5e7164]">
                  Dari lamaran hingga hari pertama.
                </p>
              </div>
            </div>
            <CircleArrowRight className="size-6" />
          </div>
        </div>
      </section>
      <section id="lowongan" className="scroll-mt-36">
        <form
          action="/jobs#lowongan"
          className="rounded-3xl border bg-card p-3 shadow-sm"
        >
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
            <label className="flex items-center gap-3 rounded-xl bg-background px-4">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <span className="sr-only">Posisi atau perusahaan</span>
              <input
                name="q"
                placeholder="Posisi atau perusahaan impian Anda"
                defaultValue={filters.q}
                className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl bg-background px-4">
              <MapPin className="size-5 shrink-0 text-muted-foreground" />
              <span className="sr-only">Lokasi</span>
              <input
                name="location"
                placeholder="Kota atau lokasi"
                defaultValue={filters.location}
                className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none"
              />
            </label>
            <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground">
              Cari lowongan <ArrowRight className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t px-1 pt-3 text-sm">
            <SlidersHorizontal className="ml-2 hidden size-4 text-muted-foreground sm:block" />
            <select
              name="employment"
              aria-label="Jenis pekerjaan"
              defaultValue={filters.employment ?? ""}
              className="max-w-full rounded-xl border bg-card px-3 py-2.5 text-xs"
            >
              <option value="">Semua jenis pekerjaan</option>
              {Object.entries(employmentLabels).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <select
              name="mode"
              aria-label="Cara kerja"
              defaultValue={filters.mode ?? ""}
              className="max-w-full rounded-xl border bg-card px-3 py-2.5 text-xs"
            >
              <option value="">Semua cara kerja</option>
              {Object.entries(workModeLabels).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            {filters.company && (
              <input type="hidden" name="company" value={filters.company} />
            )}
            {filtered && (
              <Link
                href="/jobs#lowongan"
                className="px-2 text-xs text-primary underline underline-offset-4"
              >
                Hapus filter
              </Link>
            )}
          </div>
        </form>
        <div className="mb-6 mt-12 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Temukan kecocokan Anda
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {filtered
                ? "Hasil pencarian"
                : "Peluang untuk langkah berikutnya"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {jobs.length
              ? `${jobs.length} lowongan di halaman ini · Terbaru`
              : "Lowongan terbaru dari perusahaan di KumaWorks"}
          </p>
        </div>
        {jobs.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard job={job} key={job.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed bg-card px-5 py-16 text-center">
            <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Search className="size-6 text-primary" />
            </span>
            <h3 className="text-lg font-semibold">
              {filtered
                ? "Belum menemukan yang cocok?"
                : "Peluang baru sedang disiapkan"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {filtered
                ? "Coba kata kunci lain atau perluas lokasi pencarian Anda."
                : "Belum ada lowongan yang dipublikasikan. Anda tetap dapat menyiapkan profil untuk langkah berikutnya."}
            </p>
            <Link
              href={filtered ? "/jobs#lowongan" : "/jobs/account?tab=profile"}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              {filtered ? "Lihat semua lowongan" : "Siapkan profil saya"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
        {(page > 0 || jobs.length === 50) && (
          <nav
            aria-label="Halaman lowongan"
            className="mt-6 flex items-center justify-between text-sm"
          >
            {page > 0 ? (
              <Link
                className="rounded-full border px-5 py-2"
                href={pageLink(page - 1)}
              >
                Sebelumnya
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">Halaman {page + 1}</span>
            {jobs.length === 50 ? (
              <Link
                className="rounded-full border px-5 py-2"
                href={pageLink(page + 1)}
              >
                Berikutnya
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
      <section className="mt-16 grid gap-8 border-t pt-10 sm:grid-cols-3">
        {[
          {
            Icon: BriefcaseBusiness,
            title: "Peluang yang relevan",
            text: "Cari berdasarkan posisi, lokasi, dan cara kerja yang sesuai dengan Anda.",
          },
          {
            Icon: FileText,
            title: "Profil siap, melamar lebih mudah",
            text: "Gunakan kembali profil dan dokumen. Tinjau sebelum setiap lamaran dikirim.",
          },
          {
            Icon: ShieldCheck,
            title: "Ikuti setiap langkah",
            text: "Kelola wawancara, penawaran, dan onboarding dalam satu tempat.",
          },
        ].map(({ Icon, title, text }) => (
          <div key={title} className="flex items-start gap-4">
            <Icon className="mt-1 size-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
