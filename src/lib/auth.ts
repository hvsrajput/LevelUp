// =============================================================================
// Auth.js (NextAuth v5) configuration
// =============================================================================
// Design decisions:
//   - JWT strategy: stateless sessions are ideal for serverless (Vercel)
//   - GitHub + Google providers: most DSA practitioners have these accounts
//   - Prisma adapter: auth tables live alongside domain tables
//   - The `userId` is injected into the JWT so it's available in route handlers
//     without an extra DB query per request
// =============================================================================

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // JWT strategy — no server-side session table needed for every request
  session: { strategy: "jwt" },

  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Inject the database userId into the JWT so route handlers can read it
    // without querying the User table on every request
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },

    // Expose userId on the client-side session object
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
});
