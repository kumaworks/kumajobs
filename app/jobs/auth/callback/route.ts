import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeCandidateReturn } from "@/lib/recruitment/domain";
export async function GET(request: Request) {
  const url = new URL(request.url),
    client = await createClient(),
    code = url.searchParams.get("code");
  const token = url.searchParams.get("token_hash");
  const result = code
    ? await client.auth.exchangeCodeForSession(code)
    : token
      ? await client.auth.verifyOtp({ token_hash: token, type: "email" })
      : { error: new Error("Invalid link") };
  return NextResponse.redirect(
    new URL(
      result.error
        ? "/jobs/login?error=expired"
        : safeCandidateReturn(url.searchParams.get("next")),
      url.origin,
    ),
  );
}
