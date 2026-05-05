import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home(props: {
  searchParams: Promise<{ callbackUrl?: string; provider?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);
  const requestedProvider = searchParams.provider === "gitlab" ? "gitlab" : "github";
  const activeProvider = session?.provider || "github";

  if (session) {
    if (searchParams.callbackUrl && activeProvider !== requestedProvider) {
      const signinUrl = new URL(`/api/auth/signin/${requestedProvider}`, "https://auth.pipery.dev");
      signinUrl.searchParams.set("callbackUrl", searchParams.callbackUrl);

      const logoutUrl = new URL("/api/auth/logout", "https://auth.pipery.dev");
      logoutUrl.searchParams.set("callbackUrl", signinUrl.toString());
      redirect(logoutUrl.toString());
    }

    if (searchParams.callbackUrl) {
      redirect(searchParams.callbackUrl);
    }
    redirect("https://dash.pipery.dev");
  }

  // Auto-redirect to signin if callbackUrl is present (no intermediate page needed)
  if (searchParams.callbackUrl) {
    const signinUrl = new URL(`/api/auth/signin/${requestedProvider}`, "https://auth.pipery.dev");
    signinUrl.searchParams.set("callbackUrl", searchParams.callbackUrl);
    redirect(signinUrl.toString());
  }

  const githubSigninUrl = new URL("/api/auth/signin/github", "https://auth.pipery.dev");
  const gitlabSigninUrl = new URL("/api/auth/signin/gitlab", "https://auth.pipery.dev");

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

          <p className="text-center text-xs text-gray-500 mt-6">
            By signing in, you agree to Pipery&apos;s terms and authorize us to access your selected GitHub or GitLab repositories.
          </p>
        </div>
      </div>
    </div>
  );
}
