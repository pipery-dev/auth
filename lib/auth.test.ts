import { describe, expect, it } from "vitest";
import { authOptionsForProvider, BitbucketProvider, providerSessionCookieName } from "./auth";

describe("Bitbucket OAuth provider", () => {
  it("uses authorization code flow without requesting OpenID scopes", () => {
    const provider = BitbucketProvider({ clientId: "id", clientSecret: "secret" });

    expect(provider.id).toBe("bitbucket");
    expect(provider.authorization).toMatchObject({
      url: "https://bitbucket.org/site/oauth2/authorize",
      params: {
        response_type: "code",
        scope: "account email repository repository:write pullrequest pullrequest:write",
      }
    });
  });

  it("keeps the Bitbucket OAuth endpoints and token auth method stable", () => {
    const provider = BitbucketProvider({ clientId: "id", clientSecret: "secret" });

    expect(provider.token).toBe("https://bitbucket.org/site/oauth2/access_token");
    expect((provider.userinfo as any).url).toBe("https://api.bitbucket.org/2.0/user");
    expect(provider.checks).toEqual(["state"]);
    expect(provider.client).toMatchObject({
      token_endpoint_auth_method: "client_secret_basic"
    });
  });

  it("maps a fallback Bitbucket profile into a stable NextAuth user", () => {
    const provider = BitbucketProvider({ clientId: "id", clientSecret: "secret" });

    expect(provider.profile?.({ account_id: "bitbucket-user", display_name: "Bitbucket User" })).toEqual({
      id: "bitbucket-user",
      name: "Bitbucket User",
      email: null,
      image: undefined
    });
  });
});

describe("auth options", () => {
  it("registers GitHub, GitLab, and Bitbucket providers", () => {
    const options = authOptionsForProvider("bitbucket");

    expect(options.providers.map(provider => provider.id)).toEqual(["github", "gitlab", "bitbucket"]);
  });

  it("uses provider-specific session cookie names", () => {
    expect(providerSessionCookieName("github")).toBe("__Secure-pipery-auth.github.session-token");
    expect(providerSessionCookieName("gitlab")).toBe("__Secure-pipery-auth.gitlab.session-token");
    expect(providerSessionCookieName("bitbucket")).toBe("__Secure-pipery-auth.bitbucket.session-token");
  });

  it("keeps relative auth redirects on the current auth origin", async () => {
    const options = authOptionsForProvider("github");

    await expect(options.callbacks?.redirect?.({ url: "/api/auth/signin", baseUrl: "https://auth.pipery.dev" })).resolves.toBe(
      "https://auth.pipery.dev/api/auth/signin"
    );
  });

  it("falls back to the auth origin for disallowed absolute redirects", async () => {
    const options = authOptionsForProvider("github");

    await expect(
      options.callbacks?.redirect?.({ url: "https://evil.example.test/callback", baseUrl: "https://auth.pipery.dev" })
    ).resolves.toBe("https://auth.pipery.dev");
  });

  it("stores provider tokens by account and exposes the active account on the session", async () => {
    const options = authOptionsForProvider("github");
    const jwt = options.callbacks?.jwt;
    const session = options.callbacks?.session;

    const token = await jwt?.({
      token: {},
      account: { provider: "gitlab", access_token: "gitlab-token" },
      profile: { username: "gitlab-user" }
    });

    expect(token).toMatchObject({
      accessToken: "gitlab-token",
      provider: "gitlab",
      login: "gitlab-user",
      accounts: {
        gitlab: {
          accessToken: "gitlab-token",
          login: "gitlab-user"
        }
      }
    });

    await expect(
      session?.({
        session: { user: {} },
        token
      })
    ).resolves.toMatchObject({
      provider: "gitlab",
      accessToken: "gitlab-token",
      user: {
        login: "gitlab-user"
      },
      accounts: {
        gitlab: {
          accessToken: "gitlab-token",
          login: "gitlab-user"
        }
      }
    });
  });
});
