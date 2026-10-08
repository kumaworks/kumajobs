import { documentAccess } from "./document-access";
import { candidateSession, recruitmentDb } from "./server";
jest.mock("server-only", () => ({}));
jest.mock("./server", () => ({
  candidateSession: jest.fn(),
  recruitmentDb: jest.fn(),
}));
const documents = [
  {
    id: "owned",
    candidate_id: "me",
    category: "application",
    scan_status: "clean",
    deleted_at: null,
    object_path: "me/cv.pdf",
    name: "CV.pdf",
    extension: "pdf",
  },
  {
    id: "other",
    candidate_id: "someone-else",
    category: "application",
    scan_status: "clean",
    deleted_at: null,
  },
  {
    id: "ktp",
    candidate_id: "me",
    category: "identity",
    scan_status: "clean",
    deleted_at: null,
  },
  {
    id: "quarantine",
    candidate_id: "me",
    category: "application",
    scan_status: "pending",
    deleted_at: null,
  },
];
const sign = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  (candidateSession as jest.Mock).mockResolvedValue({
    user: { id: "user" },
    candidate: { id: "me" },
  });
  sign.mockResolvedValue({
    data: { signedUrl: "https://storage.example.invalid/temporary" },
    error: null,
  });
  (recruitmentDb as jest.Mock).mockImplementation(() => ({
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return query;
        },
        is: (key: string, value: unknown) => {
          filters[key] = value;
          return query;
        },
        maybeSingle: async () => ({
          data: documents.find((d) =>
            Object.entries(filters).every(
              ([key, value]) => (d as Record<string, unknown>)[key] === value,
            ),
          ),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
      if (!["recruitment_documents", "recruitment_events"].includes(table))
        throw new Error("Unexpected table");
      return query;
    },
    storage: { from: () => ({ createSignedUrl: sign }) },
  }));
});
test("only owned clean application documents receive a short-lived download", async () => {
  await expect(documentAccess("owned")).resolves.toBe(
    "https://storage.example.invalid/temporary",
  );
  expect(sign).toHaveBeenCalledWith("me/cv.pdf", 60, { download: false });
});
test("other candidates, identity evidence and quarantine never receive signed links", async () => {
  for (const id of ["other", "ktp", "quarantine", "missing"])
    await expect(documentAccess(id)).rejects.toThrow("Document unavailable");
  expect(sign).not.toHaveBeenCalled();
});
