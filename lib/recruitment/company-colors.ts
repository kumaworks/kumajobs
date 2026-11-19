export const defaultCompanyColors = {
  primary: "#163e30",
  secondary: "#d5efbb",
};

export function companyColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : fallback;
}

function luminance(hex: string) {
  const rgb = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

export function contrastRatio(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function companyTextColor(background: string) {
  return contrastRatio(background, "#000000") >=
    contrastRatio(background, "#ffffff")
    ? "#000000"
    : "#ffffff";
}

// Keep the chosen hue while making small text readable on the portal surfaces.
function readableAccent(color: string, backgrounds: string[], target: number) {
  for (let step = 0; step <= 20; step++) {
    const candidate =
      "#" +
      [1, 3, 5]
        .map((offset) => {
          const channel = parseInt(color.slice(offset, offset + 2), 16);
          return Math.round(channel + ((target - channel) * step) / 20)
            .toString(16)
            .padStart(2, "0");
        })
        .join("");
    if (
      backgrounds.every(
        (background) => contrastRatio(candidate, background) >= 4.5,
      )
    )
      return candidate;
  }
  return target === 0 ? "#000000" : "#ffffff";
}

export function companyColorVariables(
  primaryValue?: unknown,
  secondaryValue?: unknown,
) {
  const primary = companyColor(primaryValue, defaultCompanyColors.primary);
  const secondary = companyColor(
    secondaryValue,
    defaultCompanyColors.secondary,
  );
  return {
    "--company-primary": primary,
    "--company-secondary": secondary,
    "--company-on-primary": companyTextColor(primary),
    "--company-on-secondary": companyTextColor(secondary),
    "--company-primary-light": readableAccent(
      primary,
      ["#ffffff", "#f7f8f5"],
      0,
    ),
    "--company-primary-dark": readableAccent(
      primary,
      ["#101917", "#182420"],
      255,
    ),
  };
}
