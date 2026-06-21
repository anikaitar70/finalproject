#!/usr/bin/env node

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
