import { PIPERY_PROVIDERS, PiperyProvider } from "./auth";

export function providerFromRequest(request: Request): PiperyProvider {
  const url = new URL(request.url);
  const pathProvider = url.pathname.match(/\/api\/auth\/(?:signin|callback)\/([^/?]+)/)?.[1];
  const queryProvider = url.searchParams.get("provider");
  const provider = pathProvider || queryProvider;

  if (provider && PIPERY_PROVIDERS.includes(provider as PiperyProvider)) {
    return provider as PiperyProvider;
  }

  return "github";
}
