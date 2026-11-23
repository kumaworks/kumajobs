import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  candidateAction,
  prepareCandidateUpload,
  requestCandidateLogin,
  verifyCandidateLogin,
} from "./actions";
import { formSchema } from "@/lib/recruitment/domain";
import {
  candidateSession,
  command,
  rateLimit,
  recruitmentDb,
  getPublicJobs,
} from "@/lib/recruitment/server";
import { isPreview } from "@/lib/recruitment/preview";
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/recruitment/preview", () => ({ isPreview: jest.fn() }));
jest.mock("@/lib/recruitment/server", () => ({
  candidateSession: jest.fn(),
  command: jest.fn(),
  rateLimit: jest.fn(),
  recruitmentDb: jest.fn(),
  getPublicJobs: jest.fn(),
}));
const offerId = "00000000-0000-0000-0000-000000000001";
beforeEach(() => {
  jest.clearAllMocks();
  (isPreview as jest.Mock).mockReturnValue(false);
  (candidateSession as jest.Mock).mockResolvedValue({
    user: { id: "authenticated-user" },
    candidate: { id: "owned-candidate" },
  });
  (command as jest.Mock).mockResolvedValue({ id: offerId });
  (rateLimit as jest.Mock).mockResolvedValue(undefined);
});
test("offer response uses verified actor, exact revision and no employer context", async () => {
  const result = await candidateAction("offer_response", offerId, 7, {
    response: "accepted",
    actor: "attacker",
    businessId: "other-employer",
  });
  expect(result.data).toEqual({ id: offerId });
  expect(command).toHaveBeenCalledWith(
    "authenticated-user",
    null,
    "offer_response",
    offerId,
    7,
    { response: "accepted" },
  );
});
test("missing candidate authentication never reaches the command RPC", async () => {
  (candidateSession as jest.Mock).mockRejectedValue(
    new Error("Verifikasi email untuk melanjutkan."),
  );
  expect(
    (
      await candidateAction("offer_response", offerId, 7, {
        response: "accepted",
      })
    ).error,
  ).toMatch(/Verifikasi/);
  expect(command).not.toHaveBeenCalled();
});
test("candidate transport cannot invoke employer hiring or restriction commands", async () => {
  for (const name of ["hire", "restriction", "job_publish", "offer_approve"]) {
    expect((await candidateAction(name, offerId, 1, {})).error).toBe(
      "Tindakan tidak tersedia.",
    );
  }
  expect(command).not.toHaveBeenCalled();
});
test("preview blocks authentication, uploads and mutations before any service access", async () => {
  (isPreview as jest.Mock).mockReturnValue(true);
  const results = await Promise.all([
    requestCandidateLogin("test@example.invalid", "/jobs/account"),
    verifyCandidateLogin("test@example.invalid", "123456", "/jobs/account"),
    prepareCandidateUpload({}),
    candidateAction("profile", null, null, {
      name: "Rina",
      phone: "+62812345678",
    }),
  ]);
  for (const result of results) expect(result.error).toMatch(/Mode pratinjau/);
  expect(candidateSession).not.toHaveBeenCalled();
  expect(command).not.toHaveBeenCalled();
  expect(rateLimit).not.toHaveBeenCalled();
  expect(createClient).not.toHaveBeenCalled();
});

