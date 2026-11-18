import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { LoginForm } from "./login-form";
import {
  requestCandidateLogin,
  verifyCandidateLogin,
} from "@/app/jobs/actions";
jest.mock("@/app/jobs/actions", () => ({
  requestCandidateLogin: jest.fn(),
  verifyCandidateLogin: jest.fn(),
}));
beforeEach(() => {
  jest.resetAllMocks();
  (requestCandidateLogin as jest.Mock).mockResolvedValue({ data: {} });
  (verifyCandidateLogin as jest.Mock).mockResolvedValue({
    error: "Kode tidak valid atau sudah kedaluwarsa.",
  });
});
afterEach(() => jest.useRealTimers());
async function requestCode() {
  render(<LoginForm next="/jobs/designer?apply=1" />);
  fireEvent.change(screen.getByLabelText("Alamat email"), {
    target: { value: "RINA@example.invalid" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Kirim kode verifikasi" }),
  );
  return screen.findByLabelText("Kode verifikasi");
}
test("send transitions to focused OTP input and paste automatically verifies with original destination", async () => {
  const input = await requestCode();
  expect(input).toHaveFocus();
  expect(input).toHaveAttribute("autocomplete", "one-time-code");
  expect(
    screen.getByRole("button", { name: /Kirim ulang dalam/ }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Verifikasi & masuk" }),
  ).toBeDisabled();
  fireEvent.paste(input, { clipboardData: { getData: () => "012 345" } });
  await screen.findByRole("alert");
  expect(verifyCandidateLogin).toHaveBeenCalledWith(
    "rina@example.invalid",
    "012345",
    "/jobs/designer?apply=1",
  );
  expect(input).toHaveValue("012345");
  expect(
    screen.getByRole("button", { name: "Verifikasi & masuk" }),
  ).toBeEnabled();
});
test("failed delivery keeps email editable without showing OTP", async () => {
  (requestCandidateLogin as jest.Mock).mockResolvedValue({
    error: "Tidak dapat mengirim kode.",
  });
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText("Alamat email"), {
    target: { value: "rina@example.invalid" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Kirim kode verifikasi" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Tidak dapat mengirim kode.",
  );
  expect(screen.queryByLabelText("Kode verifikasi")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Alamat email")).toHaveValue(
    "rina@example.invalid",
  );
});
test("resending unlocks after 60 seconds and resets the code and countdown", async () => {
  jest.useFakeTimers();
  const input = await requestCode();
  fireEvent.change(input, { target: { value: "123" } });
  act(() => jest.advanceTimersByTime(59_000));
  expect(
    screen.getByRole("button", { name: /Kirim ulang dalam/ }),
  ).toBeDisabled();
  act(() => jest.advanceTimersByTime(1000));
  fireEvent.click(screen.getByRole("button", { name: "Kirim ulang kode" }));
  await waitFor(() => expect(requestCandidateLogin).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(input).toHaveValue(""));
  expect(
    screen.getByRole("button", { name: /Kirim ulang dalam 60/ }),
  ).toBeDisabled();
});
test("changing email clears the previous code and submits the new recipient", async () => {
  const input = await requestCode();
  fireEvent.change(input, { target: { value: "123" } });
  fireEvent.click(screen.getByRole("button", { name: "Ubah email" }));
  fireEvent.change(screen.getByLabelText("Alamat email"), {
    target: { value: "other@example.invalid" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Kirim kode verifikasi" }),
  );
  await screen.findByLabelText("Kode verifikasi");
  expect(requestCandidateLogin).toHaveBeenLastCalledWith(
    "other@example.invalid",
    "/jobs/designer?apply=1",
  );
  expect(screen.getByLabelText("Kode verifikasi")).toHaveValue("");
});
test("network failures allow retry and do not trap the form in pending state", async () => {
  (verifyCandidateLogin as jest.Mock).mockRejectedValue(new Error("offline"));
  const input = await requestCode();
  fireEvent.change(input, { target: { value: "123456" } });
  expect(await screen.findByRole("alert")).toHaveTextContent(/Periksa koneksi/);
  expect(
    screen.getByRole("button", { name: "Verifikasi & masuk" }),
  ).toBeEnabled();
  expect(input).toHaveValue("123456");
});
test("auto verification and submit cannot create overlapping requests", async () => {
  let finish!: (value: { error: string }) => void;
  (verifyCandidateLogin as jest.Mock).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const input = await requestCode();
  fireEvent.change(input, { target: { value: "123456" } });
  fireEvent.submit(input.closest("form")!);
  expect(verifyCandidateLogin).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Ubah email" })).toBeDisabled();
  await act(async () => finish({ error: "Kode tidak valid." }));
});
