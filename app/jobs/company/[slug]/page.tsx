import { notFound, redirect } from "next/navigation";
import {
  CompanyLanding,
  companyMetadata,
  companyPageNumber,
} from "@/components/recruitment/company-landing";
import { companyHref } from "@/lib/recruitment/company-url";
import { publicCompany } from "@/lib/recruitment/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props) {
  return companyMetadata((await params).slug);
}

export default async function CompanyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = companyPageNumber((await searchParams).page);
  const company = await publicCompany(slug);
  if (!company) notFound();
  const href = companyHref(company.slug);
  if (!href.startsWith("/jobs/company/"))
    redirect(`${href}${page ? `?page=${page}` : ""}`);
  return <CompanyLanding code={company.slug} page={page} />;
}