const signInWithOtp = jest.fn();
const verifyOtp = jest.fn();
describe("candidate email OTP", () => {
  beforeEach(() => {
    (headers as jest.Mock).mockResolvedValue({ get: () => "192.0.2.1" });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signInWithOtp, verifyOtp },
    });
    signInWithOtp.mockResolvedValue({ error: null });
    verifyOtp.mockResolvedValue({
      data: { session: { user: { id: "candidate" } } },
      error: null,
    });
    (redirect as unknown as jest.Mock).mockImplementation((path) => {
      throw new Error(`REDIRECT:${path}`);
    });
  });
  test("requests a code for normalized email and keeps new account creation", async () => {
    const result = await requestCandidateLogin(
      " RINA@EXAMPLE.INVALID ",
      "/jobs/supervisor",
    );
    expect(result.data).toBeDefined();
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "rina@example.invalid",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: expect.stringContaining(
          "/jobs/auth/callback?next=%2Fjobs%2Fsupervisor",
        ),
      },
    });
    expect(rateLimit).toHaveBeenCalledTimes(2);
  });
  test("delivery failures do not claim a code was sent or expose account details", async () => {
    signInWithOtp.mockResolvedValue({
      error: { status: 400, message: "account is banned" },
    });
    const result = await requestCandidateLogin(
      "rina@example.invalid",
      "/jobs/account",
    );
    expect(result.data).toBeUndefined();
    expect(result.error).toMatch(/Tidak dapat mengirim kode/);
    expect(result.error).not.toMatch(/banned/);
  });
  test("provider throttling asks the candidate to wait", async () => {
    signInWithOtp.mockResolvedValue({ error: { status: 429 } });
    expect(
      (await requestCandidateLogin("rina@example.invalid", "/jobs/account"))
        .error,
    ).toMatch(/Tunggu/);
  });
  test.each(["12345", "1234567", "abcdef", "12 345", ""])(
    "rejects malformed code %s before service access",
    async (code) => {
      expect(
        (
          await verifyCandidateLogin(
            "rina@example.invalid",
            code,
            "/jobs/account",
          )
        ).error,
      ).toMatch(/6 digit/);
      expect(verifyOtp).not.toHaveBeenCalled();
      expect(rateLimit).not.toHaveBeenCalled();
    },
  );
  test("invalid email never reaches authentication", async () => {
    expect(
      (await requestCandidateLogin("invalid", "/jobs/account")).error,
    ).toMatch(/email/);
    expect(
      (await verifyCandidateLogin("invalid", "123456", "/jobs/account")).error,
    ).toMatch(/email/);
    expect(createClient).not.toHaveBeenCalled();
  });
  test.each([
    "/jobs/supervisor?apply=1",
    "https://evil.example",
    "//evil.example",
  ])(
    "verifies and redirects only to a safe candidate destination: %s",
    async (next) => {
      const destination = next.startsWith("/jobs/") ? next : "/jobs/account";
      await expect(
        verifyCandidateLogin(" RINA@EXAMPLE.INVALID ", " 012345 ", next),
      ).rejects.toThrow(`REDIRECT:${destination}`);
      expect(verifyOtp).toHaveBeenCalledWith({
        email: "rina@example.invalid",
        token: "012345",
        type: "email",
      });
      expect(rateLimit).toHaveBeenCalledWith(
        expect.stringMatching(/^auth-verify-email:[a-f0-9]{64}$/),
        5,
        300,
      );
      expect(rateLimit).toHaveBeenCalledWith(
        expect.stringMatching(/^auth-verify-ip:/),
        30,
        300,
      );
    },
  );
  test.each([
    { data: { session: null }, error: { message: "expired" } },
    { data: { session: null }, error: null },
  ])(
    "invalid, expired or sessionless verification cannot redirect",
    async (response) => {
      verifyOtp.mockResolvedValue(response);
      expect(
        (
          await verifyCandidateLogin(
            "rina@example.invalid",
            "123456",
            "/jobs/account",
          )
        ).error,
      ).toMatch(/tidak valid atau sudah kedaluwarsa/);
      expect(redirect).not.toHaveBeenCalled();
    },
  );
  test("verification rate limits fail closed before checking the code", async () => {
    (rateLimit as jest.Mock).mockRejectedValue(
      new Error("Terlalu banyak permintaan. Coba lagi nanti."),
    );
    expect(
      (
        await verifyCandidateLogin(
          "rina@example.invalid",
          "123456",
          "/jobs/account",
        )
      ).error,
    ).toMatch(/Terlalu banyak/);
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});

describe("submission with quarantined attachments", () => {
  const documentId = "00000000-0000-0000-0000-000000000002";
  const input = {
    name: "Rina",
    phone: "+628123456789",
    privacyConsent: true,
    futureConsent: false,
    answers: {},
    documents: { cv: documentId },
  };
  const baseDocument = {
    extension: "pdf",
    candidate_id: "owned-candidate",
    category: "application",
    scan_status: "pending",
    deleted_at: null,
  };
  beforeEach(() => {
    (getPublicJobs as jest.Mock).mockResolvedValue([
      {
        accepting: true,
        form: formSchema.parse({
          cv: "required",
          availability: false,
          expectedSalary: "off",
        }),
      },
    ]);
  });
  function mockDocument(
    document:
      | (Omit<typeof baseDocument, "deleted_at"> & {
          deleted_at: string | null;
        })
      | null,
  ) {
    (recruitmentDb as jest.Mock).mockReturnValue({
      from: (table: string) => {
        const query = {
          select: () => query,
          eq: () => query,
          single: async () => ({
            data:
              table === "recruitment_jobs" ? { slug: "supervisor" } : document,
          }),
        };
        return query;
      },
    });
  }
  test.each(["pending", "clean"])(
    "%s attachment is submitted for database ownership and upload checks",
    async (status) => {
      mockDocument({ ...baseDocument, scan_status: status });
      const result = await candidateAction("submit", offerId, 1, input);
      expect(result.error).toBeUndefined();
      expect(command).toHaveBeenCalledWith(
        "authenticated-user",
        null,
        "submit",
        offerId,
        1,
        expect.objectContaining({ documents: { cv: documentId } }),
      );
    },
  );
  test.each([
    { ...baseDocument, scan_status: "infected" },
    { ...baseDocument, scan_status: "failed" },
    { ...baseDocument, candidate_id: "other-candidate" },
    { ...baseDocument, category: "identity" },
    { ...baseDocument, deleted_at: "2026-11-23T10:00:00Z" },
    null,
  ])(
    "unusable or unauthorized attachment does not reach the command",
    async (document) => {
      mockDocument(document);
      expect(
        (await candidateAction("submit", offerId, 1, input)).error,
      ).toMatch(/Dokumen/);
      expect(command).not.toHaveBeenCalled();
    },
  );
  test("incomplete upload errors returned by the database remain visible", async () => {
    mockDocument(baseDocument);
    (command as jest.Mock).mockRejectedValueOnce(
      new Error("Unggahan dokumen belum selesai. Unggah ulang file Anda."),
    );
    expect((await candidateAction("submit", offerId, 1, input)).error).toMatch(
      /Unggahan dokumen belum selesai/,
    );
  });
});
