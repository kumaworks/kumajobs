import { test, expect } from "@playwright/test";

test("company colors apply to the banner and accents without changing the portal shell", async ({
  page,
}) => {
  await page.goto("/loka-digital");
  const banner = page.getByRole("region", { name: "Karier di Loka Digital" });
  const button = page.getByRole("link", {
    name: "Lihat lowongan",
    exact: true,
  });
  for (const theme of ["terang", "gelap"]) {
    await page
      .getByRole("button", { name: `Tema ${theme}`, exact: true })
      .click();
    await expect(page.locator(".jobs-portal")).toHaveAttribute(
      "data-theme",
      theme === "gelap" ? "dark" : "light",
    );
    await expect(banner).toHaveCSS("background-color", "rgb(224, 231, 255)");
    await expect(banner).toHaveCSS(
      "background-image",
      /^radial-gradient\(.*rgb\(224, 231, 255\) 70%\)$/,
    );
    await expect(banner).toHaveCSS("color", "rgb(0, 0, 0)");
    await expect(button).toHaveCSS("background-color", "rgb(67, 56, 202)");
    await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
    expect(
      await page
        .locator(".jobs-portal")
        .evaluate((element) =>
          getComputedStyle(element).getPropertyValue("--company-primary"),
        ),
    ).toBe("");
  }
  await page.goto("/ruang-karya");
  await expect(
    page.getByRole("region", { name: "Karier di Ruang Karya" }),
  ).toHaveCSS("background-color", "rgb(22, 62, 48)");
});

test("short company URLs accept uppercase and show only that company's jobs", async ({
  page,
}) => {
  await page.goto("/RUANG-KARYA");
  await expect(
    page.getByRole("heading", { name: "Karier di Ruang Karya" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Karier di Ruang Karya | KumaWorks Jobs");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/ruang-karya$/,
  );
  await expect(
    page.getByRole("heading", { name: "Product Designer", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "People Operations", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Frontend Engineer", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Lihat lowongan", exact: true }).click();
  await expect(page).toHaveURL(/#company-jobs$/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/company-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("heading", { name: "Product Designer", exact: true })
    .click();
  await expect(page).toHaveURL(/\/jobs\/product-designer$/);
  await page.getByRole("link", { name: "Ruang Karya", exact: true }).click();
  await expect(page).toHaveURL(/\/ruang-karya$/);
});

test("legacy links preserve pagination and unknown companies return 404", async ({
  page,
}) => {
  await page.goto("/jobs/company/RUANG-KARYA?page=1");
  await expect(page).toHaveURL(/\/ruang-karya\?page=1$/);
  await expect(
    page.getByRole("heading", { name: "Tidak ada lowongan di halaman ini" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Kembali ke lowongan perusahaan" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Product Designer", exact: true }),
  ).toBeVisible();
  const response = await page.goto("/company-that-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
  await page.goto("/jobs");
  await expect(
    page.getByRole("heading", { name: /Pekerjaan baru/ }),
  ).toBeVisible();
});

test("company landing pages fit mobile screens in both themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/loka-digital");
  for (const theme of ["terang", "gelap"]) {
    await page
      .getByRole("button", { name: `Tema ${theme}`, exact: true })
      .click();
    await expect(page.locator(".jobs-portal")).toHaveAttribute(
      "data-theme",
      theme === "gelap" ? "dark" : "light",
    );
    await expect(
      page
        .getByRole("heading", { name: "Frontend Engineer", exact: true })
        .locator(".."),
    ).toHaveCSS(
      "background-color",
      theme === "gelap" ? "rgb(24, 36, 32)" : "rgb(255, 255, 255)",
    );
    await expect(
      page.getByRole("heading", { name: "Karier di Loka Digital" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/company-mobile-${theme}.png`,
      fullPage: true,
    });
  }
});
