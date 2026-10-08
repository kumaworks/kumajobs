"use client";
import { UploadCloud, LoaderCircle } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MAX_FILE_BYTES, type Result } from "@/lib/recruitment/domain";
import { prepareCandidateUpload } from "@/app/jobs/actions";
export const inputClass =
  "w-full min-h-11 rounded-xl border bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50";
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
export function ActionForm({
  children,
  submit,
  label = "Save",
  onSuccess,
}: {
  children?: ReactNode;
  submit: (form: FormData) => Promise<Result>;
  label?: string;
  onSuccess?: (data: Record<string, unknown>) => void;
}) {
  const [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    [pending, start] = useTransition(),
    router = useRouter();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(async () => {
          try {
            const result = await submit(data);
            setError(Boolean(result.error));
            setMessage(
              result.error ??
                (typeof result.data?.message === "string"
                  ? result.data.message
                  : "Tersimpan."),
            );
            if (result.data) {
              onSuccess?.(result.data);
              router.refresh();
            }
          } catch (err) {
            setError(true);
            setMessage(err instanceof Error ? err.message : "Gagal menyimpan.");
          }
        });
      }}
    >
      {children}
      <button disabled={pending} className={buttonClass}>
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        {pending ? "Memproses…" : label}
      </button>
      {message && (
        <p
          role={error ? "alert" : "status"}
          className={
            error
              ? "rounded-xl border border-red-500/30 p-3 text-sm text-red-500"
              : "rounded-xl bg-accent p-3 text-sm text-accent-foreground"
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
export function Upload({
  category = "application",
  onUploaded,
}: {
  category?: "application" | "identity";
  onUploaded?: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [progress, setProgress] = useState(0),
    router = useRouter();
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-accent/30 p-5">
      <UploadCloud className="mb-3 size-6 text-primary" />
      <p className="mb-3 text-sm font-medium">Tambahkan dokumen Anda</p>
      <input
        type="file"
        aria-label="Unggah dokumen"
        accept={
          category === "identity"
            ? ".pdf,.jpg,.jpeg,.png"
            : ".pdf,.docx,.jpg,.jpeg,.png"
        }
        disabled={busy}
        className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary-foreground"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setMessage("");
          try {
            if (file.size === 0 || file.size > MAX_FILE_BYTES)
              throw new Error("Batas ukuran dokumen 10 MB.");
            setProgress(0);
            const result = await prepareCandidateUpload({
              name: file.name,
              bytes: file.size,
              category,
              header: Array.from(
                new Uint8Array(await file.slice(0, 16).arrayBuffer()),
              ),
            });
            if (result.error) setMessage(result.error);
            else if (result.data) {
              const target = result.data;
              await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", target.signedUrl);
                xhr.timeout = 120000;
                xhr.upload.onprogress = (event) => {
                  if (event.lengthComputable)
                    setProgress(Math.round((event.loaded / event.total) * 100));
                };
                xhr.onload = () =>
                  xhr.status >= 200 && xhr.status < 300
                    ? resolve()
                    : reject(new Error("Unggah gagal. Coba lagi."));
                xhr.onerror = () =>
                  reject(new Error("Koneksi terputus. Coba lagi."));
                xhr.ontimeout = () =>
                  reject(new Error("Unggah terlalu lama. Coba lagi."));
                const body = new FormData();
                body.append("cacheControl", "0");
                body.append("", file);
                xhr.send(body);
              });
              setMessage(
                `${target.name}: menunggu pemeriksaan keamanan. Muat ulang setelah pemeriksaan selesai.`,
              );
              onUploaded?.(target.id);
              router.refresh();
            }
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Unggah gagal. Coba lagi.",
            );
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && (
        <progress
          aria-label="Progres unggahan"
          value={progress}
          max={100}
          className="mt-2 w-full"
        />
      )}
      <p role="status" className="mt-2 text-xs text-muted-foreground">
        Maksimum 10 MB. {busy ? `Mengunggah… ${progress}%` : message}
      </p>
    </div>
  );
}
export const text = (f: FormData, key: string) => String(f.get(key) ?? "");
export const nullable = (f: FormData, key: string) => text(f, key) || null;
export const number = (f: FormData, key: string) =>
  text(f, key) ? Number(text(f, key)) : null;
export const dateTime = (f: FormData, key: string) =>
  text(f, key) ? new Date(text(f, key)).toISOString() : null;
