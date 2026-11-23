"use server";
import {
  createHash,
  createCipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  candidateSession,
  command,
  getPublicJobs,
  rateLimit,
  recruitmentDb,
} from "@/lib/recruitment/server";
import {
  applicationSchema,
  actionFailure,
  validateApplication,
  safeCandidateReturn,
  identifyFile,
  MAX_FILE_BYTES,
  type Result,
} from "@/lib/recruitment/domain";
import { isPreview } from "@/lib/recruitment/preview";
import { redirect } from "next/navigation";
import { profileSchema } from "@/lib/recruitment/validation";

export async function requestCandidateLogin(
  email: string,
  next: string,
): Promise<Result> {
  try {
    if (isPreview())
      return {
        error:
          "Mode pratinjau: tidak ada data yang disimpan atau email yang dikirim.",
      };
    email = z
      .string()
      .trim()
      .toLowerCase()
      .email("Masukkan alamat email yang valid.")
      .max(254)
      .parse(email);
    const h = await headers(),
      ip = h.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    await rateLimit(
      `auth-ip:${createHash("sha256").update(ip).digest("hex")}`,
      30,
    );
    await rateLimit(
      `auth-email:${createHash("sha256").update(email).digest("hex")}`,
      5,
      600,
    );
    const base = process.env.NEXT_PUBLIC_JOBS_URL ?? "http://localhost:3001";
    const client = await createClient();
    // Supabase uses the Magic Link template for existing-account email OTP.
    // The hosted template renders .Token for these allowlisted jobs callbacks;
    // switching to signup/resend would not sign existing candidates in.
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${base}/jobs/auth/callback?next=${encodeURIComponent(safeCandidateReturn(next))}`,
      },
    });
    if (error)
      return {
        error:
          error.status === 429
            ? "Terlalu banyak permintaan. Tunggu sebentar sebelum meminta kode lagi."
            : "Tidak dapat mengirim kode. Periksa alamat email dan coba lagi nanti.",
      };
    return {
      data: {
        message:
          "Jika email dapat digunakan, kode verifikasi sudah dikirim. Periksa kotak masuk dan spam.",
      },
    };
  } catch (error) {
    return actionFailure(error, "Tidak dapat mengirim kode. Coba lagi nanti.");
  }
}

export async function verifyCandidateLogin(
  email: string,
  token: string,
  next: string,
): Promise<Result> {
  try {
    if (isPreview())
      return {
        error:
          "Mode pratinjau: tidak ada data yang disimpan atau email yang dikirim.",
      };
    email = z
      .string()
      .trim()
      .toLowerCase()
      .email("Masukkan alamat email yang valid.")
      .max(254)
      .parse(email);
    token = z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Masukkan kode 6 digit dari email Anda.")
      .parse(token);
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    await rateLimit(
      `auth-verify-ip:${createHash("sha256").update(ip).digest("hex")}`,
      30,
      300,
    );
    await rateLimit(
      `auth-verify-email:${createHash("sha256").update(email).digest("hex")}`,
      5,
      300,
    );
    const client = await createClient();
    const { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error || !data.session)
      return {
        error:
          "Kode tidak valid atau sudah kedaluwarsa. Periksa kode atau minta kode baru.",
      };
  } catch (error) {
    return actionFailure(
      error,
      "Tidak dapat memverifikasi kode. Coba lagi nanti.",
    );
  }
  // Redirect throws in Next.js; keep it outside the error handler. The SSR
  // client has persisted the verified session in host-only cookies by now.
  redirect(safeCandidateReturn(next));
}
export async function candidateAction(
  name: string,
  id: string | null,
  revision: number | null,
  raw: unknown,
): Promise<Result> {
  try {
    if (isPreview())
      return {
        error:
          "Mode pratinjau: tidak ada data yang disimpan atau email yang dikirim.",
      };
    const session = (await candidateSession())!;
    if (id) z.string().uuid().parse(id);
    await rateLimit(`candidate:${session.user.id}`, 120, 60);
    let input: unknown;
    if (name === "profile") input = profileSchema.parse(raw);
    else if (name === "draft" || name === "submit") {
      const parsed = applicationSchema.parse(raw);
      const { data: job } = await recruitmentDb()
        .from("recruitment_jobs")
        .select("slug")
        .eq("id", id!)
        .single();
      const published = job
        ? (await getPublicJobs({ slug: job.slug }))[0]
        : null;
      if (!published?.accepting)
        throw new Error("Lowongan tidak menerima lamaran saat ini.");
      input =
        name === "submit"
          ? validateApplication(published.form, parsed)
          : parsed;
      if (name === "submit") {
        for (const [key, docId] of Object.entries(parsed.documents)) {
          const rule =
            key === "cv"
              ? { formats: ["pdf", "docx", "jpg", "png"] }
              : published.form.documents.find((d) => d.id === key);
          const { data: doc } = await recruitmentDb()
            .from("recruitment_documents")
            .select("extension,candidate_id,category,scan_status,deleted_at")
            .eq("id", docId)
            .single();
          if (
            !rule ||
            !doc ||
            doc.candidate_id !== session.candidate?.id ||
            doc.category !== "application" ||
            !["clean", "pending"].includes(doc.scan_status) ||
            doc.deleted_at ||
            !rule.formats.includes(doc.extension)
          )
            throw new Error("Dokumen tidak sesuai persyaratan.");
        }
      }
    } else if (name === "withdraw" || name === "claim_manual") input = {};
    else if (name === "interview_response")
      input = z
        .object({
          response: z.enum(["confirmed", "reschedule_requested"]),
          message: z.string().max(2000).default(""),
        })
        .parse(raw);
    else if (name === "offer_response")
      input = z
        .object({ response: z.enum(["accepted", "declined"]) })
        .parse(raw);
    else if (name === "document_response")
      input = z.object({ documentId: z.string().uuid() }).parse(raw);
    else if (name === "request")
      input = z
        .object({
          kind: z.enum(["report_job", "correction", "deletion"]),
          jobId: z.string().uuid().nullable().optional(),
          message: z.string().trim().min(10).max(5000),
        })
        .parse(raw);
    else if (name === "verification_submit") {
      const value = z
        .object({
          nik: z.string().regex(/^\d{16}$/),
          documentId: z.string().uuid(),
        })
        .parse(raw);
      const secret = process.env.RECRUITMENT_IDENTITY_KEY;
      if (!secret || Buffer.from(secret, "base64").length !== 32)
        throw new Error("Verifikasi identitas belum tersedia.");
      const key = Buffer.from(secret, "base64"),
        iv = randomBytes(12),
        cipher = createCipheriv("aes-256-gcm", key, iv);
      const encrypted = Buffer.concat([
        cipher.update(value.nik, "utf8"),
        cipher.final(),
      ]);
      input = {
        documentId: value.documentId,
        encryptedNik: `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`,
        fingerprint: createHmac("sha256", key)
          .update(`kuma-nik:${value.nik}`)
          .digest("hex"),
      };
    } else throw new Error("Tindakan tidak tersedia.");
    const data = await command(
      session.user.id,
      null,
      name,
      id,
      revision,
      input,
    );
    revalidatePath("/jobs", "layout");

    return { data };
  } catch (error) {
    return actionFailure(error, "Tidak dapat menyimpan perubahan.");
  }
}
// Only metadata crosses the application server. The signed object remains
// quarantined until the worker checks its actual bytes and malware scan.
export async function prepareCandidateUpload(
  raw: unknown,
): Promise<Result<{ id: string; name: string; signedUrl: string }>> {
  try {
    if (isPreview())
      return {
        error:
          "Mode pratinjau: tidak ada data yang disimpan atau email yang dikirim.",
      };
    const input = z
      .object({
        name: z.string().min(1).max(200),
        bytes: z.number().int().min(1).max(MAX_FILE_BYTES),
        category: z.enum(["application", "identity"]),
        header: z.array(z.number().int().min(0).max(255)).max(16),
      })
      .parse(raw);
    const session = (await candidateSession())!;
    if (!session.candidate) throw new Error("Simpan profil terlebih dahulu.");
    await rateLimit(`upload:${session.user.id}`, 30);
    const info = identifyFile(new Uint8Array(input.header), input.name);
    if (
      input.category === "identity" &&
      !["jpg", "png", "pdf"].includes(info.extension)
    )
      throw new Error("KTP harus berupa gambar atau PDF.");
    const db = recruitmentDb(),
      id = crypto.randomUUID(),
      path = `${session.candidate.id}/${id}.${info.extension}`,
      bucket =
        input.category === "identity"
          ? "recruitment-identity"
          : "recruitment-private";
    const { error } = await db.from("recruitment_documents").insert({
      id,
      candidate_id: session.candidate.id,
      name: input.name,
      object_path: path,
      category: input.category,
      mime: info.mime,
      extension: info.extension,
      bytes: input.bytes,
    });
    if (error) throw error;
    const { data, error: signError } = await db.storage
      .from(bucket)
      .createSignedUploadUrl(path, { upsert: false });
    if (signError || !data) {
      await db
        .from("recruitment_documents")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      throw new Error("Tidak dapat menyiapkan unggahan.");
    }
    return { data: { id, name: input.name, signedUrl: data.signedUrl } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unggah gagal." };
  }
}
export async function signOutCandidate() {
  if (isPreview()) return;
  const client = await createClient();
  await client.auth.signOut();
  revalidatePath("/jobs", "layout");
  redirect("/jobs/login");
}
