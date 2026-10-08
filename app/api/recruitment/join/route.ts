import { NextResponse } from "next/server";
import {
  candidateSession,
  recruitmentDb,
  rateLimit,
} from "@/lib/recruitment/server";
export async function GET(request: Request) {
  try {
    const session = (await candidateSession())!,
      db = recruitmentDb(),
      appId = new URL(request.url).searchParams.get("application");
    await rateLimit(`join:${session.user.id}`, 10, 600);
    const { data: a } = await db
      .from("recruitment_applications")
      .select("id")
      .eq("id", appId)
      .eq("candidate_id", session.candidate?.id)
      .eq("stage", "hired")
      .single();
    if (!a) throw new Error();
    const { data: h } = await db
      .from("recruitment_hires")
      .select("invitation_id")
      .eq("application_id", a.id)
      .single();
    if (!h) throw new Error();
    const origin = process.env.NEXT_PUBLIC_APP_URL;
    if (!origin) throw new Error("Employee app URL is not configured");
    const { data, error } = await db.auth.admin.generateLink({
      type: "magiclink",
      email: session.user.email!,
      options: { redirectTo: `${origin}/auth/recruitment` },
    });
    if (
      error ||
      data.user?.id !== session.user.id ||
      !data.properties?.hashed_token
    )
      throw new Error("Unable to create sign-in link");
    const url = new URL("/auth/recruitment", origin);
    url.searchParams.set("token_hash", data.properties.hashed_token);
    url.searchParams.set("invitation", h.invitation_id);
    return NextResponse.redirect(url, {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return new Response(
      "Unable to open onboarding. Sign in again or contact your recruiter.",
      { status: 400 },
    );
  }
}
