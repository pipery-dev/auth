import { NextResponse } from "next/server";
import { safeCallbackUrl } from "@/lib/redirects";

const PROVIDERS = ["github", "gitlab", "bitbucket"] as const;
type Provider = (typeof PROVIDERS)[number];
const DEFAULT_SESSION_COOKIE_PREFIX = "__Secure-pipery-auth";

function sessionCookiePrefix() {
  return process.env.PIPERY_AUTH_SESSION_COOKIE_PREFIX || DEFAULT_SESSION_COOKIE_PREFIX;
}

const LEGACY_COOKIE_NAMES = [
  "__Secure-pipery-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "__Secure-pipery-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.callback-url",
  "__Host-pipery-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.csrf-token"
];

function providerCookieNames(provider: Provider) {
  const prefixes = new Set([sessionCookiePrefix(), DEFAULT_SESSION_COOKIE_PREFIX]);
  return [
    ...Array.from(prefixes).flatMap(prefix => [
      `${prefix}.${provider}.session-token`,
      `${prefix}.${provider}.callback-url`
    ]),
    `__Host-pipery-auth.${provider}.csrf-token`
  ];
}

function expireCookie(response: NextResponse, name: string, domain?: string) {
  response.cookies.set(name, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain,
    expires: new Date(0),
    maxAge: 0,
    path: "/"
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const provider = searchParams.get("provider") as Provider | null;
  const providerScope = provider && PROVIDERS.includes(provider) ? provider : null;

  const response = NextResponse.redirect(callbackUrl);
  const requestCookies = request.headers.get("cookie") || "";
  const requestCookieNames = requestCookies
    .split(";")
    .map(cookie => cookie.trim().split("=")[0])
    .filter(Boolean);

  const baseCookieNames = providerScope
    ? [...providerCookieNames(providerScope), ...LEGACY_COOKIE_NAMES]
    : [...PROVIDERS.flatMap(providerCookieNames), ...LEGACY_COOKIE_NAMES];
  const cookiePrefixes = baseCookieNames.map(name => `${name}.`);

  const namesToExpire = new Set([
    ...baseCookieNames,
    ...requestCookieNames.filter(name => baseCookieNames.includes(name) || cookiePrefixes.some(prefix => name.startsWith(prefix)))
  ]);

  for (const name of namesToExpire) {
    expireCookie(response, name);
    if (!name.startsWith("__Host-")) {
      expireCookie(response, name, ".pipery.dev");
      expireCookie(response, name, "auth.pipery.dev");
    }
  }

  return response;
}
