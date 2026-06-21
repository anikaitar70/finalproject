/**
 * Expertise is stored in the database as a comma-separated string.
 * API responses and UI components use string[].
 */
export function parseExpertise(value: string | null | undefined): string[] {
  if (!value || value.trim() === "") {
    return [];
  }

  return value
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);
}

export function serializeExpertise(domains: string[]): string {
  return domains.map((domain) => domain.trim()).filter(Boolean).join(",");
}

export function formatExpertise(value: string | null | undefined): string {
  return parseExpertise(value).join(", ");
}
