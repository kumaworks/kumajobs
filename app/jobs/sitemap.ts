import type { MetadataRoute } from "next";
import { getPublicJobs } from "@/lib/recruitment/server";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_JOBS_URL ?? "https://jobs.kumaworks.id";
  const jobs = [];
  for (let page = 0; page < 1000; page++) {
    const batch = await getPublicJobs({ page });
    jobs.push(...batch);
    if (batch.length < 50) break;
  }
  return jobs.map((j) => ({
    url: `${base}/jobs/${j.slug}`,
    lastModified: j.createdAt,
  }));
}
