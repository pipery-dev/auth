# Pipery Auth

Pipery Auth is now a Dex-backed OIDC service.

Dex is the single issuer for Pipery apps:

```text
https://auth.pipery.dev/dex
```

It brokers login through GitHub, GitLab, and Bitbucket Cloud connectors, and exposes separate OIDC clients for:

- `pipery-dashboard`
- `pipery-workflow-gen`
- `pipery-release-bot`
- `pipery-deploy-bot`

## Helm

The chart wraps the upstream Dex chart:

```bash
helm dependency update charts/pipery-auth
helm upgrade --install pipery-auth charts/pipery-auth -n pipery
```

Required secrets:

```text
pipery-dex-connectors:
  github-client-id
  github-client-secret
  gitlab-client-id
  gitlab-client-secret
  bitbucket-client-id
  bitbucket-client-secret

pipery-dex-clients:
  dashboard-client-secret
  workflow-gen-client-secret
  release-bot-client-secret
  deploy-bot-client-secret
```

## App Configuration

The bots validate Dex bearer tokens when configured:

```bash
PIPERY_DEX_ISSUER=https://auth.pipery.dev/dex
PIPERY_RELEASE_DEX_CLIENT_ID=pipery-release-bot
PIPERY_DEPLOY_DEX_CLIENT_ID=pipery-deploy-bot
```

Dashboard and workflow generator use direct GitHub, GitLab, and Bitbucket Cloud OAuth so they can keep provider API tokens for repository operations. Dex still registers static clients for those apps so the issuer can be used for future OIDC-only flows that do not need provider API tokens.

The app redirect URLs are:

```text
https://dash.pipery.dev/api/auth/callback/github
https://dash.pipery.dev/api/auth/callback/gitlab
https://dash.pipery.dev/api/auth/callback/bitbucket
https://start.pipery.dev/api/auth/callback/github
https://start.pipery.dev/api/auth/callback/gitlab
https://start.pipery.dev/api/auth/callback/bitbucket
```

The existing static API token env vars still work for workflow-triggered automation:

```bash
PIPERY_RELEASE_API_TOKEN=...
PIPERY_DEPLOY_API_TOKEN=...
```

## Provider Tokens

Dex handles identity. GitHub, GitLab, and Bitbucket API access should be performed with app installation tokens, bot credentials, or scoped automation tokens owned by the relevant Pipery service.
