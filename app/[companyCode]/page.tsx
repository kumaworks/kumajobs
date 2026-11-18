import {
  CompanyLanding,
  companyMetadata,
  companyPageNumber,
} from "@/components/recruitment/company-landing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ companyCode: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props) {
  return companyMetadata((await params).companyCode);
}

export default async function CompanyPage({ params, searchParams }: Props) {
  const { companyCode } = await params;
  return (
    <CompanyLanding
      code={companyCode}
      page={companyPageNumber((await searchParams).page)}
    />
  );
}
