// Match the employer's editable careers slug, accepting uppercase shared links.
export function normalizeCompanyCode(value: string): string | null {
  if (value.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value))
    return null;
  return value.toLowerCase();
}

// Existing application routes take priority over company codes. Keep legacy
// company URLs usable for employers whose saved slug matches a reserved route.
const reservedCodes = new Set(["jobs", "api", "_next"]);

export function companyHref(code: string): string {
  const normalized = normalizeCompanyCode(code);
  return normalized && !reservedCodes.has(normalized)
    ? `/${normalized}`
    : `/jobs/company/${encodeURIComponent(code)}`;
}
