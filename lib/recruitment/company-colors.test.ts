import { companyColorVariables, contrastRatio } from "./company-colors";

test("invalid or missing saved colors use safe defaults", () => {
  const colors = companyColorVariables("url(https://example.invalid)", "#abc");
  expect(colors["--company-primary"]).toBe("#163e30");
  expect(colors["--company-secondary"]).toBe("#d5efbb");
  expect(companyColorVariables()).toEqual(colors);
});

test("light, dark, and saturated brand colors retain readable text and accents", () => {
  for (const color of [
    "#FFFFFF",
    "#000000",
    "#FFFF00",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#777777",
    "#e0e7ff",
    "#4338ca",
  ]) {
    const colors = companyColorVariables(color, color);
    expect(colors["--company-primary"]).toBe(color.toLowerCase());
    expect(colors["--company-secondary"]).toBe(color.toLowerCase());
    const gradientStops =
      colors["--company-banner-gradient"].match(/#[0-9a-f]{6}/g)!;
    expect(gradientStops[1]).toBe(color.toLowerCase());
    expect(gradientStops[0]).not.toBe(gradientStops[1]);
    for (const stop of gradientStops)
      expect(
        contrastRatio(stop, colors["--company-on-primary"]),
      ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(color, colors["--company-on-primary"]),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(color, colors["--company-on-secondary"]),
    ).toBeGreaterThanOrEqual(4.5);
    for (const background of ["#ffffff", "#f7f8f5"])
      expect(
        contrastRatio(colors["--company-primary-light"], background),
      ).toBeGreaterThanOrEqual(4.5);
    for (const background of ["#101917", "#182420"])
      expect(
        contrastRatio(colors["--company-primary-dark"], background),
      ).toBeGreaterThanOrEqual(4.5);
  }
});
