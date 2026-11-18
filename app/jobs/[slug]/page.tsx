import { isPreview } from "@/lib/recruitment/preview";
import { companyHref } from "@/lib/recruitment/company-url";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  FileCheck2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  CompanyMark,
  salaryLabel,
} from "@/components/recruitment/job-discovery";
import { employmentLabels, workModeLabels } from "@/lib/recruitment/domain";
import { notFound } from "next/navigation";
import {
  candidateSession,
  getPublicJobs,
  recruitmentDb,
} from "@/lib/recruitment/server";
import { ApplyForm } from "@/components/recruitment/candidate-forms";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = (await getPublicJobs({ slug }))[0];
  return {
    title: job ? `${job.title} — ${job.company} | KumaWorks Jobs` : "Lowongan",
    robots: { index: Boolean(job?.indexable && job.accepting), follow: true },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_JOBS_URL ?? "https://jobs.kumaworks.id"}/jobs/${slug}`,
    },
  };
}
export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    job = (await getPublicJobs({ slug }))[0];
  if (!job) notFound();
  const session = await candidateSession(false),
    db = isPreview() ? null : recruitmentDb();
  const { data: existing } =
    session?.candidate && db
      ? await db
          .from("recruitment_applications")
          .select("input,stage")
          .eq("candidate_id", session.candidate.id)
          .eq("job_id", job.id)
          .maybeSingle()
      : { data: null };
  const { data: documents } =
    session?.candidate && db
      ? await db
          .from("recruitment_documents")
          .select("id,name,scan_status")
          .eq("candidate_id", session.candidate.id)
          .eq("category", "application")
          .is("deleted_at", null)
      : { data: [] };
  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.createdAt,
    validThrough: job.deadline ?? undefined,
    hiringOrganization: { "@type": "Organization", name: job.company },
    employmentType: (
      {
        permanent: "FULL_TIME",
        contract: "CONTRACTOR",
        part_time: "PART_TIME",
        internship: "INTERN",
        freelance: "CONTRACTOR",
      } as Record<string, string>
    )[job.employmentType],
    ...(job.workMode === "remote"
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: "Indonesia",
          },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.location,
              addressCountry: "ID",
            },
          },
        }),
    ...(job.salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salary.currency,
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary.min,
              maxValue: job.salary.max,
              unitText: job.salary.period.toUpperCase(),
            },
          },
        }
      : {}),
  };
  return (
    <div>
      <Link
        href="/jobs"
        className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Semua lowongan
      </Link>
      <section className="rounded-[2rem] border bg-card p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <CompanyMark name={job.company} logoUrl={job.companyLogoUrl} />
            <Link
              href={companyHref(job.companySlug)}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              {job.company}
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
            {job.accepting ? "Menerima lamaran" : "Lamaran ditutup"}
          </span>
        </div>
        <h1 className="mt-6 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {job.title}
        </h1>
        <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            {job.location}
          </p>
          <p className="flex items-center gap-2">
            <BriefcaseBusiness className="size-4" />
            {employmentLabels[job.employmentType]}
          </p>
          <p>{workModeLabels[job.workMode]}</p>
        </div>
        {job.salary && (
          <p className="mt-5 text-base font-semibold text-primary">
            {salaryLabel(job.salary)}
          </p>
        )}
        {job.accepting && (
          <a
            href="#lamar"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground lg:hidden"
          >
            Lamar posisi ini <ArrowUpRight className="size-4" />
          </a>
        )}
      </section>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.05fr_1fr]">
        <article className="space-y-8 p-1 sm:p-3">
          {[
            ["Tentang posisi ini", job.description],
            ["Tanggung jawab", job.responsibilities],
            ["Yang kami cari", job.requirements],
            ["Yang Anda dapatkan", job.benefits],
          ]
            .filter(([, content]) => content)
            .map(([title, content]) => (
              <section key={title}>
                <h2 className="mb-3 text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {content}
                </p>
              </section>
            ))}
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <FileCheck2 className="size-4 text-primary" /> Siapkan sebelum
              melamar
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Nama, email terverifikasi, dan nomor telepon</li>
              {job.form.cv !== "off" && (
                <li>
                  CV {job.form.cv === "required" ? "(wajib)" : "(opsional)"}
                </li>
              )}
              {job.form.documents.map((d) => (
                <li key={d.id}>
                  {d.label} {d.required ? "(wajib)" : "(opsional)"}
                  <span className="mt-0.5 block text-xs">
                    {d.instructions} · {d.formats.join(", ").toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              PDF, DOCX, JPG, atau PNG · Maksimal 10 MB per dokumen
            </p>
          </section>
          {job.deadline && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" /> Batas lamaran:{" "}
              {new Date(job.deadline).toLocaleDateString("id-ID", {
                timeZone: "Asia/Jakarta",
                dateStyle: "long",
              })}
            </p>
          )}
          <div className="border-t pt-5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4" /> Periksa detail lowongan sebelum
              membagikan data Anda.
            </p>
            <Link
              href={`/jobs/account?report=${job.id}`}
              className="mt-3 inline-block text-xs underline underline-offset-4"
            >
              Laporkan lowongan
            </Link>
          </div>
        </article>
        <div id="lamar" className="scroll-mt-36">
          {job.accepting ? (
            <ApplyForm
              job={job}
              signedIn={Boolean(session)}
              profile={session?.candidate}
              existing={existing}
              documents={documents ?? []}
              preview={isPreview()}
            />
          ) : (
            <div className="rounded-3xl border bg-card p-8">
              <h2 className="text-xl font-semibold">Lamaran ditutup</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Lowongan ini tidak menerima lamaran baru. Lamaran yang sudah
                dikirim tetap dapat dilihat.
              </p>
              <Link
                href="/jobs/account"
                className="mt-5 block text-sm font-medium text-primary"
              >
                Lihat lamaran saya →
              </Link>
            </div>
          )}
        </div>
      </div>
      {job.accepting && job.indexable && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </div>
  );
}
