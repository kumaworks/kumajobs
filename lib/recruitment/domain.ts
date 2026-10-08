import { z } from "zod";

export const stages = [
  "applied",
  "screening",
  "shortlisted",
  "interview",
  "offer",
  "offer_accepted",
  "hired",
  "rejected",
  "withdrawn",
  "offer_declined",
] as const;
export type Stage = (typeof stages)[number];
export const availability = [
  "immediately",
  "two_weeks",
  "one_month",
  "two_months",
  "more_than_two_months",
  "specific_date",
] as const;
export const availabilityLabels: Record<string, string> = {
  immediately: "Segera",
  two_weeks: "Dalam 2 minggu",
  one_month: "Dalam 1 bulan",
  two_months: "Dalam 2 bulan",
  more_than_two_months: "Lebih dari 2 bulan",
  specific_date: "Tanggal tertentu",
};
export const stageLabels: Record<Stage, string> = {
  applied: "Lamaran diterima",
  screening: "Sedang ditinjau",
  shortlisted: "Seleksi lanjutan",
  interview: "Wawancara",
  offer: "Penawaran",
  offer_accepted: "Penawaran diterima",
  hired: "Bergabung",
  rejected: "Belum terpilih",
  withdrawn: "Ditarik",
  offer_declined: "Penawaran ditolak",
};
export const permissions = [
  "view",
  "jobs",
  "applications",
  "compensation",
  "interview",
  "offers",
  "approve",
  "hire",
  "export",
  "restrictions",
  "settings",
] as const;
export type RecruitmentPermission = (typeof permissions)[number];
export const permissionKey = (key: RecruitmentPermission) =>
  `desktop.people.recruitment.${key}`;
const uuid = z.string().uuid();
const optionalId = uuid.nullable().optional();
const requirement = z.enum(["off", "optional", "required"]);
export const fieldSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
    label: z.string().trim().min(1).max(150),
    type: z.enum([
      "text",
      "textarea",
      "number",
      "date",
      "select",
      "multiselect",
      "checkbox",
      "url",
    ]),
    required: z.boolean().default(false),
    options: z.array(z.string().trim().min(1).max(150)).max(50).default([]),
  })
  .superRefine((f, ctx) => {
    if (["select", "multiselect"].includes(f.type) && !f.options.length)
      ctx.addIssue({ code: "custom", message: "Choice fields need options" });
  });
export const documentSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  label: z.string().trim().min(1).max(150),
  instructions: z.string().max(1000).default(""),
  required: z.boolean().default(false),
  formats: z
    .array(z.enum(["pdf", "docx", "jpg", "png"]))
    .min(1)
    .default(["pdf", "docx", "jpg", "png"]),
});
export const formSchema = z
  .object({
    cv: requirement.default("required"),
    expectedSalary: requirement.default("optional"),
    lastSalary: requirement.default("off"),
    availability: z.boolean().default(true),
    fields: z.array(fieldSchema).max(30).default([]),
    documents: z.array(documentSchema).max(15).default([]),
  })
  .superRefine((f, ctx) => {
    for (const items of [f.fields, f.documents])
      if (new Set(items.map((i) => i.id)).size !== items.length)
        ctx.addIssue({
          code: "custom",
          message: "Field identifiers must be unique",
        });
  });
export const jobSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(20).max(20000),
    responsibilities: z.string().max(10000).default(""),
    requirements: z.string().max(10000).default(""),
    benefits: z.string().max(10000).default(""),
    location: z.string().trim().min(1).max(200),
    employmentType: z.enum([
      "permanent",
      "contract",
      "part_time",
      "internship",
      "freelance",
    ]),
    workMode: z.enum(["onsite", "hybrid", "remote"]),
    headcount: z.number().int().min(1).max(10000),
    salaryMin: z.number().nonnegative().nullable(),
    salaryMax: z.number().nonnegative().nullable(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .default("IDR"),
    payPeriod: z.enum(["hour", "day", "month", "year"]).default("month"),
    showSalary: z.boolean().default(false),
    visibility: z.enum(["public", "unlisted"]).default("public"),
    deadline: z.string().datetime().nullable(),
    jobTitleId: optionalId,
    departmentId: optionalId,
    branchId: optionalId,
    recruiterId: optionalId,
    hiringManagerId: optionalId,
    interviewerIds: z.array(uuid).max(20).default([]),
    form: formSchema,
  })
  .superRefine((j, ctx) => {
    if (
      j.salaryMin !== null &&
      j.salaryMax !== null &&
      j.salaryMin > j.salaryMax
    )
      ctx.addIssue({
        code: "custom",
        message: "Minimum salary exceeds maximum",
      });
    if (j.showSalary && (j.salaryMin === null || j.salaryMax === null))
      ctx.addIssue({
        code: "custom",
        message: "Visible salary requires a range",
      });
  });
