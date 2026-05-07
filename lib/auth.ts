import GitHubProvider from "next-auth/providers/github";
import GitLabProvider from "next-auth/providers/gitlab";
import { NextAuthOptions, DefaultSession } from "next-auth";
import { OAuthConfig } from "next-auth/providers/oauth";
import { safeCallbackUrl } from "./redirects";

export type PiperyProvider = "github" | "gitlab" | "bitbucket";
export const PIPERY_PROVIDERS: PiperyProvider[] = ["github", "gitlab", "bitbucket"];
const DEFAULT_SESSION_COOKIE_PREFIX = "__Secure-pipery-auth";

const gitHubId = process.env.GITHUB_ID?.trim() || "";
// Use write-scope secret by default (works for both read and write operations)
const gitHubSecret = process.env.GITHUB_SECRET_WRITE?.trim() || process.env.GITHUB_SECRET?.trim() || "";
const gitLabId = process.env.GITLAB_ID?.trim() || "";
const gitLabSecret = process.env.GITLAB_SECRET?.trim() || "";
const bitbucketId = process.env.BITBUCKET_ID?.trim() || "";
const bitbucketSecret = process.env.BITBUCKET_SECRET?.trim() || "";
function providerCookiePrefix(provider: PiperyProvider) {
  return `${process.env.PIPERY_AUTH_SESSION_COOKIE_PREFIX || DEFAULT_SESSION_COOKIE_PREFIX}.${provider}`;
}

export function providerSessionCookieName(provider: PiperyProvider) {
  return `${providerCookiePrefix(provider)}.session-token`;
}

console.log("[AUTH] GitHub Provider Config:", {
  clientId: gitHubId,
  clientIdLength: gitHubId.length,
  hasSecret: !!gitHubSecret,
  secretLength: gitHubSecret.length
});

type BitbucketProfile = {
  uuid?: string;
  account_id?: string;
  username?: string;
  nickname?: string;
  display_name?: string;
  links?: {
    avatar?: {
      href?: string;
    };
  };
};

function BitbucketProvider(options: { clientId: string; clientSecret: string }): OAuthConfig<BitbucketProfile> {
  return {
    id: "bitbucket",
    name: "Bitbucket Cloud",
    type: "oauth",
    authorization: {
      url: "https://bitbucket.org/site/oauth2/authorize",
      params: {
        scope: "account email repository pullrequest"
      }
    },
    token: "https://bitbucket.org/site/oauth2/access_token",
    userinfo: "https://api.bitbucket.org/2.0/user",
    client: {
      token_endpoint_auth_method: "client_secret_basic"
    },
    checks: ["state"],
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    profile(profile) {
      return {
        id: profile.account_id || profile.uuid || profile.username || profile.nickname || profile.display_name || "bitbucket-user",
        name: profile.display_name || profile.nickname || profile.username || "Bitbucket User",
        email: null,
        image: profile.links?.avatar?.href
      };
    },
    allowDangerousEmailAccountLinking: true
  };
}

export function authOptionsForProvider(cookieProvider: PiperyProvider = "github"): NextAuthOptions {
  const cookiePrefix = providerCookiePrefix(cookieProvider);

  return {
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
      }),
      BitbucketProvider({
        clientId: bitbucketId,
        clientSecret: bitbucketSecret
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
          const provider = account.provider as PiperyProvider;
          const login = profile?.login || profile?.username || profile?.nickname || profile?.display_name || token.login;
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
        if ((profile as any)?.nickname) {
          token.login = (profile as any).nickname;
        }
        if (!token.login && (profile as any)?.display_name) {
          token.login = (profile as any).display_name;
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
        name: providerSessionCookieName(cookieProvider),
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
          domain: ".pipery.dev"
        }
      },
      callbackUrl: {
        name: `${cookiePrefix}.callback-url`,
        options: {
          sameSite: "lax",
          path: "/",
          secure: true,
          domain: ".pipery.dev"
        }
      },
      csrfToken: {
        name: "__Host-pipery-auth.csrf-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true
        }
      }
    }
  };
}

export const authOptions = authOptionsForProvider("github");

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
