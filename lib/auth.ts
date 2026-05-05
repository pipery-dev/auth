import GitHubProvider from "next-auth/providers/github";
import GitLabProvider from "next-auth/providers/gitlab";
import { NextAuthOptions, DefaultSession } from "next-auth";
import { safeCallbackUrl } from "./redirects";

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
          scope: "repo workflow user:email" // Includes workflow write access for PR creation.
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
        const provider = account.provider as "github" | "gitlab";
        const login = profile?.login || profile?.username || token.login;
        token.accounts = {
          ...(token.accounts as any),
          [provider]: {
            accessToken: account.access_token,
            login
          }
        };
        token.accessToken = account.access_token;
        token.provider = provider;
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
      session.accounts = token.accounts || {};
      session.provider = token.provider;
      session.accessToken =
        session.provider && session.accounts[session.provider]?.accessToken
          ? session.accounts[session.provider].accessToken
          : token.accessToken;
      session.user.login = token.login;
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return safeCallbackUrl(url, baseUrl);
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
    accounts?: Record<string, { accessToken?: string; login?: string }>;
    user: {
      login?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    accessToken?: string;
    provider?: string;
    login?: string;
    accounts?: Record<string, { accessToken?: string; login?: string }>;
  }
}
