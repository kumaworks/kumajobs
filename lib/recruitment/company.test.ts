import { createClient } from "@supabase/supabase-js";
import { companyHref, normalizeCompanyCode } from "./company-url";
import { getPublicJobs, publicCompany } from "./server";

jest.mock("server-only", () => ({}));
jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("./preview", () => ({ isPreview: () => false }));

const originalEnv = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid",
    SUPABASE_SERVICE_ROLE_KEY: "test-only",
  };
});
afterEach(() => {
  process.env = originalEnv;
});

test("custom company codes support uppercase links and preserve reserved legacy routes", () => {
  expect(normalizeCompanyCode("PTKAGO")).toBe("ptkago");
  expect(companyHref("PTKAGO")).toBe("/ptkago");
  expect(companyHref("my-company-42")).toBe("/my-company-42");
  expect(companyHref("jobs")).toBe("/jobs/company/jobs");
  expect(companyHref("api")).toBe("/jobs/company/api");
  for (const code of [
    "",
    "../jobs",
    "a/b",
    "%",
    "a_b",
    "a--b",
    "x".repeat(101),
  ])
    expect(normalizeCompanyCode(code)).toBeNull();
});

test("company lookup normalizes the code and requires enabled public intake", async () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  const from = jest.fn().mockReturnValue(query);
  jest.mocked(createClient).mockReturnValue({ from } as never);
  expect(await publicCompany("PTKAGO")).toBeNull();
  expect(from).toHaveBeenCalledWith("recruitment_settings");
  expect(query.eq.mock.calls).toEqual([
    ["slug", "ptkago"],
    ["enabled", true],
    ["public_enabled", true],
  ]);
  expect(await publicCompany("%invalid%")).toBeNull();
  expect(from).toHaveBeenCalledTimes(1);
});

test("company listings only query accepting public jobs for the selected company", async () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
  const from = jest.fn().mockReturnValue(query);
  jest.mocked(createClient).mockReturnValue({ from } as never);
  expect(await getPublicJobs({ company: "ptkago", page: 1 })).toEqual([]);
  expect(from).toHaveBeenCalledWith("recruitment_public_vacancies");
  expect(query.eq.mock.calls).toEqual([
    ["accepting", true],
    ["published->>visibility", "public"],
    ["company_slug", "ptkago"],
  ]);
  expect(query.range).toHaveBeenCalledWith(50, 99);
});
