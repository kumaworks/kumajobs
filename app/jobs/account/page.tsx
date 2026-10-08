import { redirect } from "next/navigation";
import { candidateSession, candidateData } from "@/lib/recruitment/server";
import { CandidateAccount } from "@/components/recruitment/candidate-account";
export const metadata = {
  title: "Ruang karier — KumaWorks Jobs",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; tab?: string }>;
}) {
  const p = await searchParams;
  if (!(await candidateSession(false))) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)),
    );
    redirect(
      `/jobs/login?next=${encodeURIComponent(`/jobs/account?${query}`)}`,
    );
  }
  return (
    <CandidateAccount
      initial={await candidateData()}
      report={p.report}
      tab={p.tab}
    />
  );
}
