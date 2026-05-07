import { describe, expect, it } from "vitest";
import { providerFromRequest } from "./provider-router";

describe("providerFromRequest", () => {
  it("detects the provider from signin and callback paths", () => {
    expect(providerFromRequest(new Request("https://auth.pipery.dev/api/auth/signin/bitbucket"))).toBe("bitbucket");
    expect(providerFromRequest(new Request("https://auth.pipery.dev/api/auth/callback/gitlab"))).toBe("gitlab");
  });

  it("detects the provider from query params", () => {
    expect(providerFromRequest(new Request("https://auth.pipery.dev/api/auth/csrf?provider=bitbucket"))).toBe("bitbucket");
  });

  it("falls back to GitHub for unknown providers", () => {
    expect(providerFromRequest(new Request("https://auth.pipery.dev/api/auth/signin/unknown"))).toBe("github");
  });
});
