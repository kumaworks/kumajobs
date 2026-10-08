import "server-only";
import type { User } from "@supabase/supabase-js";
import { formSchema, type PublicJob } from "./domain";

// Development-only, visibly labeled, and all write actions fail closed.
export function isPreview() {
  return (
    process.env.PORTAL_PREVIEW === "1" && process.env.NODE_ENV !== "production"
  );
}
const candidateId = "10000000-0000-0000-0000-000000000001";
const businessId = "10000000-0000-0000-0000-000000000002";
const applicationId = "10000000-0000-0000-0000-000000000003";
export const previewJobs: PublicJob[] = [
  [
    "Product Designer",
    "Ruang Karya",
    "Jakarta",
    "hybrid",
    "permanent",
    "product-designer",
  ],
  [
    "Frontend Engineer",
    "Loka Digital",
    "Indonesia",
    "remote",
    "permanent",
    "frontend-engineer",
  ],
  [
    "People Operations",
    "Ruang Karya",
    "Bandung",
    "onsite",
    "permanent",
    "people-operations",
  ],
  [
    "Brand & Content Strategist",
    "Studio Sore",
    "Jakarta",
    "hybrid",
    "contract",
    "brand-content-strategist",
  ],
  [
    "Operations Supervisor",
    "Nusa Logistik",
    "Surabaya",
    "onsite",
    "permanent",
    "operations-supervisor",
  ],
  [
    "Marketing Intern",
    "Studio Sore",
    "Bandung",
    "hybrid",
    "internship",
    "marketing-intern",
  ],
].map(([title, company, location, workMode, employmentType, slug], index) => ({
  id: `20000000-0000-0000-0000-00000000000${index + 1}`,
  slug,
  businessId,
  company,
  companySlug: company.toLowerCase().replaceAll(" ", "-"),
  title,
  location,
  workMode,
  employmentType,
  description:
    "Kami mencari rekan yang ingin menciptakan pengalaman yang bermakna. Bekerja bersama tim yang terbuka terhadap ide, peduli pada kualitas, dan memberi ruang untuk terus belajar.",
  responsibilities:
    "Berkolaborasi dengan tim lintas fungsi.\nMengembangkan solusi yang membantu pelanggan dalam keseharian mereka.\nBerbagi pengetahuan dan berkontribusi pada pertumbuhan tim.",
  requirements:
    "Memiliki pengalaman yang relevan dengan posisi ini.\nNyaman berkomunikasi dan bekerja dalam tim.\nPunya rasa ingin tahu dan perhatian terhadap detail.",
  benefits:
    "Kesempatan belajar dan pengembangan karier.\nLingkungan kerja yang kolaboratif.\nDukungan kesehatan dan kesejahteraan.",
  salary:
    index === 2
      ? null
      : {
          min: 6000000 + index * 1000000,
          max: 9000000 + index * 1000000,
          currency: "IDR",
          period: "month",
        },
  deadline: "2099-12-31T16:59:00Z",
  createdAt: "2026-10-01T00:00:00Z",
  accepting: true,
  indexable: false,
  version: 1,
  form: formSchema.parse({
    cv: "optional",
    availability: true,
    expectedSalary: "optional",
    fields: [
      {
        id: "motivation",
        label: "Apa yang membuat Anda tertarik dengan posisi ini?",
        type: "textarea",
        required: false,
        options: [],
      },
    ],
  }),
}));
export const previewSession = {
  user: {
    id: candidateId,
    email: "rina@example.invalid",
    email_confirmed_at: "2026-10-01T00:00:00Z",
  } as User,
  candidate: {
    id: candidateId,
    user_id: candidateId,
    name: "Rina Pratama",
    email: "rina@example.invalid",
    phone: "+6281234567890",
    profile: {},
    verification_status: "not_submitted",
    verified_at: null,
  },
};
export function previewCandidateData() {
  return {
    session: previewSession,
    verificationAvailable: true,
    applications: [
      {
        id: applicationId,
        job_id: previewJobs[0].id,
        job_slug: previewJobs[0].slug,
        business_id: businessId,
        version: 1,
        revision: 1,
        stage: "offer",
        input: {
          name: "Rina Pratama",
          phone: "+6281234567890",
          documents: {},
          answers: {},
        },
        company: "Ruang Karya",
        snapshot: {
          title: "Product Designer",
          location: "Jakarta",
          description: previewJobs[0].description,
          form: previewJobs[0].form,
        },
        submitted_at: "2026-10-01T00:00:00Z",
        created_at: "2026-10-01T00:00:00Z",
        employee_id: null,
      },
    ],
    interviews: [
      {
        id: "30000000-0000-0000-0000-000000000001",
        application_id: applicationId,
        revision: 1,
        status: "scheduled",
        candidate_response: null,
        input: {
          title: "Kenalan dengan tim desain",
          startsAt: "2099-01-15T03:00:00Z",
          timezone: "Asia/Jakarta",
          duration: 45,
          location: "Kantor Ruang Karya, Jakarta",
          instructions:
            "Siapkan cerita tentang proyek yang paling Anda banggakan.",
        },
      },
    ],
    offers: [
      {
        id: "30000000-0000-0000-0000-000000000002",
        application_id: applicationId,
        version: 1,
        revision: 1,
        status: "sent",
        responded_at: null,
        input: {
          title: "Product Designer",
          location: "Jakarta",
          currency: "IDR",
          salary: 9000000,
          payPeriod: "month",
          employmentType: "permanent",
          joinDate: "2099-02-01",
          expiresAt: "2099-01-31T16:59:00Z",
          terms: "Kami menantikan kontribusi Anda bersama tim Ruang Karya.",
          components: [],
        },
      },
    ],
    events: [],
    requests: [],
    documents: [],
    verifications: [],
    hires: [],
    manualRecords: [],
  };
}
