import { signOut } from "next-auth/react";
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Use NextAuth signOut instead" });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "https://dash.pipery.dev";

  const response = NextResponse.redirect(callbackUrl);
  response.cookies.delete("__Secure-next-auth.session-token");
  response.cookies.delete("next-auth.csrf-token");

  return response;
}
