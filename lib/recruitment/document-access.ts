import "server-only";
import { candidateSession, recruitmentDb } from "./server";
export async function documentAccess(id: string) {
  const session = await candidateSession();
  if (!session?.candidate) throw new Error("Document unavailable");
  const db = recruitmentDb();
  const { data: doc } = await db
    .from("recruitment_documents")
    .select("id,object_path,extension,name")
    .eq("id", id)
    .eq("candidate_id", session.candidate.id)
    .eq("category", "application")
    .eq("scan_status", "clean")
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) throw new Error("Document unavailable");
  const { error: auditError } = await db.from("recruitment_events").insert({
    actor_id: session.user.id,
    kind: "document_access",
    detail: { documentId: doc.id },
  });
  if (auditError) throw new Error("Document unavailable");
  const { data, error } = await db.storage
    .from("recruitment-private")
    .createSignedUrl(doc.object_path, 60, {
      download: doc.extension === "docx" ? doc.name : false,
    });
  if (error || !data) throw new Error("Document unavailable");
  return data.signedUrl;
}
