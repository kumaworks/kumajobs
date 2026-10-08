import { isPreview } from "@/lib/recruitment/preview";
import { cookies } from "next/headers";
import {
  PortalShell,
  type PortalTheme,
} from "@/components/recruitment/portal-shell";
import { candidateSession } from "@/lib/recruitment/server";
export default async function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cookieStore, session] = await Promise.all([
    cookies(),
    candidateSession(false),
  ]);
  const preference = cookieStore.get("kuma_jobs_theme")?.value;
  const theme: PortalTheme =
    preference === "dark" || preference === "light" ? preference : "system";
  return (
    <PortalShell initialTheme={theme} signedIn={Boolean(session)}>
      {isPreview() && (
        <div className="mb-6 rounded-xl border border-primary/20 bg-accent px-4 py-3 text-center text-xs font-medium text-accent-foreground">
          Pratinjau · Data contoh · Tidak terhubung ke data kandidat atau
          lowongan nyata
        </div>
      )}
      {children}
    </PortalShell>
  );
}
