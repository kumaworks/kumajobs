import { jsPDF } from "jspdf";
import { candidateSession, recruitmentDb } from "@/lib/recruitment/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await candidateSession(),
      { id } = await params,
      db = recruitmentDb();
    const { data: o } = await db
      .from("recruitment_offers")
      .select("*")
      .eq("id", id)
      .in("status", [
        "sent",
        "accepted",
        "declined",
        "expired",
        "withdrawn",
        "superseded",
      ])
      .single();
    if (!o || !session?.candidate) throw new Error();
    const { data: a } = await db
      .from("recruitment_applications")
      .select("id,input")
      .eq("id", o.application_id)
      .eq("candidate_id", session.candidate.id)
      .single();
    if (!a) throw new Error();
    const { data: s } = await db
      .from("recruitment_settings")
      .select("company_name")
      .eq("business_id", o.business_id)
      .single();
    const pdf = new jsPDF(),
      lines = [
        s?.company_name ?? "",
        `Penawaran pekerjaan - versi ${o.version}`,
        `Untuk: ${a.input.name}`,
        o.input.title,
        o.input.location,
        `${o.input.currency} ${o.input.salary} / ${o.input.payPeriod}`,
        ...(o.input.components ?? []).map(
          (c: { label: string; amount: number }) =>
            `${c.label}: ${o.input.currency} ${c.amount}`,
        ),
        `Tanggal mulai: ${o.input.joinDate}`,
        `Berlaku sampai: ${o.input.expiresAt}`,
        "",
        o.input.terms,
        "",
        `Status: ${o.status}`,
        `Referensi: ${o.id}`,
      ];
    pdf.setFontSize(11);
    let y = 20;
    for (const paragraph of lines) {
      for (const line of pdf.splitTextToSize(
        String(paragraph),
        170,
      ) as string[]) {
        if (y > 275) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 20, y);
        y += 6;
      }
      y += 3;
    }
    return new Response(pdf.output("arraybuffer"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="offer.pdf"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
