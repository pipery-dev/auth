import NextAuth from "next-auth";
import { authOptionsForProvider } from "@/lib/auth";
export { providerFromRequest } from "@/lib/provider-router";
import { providerFromRequest } from "@/lib/provider-router";

function handler(request: Request, context: any) {
  return NextAuth(authOptionsForProvider(providerFromRequest(request)))(request, context);
}

export { handler as GET, handler as POST };
