export function formatCredibilityScore(value: number): string {
  // Convert to string with fixed precision and parse back to number to handle floating point precision
  return (Math.round(value * 10) / 10).toString();
}

export function formatCredibilityTitle(value: number): string {
  // Convert to string with fixed precision and parse back to number to handle floating point precision
  return `Credibility Score: ${(Math.round(value * 100) / 100).toString()}`;
}