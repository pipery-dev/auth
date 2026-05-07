# Pipery Auth

Shared NextAuth service for Pipery apps.

Supported providers:

- GitHub OAuth with `repo workflow user:email` scope for repository listing and workflow PR creation.
- GitLab OAuth with `read_user api` scope for project listing and merge request creation.
- Bitbucket Cloud OAuth uses authorization code grant. Scopes are configured on the Bitbucket OAuth consumer, not requested per login.

## Environment

```bash
GITHUB_ID=your_github_oauth_app_client_id
GITHUB_SECRET=your_github_oauth_app_client_secret
GITLAB_ID=your_gitlab_oauth_app_client_id
GITLAB_SECRET=your_gitlab_oauth_app_client_secret
BITBUCKET_ID=your_bitbucket_oauth_consumer_key
BITBUCKET_SECRET=your_bitbucket_oauth_consumer_secret
NEXTAUTH_SECRET=replace_with_a_long_random_secret
NEXTAUTH_URL=https://auth.pipery.dev
PIPERY_AUTH_SESSION_COOKIE_PREFIX=__Secure-pipery-auth
PIPERY_AUTH_ALLOWED_CALLBACK_ORIGINS=https://auth.pipery.dev,https://dash.pipery.dev,https://start.pipery.dev
PIPERY_AUTH_DASHBOARD_CLIENT_ID=pipery-dashboard
PIPERY_AUTH_DASHBOARD_STATE_SECRET=shared_hmac_secret_for_dashboard
PIPERY_AUTH_WORKFLOW_GEN_CLIENT_ID=pipery-workflow-gen
PIPERY_AUTH_WORKFLOW_GEN_STATE_SECRET=shared_hmac_secret_for_workflow_gen
```

The login page accepts an optional `provider` query parameter:

```text
https://auth.pipery.dev?provider=gitlab&callbackUrl=https%3A%2F%2Fstart.pipery.dev%2Fauth%2Fcallback%3Fprovider%3Dgitlab%26next%3D%252Fwizard
```

Callback URLs are only honored for allowlisted origins, and the shared session stores GitHub, GitLab, and Bitbucket Cloud account tokens separately so one provider login does not overwrite the other.

When a valid `provider` is supplied, Pipery Auth shows a short provider handoff screen and auto-redirects to that provider. The page keeps a single provider-specific login button as a fallback if the redirect does not happen. Without `provider`, the auth page shows all login options.

App-originated login requests must include `client_id` and signed `state`. The state is an HMAC-signed payload containing the Pipery app id, requested provider, callback URL, nonce, and issue time. Auth verifies this before trusting the callback URL or provider, so dashboard and workflow-gen login requests are cryptographically tied to their configured client ids.

`PIPERY_AUTH_SESSION_COOKIE_PREFIX` must match the dashboard and workflow generator value. The auth service writes provider-specific session cookies such as `__Secure-pipery-auth.github.session-token`, `__Secure-pipery-auth.gitlab.session-token`, and `__Secure-pipery-auth.bitbucket.session-token`. Logout also clears old generic NextAuth cookie names so existing browser sessions can recover cleanly.

Logout accepts an optional `provider` query parameter. For example, `/api/auth/logout?provider=gitlab&callbackUrl=...` clears only the GitLab cookies; omitting `provider` clears every Pipery provider session.
