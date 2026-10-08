"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  HelpCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { CompanyMark } from "./job-discovery";
import type { CandidateData } from "@/lib/recruitment/server";
import {
  stageLabels,
  employmentLabels,
  interviewLabels,
  offerLabels,
  verificationLabels,
  type Stage,
} from "@/lib/recruitment/domain";
import { candidateAction } from "@/app/jobs/actions";
import { ActionForm, Field, inputClass, text, Upload } from "./forms";
export function CandidateAccount({
  initial,
  report,
  tab = "applications",
}: {
  initial: CandidateData;
  report?: string;
  tab?: string;
}) {
  const c = initial.session?.candidate;
  const activeTab = report
    ? "help"
    : [
          "applications",
          "interviews",
          "offers",
          "profile",
          "verification",
          "help",
        ].includes(tab)
      ? tab
      : "applications";
  const showApplications = ["applications", "interviews", "offers"].includes(
    activeTab,
  );
  const applications = initial.applications.filter((a) =>
    activeTab === "interviews"
      ? initial.interviews.some((i) => i.application_id === a.id)
      : activeTab === "offers"
        ? initial.offers.some((o) => o.application_id === a.id)
        : true,
  );
  const tabs = [
    { id: "applications", label: "Lamaran saya", Icon: BriefcaseBusiness },
    { id: "interviews", label: "Wawancara", Icon: CalendarDays },
    { id: "offers", label: "Penawaran", Icon: FileText },
    { id: "profile", label: "Profil & dokumen", Icon: UserRound },
    { id: "verification", label: "Kuma Verified", Icon: ShieldCheck },
    { id: "help", label: "Bantuan & privasi", Icon: HelpCircle },
  ];
  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Ruang karier Anda
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Halo{c?.name ? `, ${c.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Setiap langkah membawa Anda lebih dekat ke peluang berikutnya.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-full border bg-card px-5 py-3 text-sm font-medium"
        >
          Jelajahi lowongan <ArrowUpRight className="size-4" />
        </Link>
      </header>
      <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Lamaran",
            count: initial.applications.length,
            tab: "applications",
            Icon: BriefcaseBusiness,
          },
          {
            label: "Wawancara",
            count: initial.interviews.filter((i) =>
              ["scheduled", "confirmed", "reschedule_requested"].includes(
                i.status,
              ),
            ).length,
            tab: "interviews",
            Icon: CalendarDays,
          },
          {
            label: "Penawaran baru",
            count: initial.offers.filter((o) => o.status === "sent").length,
            tab: "offers",
            Icon: FileText,
          },
        ].map(({ label, count, tab, Icon }) => (
          <Link
            key={tab}
            href={`/jobs/account?tab=${tab}`}
            className="rounded-2xl border bg-card p-4 sm:p-6"
          >
            <Icon className="mb-4 size-5 text-primary" />
            <p className="text-3xl font-semibold tracking-tight">{count}</p>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              {label}
            </p>
          </Link>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28">
          <nav
            aria-label="Ruang kandidat"
            className="flex flex-wrap gap-2 lg:flex-col"
          >
            {tabs.map(({ id, label, Icon }) => (
              <Link
                key={id}
                href={`/jobs/account?tab=${id}`}
                aria-current={activeTab === id ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-medium transition ${activeTab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 hidden px-3 text-xs leading-relaxed text-muted-foreground lg:block">
            Profil Anda dapat digunakan di berbagai perusahaan. Setiap lamaran
            dibagikan hanya kepada perusahaan yang Anda pilih.
          </p>
        </aside>
        <div className="min-w-0 space-y-6">
          <h2 className="text-xl font-semibold tracking-tight">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
          {(activeTab === "profile" || !c) && (
            <details open className="rounded-3xl border bg-card p-6">
              <summary className="cursor-pointer font-semibold">
                Profil dan dokumen
              </summary>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <ActionForm
                  label="Simpan profil"
                  submit={(f) =>
                    candidateAction("profile", null, null, {
                      name: text(f, "name"),
                      phone: text(f, "phone"),
                    })
                  }
                >
                  <Field label="Nama lengkap">
                    <input
                      name="name"
                      required
                      defaultValue={c?.name}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Nomor telepon">
                    <input
                      name="phone"
                      required
                      defaultValue={c?.phone}
                      placeholder="+62…"
                      className={inputClass}
                    />
                  </Field>
                  <p className="text-sm text-muted-foreground">
                    Email terverifikasi: {initial.session?.user.email}
                  </p>
                </ActionForm>
                {c && (
                  <div className="space-y-3">
                    <Upload />
                    {initial.documents
                      .filter((d) => d.category === "application")
                      .map((d) => (
                        <p key={d.id} className="flex justify-between text-sm">
                          <a
                            className="underline"
                            href={`/api/recruitment/documents/${d.id}`}
                            target="_blank"
                          >
                            {d.name}
                          </a>
                          <span>
                            {d.scan_status === "clean"
                              ? "Siap"
                              : d.scan_status === "pending"
                                ? "Sedang diperiksa"
                                : "Tidak dapat digunakan"}
                          </span>
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </details>
          )}
          {activeTab === "applications" &&
            initial.manualRecords.map((record) => (
              <section
                key={record.id}
                className="space-y-3 rounded-3xl border bg-card p-6"
              >
                <h2 className="font-semibold">
                  Rujukan atau kunjungan langsung atas nama {record.name}
                </h2>
                <p className="text-sm">
                  Perekrut menggunakan alamat email Anda untuk mencatat rujukan
                  ini. Hubungkan hanya jika catatan ini milik Anda.
                </p>
                <ActionForm
                  label="Hubungkan dengan akun saya"
                  submit={() =>
                    candidateAction("claim_manual", record.id, null, {})
                  }
                />
              </section>
            ))}
          {showApplications &&
            applications.map((a) => (
              <article
                key={a.id}
                className="space-y-5 rounded-3xl border bg-card p-6"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CompanyMark name={a.company || "KumaWorks"} />
                    <div>
                      <h2 className="text-xl font-semibold">
                        {a.snapshot?.title ?? "Draf lamaran"}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {a.company} · {a.snapshot?.location} · #
                        {a.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-sm text-primary">
                    {a.stage === "draft"
                      ? "Draf"
                      : (stageLabels[a.stage as Stage] ?? a.stage)}
                  </span>
                </header>
                {a.stage === "draft" && a.job_slug && (
                  <Link
                    href={`/jobs/${a.job_slug}`}
                    className="text-sm underline"
                  >
                    Lanjutkan lamaran
                  </Link>
                )}
                {a.stage !== "draft" && (
                  <details className="rounded-xl border p-4">
                    <summary className="text-sm font-medium">
                      Lihat lamaran yang dikirim
                    </summary>
                    <div className="mt-4 space-y-3 text-sm">
                      <p>
                        {a.input.name} · {a.input.phone}
                      </p>
                      {Object.entries(a.input.answers ?? {}).map(
                        ([key, value]) => (
                          <p key={key}>
                            <span className="text-muted-foreground">
                              {a.snapshot?.form?.fields?.find(
                                (f: { id: string; label: string }) =>
                                  f.id === key,
                              )?.label ?? key}
                              :{" "}
                            </span>
                            {Array.isArray(value)
                              ? value.join(", ")
                              : typeof value === "boolean"
                                ? value
                                  ? "Ya"
                                  : "Tidak"
                                : String(value)}
                          </p>
                        ),
                      )}
                      {Object.entries(a.input.documents ?? {}).map(
                        ([key, id]) => (
                          <a
                            key={key}
                            href={`/api/recruitment/documents/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-primary underline"
                          >
                            {initial.documents.find((d) => d.id === id)?.name ??
                              key}
                          </a>
                        ),
                      )}
                    </div>
                  </details>
                )}
                {initial.events
                  .filter(
                    (e) => e.application_id === a.id && e.kind === "message",
                  )
                  .map((e) => (
                    <section
                      key={e.id}
                      className="rounded-lg border-l-4 border-primary bg-accent/50 p-4"
                    >
                      <p className="text-sm font-medium">{e.detail.subject}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {e.detail.message}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                        })}
                      </p>
                    </section>
                  ))}
                {initial.interviews
                  .filter(
                    (i) => i.application_id === a.id && activeTab !== "offers",
                  )
                  .map((i) => (
                    <section
                      key={i.id}
                      className="space-y-3 rounded-lg bg-background p-4"
                    >
                      <h3 className="font-medium">{i.input.title}</h3>
                      <p className="text-sm">
                        {new Date(i.input.startsAt).toLocaleString("id-ID", {
                          timeZone: i.input.timezone,
                        })}{" "}
                        ({i.input.timezone}) · {i.input.duration} menit
                      </p>
                      <p className="text-sm">{i.input.location}</p>
                      <p className="whitespace-pre-wrap text-sm">
                        {i.input.instructions}
                      </p>
                      <p className="text-sm">
                        Status: {interviewLabels[i.status] ?? i.status}
                      </p>
                      <a
                        href={`/api/recruitment/interviews/${i.id}/calendar`}
                        className="text-sm underline"
                      >
                        Simpan ke kalender
                      </a>
                      {[
                        "scheduled",
                        "confirmed",
                        "reschedule_requested",
                      ].includes(i.status) && (
                        <ActionForm
                          label="Kirim jawaban"
                          submit={(f) =>
                            candidateAction(
                              "interview_response",
                              i.id,
                              i.revision,
                              {
                                response: text(f, "response"),
                                message: text(f, "message"),
                              },
                            )
                          }
                        >
                          <select
                            aria-label="Jawaban wawancara"
                            name="response"
                            className={inputClass}
                          >
                            <option value="confirmed">Saya dapat hadir</option>
                            <option value="reschedule_requested">
                              Minta jadwal lain
                            </option>
                          </select>
                          <textarea
                            name="message"
                            aria-label="Pesan untuk perekrut"
                            placeholder="Pesan untuk perekrut"
                            className={inputClass}
                          />
                        </ActionForm>
                      )}
                    </section>
                  ))}
                {initial.offers
                  .filter(
                    (o) =>
                      o.application_id === a.id && activeTab !== "interviews",
                  )
                  .map((o) => (
                    <section
                      key={o.id}
                      className="space-y-3 rounded-lg border border-primary/30 p-4"
                    >
                      <h3 className="font-semibold">
                        Penawaran pekerjaan · versi {o.version}
                      </h3>
                      <p>
                        {o.input.title} · {o.input.location}
                      </p>
                      <p className="text-sm">
                        {o.input.currency}{" "}
                        {Number(o.input.salary).toLocaleString("id-ID")} /{" "}
                        {(
                          {
                            month: "bulan",
                            year: "tahun",
                            day: "hari",
                            hour: "jam",
                          } as Record<string, string>
                        )[o.input.payPeriod] ?? o.input.payPeriod}
                      </p>
                      <p className="text-sm">
                        Mulai: {o.input.joinDate} ·{" "}
                        {employmentLabels[o.input.employmentType] ??
                          o.input.employmentType}
                      </p>
                      {(o.input.components ?? []).map(
                        (c: { label: string; amount: number }, i: number) => (
                          <p key={i} className="text-sm">
                            {c.label}: {o.input.currency}{" "}
                            {c.amount.toLocaleString("id-ID")}
                          </p>
                        ),
                      )}
                      <p className="whitespace-pre-wrap text-sm">
                        {o.input.terms}
                      </p>
                      <p className="text-sm">
                        Berlaku sampai{" "}
                        {new Date(o.input.expiresAt).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                        })}{" "}
                        · {offerLabels[o.status] ?? o.status}
                      </p>
                      <a
                        className="text-sm underline"
                        href={`/api/recruitment/offers/${o.id}`}
                        target="_blank"
                      >
                        Unduh / cetak penawaran
                      </a>
                      {o.status === "sent" && (
                        <ActionForm
                          label="Konfirmasi jawaban"
                          submit={(f) =>
                            candidateAction(
                              "offer_response",
                              o.id,
                              o.revision,
                              {
                                response: text(f, "response"),
                              },
                            )
                          }
                        >
                          <select
                            required
                            aria-label="Jawaban penawaran"
                            name="response"
                            defaultValue=""
                            className={inputClass}
                          >
                            <option value="" disabled>
                              Pilih jawaban
                            </option>
                            <option value="accepted">
                              Terima penawaran ini
                            </option>
                            <option value="declined">
                              Tolak penawaran ini
                            </option>
                          </select>
                          <label className="flex gap-2 text-sm">
                            <input type="checkbox" required />
                            Saya telah membaca versi penawaran ini dan
                            mengonfirmasi pilihan saya.
                          </label>
                        </ActionForm>
                      )}
                    </section>
                  ))}
                {initial.requests
                  .filter((r) => r.application_id === a.id)
                  .map((r) => (
                    <section
                      key={r.id}
                      className="space-y-3 rounded-lg bg-background p-4"
                    >
                      <h3 className="font-medium">
                        Dokumen tambahan: {r.label}
                      </h3>
                      <p className="text-sm">{r.instructions}</p>
                      {r.deadline && (
                        <p className="text-sm">
                          Batas:{" "}
                          {new Date(r.deadline).toLocaleDateString("id-ID", {
                            timeZone: "Asia/Jakarta",
                          })}
                        </p>
                      )}
                      <Upload />
                      <ActionForm
                        label={
                          r.document_id ? "Ganti dokumen" : "Kirim dokumen"
                        }
                        submit={(f) =>
                          candidateAction("document_response", r.id, null, {
                            documentId: text(f, "documentId"),
                          })
                        }
                      >
                        <select
                          aria-label="Dokumen tambahan"
                          name="documentId"
                          required
                          className={inputClass}
                          defaultValue={r.document_id ?? ""}
                        >
                          <option value="">Pilih dokumen siap</option>
                          {initial.documents
                            .filter(
                              (d) =>
                                d.category === "application" &&
                                d.scan_status === "clean",
                            )
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                        </select>
                      </ActionForm>
                    </section>
                  ))}
                {a.stage === "hired" && (
                  <div className="rounded-lg bg-accent p-5">
                    <h3 className="font-semibold">Selamat bergabung!</h3>
                    <p className="my-2 text-sm">
                      Lengkapi onboarding untuk mengaktifkan akses karyawan
                      Anda.
                    </p>
                    <a
                      href={`/api/recruitment/join?application=${a.id}`}
                      className="text-sm font-medium underline"
                    >
                      Lanjut ke KumaWorks →
                    </a>
                  </div>
                )}
                {![
                  "draft",
                  "hired",
                  "withdrawn",
                  "rejected",
                  "offer_declined",
                ].includes(a.stage) && (
                  <details>
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Tarik lamaran
                    </summary>
                    <ActionForm
                      label="Ya, tarik lamaran"
                      submit={() =>
                        candidateAction("withdraw", a.id, a.revision, {})
                      }
                    >
                      <p className="text-sm">
                        Perekrut perlu membuka kembali lamaran jika Anda ingin
                        melanjutkan nanti.
                      </p>
                    </ActionForm>
                  </details>
                )}
              </article>
            ))}
          {showApplications && !applications.length && (
            <div className="rounded-xl border bg-card p-8 text-center">
              <BriefcaseBusiness className="mx-auto mb-4 size-8 text-primary" />
              <p>
                Belum ada{" "}
                {activeTab === "interviews"
                  ? "jadwal wawancara"
                  : activeTab === "offers"
                    ? "penawaran"
                    : "lamaran"}
                .
              </p>
              <Link
                href="/jobs"
                className="mt-3 inline-block text-primary underline"
              >
                Cari lowongan
              </Link>
            </div>
          )}
          {c && activeTab === "verification" && (
            <details open className="rounded-3xl border bg-card p-6">
              <summary className="cursor-pointer font-semibold">
                Kuma Verified ·{" "}
                {c.verification_status === "verified"
                  ? "✓ Terverifikasi"
                  : (verificationLabels[c.verification_status] ??
                    c.verification_status)}
              </summary>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Opsional. Tim Kuma meninjau KTP/NIK Anda secara manual.
                  Perusahaan hanya melihat status verifikasi, bukan KTP atau
                  NIK. Status ini bukan pemeriksaan latar belakang atau validasi
                  database pemerintah.
                </p>
                {initial.verifications.map((v) => (
                  <p key={v.id} className="text-sm">
                    {verificationLabels[v.status] ?? v.status}:{" "}
                    {v.reason ?? "Menunggu peninjauan"}
                  </p>
                ))}
                {!initial.verificationAvailable && (
                  <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    Pendaftaran verifikasi belum tersedia. Anda tetap dapat
                    melamar tanpa Kuma Verified.
                  </p>
                )}
                {initial.verificationAvailable &&
                  c.verification_status !== "verified" &&
                  c.verification_status !== "pending" && (
                    <>
                      <Upload category="identity" />
                      <ActionForm
                        label="Ajukan verifikasi"
                        submit={(f) =>
                          candidateAction("verification_submit", null, null, {
                            nik: text(f, "nik"),
                            documentId: text(f, "documentId"),
                          })
                        }
                      >
                        <Field label="NIK (16 angka)">
                          <input
                            name="nik"
                            required
                            inputMode="numeric"
                            pattern="[0-9]{16}"
                            autoComplete="off"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Dokumen KTP">
                          <select
                            name="documentId"
                            required
                            className={inputClass}
                          >
                            <option value="">Pilih dokumen siap</option>
                            {initial.documents
                              .filter(
                                (d) =>
                                  d.category === "identity" &&
                                  d.scan_status === "clean",
                              )
                              .map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                          </select>
                        </Field>
                        <label className="flex gap-2 text-sm">
                          <input type="checkbox" required />
                          Saya menyetujui peninjauan dokumen identitas oleh tim
                          Kuma.
                        </label>
                      </ActionForm>
                    </>
                  )}
              </div>
            </details>
          )}
          {c && activeTab === "help" && (
            <details open className="rounded-3xl border bg-card p-6">
              <summary className="cursor-pointer font-semibold">
                Bantuan, koreksi, dan privasi
              </summary>
              <div className="mt-4">
                <ActionForm
                  label="Kirim permintaan"
                  submit={(f) =>
                    candidateAction("request", null, null, {
                      kind: text(f, "kind"),
                      jobId: report ?? null,
                      message: text(f, "message"),
                    })
                  }
                >
                  <select
                    name="kind"
                    aria-label="Jenis permintaan"
                    defaultValue={report ? "report_job" : "correction"}
                    className={inputClass}
                  >
                    <option value="correction">Koreksi data</option>
                    <option value="deletion">Hapus data kandidat</option>
                    <option value="report_job">Laporkan lowongan</option>
                  </select>
                  <textarea
                    required
                    minLength={10}
                    name="message"
                    aria-label="Detail permintaan"
                    placeholder="Jelaskan permintaan Anda"
                    className={inputClass}
                  />
                </ActionForm>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