export type JobInput = z.infer<typeof jobSchema>;
export type ApplicationForm = z.infer<typeof formSchema>;
export type Job = {
  id: string;
  business_id: string;
  slug: string;
  state: string;
  revision: number;
  published_version: number;
  input: JobInput;
  published?: JobInput;
  created_at: string;
};
export type PublicJob = {
  id: string;
  slug: string;
  businessId: string;
  company: string;
  companySlug: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  location: string;
  employmentType: string;
  workMode: string;
  salary: { min: number; max: number; currency: string; period: string } | null;
  deadline: string | null;
  form: ApplicationForm;
  version: number;
  accepting: boolean;
  indexable: boolean;
  createdAt: string;
};
export type Result<T = Record<string, unknown>> =
  | { data: T; error?: never }
  | {
      data?: never;
      error: string;
      code?: "validation" | "conflict" | "retry" | "forbidden" | "failed";
      fields?: Record<string, string>;
    };
export function actionFailure(
  error: unknown,
  fallback = "Unable to save",
): Extract<Result, { error: string }> {
  if (error instanceof z.ZodError)
    return {
      error: error.issues.map((i) => i.message).join("; "),
      code: "validation",
      fields: Object.fromEntries(
        error.issues.map((i) => [i.path.join("."), i.message]),
      ),
    };
  const sql =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  return {
    error: error instanceof Error ? error.message : fallback,
    code:
      sql === "40001" || sql === "23505"
        ? "conflict"
        : ["40P01", "57014", "53300"].includes(sql)
          ? "retry"
          : sql === "42501"
            ? "forbidden"
            : "failed",
  };
}
export const normalizeEmail = (v: string) => v.trim().toLowerCase();
export function normalizePhone(v: string) {
  let p = v.replace(/[\s().-]/g, "");
  if (p.startsWith("0")) p = `+62${p.slice(1)}`;
  else if (p.startsWith("62")) p = `+${p}`;
  if (!/^\+[1-9]\d{7,14}$/.test(p))
    throw new Error("Gunakan nomor telepon dengan kode negara yang valid.");
  return p;
}
export const applicationSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().transform(normalizePhone),
  availability: z.enum(availability).optional(),
  availableDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  expectedSalary: z.number().nonnegative().nullable().optional(),
  lastSalary: z.number().nonnegative().nullable().optional(),
  answers: z
    .record(
      z.union([
        z.string().max(10000),
        z.number().finite(),
        z.boolean(),
        z.array(z.string().max(150)).max(50),
      ]),
    )
    .default({}),
  documents: z.record(uuid).default({}),
  futureConsent: z.boolean().default(false),
  privacyConsent: z.boolean().default(false),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;
