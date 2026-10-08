import {
  applicationSchema,
  formSchema,
  jobSchema,
  normalizePhone,
  publicJob,
  redactApplication,
  safeCandidateReturn,
  validateApplication,
  identifyFile,
  type Job,
} from "./domain";
const input = jobSchema.parse({
  title: "Supervisor",
  description: "Lead the operations team daily.",
  location: "Jakarta",
  employmentType: "permanent",
  workMode: "onsite",
  headcount: 1,
  salaryMin: 123456,
  salaryMax: 987654,
  showSalary: false,
  deadline: null,
  form: {},
});
test("public projection never serializes hidden salary or internal hiring metadata", () => {
  const row = {
    id: "job",
    slug: "job",
    business_id: "business",
    state: "published",
    revision: 1,
    published_version: 1,
    input: { ...input, recruiterId: "00000000-0000-0000-0000-000000000001" },
    created_at: "2026-01-01",
  } as Job;
  const out = JSON.stringify(
    publicJob(row, { name: "Kuma", slug: "kuma" }, true),
  );
  expect(out).not.toContain("123456");
  expect(out).not.toContain("987654");
  expect(out).not.toContain("recruiterId");
  expect(out).not.toContain("salaryMin");
  expect(
    publicJob(
      { ...row, input: { ...input, showSalary: true } },
      { name: "Kuma", slug: "kuma" },
      true,
    ).salary?.min,
  ).toBe(123456);
});
test("phone normalization handles Indonesian prefixes without marking verification", () => {
  expect(normalizePhone("0812 3456 789")).toBe("+628123456789");
  expect(normalizePhone("628123456789")).toBe("+628123456789");
  expect(() => normalizePhone("123")).toThrow();
});
test("required custom fields, consent, salary, availability and CV are enforced", () => {
  const form = formSchema.parse({
    cv: "required",
    expectedSalary: "required",
    fields: [
      { id: "letter", label: "Cover letter", type: "textarea", required: true },
    ],
  });
  const app = applicationSchema.parse({
    name: "Rina",
    phone: "08123456789",
    privacyConsent: true,
    answers: {},
    documents: {},
  });
  expect(() => validateApplication(form, app)).toThrow();
  expect(() =>
    validateApplication(form, {
      ...app,
      availability: "specific_date",
      availableDate: "",
      expectedSalary: 1,
    }),
  ).toThrow();
  expect(() =>
    validateApplication(form, {
      ...app,
      availability: "immediately",
      expectedSalary: 1,
      documents: { cv: "00000000-0000-0000-0000-000000000001" },
      answers: { letter: "My experience" },
    }),
  ).not.toThrow();
  expect(() =>
    validateApplication(form, { ...app, privacyConsent: false }),
  ).toThrow(/Persetujuan/);
});
test("disabled salary fields and unknown answers are discarded", () => {
  const app = applicationSchema.parse({
    name: "Rina",
    phone: "08123456789",
    privacyConsent: true,
    lastSalary: 999,
    answers: { injected: "value" },
  });
  const out = validateApplication(
    formSchema.parse({ cv: "off", availability: false, lastSalary: "off" }),
    app,
  );
  expect(out.lastSalary).toBeUndefined();
  expect(out.answers).toEqual({});
});
test("choice validation rejects invented options", () => {
  const f = formSchema.parse({
    cv: "off",
    availability: false,
    fields: [{ id: "choice", label: "Pick", type: "select", options: ["One"] }],
  });
  const a = applicationSchema.parse({
    name: "Rina",
    phone: "08123456789",
    privacyConsent: true,
    answers: { choice: "Injected" },
  });
  expect(() => validateApplication(f, a)).toThrow(/pilihan/);
});
test("salary redaction preserves the submitted original", () => {
  const input = { expectedSalary: 1, lastSalary: 2, name: "Rina" };
  expect(redactApplication(input, false)).toEqual({ name: "Rina" });
  expect(input.lastSalary).toBe(2);
});
test("candidate redirects reject external destinations and employer routes", () => {
  for (const path of [
    "https://evil.invalid",
    "//evil.invalid",
    "/dashboard",
    "/jobs/../dashboard",
    "/jobs/\\evil",
  ])
    expect(safeCandidateReturn(path)).toBe("/jobs/account");
  expect(safeCandidateReturn("/jobs/a-b")).toBe("/jobs/a-b");
});
test("uploads use signatures in addition to file extensions", () => {
  expect(
    identifyFile(new Uint8Array([37, 80, 68, 70, 45]), "cv.pdf").mime,
  ).toBe("application/pdf");
  expect(() =>
    identifyFile(new Uint8Array([60, 115, 99, 114]), "cv.pdf"),
  ).toThrow();
  expect(() =>
    identifyFile(new Uint8Array([37, 80, 68, 70, 45]), "cv.exe"),
  ).toThrow();
});
