import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type UserRole } from "@prisma/client";
import { nanoid } from "nanoid";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import { env } from "~/env";
import { prisma } from "~/server/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string | null;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string | null;
    role: UserRole;
  }
}

function getAdminEmailAllowlist(): string[] {
  if (!env.ADMIN_EMAILS) {
    return [];
  }

  return env.ADMIN_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function syncAdminRole(userId: string, email: string | null | undefined) {
  if (!email) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        role: true,
      },
    });
  }

  const allowlist = getAdminEmailAllowlist();
  const shouldBeAdmin = allowlist.includes(email.toLowerCase());

  if (shouldBeAdmin) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        role: true,
      },
    });
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      role: true,
    },
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  useSecureCookies: env.NEXTAUTH_URL.startsWith("https://"),
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id,
        name: token.name,
        email: token.email,
        image: token.picture,
        username: token.username,
        role: token.role ?? "USER",
      },
    }),

    async jwt({ token, user }) {
      try {
        if (user) {
          const dbUser = await syncAdminRole(user.id, user.email);
          token.id = user.id;
          token.username = dbUser?.username ?? null;
          token.role = dbUser?.role ?? "USER";
          return token;
        }

        if (!token.id) {
          return token;
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            role: true,
          },
        });

        if (!dbUser) {
          return token;
        }

        const syncedUser = await syncAdminRole(dbUser.id, dbUser.email);

        if (!syncedUser?.username) {
          const updatedUser = await prisma.user.update({
            where: {
              id: syncedUser?.id ?? dbUser.id,
            },
            data: {
              username: nanoid(10),
            },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
              role: true,
            },
          });

          return {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            picture: updatedUser.image,
            username: updatedUser.username,
            role: updatedUser.role,
          };
        }

        return {
          id: syncedUser.id,
          name: syncedUser.name,
          email: syncedUser.email,
          picture: syncedUser.image,
          username: syncedUser.username,
          role: syncedUser.role,
        };
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    redirect() {
      return "/";
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
};

export const getServerAuthSession = () => {
  return getServerSession(authOptions);
};
