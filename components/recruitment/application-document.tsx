"use client";

import { CheckCircle2, FileText } from "lucide-react";
import { Upload } from "./forms";

export type CandidateDocument = {
  id: string;
  name: string;
  scan_status: string;
  created_at?: string;
};

export type DocumentRequirement = {
  id: string;
  label: string;
  required: boolean;
  instructions: string;
  formats: string[];
};

export function matchesDocumentFormat(
  document: CandidateDocument,
  formats: string[],
) {
  const extension = document.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/^jpeg$/, "jpg");
  return Boolean(extension && formats.includes(extension));
}

export function ApplicationDocument({
  requirement,
  selectedId,
  documents,
  busy,
  onSelect,
  onUploaded,
  onBusyChange,
}: {
  requirement: DocumentRequirement;
  selectedId?: string;
  documents: CandidateDocument[];
  busy: boolean;
  onSelect: (id: string) => void;
  onUploaded: (id: string, name: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const selected = documents.find((document) => document.id === selectedId);
  const ready =
    selected?.scan_status === "clean" &&
    matchesDocumentFormat(selected, requirement.formats);
  const pending = selected?.scan_status === "pending";
  const available = documents.filter(
    (document) =>
      document.id !== selectedId &&
      ["clean", "pending"].includes(document.scan_status) &&
      matchesDocumentFormat(document, requirement.formats),
  );

  return (
    <fieldset className="min-w-0 space-y-4 rounded-2xl border p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold">
        {requirement.label}{" "}
        <span className="font-normal text-muted-foreground">
          ({requirement.required ? "wajib" : "opsional"})
        </span>
      </legend>
      {requirement.instructions && (
        <p className="text-sm text-muted-foreground">
          {requirement.instructions}
        </p>
      )}
      {selectedId ? (
        <div className="rounded-xl bg-accent/40 p-3" role="status">
          <p className="flex items-start gap-2 text-sm font-medium">
            {ready ? (
              <CheckCircle2
                aria-hidden="true"
                className="size-5 shrink-0 text-primary"
              />
            ) : (
              <FileText aria-hidden="true" className="size-5 shrink-0" />
            )}
            <span className="min-w-0 break-words">
              {selected?.name ?? "File tidak tersedia"}
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {ready
              ? "Siap digunakan · Sudah terpasang pada lamaran ini."
              : pending
                ? "File terpilih. Lamaran dapat dikirim sekarang; file baru dapat dibuka setelah pemeriksaan keamanan selesai."
                : "File ini tidak dapat digunakan. Unggah file lain atau pilih file tersimpan."}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSelect("")}
            className="mt-2 min-h-9 text-sm underline disabled:opacity-50"
          >
            Lepas file
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {requirement.required
            ? `Unggah ${requirement.label} untuk melanjutkan.`
            : "Boleh dilewati jika tidak ada."}
        </p>
      )}
      <Upload
        compact
        label={`${selectedId ? "Ganti" : "Unggah"} ${requirement.label}`}
        formats={requirement.formats}
        onUploaded={onUploaded}
        onBusyChange={onBusyChange}
      />
      {available.length > 0 && (
        <details>
          <summary className="cursor-pointer py-2 text-sm font-medium text-primary underline">
            Gunakan file tersimpan ({available.length})
          </summary>
          <div className="mt-2 space-y-2">
            {available.map((document) => (
              <button
                key={document.id}
                type="button"
                disabled={busy}
                onClick={() => onSelect(document.id)}
                className="flex w-full items-start gap-2 rounded-xl border p-3 text-left text-sm hover:bg-accent/40 disabled:opacity-50"
              >
                <FileText aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0 break-words">
                  {document.name}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {document.scan_status === "clean"
                      ? "Siap digunakan"
                      : "Sedang diperiksa"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </details>
      )}
    </fieldset>
  );
}
