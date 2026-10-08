import { NextResponse } from "next/server";
import { documentAccess } from "@/lib/recruitment/document-access";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return NextResponse.redirect(await documentAccess(id), {
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return new NextResponse("Document unavailable", { status: 404 });
  }
}