export function validateApplication(
  form: ApplicationForm,
  input: ApplicationInput,
) {
  if (!input.privacyConsent)
    throw new Error("Persetujuan penggunaan data diperlukan.");
  if (form.availability && !input.availability)
    throw new Error("Pilih waktu mulai bekerja.");
  if (
    input.availability === "specific_date" &&
    (!input.availableDate || Number.isNaN(Date.parse(input.availableDate)))
  )
    throw new Error("Isi tanggal mulai bekerja.");
  for (const key of ["expectedSalary", "lastSalary"] as const) {
    if (form[key] === "required" && input[key] == null)
      throw new Error(`${key} wajib diisi.`);
    if (form[key] === "off") delete input[key];
  }
  if (form.cv === "required" && !input.documents.cv)
    throw new Error("Unggah CV terlebih dahulu.");
  for (const d of form.documents)
    if (d.required && !input.documents[d.id])
      throw new Error(`${d.label} wajib diunggah.`);
  const allowed = new Set(form.fields.map((f) => f.id));
  for (const k of Object.keys(input.answers))
    if (!allowed.has(k)) delete input.answers[k];
  for (const f of form.fields) {
    const v = input.answers[f.id],
      empty =
        v === undefined ||
        v === "" ||
        (Array.isArray(v) && !v.length) ||
        (f.type === "checkbox" && v !== true);
    if (empty) {
      if (f.required) throw new Error(`${f.label} wajib diisi.`);
      continue;
    }
    if (f.type === "number" && typeof v !== "number")
      throw new Error(`${f.label}: angka diperlukan.`);
    if (f.type === "checkbox" && typeof v !== "boolean")
      throw new Error(`${f.label}: pilihan tidak valid.`);
    if (f.type === "select" && !f.options.includes(String(v)))
      throw new Error(`${f.label}: pilihan tidak valid.`);
    if (
      f.type === "multiselect" &&
      (!Array.isArray(v) || v.some((o) => !f.options.includes(o)))
    )
      throw new Error(`${f.label}: pilihan tidak valid.`);
    if (
      ["text", "textarea", "url", "date"].includes(f.type) &&
      typeof v !== "string"
    )
      throw new Error(`${f.label}: teks diperlukan.`);
    if (f.type === "url" && !/^https?:\/\//i.test(String(v)))
      throw new Error(`${f.label}: gunakan tautan http atau https.`);
    if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(String(v)))
      throw new Error(`${f.label}: tanggal tidak valid.`);
  }
  return input;
}
export function publicJob(
  row: Job,
  company: { name: string; slug: string },
  accepting: boolean,
): PublicJob {
  const j = row.published ?? row.input;
  return {
    id: row.id,
    slug: row.slug,
    businessId: row.business_id,
    company: company.name,
    companySlug: company.slug,
    title: j.title,
    description: j.description,
    responsibilities: j.responsibilities,
    requirements: j.requirements,
    benefits: j.benefits,
    location: j.location,
    employmentType: j.employmentType,
    workMode: j.workMode,
    salary: j.showSalary
      ? {
          min: j.salaryMin!,
          max: j.salaryMax!,
          currency: j.currency,
          period: j.payPeriod,
        }
      : null,
    deadline: j.deadline,
    form: j.form,
    version: row.published_version,
    accepting,
    indexable: j.visibility === "public",
    createdAt: row.created_at,
  };
}
export function safeCandidateReturn(value: string | null) {
  return value &&
    /^\/jobs(?:\/[a-zA-Z0-9/_-]*)?(?:\?[a-zA-Z0-9%=&_-]*)?$/.test(value)
    ? value
    : "/jobs/account";
}
export function redactApplication(
  input: Record<string, unknown>,
  canCompensation: boolean,
) {
  const copy = { ...input };
  if (!canCompensation) {
    delete copy.expectedSalary;
    delete copy.lastSalary;
  }
  return copy;
}
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export function identifyFile(
  bytes: Uint8Array,
  name: string,
): { extension: string; mime: string } {
  const ext = name.toLowerCase().split(".").pop(),
    starts = (...v: number[]) => v.every((n, i) => bytes[i] === n);
  if (ext === "pdf" && starts(37, 80, 68, 70, 45))
    return { extension: "pdf", mime: "application/pdf" };
  if ((ext === "jpg" || ext === "jpeg") && starts(255, 216, 255))
    return { extension: "jpg", mime: "image/jpeg" };
  if (ext === "png" && starts(137, 80, 78, 71, 13, 10, 26, 10))
    return { extension: "png", mime: "image/png" };
  if (ext === "docx" && starts(80, 75, 3, 4))
    return {
      extension: "docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  throw new Error("Format dokumen tidak didukung.");
}

export const interviewLabels: Record<string, string> = {
  scheduled: "Menunggu konfirmasi",
  confirmed: "Dikonfirmasi",
  reschedule_requested: "Permintaan jadwal baru",
  cancelled: "Dibatalkan",
  completed: "Selesai",
  no_show: "Tidak hadir",
};
export const offerLabels: Record<string, string> = {
  sent: "Menunggu jawaban",
  accepted: "Diterima",
  declined: "Ditolak",
  expired: "Kedaluwarsa",
  withdrawn: "Ditarik",
  superseded: "Diganti dengan versi baru",
};
export const verificationLabels: Record<string, string> = {
  not_submitted: "Belum diajukan",
  pending: "Menunggu peninjauan",
  verified: "Terverifikasi",
  needs_correction: "Perlu perbaikan",
  rejected: "Belum disetujui",
  revoked: "Perlu verifikasi ulang",
};
export const employmentLabels: Record<string, string> = {
  permanent: "Karyawan tetap",
  contract: "Kontrak",
  part_time: "Paruh waktu",
  internship: "Magang",
  freelance: "Lepas",
};

export const workModeLabels: Record<string, string> = {
  onsite: "Di kantor",
  hybrid: "Hibrida",
  remote: "Jarak jauh",
};
