import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/jobs/account", "/jobs/login", "/jobs/auth/", "/api/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_JOBS_URL ?? "https://jobs.kumaworks.id"}/jobs/sitemap.xml`,
  };
}
