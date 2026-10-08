import {
  JobDiscovery,
  type JobFilters,
} from "@/components/recruitment/job-discovery";
import { getPublicJobs } from "@/lib/recruitment/server";
export const dynamic = "force-dynamic";
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<JobFilters>;
}) {
  const p = await searchParams;
  const jobs = await getPublicJobs({
    query: p.q,
    location: p.location,
    company: p.company,
    employment: p.employment,
    mode: p.mode,
    page: Math.max(0, Math.min(10000, Math.floor(Number(p.page)) || 0)),
  });
  return <JobDiscovery jobs={jobs} filters={p} />;
}
