import GitHubProvider from "next-auth/providers/github";
import { NextAuthOptions, DefaultSession } from "next-auth";

const generateTraceId = () => {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: {
        params: {
          scope: "read:user repo"
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/"
  },
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      if (profile?.login) {
        token.login = profile.login;
      }

      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.user.login = token.login;
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain: ".pipery.dev"
      }
    }
  }
};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      login?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    accessToken?: string;
    login?: string;
  }
}
