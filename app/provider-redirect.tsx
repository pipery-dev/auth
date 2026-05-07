"use client";

import { useEffect } from "react";

type Provider = "github" | "gitlab" | "bitbucket";

const providerLabels: Record<Provider, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket Cloud"
};

const providerStyles: Record<Provider, string> = {
  github: "bg-gray-900 hover:bg-gray-800",
  gitlab: "bg-orange-600 hover:bg-orange-700",
  bitbucket: "bg-blue-700 hover:bg-blue-800"
};

export default function ProviderRedirect({
  provider,
  signInUrl
}: {
  provider: Provider;
  signInUrl: string;
}) {
  const providerLabel = providerLabels[provider];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.location.assign(signInUrl);
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [signInUrl]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Provider requested</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-3">Redirecting to {providerLabel}</h1>
          <p className="text-gray-600 text-sm mb-6">
            This app requested {providerLabel} login, so Pipery Auth will continue with that provider instead of showing every login option.
          </p>
          <div className="rounded border border-amber-200 bg-amber-50 p-4 mb-6">
            <p className="text-sm text-amber-900">
              If the redirect does not happen automatically, use the button below to continue.
            </p>
          </div>
          <a
            href={signInUrl}
            className={`w-full flex items-center justify-center gap-2 text-white font-medium py-3 px-4 rounded-lg transition-colors ${providerStyles[provider]}`}
          >
            Sign in with {providerLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
