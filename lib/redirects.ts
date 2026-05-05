const DEFAULT_CALLBACK_ORIGINS = [
  "https://auth.pipery.dev",
  "https://dash.pipery.dev",
  "https://start.pipery.dev",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002"
];

function allowedCallbackOrigins() {
  const configured = process.env.PIPERY_AUTH_ALLOWED_CALLBACK_ORIGINS
    ?.split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

  return configured?.length ? configured : DEFAULT_CALLBACK_ORIGINS;
}

export function safeCallbackUrl(value: string | null | undefined, fallback = "https://dash.pipery.dev") {
  if (!value) return fallback;

  try {
    const url = new URL(value);
    if (allowedCallbackOrigins().includes(url.origin)) {
      return url.toString();
    }
  } catch {
    if (value.startsWith("/")) {
      return new URL(value, "https://auth.pipery.dev").toString();
    }
  }

  return fallback;
}
