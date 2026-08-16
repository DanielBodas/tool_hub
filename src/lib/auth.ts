import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
  }
  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  // Use '1234' as ultimate fallback for the secret to avoid NO_SECRET error in production
  secret: process.env.NEXTAUTH_SECRET || "1234",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days persistent session
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }),
    CredentialsProvider({
      name: "Admin Code",
      credentials: {
        code: { label: "Admin Code", type: "password" },
      },
      async authorize(credentials) {
        const adminCode = process.env.ADMIN_CODE || "1234";

        if (credentials?.code === adminCode) {
          return {
            id: "admin",
            name: "Administrator",
            email: "admin@example.com",
            role: "admin",
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || "user";
      }
      return token;
    },
  },
};

/**
 * Checks if a logged-in session user is authorized to access a given tool directly.
 * - Admin users (role === "admin") have unrestricted access to all tools.
 * - Regular users (e.g., Google login) have access to tools listed in:
 *   - ALLOWED_TOOLS_FOR_USER (comma-separated list of tool IDs, or "*")
 *   - ALLOWED_TOOLS_<EMAIL> (e.g. ALLOWED_TOOLS_USER_GMAIL_COM)
 *   - ALLOWED_TOOLS_FOR_PIN
 */
export function isToolAllowedForUser(session: { user?: { role?: string; email?: string | null } } | null | undefined, toolId: string): boolean {
  if (!session || !session.user) {
    return false;
  }

  // Admin users have full unrestricted access to all tools
  if (session.user.role === "admin") {
    return true;
  }

  const allowedToolsVars: string[] = [];

  if (process.env.ALLOWED_TOOLS_FOR_USER) {
    allowedToolsVars.push(process.env.ALLOWED_TOOLS_FOR_USER);
  }

  if (process.env.ALLOWED_TOOLS_FOR_PIN) {
    allowedToolsVars.push(process.env.ALLOWED_TOOLS_FOR_PIN);
  }

  if (session.user.email) {
    const sanitizedEmail = session.user.email.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    const emailEnvKey = `ALLOWED_TOOLS_${sanitizedEmail}`;
    if (process.env[emailEnvKey]) {
      allowedToolsVars.push(process.env[emailEnvKey] as string);
    }
  }

  for (const varVal of allowedToolsVars) {
    const tools = varVal.split(",").map((t) => t.trim().toLowerCase());
    if (tools.includes("*") || tools.includes(toolId.toLowerCase())) {
      return true;
    }
  }

  return false;
}
