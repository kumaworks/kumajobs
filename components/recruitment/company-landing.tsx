import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Globe } from "lucide-react";
import { notFound } from "next/navigation";
import { companyHref } from "@/lib/recruitment/company-url";
import { isPreview } from "@/lib/recruitment/preview";
import { getPublicJobs, publicCompany } from "@/lib/recruitment/server";
import { CompanyMark, JobCard } from "./job-discovery";

export function companyPageNumber(value?: string) {
  return Math.max(0, Math.min(10000, Math.floor(Number(value)) || 0));
}

export async function companyMetadata(code: string): Promise<Metadata> {
  const company = await publicCompany(code);
  if (!company)
    return { title: "Perusahaan tidak ditemukan", robots: { index: false } };
  const title = `Karier di ${company.company_name} | KumaWorks Jobs`;
  const description =
    company.description ||
    `Temukan lowongan kerja dan bergabung bersama ${company.company_name}.`;
  const base = process.env.NEXT_PUBLIC_JOBS_URL ?? "https://jobs.kumaworks.id";
  const url = `${base.replace(/\/$/, "")}${companyHref(company.slug)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    robots: { index: !isPreview(), follow: true },
  };
}

export async function CompanyLanding({
  code,
  page = 0,
}: {
  code: string;
  page?: number;
}) {
  const company = await publicCompany(code);
  if (!company) notFound();
  // Use the resolved, saved code rather than the casing of the incoming URL.
  const jobs = await getPublicJobs({ company: company.slug, page });
  const website = /^https?:\/\//i.test(company.website ?? "")
    ? company.website
    : null;
  const href = companyHref(company.slug);

  return (
    <div>
      <Link
        href="/jobs"
        className="mb-6 inline-flex text-sm font-medium text-muted-foreground hover:text-primary"
      >
        Semua lowongan
      </Link>
      <section
        aria-labelledby="company-heading"
        className="relative isolate overflow-hidden rounded-[2rem] bg-[#163e30] px-6 py-10 text-white sm:px-10 sm:py-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#367858,transparent_65%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 -z-10 size-[32rem] rounded-full border border-white/10 sm:right-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-64 -right-20 -z-10 size-[32rem] rounded-full border border-white/10"
        />
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-8">
          <div className="rounded-[1.25rem] bg-white/10 p-2">
            <CompanyMark
              name={company.company_name}
              logoUrl={company.logoUrl}
              large
            />
          </div>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#c9e6b4]">
              Bergabung bersama kami
            </p>
            <h1
              id="company-heading"
              className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl"
            >
              Karier di {company.company_name}
            </h1>
            {company.description && (
              <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-white/80">
                {company.description}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#company-jobs"
                className="rounded-full bg-[#d5efbb] px-6 py-3 text-sm font-semibold text-[#163e30] hover:bg-white"
              >
                Lihat lowongan
              </a>
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-medium hover:bg-white/10"
                >
                  <Globe aria-hidden="true" className="size-4" /> Situs
                  perusahaan
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="company-jobs"
        aria-labelledby="company-jobs-heading"
        className="scroll-mt-40 pt-12"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">
              Temukan peran Anda
            </p>
            <h2
              id="company-jobs-heading"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Lowongan yang tersedia
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {jobs.length} lowongan di halaman ini
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
        {!jobs.length && (
          <div className="rounded-3xl border border-dashed bg-card px-6 py-16 text-center">
            <Building2
              aria-hidden="true"
              className="mx-auto mb-4 size-8 text-primary"
            />
            <h3 className="text-lg font-semibold">
              {page > 0
                ? "Tidak ada lowongan di halaman ini"
                : "Belum ada lowongan terbuka saat ini"}
            </h3>
            <p className="mt-3 text-base text-muted-foreground">
              {page > 0
                ? "Kembali ke halaman pertama untuk melihat posisi yang tersedia."
                : "Kunjungi halaman ini lagi untuk melihat kesempatan berikutnya."}
            </p>
            {page > 0 && (
              <Link
                href={href}
                className="mt-6 inline-block text-sm font-medium text-primary"
              >
                Kembali ke lowongan perusahaan
              </Link>
            )}
          </div>
        )}
        {(page > 0 || jobs.length === 50) && (
          <nav
            className="mt-8 flex items-center justify-between gap-3 text-sm"
            aria-label="Halaman lowongan perusahaan"
          >
            {page > 0 ? (
              <Link
                className="rounded-full border px-5 py-2"
                href={`${href}?page=${page - 1}#company-jobs`}
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
                href={`${href}?page=${page + 1}#company-jobs`}
              >
                Berikutnya
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
