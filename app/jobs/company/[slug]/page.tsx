import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Building2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicJobs, publicCompany } from "@/lib/recruitment/server";
import { CompanyMark, JobCard } from "@/components/recruitment/job-discovery";
export const dynamic = "force-dynamic";
export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const page = Math.max(
    0,
    Math.min(10000, Math.floor(Number((await searchParams).page)) || 0),
  );
  const c = await publicCompany(slug);
  if (!c) notFound();
  const jobs = await getPublicJobs({ company: slug, page });
  const website = /^https?:\/\//i.test(c.website) ? c.website : null;
  return (
    <div>
      <Link
        href="/jobs"
        className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Semua lowongan
      </Link>
      <section className="overflow-hidden rounded-[2rem] border bg-card">
        <div className="h-24 bg-accent sm:h-32" />
        <div className="px-6 pb-8 sm:px-10">
          <div className="relative -mt-10 mb-6 w-fit rounded-2xl border-4 border-card">
            <CompanyMark name={c.company_name} large />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Temukan tempat Anda
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Karier di {c.company_name}
          </h1>
          <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {c.description}
          </p>
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              Situs perusahaan <ArrowUpRight className="size-4" />
            </a>
          )}
        </div>
      </section>
      <div className="mb-6 mt-10 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Bertumbuh bersama kami
        </h2>
        <span className="text-sm text-muted-foreground">
          {jobs.length} lowongan di halaman ini
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </div>
      {!jobs.length && (
        <div className="rounded-3xl border border-dashed py-16 text-center">
          <Building2 className="mx-auto mb-4 size-8 text-primary" />
          <p className="text-sm text-muted-foreground">
            Belum ada lowongan terbuka saat ini.
          </p>
        </div>
      )}
      <nav
        className="mt-6 flex justify-between text-sm"
        aria-label="Halaman lowongan perusahaan"
      >
        {page > 0 ? (
          <Link href={`?page=${page - 1}`}>Sebelumnya</Link>
        ) : (
          <span />
        )}
        {jobs.length === 50 && (
          <Link href={`?page=${page + 1}`}>Berikutnya</Link>
        )}
      </nav>
    </div>
  );
}
