import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { ApplyForm, LoginForm } from "./candidate-forms";
import {
  candidateAction,
  prepareCandidateUpload,
  requestCandidateLogin,
} from "@/app/jobs/actions";
import { formSchema, type PublicJob } from "@/lib/recruitment/domain";
const mockRouter = { refresh: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));
jest.mock("@/app/jobs/actions", () => ({
  candidateAction: jest.fn(),
  requestCandidateLogin: jest.fn(),
  prepareCandidateUpload: jest.fn(),
}));
const job: PublicJob = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "supervisor",
  businessId: "b",
  company: "Kuma",
  companySlug: "kuma",
  title: "Supervisor",
  description: "Lead our team",
  responsibilities: "",
  requirements: "",
  benefits: "",
  location: "Jakarta",
  employmentType: "permanent",
  workMode: "onsite",
  salary: null,
  deadline: null,
  form: formSchema.parse({
    cv: "off",
    availability: false,
    expectedSalary: "off",
  }),
  version: 1,
  accepting: true,
  indexable: true,
  createdAt: "2026-01-01",
};
beforeEach(() => {
  jest.clearAllMocks();
  (candidateAction as jest.Mock).mockResolvedValue({ data: {} });
  (requestCandidateLogin as jest.Mock).mockResolvedValue({
    data: { message: "Sent" },
  });
});
test("verified candidate can complete the staged application and gets the submitted outcome", async () => {
  render(
    <ApplyForm
      job={job}
      signedIn
      profile={{ name: "Rina", phone: "+628123456789" }}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Simpan profil dan lanjutkan" }),
  );
  await screen.findByRole("button", { name: "Lanjutkan" });
  fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));
  fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));
  fireEvent.click(screen.getByLabelText(/Saya menyetujui penggunaan/));
  fireEvent.click(screen.getByRole("button", { name: "Kirim lamaran" }));
  await screen.findByText("Lamaran telah dikirim.");
  expect(candidateAction).toHaveBeenCalledWith(
    "submit",
    job.id,
    1,
    expect.objectContaining({ privacyConsent: true, name: "Rina" }),
  );
});
test("application conflicts remain visible and preserve candidate entries", async () => {
  (candidateAction as jest.Mock).mockImplementation(async (name: string) =>
    name === "submit"
      ? { error: "The application form changed" }
      : { data: {} },
  );
  render(
    <ApplyForm
      job={job}
      signedIn
      profile={{ name: "Rina", phone: "+628123456789" }}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Simpan profil dan lanjutkan" }),
  );
  await screen.findByRole("button", { name: "Lanjutkan" });
  fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));
  fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));
  fireEvent.click(screen.getByLabelText(/Saya menyetujui penggunaan/));
  fireEvent.click(screen.getByRole("button", { name: "Kirim lamaran" }));
  await screen.findByText("The application form changed");
  expect(screen.getByText(/Rina ·/)).toBeInTheDocument();
});
test("email sign-in sends a dedicated candidate return destination", async () => {
  render(<LoginForm next="/jobs/supervisor" />);
  fireEvent.change(screen.getByLabelText("Alamat email"), {
    target: { value: "rina@example.invalid" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Kirim kode verifikasi" }),
  );
  await waitFor(() =>
    expect(requestCandidateLogin).toHaveBeenCalledWith(
      "rina@example.invalid",
      "/jobs/supervisor",
    ),
  );
});

const cvJob: PublicJob = { ...job, form: { ...job.form, cv: "required" } };
const candidateProfile = { name: "Rina", phone: "+628123456789" };
async function openDocuments() {
  fireEvent.click(
    screen.getByRole("button", { name: "Simpan profil dan lanjutkan" }),
  );
  await screen.findByLabelText("Unggah CV");
}

test("empty document library offers direct upload and blocks a missing required CV", async () => {
  render(<ApplyForm job={cvJob} signedIn profile={candidateProfile} />);
  await openDocuments();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(screen.queryByText(/Gunakan file tersimpan/)).not.toBeInTheDocument();
  expect(screen.getByText("Unggah CV untuk melanjutkan.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Lanjutkan" })).toBeDisabled();
});

test("upload attaches to CV automatically and becomes usable when scanning completes", async () => {
  const document = {
    id: "00000000-0000-0000-0000-000000000002",
    name: "CV Rina.pdf",
    scan_status: "clean",
  };
  (prepareCandidateUpload as jest.Mock).mockResolvedValue({
    data: { ...document, signedUrl: "https://example.invalid/upload" },
  });
  const open = jest
    .spyOn(XMLHttpRequest.prototype, "open")
    .mockImplementation(() => {});
  const send = jest
    .spyOn(XMLHttpRequest.prototype, "send")
    .mockImplementation(function (this: XMLHttpRequest) {
      Object.defineProperty(this, "status", { value: 200 });
      this.dispatchEvent(new Event("load"));
    });
  const file = new File(["%PDF-1.7"], document.name, {
    type: "application/pdf",
  });
  jest
    .spyOn(file, "slice")
    .mockReturnValue({ arrayBuffer: async () => new ArrayBuffer(8) } as Blob);
  try {
    const { rerender } = render(
      <ApplyForm job={cvJob} signedIn profile={candidateProfile} />,
    );
    await openDocuments();
    fireEvent.change(screen.getByLabelText("Unggah CV"), {
      target: { files: [file] },
    });
    await screen.findByText(document.name);
    expect(
      screen.getByText(/File terunggah. Sedang diperiksa/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lanjutkan" })).toBeDisabled();
    rerender(
      <ApplyForm
        job={cvJob}
        signedIn
        profile={candidateProfile}
        documents={[document]}
      />,
    );
    expect(
      screen.getByText(/Siap digunakan · Sudah terpasang/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));
    expect(screen.getByText(document.name)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Saya menyetujui penggunaan/));
    fireEvent.click(screen.getByRole("button", { name: "Kirim lamaran" }));
    await screen.findByText("Lamaran telah dikirim.");
    expect(candidateAction).toHaveBeenCalledWith(
      "submit",
      cvJob.id,
      cvJob.version,
      expect.objectContaining({ documents: { cv: document.id } }),
    );
  } finally {
    open.mockRestore();
    send.mockRestore();
  }
});

test("pending saved files refresh automatically and rejected files can be replaced", async () => {
  const document = { id: "cv-file", name: "CV.pdf", scan_status: "pending" };
  const { rerender, unmount } = render(
    <ApplyForm
      job={cvJob}
      signedIn
      profile={candidateProfile}
      documents={[document]}
    />,
  );
  await openDocuments();
  fireEvent.click(screen.getByRole("button", { name: /CV.pdf/ }));
  expect(screen.getByRole("button", { name: "Lanjutkan" })).toBeDisabled();
  jest.useFakeTimers();
  // Re-enter the step to start its polling effect with the test clock.
  fireEvent.click(screen.getByRole("button", { name: "Kembali" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Simpan profil dan lanjutkan" }),
  );
  await act(async () => {});
  mockRouter.refresh.mockClear();
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(mockRouter.refresh).toHaveBeenCalled();
  rerender(
    <ApplyForm
      job={cvJob}
      signedIn
      profile={candidateProfile}
      documents={[{ ...document, scan_status: "rejected" }]}
    />,
  );
  expect(
    screen.getByText(/File ini tidak dapat digunakan/),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Ganti CV")).toBeEnabled();
  expect(screen.getByRole("button", { name: "Lanjutkan" })).toBeDisabled();
  mockRouter.refresh.mockClear();
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  expect(mockRouter.refresh).not.toHaveBeenCalled();
  unmount();
  jest.useRealTimers();
});

test("optional documents may be skipped and saved files respect the required format", async () => {
  const optionalJob: PublicJob = {
    ...job,
    form: {
      ...job.form,
      cv: "optional",
      documents: [
        {
          id: "portfolio",
          label: "Portofolio",
          instructions: "Kirim PDF",
          required: true,
          formats: ["pdf"],
        },
      ],
    },
  };
  render(
    <ApplyForm
      job={optionalJob}
      signedIn
      profile={candidateProfile}
      documents={[
        { id: "pdf", name: "Portfolio.pdf", scan_status: "clean" },
        { id: "word", name: "Portfolio.docx", scan_status: "clean" },
      ]}
    />,
  );
  await openDocuments();
  const portfolio = screen.getByRole("group", { name: "Portofolio (wajib)" });
  expect(
    within(portfolio).queryByRole("button", { name: /Portfolio.docx/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(
    within(portfolio).getByRole("button", { name: /Portfolio.pdf/ }),
  );
  expect(screen.getByRole("button", { name: "Lanjutkan" })).toBeEnabled();
});

test("invalid uploads explain how to retry without attaching a file", async () => {
  render(<ApplyForm job={cvJob} signedIn profile={candidateProfile} />);
  await openDocuments();
  fireEvent.change(screen.getByLabelText("Unggah CV"), {
    target: { files: [new File(["text"], "CV.txt")] },
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Gunakan file PDF, DOCX, JPG, PNG.",
  );
  expect(prepareCandidateUpload).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Unggah CV")).toBeEnabled();
  expect(screen.getByRole("button", { name: "Lanjutkan" })).toBeDisabled();
});
