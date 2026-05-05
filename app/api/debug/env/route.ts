export async function GET() {
  return Response.json({
    hasGitHubId: !!process.env.GITHUB_ID,
    gitHubIdLength: process.env.GITHUB_ID?.length || 0,
    hasGitHubSecret: !!process.env.GITHUB_SECRET,
    gitHubSecretLength: process.env.GITHUB_SECRET?.length || 0,
    nextAuthUrl: process.env.NEXTAUTH_URL || "MISSING",
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
  });
}
