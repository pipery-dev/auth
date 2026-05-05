# Pipery Auth

Shared NextAuth service for Pipery apps.

Supported providers:

- GitHub OAuth with `repo workflow user:email` scope for repository listing and workflow PR creation.
- GitLab OAuth with `read_user api` scope for project listing and merge request creation.

## Environment

```bash
GITHUB_ID=your_github_oauth_app_client_id
GITHUB_SECRET=your_github_oauth_app_client_secret
GITLAB_ID=your_gitlab_oauth_app_client_id
GITLAB_SECRET=your_gitlab_oauth_app_client_secret
NEXTAUTH_SECRET=replace_with_a_long_random_secret
NEXTAUTH_URL=https://auth.pipery.dev
PIPERY_AUTH_ALLOWED_CALLBACK_ORIGINS=https://auth.pipery.dev,https://dash.pipery.dev,https://start.pipery.dev
```

The login page accepts an optional `provider` query parameter:

```text
https://auth.pipery.dev?provider=gitlab&callbackUrl=https%3A%2F%2Fstart.pipery.dev%2Fwizard
```

When `callbackUrl` is present, the service redirects directly into the selected provider sign-in flow.
Callback URLs are only honored for allowlisted origins, and the shared session stores GitHub and GitLab account tokens separately so one provider login does not overwrite the other.
