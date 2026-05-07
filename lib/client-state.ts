import { createHmac, timingSafeEqual } from "crypto";

export type PiperyClientId = "pipery-dashboard" | "pipery-workflow-gen";
export type PiperyProvider = "github" | "gitlab" | "bitbucket";

type SignedStatePayload = {
  clientId: PiperyClientId;
  provider: PiperyProvider;
  callbackUrl: string;
  nonce: string;
  issuedAt: number;
};

export type VerifiedState =
  | { ok: true; payload: SignedStatePayload }
  | { ok: false; error: string };

const MAX_STATE_AGE_MS = 5 * 60 * 1000;

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function appConfigs() {
  return new Map<PiperyClientId, string>([
    [
      (process.env.PIPERY_AUTH_DASHBOARD_CLIENT_ID as PiperyClientId) || "pipery-dashboard",
      process.env.PIPERY_AUTH_DASHBOARD_STATE_SECRET || ""
    ],
    [
      (process.env.PIPERY_AUTH_WORKFLOW_GEN_CLIENT_ID as PiperyClientId) || "pipery-workflow-gen",
      process.env.PIPERY_AUTH_WORKFLOW_GEN_STATE_SECRET || ""
    ]
  ]);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function sameSignature(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyClientState(clientId: string | undefined, state: string | undefined): VerifiedState {
  if (!clientId || !state) {
    return { ok: false, error: "Missing signed app state." };
  }

  const secret = appConfigs().get(clientId as PiperyClientId);
  if (!secret) {
    return { ok: false, error: "Unknown Pipery app client." };
  }

  const [encodedPayload, receivedSignature] = state.split(".");
  if (!encodedPayload || !receivedSignature) {
    return { ok: false, error: "Malformed signed app state." };
  }

  const expectedSignature = sign(encodedPayload, secret);
  if (!sameSignature(receivedSignature, expectedSignature)) {
    return { ok: false, error: "Invalid signed app state." };
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SignedStatePayload;
    if (payload.clientId !== clientId) {
      return { ok: false, error: "Signed app state client mismatch." };
    }
    if (Date.now() - payload.issuedAt > MAX_STATE_AGE_MS) {
      return { ok: false, error: "Signed app state expired." };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, error: "Unreadable signed app state." };
  }
}

export function createClientState(payload: SignedStatePayload, secret: string) {
  const encodedPayload = base64url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}
