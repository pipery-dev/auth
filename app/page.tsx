import { getServerSession } from "next-auth";
import { authOptionsForProvider } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/redirects";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProviderRedirect from "./provider-redirect";
import InvalidState from "./invalid-state";
import { verifyClientState } from "@/lib/client-state";

export default async function Home(props: {
  searchParams: Promise<{ callbackUrl?: string; provider?: string; client_id?: string; state?: string }>;
}) {
  const searchParams = await props.searchParams;
  const hasExternalAppRequest = !!(searchParams.client_id || searchParams.state);
  const verifiedState = hasExternalAppRequest
    ? verifyClientState(searchParams.client_id, searchParams.state)
    : null;

  if (verifiedState && !verifiedState.ok) {
    return <InvalidState error={verifiedState.error} />;
  }

  const signedPayload = verifiedState?.ok ? verifiedState.payload : null;
  const hasExplicitProvider = searchParams.provider === "github" || searchParams.provider === "gitlab" || searchParams.provider === "bitbucket";
  const requestedProvider =
    signedPayload?.provider ||
    (searchParams.provider === "gitlab" || searchParams.provider === "bitbucket"
      ? searchParams.provider
      : searchParams.provider === "github"
        ? "github"
        : undefined) ||
    "github";
  const requestedCallbackUrl = signedPayload?.callbackUrl || searchParams.callbackUrl;
  const shouldUseProviderHandoff = !!signedPayload || hasExplicitProvider;
  const session = await getServerSession(authOptionsForProvider(requestedProvider));
  const callbackUrl = safeCallbackUrl(requestedCallbackUrl);
  const hasRequestedProvider = !!session?.accounts?.[requestedProvider]?.accessToken;
  const requestedSigninUrl = new URL(`/api/auth/signin/${requestedProvider}`, "https://auth.pipery.dev");
  requestedSigninUrl.searchParams.set("callbackUrl", callbackUrl);

  if (session) {
    if (requestedCallbackUrl && !hasRequestedProvider) {
      return <ProviderRedirect provider={requestedProvider} signInUrl={requestedSigninUrl.toString()} />;
    }

    if (requestedCallbackUrl) {
      redirect(callbackUrl);
    }
    redirect("https://dash.pipery.dev");
  }

  if (shouldUseProviderHandoff) {
    return <ProviderRedirect provider={requestedProvider} signInUrl={requestedSigninUrl.toString()} />;
  }

  const githubSigninUrl = new URL("/api/auth/signin/github", "https://auth.pipery.dev");
  const gitlabSigninUrl = new URL("/api/auth/signin/gitlab", "https://auth.pipery.dev");
  const bitbucketSigninUrl = new URL("/api/auth/signin/bitbucket", "https://auth.pipery.dev");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pipery Auth</h1>
          <p className="text-gray-600 text-sm mb-8">Sign in to access Pipery Dashboard and Workflow Generator</p>

          <Link
            href={githubSigninUrl.toString()}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-6"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.19.092-.926.35-1.557.636-1.914-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.138 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
            Sign in with GitHub
          </Link>

          <Link
            href={gitlabSigninUrl.toString()}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-6"
          >
            Sign in with GitLab
          </Link>

          <Link
            href={bitbucketSigninUrl.toString()}
            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-6"
          >
            Sign in with Bitbucket Cloud
          </Link>

          <p className="text-center text-xs text-gray-500 mt-6">
            By signing in, you agree to Pipery&apos;s terms and authorize us to access your selected GitHub, GitLab, or Bitbucket Cloud repositories.
          </p>
        </div>
      </div>
    </div>
  );
}
