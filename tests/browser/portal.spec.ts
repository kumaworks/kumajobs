import { test, expect } from "@playwright/test";

test("discovery filters, real detail navigation, and light/dark persistence", async ({
  page,
}) => {
  await page.goto("/jobs");
  await expect(
    page.getByRole("heading", { name: /Pekerjaan baru/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tema terang", exact: true }).click();
  await page.screenshot({
    path: "test-results/portal-light.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Tema gelap", exact: true }).click();
  await page.reload();
  await expect(page.locator(".jobs-portal")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  await page.screenshot({
    path: "test-results/portal-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByLabel("Cara kerja").selectOption("remote");
  await page
    .getByRole("button", { name: "Cari lowongan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Frontend Engineer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Product Designer" }),
  ).toHaveCount(0);
  await page.getByRole("heading", { name: "Frontend Engineer" }).click();
  await expect(
    page.getByRole("heading", { name: "Tentang posisi ini" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Loka Digital", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Karier di Loka Digital" }),
  ).toBeVisible();
});

test("application review preserves entered answers and preview never submits", async ({
  page,
}) => {
  await page.goto("/jobs/product-designer");
  await page
    .getByRole("button", { name: "Simpan profil dan lanjutkan" })
    .click();
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await page.getByLabel(/Kapan Anda/).selectOption("immediately");
  await page
    .getByLabel(/Apa yang membuat/)
    .fill("Saya ingin membantu tim membangun produk yang bermanfaat.");
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await expect(
    page.getByText("Saya ingin membantu tim membangun produk yang bermanfaat."),
  ).toBeVisible();
  await page.getByLabel(/Saya menyetujui penggunaan/).check();
  await page
    .getByRole("button", { name: "Kirim lamaran", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Mode pratinjau" }),
  ).toContainText("Mode pratinjau");
  await page.screenshot({
    path: "test-results/application.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("candidate can find every current recruitment capability", async ({
  page,
}) => {
  await page.goto("/jobs/account");
  await page
    .getByRole("navigation", { name: "Ruang kandidat" })
    .getByRole("link", { name: "Wawancara", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kenalan dengan tim desain" }),
  ).toBeVisible();
  await page
    .getByLabel("Jawaban wawancara")
    .selectOption("reschedule_requested");
  await page.getByRole("button", { name: "Kirim jawaban" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Mode pratinjau" }),
  ).toContainText("Mode pratinjau");
  await page
    .getByRole("navigation", { name: "Ruang kandidat" })
    .getByRole("link", { name: "Penawaran", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Penawaran pekerjaan/ }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/account.png", fullPage: true });
  await page
    .getByRole("navigation", { name: "Ruang kandidat" })
    .getByRole("link", { name: "Profil & dokumen" })
    .click();
  await expect(
    page.getByRole("button", { name: "Simpan profil", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Ruang kandidat" })
    .getByRole("link", { name: "Kuma Verified" })
    .click();
  await expect(page.getByLabel("NIK (16 angka)")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Ruang kandidat" })
    .getByRole("link", { name: "Bantuan & privasi" })
    .click();
  await expect(page.getByLabel("Jenis permintaan")).toBeVisible();
});

test("small screens and empty search remain usable in both themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["terang", "gelap"]) {
    await page.goto("/jobs");
    await page
      .getByRole("button", { name: `Tema ${theme}`, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: /Pekerjaan baru/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Product Designer" }).locator(".."),
    ).toHaveCSS(
      "background-color",
      theme === "gelap" ? "rgb(24, 36, 32)" : "rgb(255, 255, 255)",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/mobile-${theme}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("/jobs/account");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/jobs?q=nonexistent-example");
  await expect(
    page.getByRole("heading", { name: "Belum menemukan yang cocok?" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Hapus filter" }).click();
  await expect(
    page.getByRole("heading", { name: "Product Designer" }),
  ).toBeVisible();
});
