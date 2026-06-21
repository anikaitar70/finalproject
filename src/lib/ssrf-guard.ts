import dns from "dns/promises";
import { isIP } from "net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const a = parts[0] ?? 0;
  const b = parts[1] ?? 0;

  if (a === 127 || a === 0 || a === 10) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;

  return false;
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  ) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.replace("::ffff:", "");
    if (isIP(mapped) === 4) {
      return isBlockedIpv4(mapped);
    }
  }

  return false;
}

function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);

  if (version === 4) {
    return isBlockedIpv4(ip);
  }

  if (version === 6) {
    return isBlockedIpv6(ip);
  }

  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  if (
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }

  const ipVersion = isIP(normalized);
  if (ipVersion !== 0) {
    return isBlockedIp(normalized);
  }

  return false;
}

export async function assertSafeExternalUrl(
  rawUrl: string,
): Promise<{ ok: true; url: URL } | { ok: false; reason: string }> {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only http and https URLs are allowed" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "URLs with credentials are not allowed" };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false, reason: "Blocked hostname" };
  }

  const ipVersion = isIP(parsed.hostname);
  if (ipVersion !== 0) {
    if (isBlockedIp(parsed.hostname)) {
      return { ok: false, reason: "Blocked IP address" };
    }
    return { ok: true, url: parsed };
  }

  try {
    const records = await dns.lookup(parsed.hostname, { all: true, verbatim: true });

    if (records.length === 0) {
      return { ok: false, reason: "Unable to resolve hostname" };
    }

    for (const record of records) {
      if (isBlockedIp(record.address)) {
        return { ok: false, reason: "Hostname resolves to a blocked address" };
      }
    }
  } catch {
    return { ok: false, reason: "Unable to resolve hostname" };
  }

  return { ok: true, url: parsed };
}
