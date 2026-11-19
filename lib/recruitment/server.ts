import "server-only";
import {
  isPreview,
  previewJobs,
  previewSession,
  previewCandidateData,
} from "./preview";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { publicJob, type Job, type PublicJob } from "./domain";
import { normalizeCompanyCode } from "./company-url";
import { companyColor, defaultCompanyColors } from "./company-colors";

export function recruitmentDb() {
  if (isPreview())
    throw new Error("Pratinjau hanya baca. Tidak ada data yang disimpan.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Recruitment database is not configured");
  return createAdmin(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function candidateSession(required = true) {
  if (isPreview()) return previewSession;
  const client = await createClient(),
    {
      data: { user },
    } = await client.auth.getUser();
  if (!user?.email_confirmed_at || !user.email) {
    if (required) throw new Error("Verifikasi email untuk melanjutkan.");
    return null;
  }
  const { data: candidate, error } = await recruitmentDb()
    .from("recruitment_candidates")
    .select(
      "id,user_id,name,email,phone,profile,verification_status,verified_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { user, candidate };
}
export async function command(
  actor: string,
  business: string | null,
  name: string,
  id: string | null,
  revision: number | null,
  input: unknown,
) {
  const { data, error } = await recruitmentDb().rpc("recruitment_command", {
    p_actor: actor,
    p_business: business,
    p_command: name,
    p_id: id,
    p_revision: revision,
    p_input: input,
  });
  if (error)
    throw Object.assign(new Error(error.message), { code: error.code });
  return data as Record<string, unknown>;
}
export async function rateLimit(key: string, limit = 20, seconds = 3600) {
  const { data, error } = await recruitmentDb().rpc("recruitment_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_seconds: seconds,
  });
  if (error || data !== true)
    throw new Error("Terlalu banyak permintaan. Coba lagi nanti.");
}
async function companyLogoUrls(businessIds: string[]) {
  const urls = new Map<string, string>();
  if (!businessIds.length) return urls;
  const db = recruitmentDb();
  const { data, error } = await db
    .from("company_logos")
    .select("business_id,storage_path")
    .in("business_id", [...new Set(businessIds)])
    .order("is_main", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id");
  if (error) {
    console.error("Unable to load company logos:", error.message);
    return urls;
  }
  for (const logo of data ?? []) {
    if (!urls.has(logo.business_id) && logo.storage_path?.trim()) {
      const { data } = db.storage
        .from("company-logos")
        .getPublicUrl(logo.storage_path);
      urls.set(logo.business_id, data.publicUrl);
    }
  }
  return urls;
}

export async function getPublicJobs(
  filter: {
    slug?: string;
    company?: string;
    query?: string;
    location?: string;
    employment?: string;
    mode?: string;
    page?: number;
  } = {},
): Promise<PublicJob[]> {
  if (isPreview())
    return previewJobs
      .filter(
        (j) =>
          (!filter.slug || j.slug === filter.slug) &&
          (!filter.company || j.companySlug === filter.company) &&
          (!filter.query ||
            `${j.title} ${j.company}`
              .toLowerCase()
              .includes(filter.query.toLowerCase())) &&
          (!filter.location ||
            j.location.toLowerCase().includes(filter.location.toLowerCase())) &&
          (!filter.employment || j.employmentType === filter.employment) &&
          (!filter.mode || j.workMode === filter.mode),
      )
      .slice((filter.page ?? 0) * 50, ((filter.page ?? 0) + 1) * 50);
  const clean = (v: string) =>
    v
      .replace(/[,()%"\\]/g, " ")
      .trim()
      .slice(0, 150);
  let query = recruitmentDb()
    .from("recruitment_public_vacancies")
    .select("*")
    .order("published_at", { ascending: false })
    .order("id");
  if (filter.slug) query = query.eq("slug", filter.slug);
  else
    query = query.eq("accepting", true).eq("published->>visibility", "public");
  if (filter.company) query = query.eq("company_slug", filter.company);
  if (filter.query) {
    const term = clean(filter.query);
    query = query.or(
      `published->>title.ilike.%${term}%,company_name.ilike.%${term}%`,
    );
  }
  if (filter.location)
    query = query.ilike("published->>location", `%${clean(filter.location)}%`);
  if (filter.employment)
    query = query.eq("published->>employmentType", filter.employment);
  if (filter.mode) query = query.eq("published->>workMode", filter.mode);
  const page = Math.max(0, Math.floor(filter.page ?? 0));
  const { data, error } = await query.range(page * 50, page * 50 + 49);
  if (error) throw new Error(error.message);
  const logos = await companyLogoUrls(
    (data ?? []).map((row) => row.business_id),
  );
  return (data ?? []).map((row) =>
    publicJob(
      { ...row, created_at: row.published_at } as Job,
      {
        name: row.company_name,
        slug: row.company_slug,
        logoUrl: logos.get(row.business_id),
      },
      row.accepting,
    ),
  );
}
export async function candidateData() {
  if (isPreview()) return previewCandidateData();
  const verificationAvailable = await verificationAvailability();
  const session = await candidateSession();
  if (!session?.candidate)
    return {
      session,
      verificationAvailable,
      applications: [],
      interviews: [],
      offers: [],
      events: [],
      requests: [],
      documents: [],
      verifications: [],
      hires: [],
      manualRecords: [],
    };
  const db = recruitmentDb(),
    { data: applications, error } = await db
      .from("recruitment_applications")
      .select(
        "id,job_id,business_id,version,revision,stage,input,snapshot,submitted_at,created_at,employee_id",
      )
      .eq("candidate_id", session.candidate.id)
      .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const ids = applications?.map((a) => a.id) ?? [];
  const { data: jobs, error: jobsError } = applications?.length
    ? await db
        .from("recruitment_jobs")
        .select("id,slug")
        .in(
          "id",
          applications.map((a) => a.job_id),
        )
    : { data: [], error: null };
  if (jobsError) throw new Error(jobsError.message);
  const businesses = [
    ...new Set((applications ?? []).map((a) => a.business_id)),
  ];
  const { data: companies, error: companyError } = businesses.length
    ? await db.from("businesses").select("id,name").in("id", businesses)
    : { data: [], error: null };
  if (companyError) throw new Error(companyError.message);
  const results = ids.length
    ? await Promise.all([
        db
          .from("recruitment_interviews")
          .select("id,application_id,revision,input,status,candidate_response")
          .in("application_id", ids),
        db
          .from("recruitment_offers")
          .select(
            "id,application_id,version,revision,input,status,responded_at",
          )
          .in("application_id", ids)
          .in("status", [
            "sent",
            "accepted",
            "declined",
            "expired",
            "withdrawn",
            "superseded",
          ]),
        db
          .from("recruitment_events")
          .select("id,application_id,kind,detail,created_at")
          .in("application_id", ids)
          .eq("candidate_visible", true),
        db
          .from("recruitment_document_requests")
          .select("id,application_id,label,instructions,deadline,document_id")
          .in("application_id", ids),
        db
          .from("recruitment_hires")
          .select("application_id,business_id,employee_id,invitation_id")
          .in("application_id", ids),
      ])
    : [];
  const { data: documents } = await db
    .from("recruitment_documents")
    .select("id,name,category,scan_status,created_at")
    .eq("candidate_id", session.candidate.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const { data: verifications } = await db
    .from("recruitment_verifications")
    .select("id,status,reason,reviewed_at,created_at")
    .eq("candidate_id", session.candidate.id)
    .order("created_at", { ascending: false });
  const { data: manualRecords } = await db
    .from("recruitment_business_candidates")
    .select("id,name,source,businesses(name)")
    .eq("email", session.user.email!.toLowerCase())
    .is("candidate_id", null);
  for (const r of results) if (r.error) throw new Error(r.error.message);
  return {
    session,
    verificationAvailable,
    applications: (applications ?? []).map((a) => ({
      ...a,
      job_slug: jobs?.find((j) => j.id === a.job_id)?.slug ?? null,
      company: companies?.find((c) => c.id === a.business_id)?.name ?? "",
      snapshot: a.snapshot
        ? {
            title: a.snapshot.title,
            location: a.snapshot.location,
            description: a.snapshot.description,
            form: a.snapshot.form,
          }
        : null,
    })),
    interviews: (results[0]?.data ?? []).map((i) => ({
      ...i,
      input: {
        title: i.input.title,
        startsAt: i.input.startsAt,
        duration: i.input.duration,
        timezone: i.input.timezone,
        location: i.input.location,
        instructions: i.input.instructions,
      },
    })),
    offers: results[1]?.data ?? [],
    events: results[2]?.data ?? [],
    requests: results[3]?.data ?? [],
    hires: results[4]?.data ?? [],
    documents: documents ?? [],
    verifications: verifications ?? [],
    manualRecords: manualRecords ?? [],
  };
}
export type CandidateData = Awaited<ReturnType<typeof candidateData>>;

export async function verificationAvailability() {
  if (isPreview()) return true;
  if (!process.env.RECRUITMENT_IDENTITY_KEY) return false;
  const { data, error } = await recruitmentDb()
    .from("recruitment_settings")
    .select("business_id")
    .eq("verification_enabled", true)
    .limit(1);
  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}
export async function publicCompany(slug: string) {
  const code = normalizeCompanyCode(slug);
  if (!code) return null;
  if (isPreview()) {
    const job = previewJobs.find((j) => j.companySlug === code);
    return job
      ? {
          company_name: job.company,
          slug: code,
          primaryColor:
            code === "loka-digital" ? "#e0e7ff" : defaultCompanyColors.primary,
          secondaryColor:
            code === "loka-digital"
              ? "#4338ca"
              : defaultCompanyColors.secondary,
          logoUrl: job.companyLogoUrl ?? null,
          description:
            "Tempat untuk ide yang berani, kolaborasi yang terbuka, dan pekerjaan yang berdampak. Temukan peran Anda bersama kami.",
          website: "",
        }
      : null;
  }
  const { data, error } = await recruitmentDb()
    .from("recruitment_settings")
    .select(
      "business_id,slug,company_name,description,website,primary_color,secondary_color",
    )
    .eq("slug", code)
    .eq("enabled", true)
    .eq("public_enabled", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const logos = await companyLogoUrls([data.business_id]);
  return {
    company_name: data.company_name,
    slug: data.slug as string,
    primaryColor: companyColor(
      data.primary_color,
      defaultCompanyColors.primary,
    ),
    secondaryColor: companyColor(
      data.secondary_color,
      defaultCompanyColors.secondary,
    ),
    description: data.description,
    website: data.website,
    logoUrl: logos.get(data.business_id) ?? null,
  };
}
