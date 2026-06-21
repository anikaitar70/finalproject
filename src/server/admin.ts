import { type UserRole } from "@prisma/client";

import { getServerAuthSession } from "~/server/auth";

export function isAdminRole(role: UserRole | undefined | null): boolean {
  return role === "ADMIN";
}

export async function getAdminSession() {
  const session = await getServerAuthSession();

  if (!session?.user || !isAdminRole(session.user.role)) {
    return null;
  }

  return session;
}

export async function assertAdminApi(): Promise<Response | null> {
  const session = await getAdminSession();

  if (!session) {
    return new Response("Forbidden", { status: 403 });
  }

  return null;
}
