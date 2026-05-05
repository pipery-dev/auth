import { NextResponse } from "next/server";

const COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.callback-url",
  "next-auth.callback-url",
  "__Host-next-auth.csrf-token",
  "next-auth.csrf-token"
];

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
  const callbackUrl = searchParams.get("callbackUrl") || "https://dash.pipery.dev";

  const response = NextResponse.redirect(callbackUrl);

  for (const name of COOKIE_NAMES) {
    expireCookie(response, name);
    if (!name.startsWith("__Host-")) {
      expireCookie(response, name, ".pipery.dev");
      expireCookie(response, name, "auth.pipery.dev");
    }
  }

  return response;
}
