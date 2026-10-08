import { candidateSession, recruitmentDb } from "@/lib/recruitment/server";
import { interviewCalendar } from "@/lib/recruitment/calendar";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await candidateSession(),
      { id } = await params,
      db = recruitmentDb();
    const { data: i } = await db
      .from("recruitment_interviews")
      .select("id,application_id,revision,input,status")
      .eq("id", id)
      .single();
    if (!i || !session?.candidate) throw new Error();
    const { data: a } = await db
      .from("recruitment_applications")
      .select("id")
      .eq("id", i.application_id)
      .eq("candidate_id", session.candidate.id)
      .single();
    if (!a) throw new Error();
    return new Response(
      interviewCalendar(i.id, i.revision, i.input, i.status === "cancelled"),
      {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'attachment; filename="interview.ics"',
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
