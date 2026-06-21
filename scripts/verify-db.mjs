#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { access, constants } from "node:fs/promises";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "fatal",
      event: "database.verify.missing_url",
    }),
  );
  process.exit(1);
}

const dbPath = databaseUrl.replace(/^file:/, "");

try {
  await access(dbPath, constants.F_OK | constants.W_OK);
} catch {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "fatal",
      event: "database.verify.file_not_writable",
      path: dbPath,
    }),
  );
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  await prisma.$queryRaw`SELECT 1`;

  const tables = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'
  `;

  if (tables.length === 0) {
    throw new Error("Prisma migrations table missing");
  }

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      event: "database.verify.passed",
      path: dbPath,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "fatal",
      event: "database.verify.failed",
      message: error instanceof Error ? error.message : "unknown",
    }),
  );
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
