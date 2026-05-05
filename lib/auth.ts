import GitHubProvider from "next-auth/providers/github";
import GitLabProvider from "next-auth/providers/gitlab";
import { NextAuthOptions, DefaultSession } from "next-auth";

const gitHubId = process.env.GITHUB_ID?.trim() || "";
// Use write-scope secret by default (works for both read and write operations)
const gitHubSecret = process.env.GITHUB_SECRET_WRITE?.trim() || process.env.GITHUB_SECRET?.trim() || "";
const gitLabId = process.env.GITLAB_ID?.trim() || "";
const gitLabSecret = process.env.GITLAB_SECRET?.trim() || "";

console.log("[AUTH] GitHub Provider Config:", {
  clientId: gitHubId,
  clientIdLength: gitHubId.length,
  hasSecret: !!gitHubSecret,
  secretLength: gitHubSecret.length
});

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: gitHubId,
      clientSecret: gitHubSecret,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "repo user:email" // Full repo scope for both auth and PR creation
        }
      }
    }),
    GitLabProvider({
      clientId: gitLabId,
      clientSecret: gitLabSecret,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "read_user api"
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  useSecureCookies: true,
  debug: true,
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      if (profile?.login) {
        token.login = profile.login;
      }
      if ((profile as any)?.username) {
        token.login = (profile as any).username;
      }

      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.provider = token.provider;
      session.user.login = token.login;
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      if (url.includes("start.pipery.dev") || url.includes("dash.pipery.dev")) return url;
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
    provider?: string;
    user: {
      login?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    accessToken?: string;
    provider?: string;
    login?: string;
  }
}
