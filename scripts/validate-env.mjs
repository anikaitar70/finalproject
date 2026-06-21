#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(".env.production");

const required = [
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXTAUTH_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "UPLOADTHING_TOKEN",
];

const missing = required.filter((key) => {
  const value = process.env[key];
  return !value || value.trim() === "";
});

if (missing.length > 0) {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "fatal",
      event: "startup.validation.failed",
      missing,
    }),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    ts: new Date().toISOString(),
    level: "info",
    event: "startup.validation.passed",
    checked: required.length,
  }),
);
