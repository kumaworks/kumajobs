"use client";
import { Check, CheckCircle2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { candidateAction } from "@/app/jobs/actions";
import { LoginForm } from "./login-form";
import { ActionForm, Field, inputClass, buttonClass } from "./forms";
import {
  availability,
  availabilityLabels,
  type ApplicationInput,
  type PublicJob,
} from "@/lib/recruitment/domain";
import {
  ApplicationDocument,
  matchesDocumentFormat,
  type CandidateDocument,
  type DocumentRequirement,
} from "./application-document";
export { LoginForm };
export function ApplyForm({
  job,
  signedIn,
  profile,
  existing,
  documents = [],
  preview = false,
}: {
  preview?: boolean;
  job: PublicJob;
  signedIn: boolean;
  profile?: { name: string; phone: string } | null;
  existing?: { input: ApplicationInput; stage: string } | null;
  documents?: CandidateDocument[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0),
    [values, setValues] = useState<ApplicationInput>(
      existing?.input ?? {
        name: profile?.name ?? "",
        phone: profile?.phone ?? "",
        answers: {},
        documents: {},
        futureConsent: false,
        privacyConsent: false,
      },
    ),
    [saved, setSaved] = useState(""),
    [submitted, setSubmitted] = useState(false),
    [profileReady, setProfileReady] = useState(Boolean(profile));
  const existingStage = existing?.stage;
  const [uploadedDocuments, setUploadedDocuments] = useState<
    CandidateDocument[]
  >([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const allDocuments = [
    ...documents,
    ...uploadedDocuments.filter(
      (uploaded) => !documents.some((document) => document.id === uploaded.id),
    ),
  ];
  const documentRequirements: DocumentRequirement[] = [
    ...(job.form.cv !== "off"
      ? [
          {
            id: "cv",
            label: "CV",
            required: job.form.cv === "required",
            instructions: "",
            formats: ["pdf", "docx", "jpg", "png"],
          },
        ]
      : []),
    ...job.form.documents,
  ];
  const [manualCvSelection, setManualCvSelection] = useState(false);
  const latestCvId =
    job.form.cv === "off"
      ? undefined
      : allDocuments
          .filter(
            (document) =>
              ["clean", "pending"].includes(document.scan_status) &&
              matchesDocumentFormat(document, ["pdf", "docx", "jpg", "png"]),
          )
          .sort(
            (a, b) =>
              (Date.parse(b.created_at ?? "") || 0) -
              (Date.parse(a.created_at ?? "") || 0),
          )[0]?.id;
  useEffect(() => {
    if (step !== 1 || manualCvSelection || !latestCvId) return;
    setValues((current) =>
      current.documents.cv === latestCvId
        ? current
        : {
            ...current,
            documents: { ...current.documents, cv: latestCvId },
          },
    );
  }, [step, manualCvSelection, latestCvId]);
  const uploadingDocument = Object.values(uploading).some(Boolean);
  const incompleteDocuments = documentRequirements.filter((requirement) => {
    const id = values.documents[requirement.id];
    if (!id) return requirement.required;
    const document = allDocuments.find((item) => item.id === id);
    return (
      !document ||
      !["clean", "pending"].includes(document.scan_status) ||
      !matchesDocumentFormat(document, requirement.formats)
    );
  });
  const pendingSelectedDocuments = documentRequirements.filter(
    (requirement) =>
      allDocuments.find(
        (document) => document.id === values.documents[requirement.id],
      )?.scan_status === "pending",
  );
  const hasPendingDocuments = allDocuments.some(
    (document) => document.scan_status === "pending",
  );
  useEffect(() => {
    if (
      preview ||
      !signedIn ||
      submitted ||
      !hasPendingDocuments ||
      step === 0 ||
      (existingStage && existingStage !== "draft")
    )
      return;
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [
    preview,
    signedIn,
    submitted,
    hasPendingDocuments,
    step,
    router,
    existingStage,
  ]);
  const selectDocument = (field: string, id: string) => {
    if (field === "cv") setManualCvSelection(true);
    setValues((current) => ({
      ...current,
      documents: Object.fromEntries(
        Object.entries({ ...current.documents, [field]: id }).filter(
          ([, value]) => value,
        ),
      ),
    }));
  };
  const payload = JSON.stringify(values);

  useEffect(() => {
    if (
      preview ||
      !signedIn ||
      !profileReady ||
      submitted ||
      !values.name ||
      !values.phone ||
      (existingStage && existingStage !== "draft")
    )
      return;
    const timer = setTimeout(() => {
      void candidateAction("draft", job.id, job.version, JSON.parse(payload))
        .then((r) => setSaved(r.error ?? "Draf tersimpan"))
        .catch(() => setSaved("Draf belum tersimpan. Periksa koneksi Anda."));
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    preview,
    payload,
    signedIn,
    profileReady,
    job.id,
    job.version,
    submitted,
    existingStage,
    values.name,
    values.phone,
  ]);
  const update = <K extends keyof ApplicationInput>(
    key: K,
    value: ApplicationInput[K],
  ) => setValues({ ...values, [key]: value });
  if (submitted || (existing && existing.stage !== "draft"))
    return (
      <div className="space-y-4 rounded-3xl border border-primary/30 bg-card p-8">
        <CheckCircle2 className="size-10 text-primary" />
        <h2 className="text-xl font-semibold">Lamaran telah dikirim.</h2>
        <p className="text-sm text-muted-foreground">
          Ikuti kabar dari perekrut, jadwal wawancara, dan penawaran di akun
          Anda.
        </p>
        <Link className="text-primary underline" href="/jobs/account">
          Lihat status lamaran
        </Link>
      </div>
    );
  return (
    <section className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
          Langkah {step + 1} dari 4
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {
            [
              "Mulai cerita Anda",
              "Lengkapi dokumen lamaran",
              "Kenalkan potensi Anda",
              "Siap mengambil langkah?",
            ][step]
          }
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {job.title} · {job.company}
        </p>
      </div>
      <ol
        aria-label="Progres lamaran"
        className="grid grid-cols-4 gap-2 text-xs"
      >
        {["Kontak", "CV & profil", "Pertanyaan", "Tinjau & kirim"].map(
          (v, i) => (
            <li
              key={v}
              aria-current={step === i ? "step" : undefined}
              className={`border-t-2 pt-3 ${step >= i ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
            >
              <span className="mb-2 flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {step > i ? <Check className="size-3" /> : i + 1}
              </span>
              {v}
            </li>
          ),
        )}
      </ol>
      {step === 0 && (
        <div className="space-y-4">
          <Field label="Nama lengkap">
            <input
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              autoComplete="name"
              className={inputClass}
            />
          </Field>
          <Field label="Nomor telepon">
            <input
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+62…"
              autoComplete="tel"
              className={inputClass}
            />
          </Field>
          {!signedIn ? (
            <LoginForm next={`/jobs/${job.slug}`} />
          ) : (
            <ActionForm
              label="Simpan profil dan lanjutkan"
              submit={async () => {
                if (preview) {
                  setProfileReady(true);
                  setStep(1);
                  return {
                    data: {
                      message: "Pratinjau formulir. Tidak ada data disimpan.",
                    },
                  };
                }
                const r = await candidateAction("profile", null, null, {
                  name: values.name,
                  phone: values.phone,
                });
                if (r.data) {
                  setProfileReady(true);
                  setStep(1);
                }
                return r;
              }}
            />
          )}
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {documentRequirements.length
              ? job.form.cv !== "off"
                ? "File terbaru dipilih otomatis untuk CV. Anda bisa menggantinya jika perlu."
                : "Unggah file pada bagian yang sesuai."
              : "Tidak ada dokumen yang diminta. Silakan lanjutkan."}
          </p>
          {documentRequirements.map((requirement) => (
            <ApplicationDocument
              key={requirement.id}
              requirement={requirement}
              selectedId={values.documents[requirement.id]}
              documents={allDocuments}
              busy={Boolean(uploading[requirement.id])}
              onSelect={(id) => selectDocument(requirement.id, id)}
              onBusyChange={(busy) =>
                setUploading((current) => ({
                  ...current,
                  [requirement.id]: busy,
                }))
              }
              onUploaded={(id, name) => {
                setUploadedDocuments((current) => [
                  ...current,
                  {
                    id,
                    name,
                    scan_status: "pending",
                    created_at: new Date().toISOString(),
                  },
                ]);
                selectDocument(requirement.id, id);
              }}
            />
          ))}
          {incompleteDocuments.length > 0 && (
            <p
              id="document-next-help"
              className="text-sm text-muted-foreground"
            >
              Lengkapi dokumen berikut untuk melanjutkan:{" "}
              {incompleteDocuments
                .map((requirement) => requirement.label)
                .join(", ")}
              .
            </p>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          {job.form.availability && (
            <>
              <Field label="Kapan Anda dapat mulai bekerja? *">
                <select
                  value={values.availability ?? ""}
                  onChange={(e) =>
                    update(
                      "availability",
                      e.target.value as ApplicationInput["availability"],
                    )
                  }
                  className={inputClass}
                >
                  <option value="">Pilih waktu</option>
                  {availability.map((v) => (
                    <option key={v} value={v}>
                      {availabilityLabels[v]}
                    </option>
                  ))}
                </select>
              </Field>
              {values.availability === "specific_date" && (
                <Field label="Tanggal mulai">
                  <input
                    type="date"
                    value={values.availableDate ?? ""}
                    onChange={(e) => update("availableDate", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}
            </>
          )}
          {(
            [
              ["expectedSalary", "Gaji yang diharapkan"],
              ["lastSalary", "Gaji terakhir"],
            ] as const
          )
            .filter(([key]) => job.form[key] !== "off")
            .map(([key, label]) => (
              <Field
                key={key}
                label={`${label} (${job.form[key] === "required" ? "wajib" : "opsional"})`}
              >
                <input
                  type="number"
                  min="0"
                  value={values[key] ?? ""}
                  onChange={(e) =>
                    update(key, e.target.value ? Number(e.target.value) : null)
                  }
                  className={inputClass}
                />
              </Field>
            ))}
          {job.form.fields.map((f) => (
            <Field key={f.id} label={`${f.label}${f.required ? " *" : ""}`}>
              {f.type === "textarea" ? (
                <textarea
                  rows={5}
                  value={String(values.answers[f.id] ?? "")}
                  onChange={(e) =>
                    update("answers", {
                      ...values.answers,
                      [f.id]: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              ) : f.type === "select" || f.type === "multiselect" ? (
                <select
                  multiple={f.type === "multiselect"}
                  value={
                    f.type === "multiselect"
                      ? ((values.answers[f.id] as string[]) ?? [])
                      : String(values.answers[f.id] ?? "")
                  }
                  onChange={(e) =>
                    update("answers", {
                      ...values.answers,
                      [f.id]:
                        f.type === "multiselect"
                          ? Array.from(e.target.selectedOptions).map(
                              (o) => o.value,
                            )
                          : e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  {f.type === "select" && <option value="">Pilih</option>}
                  {f.options.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={values.answers[f.id] === true}
                  onChange={(e) =>
                    update("answers", {
                      ...values.answers,
                      [f.id]: e.target.checked,
                    })
                  }
                  className="h-5 w-5"
                />
              ) : (
                <input
                  type={f.type === "text" ? "text" : f.type}
                  value={String(values.answers[f.id] ?? "")}
                  onChange={(e) =>
                    update("answers", {
                      ...values.answers,
                      [f.id]:
                        f.type === "number" && e.target.value
                          ? Number(e.target.value)
                          : e.target.value,
                    })
                  }
                  className={inputClass}
                />
              )}
            </Field>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tinjau lamaran Anda</h2>
          <p>
            {values.name} · {values.phone}
          </p>
          <p className="text-sm">
            {Object.keys(values.documents).length} dokumen dipilih · {job.title}{" "}
            di {job.company}
          </p>
          <dl className="space-y-3 rounded-2xl bg-background p-4 text-sm">
            {values.availability && (
              <div>
                <dt className="text-xs text-muted-foreground">
                  Ketersediaan mulai bekerja
                </dt>
                <dd className="mt-1">
                  {availabilityLabels[values.availability]}{" "}
                  {values.availableDate}
                </dd>
              </div>
            )}
            {(
              [
                ["expectedSalary", "Gaji yang diharapkan"],
                ["lastSalary", "Gaji terakhir"],
              ] as const
            )
              .filter(([key]) => job.form[key] !== "off" && values[key] != null)
              .map(([key, label]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1">
                    IDR {values[key]?.toLocaleString("id-ID")}
                  </dd>
                </div>
              ))}
            {Object.entries(values.documents).map(([key, id]) => (
              <div key={key}>
                <dt className="text-xs text-muted-foreground">
                  {key === "cv"
                    ? "CV"
                    : job.form.documents.find((d) => d.id === key)?.label}
                </dt>
                <dd className="mt-1">
                  {allDocuments.find((d) => d.id === id)?.name ??
                    "Dokumen dipilih"}
                </dd>
              </div>
            ))}
            {job.form.fields.map((f) => (
              <div key={f.id}>
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {Array.isArray(values.answers[f.id])
                    ? (values.answers[f.id] as string[]).join(", ")
                    : typeof values.answers[f.id] === "boolean"
                      ? values.answers[f.id]
                        ? "Ya"
                        : "Tidak"
                      : String(values.answers[f.id] || "Belum diisi")}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted-foreground">
            Informasi dan dokumen pada lamaran ini dibagikan dengan{" "}
            {job.company}. Perubahan profil berikutnya tidak mengubah lamaran
            yang sudah dikirim.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.privacyConsent}
              onChange={(e) => update("privacyConsent", e.target.checked)}
            />
            Saya menyetujui penggunaan data lamaran untuk proses rekrutmen ini.
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.futureConsent}
              onChange={(e) => update("futureConsent", e.target.checked)}
            />
            Saya bersedia dihubungi untuk peluang berikutnya (opsional).
          </label>
          {(pendingSelectedDocuments.length > 0 ||
            incompleteDocuments.length > 0) && (
            <div role="status" className="rounded-xl border p-3 text-sm">
              <p>
                {incompleteDocuments.length > 0
                  ? "Ada dokumen yang belum lengkap atau tidak dapat digunakan. Periksa kembali dokumen Anda."
                  : `Menunggu pemeriksaan: ${pendingSelectedDocuments.map((requirement) => requirement.label).join(", ")}. Tombol kirim akan aktif otomatis setelah pemeriksaan selesai.`}
              </p>
              <button
                type="button"
                className="mt-2 underline"
                onClick={() => setStep(1)}
              >
                Lihat dokumen
              </button>
            </div>
          )}
          <ActionForm
            label="Kirim lamaran"
            disabled={
              uploadingDocument ||
              incompleteDocuments.length > 0 ||
              pendingSelectedDocuments.length > 0
            }
            submit={async () => {
              const r = await candidateAction(
                "submit",
                job.id,
                job.version,
                values,
              );
              if (r.data) setSubmitted(true);
              return r;
            }}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        {step > 0 && (
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm"
            disabled={uploadingDocument}
            onClick={() => setStep(step - 1)}
          >
            Kembali
          </button>
        )}
        {step > 0 && step < 3 && (
          <button
            type="button"
            className={buttonClass}
            disabled={
              step === 1 &&
              (uploadingDocument || incompleteDocuments.length > 0)
            }
            aria-describedby={
              step === 1 && incompleteDocuments.length > 0
                ? "document-next-help"
                : undefined
            }
            onClick={() => setStep(step + 1)}
          >
            Lanjutkan
          </button>
        )}
        <p className="text-xs text-muted-foreground" role="status">
          {saved}
        </p>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <LockKeyhole className="size-3.5 shrink-0" />
        {preview
          ? "Pratinjau formulir · Data tidak disimpan."
          : signedIn
            ? "Draf tersimpan otomatis setelah profil dilengkapi."
            : "Verifikasi email untuk menyimpan draf dan mengunggah dokumen."}
      </p>
    </section>
  );
}
