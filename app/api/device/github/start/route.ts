import { NextResponse } from "next/server";

const DEVICE_CODE_URL = "https://github.com/login/device/code";

export async function POST() {
  try {
    const clientId = process.env.GITHUB_ID;

    if (!clientId) {
      return NextResponse.json(
        { error: "GitHub device flow is not configured on this deployment." },
        { status: 500 }
      );
    }

    const response = await fetch(DEVICE_CODE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        scope: "read:user repo"
      }).toString()
    });

    const payload = await response.json();

    if (!response.ok || (payload as any).error) {
      return NextResponse.json(
        {
          error: (payload as any).error_description || (payload as any).error || "Unable to start GitHub device flow."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deviceCode: (payload as any).device_code,
      userCode: (payload as any).user_code,
      verificationUri: (payload as any).verification_uri,
      expiresIn: (payload as any).expires_in,
      interval: (payload as any).interval
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unable to start GitHub device flow." },
      { status: 500 }
    );
  }
}
