"use client";
import { Check, CheckCircle2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { candidateAction } from "@/app/jobs/actions";
import { LoginForm } from "./login-form";
import { ActionForm, Field, inputClass, buttonClass, Upload } from "./forms";
import {
  availability,
  availabilityLabels,
  type ApplicationInput,
  type PublicJob,
} from "@/lib/recruitment/domain";
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
  documents?: { id: string; name: string; scan_status: string }[];
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
  const payload = JSON.stringify(values);
  const existingStage = existing?.stage;
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
              "Profil yang berbicara",
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
            Dokumen baru diperiksa sebelum dapat digunakan. Pilih dokumen yang
            sudah siap dari pustaka Anda.
          </p>
          <Upload />
          {[
            ...(job.form.cv !== "off"
              ? [
                  {
                    id: "cv",
                    label: "CV",
                    required: job.form.cv === "required",
                    instructions: "",
                  },
                ]
              : []),
            ...job.form.documents,
          ].map((d) => (
            <Field
              key={d.id}
              label={`${d.label}${d.required ? " *" : " (opsional)"}`}
            >
              <select
                value={values.documents[d.id] ?? ""}
                onChange={(e) =>
                  update(
                    "documents",
                    Object.fromEntries(
                      Object.entries({
                        ...values.documents,
                        [d.id]: e.target.value,
                      }).filter(([, v]) => v),
                    ),
                  )
                }
                className={inputClass}
              >
                <option value="">Pilih dokumen</option>
                {documents
                  .filter((doc) => doc.scan_status === "clean")
                  .map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
              </select>
              <span className="text-xs text-muted-foreground">
                {d.instructions}
              </span>
            </Field>
          ))}
          <button
            type="button"
            className="text-sm underline"
            onClick={() => router.refresh()}
          >
            Muat ulang status dokumen
          </button>
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
                  {documents.find((d) => d.id === id)?.name ??
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
          <ActionForm
            label="Kirim lamaran"
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
            onClick={() => setStep(step - 1)}
          >
            Kembali
          </button>
        )}
        {step > 0 && step < 3 && (
          <button
            type="button"
            className={buttonClass}
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
