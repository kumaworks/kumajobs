import {
  candidateAction,
  prepareCandidateUpload,
  requestCandidateLogin,
} from "./actions";
import { candidateSession, command, rateLimit } from "@/lib/recruitment/server";
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
});
