import { type NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";

// Only register providers that are actually configured, so the app boots
// cleanly in any environment (Phase 1 may run with just one provider).
function buildProviders() {
  const providers: NextAuthOptions["providers"] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM) {
    providers.push(
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: process.env.EMAIL_FROM,
      }),
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: buildProviders(),
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // surface live credit balance on the session
        session.user.credits = (user as { credits?: number }).credits ?? 0;
      }
      return session;
    },
  },
  events: {
    // Record the starter-credit grant in the ledger so balances stay auditable.
    async createUser({ user }) {
      const credits = (user as { credits?: number }).credits ?? 0;
      if (credits > 0) {
        await prisma.creditTxn.create({
          data: {
            userId: user.id,
            amount: credits,
            reason: "signup_bonus",
            balance: credits,
          },
        });
      }
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
