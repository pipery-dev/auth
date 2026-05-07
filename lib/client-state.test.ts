import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientState, verifyClientState } from "./client-state";
import { safeCallbackUrl } from "./redirects";

const fixedNow = new Date("2026-05-07T12:00:00.000Z").getTime();
const dashboardSecret = "dashboard-state-secret";
const workflowSecret = "workflow-state-secret";

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function dashboardPayload(overrides = {}) {
  return {
    clientId: "pipery-dashboard" as const,
    provider: "github" as const,
    callbackUrl: "https://dash.pipery.dev/projects",
    nonce: "nonce-123",
    issuedAt: fixedNow,
    ...overrides
  };
}

function stubStateSecrets() {
  vi.stubEnv("PIPERY_AUTH_DASHBOARD_CLIENT_ID", "pipery-dashboard");
  vi.stubEnv("PIPERY_AUTH_DASHBOARD_STATE_SECRET", dashboardSecret);
  vi.stubEnv("PIPERY_AUTH_WORKFLOW_GEN_CLIENT_ID", "pipery-workflow-gen");
  vi.stubEnv("PIPERY_AUTH_WORKFLOW_GEN_STATE_SECRET", workflowSecret);
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("signed client state", () => {
  it("creates and verifies signed state for the expected client", () => {
    stubStateSecrets();
    vi.setSystemTime(fixedNow);

    const state = createClientState(dashboardPayload(), dashboardSecret);
    const result = verifyClientState("pipery-dashboard", state);

    expect(result).toEqual({
      ok: true,
      payload: dashboardPayload()
    });
  });

  it("rejects missing client or state values", () => {
    expect(verifyClientState(undefined, "state")).toEqual({
      ok: false,
      error: "Missing signed app state."
    });
    expect(verifyClientState("pipery-dashboard", undefined)).toEqual({
      ok: false,
      error: "Missing signed app state."
    });
  });

  it("rejects unknown clients before reading the state", () => {
    stubStateSecrets();

    expect(verifyClientState("unknown-client", "not.a.real.state")).toEqual({
      ok: false,
      error: "Unknown Pipery app client."
    });
  });

  it("rejects malformed state values", () => {
    stubStateSecrets();

    expect(verifyClientState("pipery-dashboard", "missing-signature")).toEqual({
      ok: false,
      error: "Malformed signed app state."
    });
  });

  it("rejects invalid signatures", () => {
    stubStateSecrets();
    vi.setSystemTime(fixedNow);

    const state = createClientState(dashboardPayload(), dashboardSecret);
    const [encodedPayload] = state.split(".");

    expect(verifyClientState("pipery-dashboard", `${encodedPayload}.wrong-signature`)).toEqual({
      ok: false,
      error: "Invalid signed app state."
    });
  });

  it("rejects state signed for a different client", () => {
    stubStateSecrets();
    vi.setSystemTime(fixedNow);

    const state = createClientState(
      dashboardPayload({ clientId: "pipery-workflow-gen", callbackUrl: "https://start.pipery.dev/new" }),
      dashboardSecret
    );

    expect(verifyClientState("pipery-dashboard", state)).toEqual({
      ok: false,
      error: "Signed app state client mismatch."
    });
  });

  it("rejects expired state", () => {
    stubStateSecrets();
    vi.setSystemTime(fixedNow);

    const state = createClientState(dashboardPayload({ issuedAt: fixedNow - 5 * 60 * 1000 - 1 }), dashboardSecret);

    expect(verifyClientState("pipery-dashboard", state)).toEqual({
      ok: false,
      error: "Signed app state expired."
    });
  });

  it("rejects unreadable signed payloads", () => {
    stubStateSecrets();

    const encodedPayload = Buffer.from("not-json").toString("base64url");
    const state = `${encodedPayload}.${sign(encodedPayload, dashboardSecret)}`;

    expect(verifyClientState("pipery-dashboard", state)).toEqual({
      ok: false,
      error: "Unreadable signed app state."
    });
  });
});

describe("safe callback URLs", () => {
  it("allows configured absolute callback origins", () => {
    vi.stubEnv("PIPERY_AUTH_ALLOWED_CALLBACK_ORIGINS", "https://app.example.test, http://localhost:9999");

    expect(safeCallbackUrl("https://app.example.test/welcome?from=auth")).toBe(
      "https://app.example.test/welcome?from=auth"
    );
    expect(safeCallbackUrl("http://localhost:9999/callback")).toBe("http://localhost:9999/callback");
  });

  it("normalizes relative callback URLs against the auth origin", () => {
    expect(safeCallbackUrl("/signed-in?next=/projects")).toBe(
      "https://auth.pipery.dev/signed-in?next=/projects"
    );
  });

  it("falls back for disallowed absolute callback origins and empty values", () => {
    expect(safeCallbackUrl("https://evil.example.test/steal", "https://dash.pipery.dev/fallback")).toBe(
      "https://dash.pipery.dev/fallback"
    );
    expect(safeCallbackUrl(null, "https://dash.pipery.dev/fallback")).toBe("https://dash.pipery.dev/fallback");
  });

  it("uses the built-in allowed callback origins when none are configured", () => {
    expect(safeCallbackUrl("https://start.pipery.dev/create")).toBe("https://start.pipery.dev/create");
  });
});
