import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApplyForm, LoginForm } from "./candidate-forms";
import { candidateAction, requestCandidateLogin } from "@/app/jobs/actions";
import { formSchema, type PublicJob } from "@/lib/recruitment/domain";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));
jest.mock("@/app/jobs/actions", () => ({
  candidateAction: jest.fn(),
  requestCandidateLogin: jest.fn(),
  uploadCandidateDocument: jest.fn(),
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
  fireEvent.click(screen.getByRole("button", { name: "Kirim tautan masuk" }));
  await waitFor(() =>
    expect(requestCandidateLogin).toHaveBeenCalledWith(
      "rina@example.invalid",
      "/jobs/supervisor",
    ),
  );
});
