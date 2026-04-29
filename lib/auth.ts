import GitHubProvider from "next-auth/providers/github";
import { NextAuthOptions, DefaultSession } from "next-auth";

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
