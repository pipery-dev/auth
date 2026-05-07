"use client";

import { signIn } from "next-auth/react";

type Provider = "github" | "gitlab" | "bitbucket";

const providerStyles: Record<Provider, string> = {
  github: "bg-gray-900 hover:bg-gray-800",
  gitlab: "bg-orange-600 hover:bg-orange-700",
  bitbucket: "bg-blue-700 hover:bg-blue-800"
};

export default function ProviderSignInButton({
  provider,
  callbackUrl,
  children
}: {
  provider: Provider;
  callbackUrl: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => void signIn(provider, { callbackUrl })}
      className={`w-full flex items-center justify-center gap-2 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-6 ${providerStyles[provider]}`}
    >
      {children}
    </button>
  );
}
