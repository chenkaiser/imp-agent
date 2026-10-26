# IMP Agent

Standalone operations assistant at https://ask.impops.work.

The frontend is in `web/` and is deployed to the dedicated Azure Static Web App
`imp-agent-web` in `imp-dev-rg`. It uses the existing IMP .NET backend at
https://api-dev.impops.work. IMPUI is a reference for the Acumatica sign-in flow;
this app does not depend on the IMPUI frontend.

## Authentication

1. Load public OAuth configuration from `/v1/impuser/auth/acumatica/config`.
2. Redirect to Acumatica using Authorization Code + PKCE (S256) and random state.
3. Return to `https://ask.impops.work/login` and verify state and request age.
4. Send the code and verifier to `/v1/impuser/auth/acumatica/code` on the IMP API.
5. Send chat requests to `/v1/Chat` with the IMP bearer token and the user's
   Acumatica access token. Existing backend account mapping and roles apply.

The Acumatica Connected Application must allow the exact redirect URI
`https://ask.impops.work/login`. The frontend contains no client secret or model key.
Sessions expire when the IMP or Acumatica token expires; sign-out clears the local
session and conversation. The chat interface supports streamed responses,
cancellation, and new conversations.

After sign-in at `/login`, users choose a working persona at `/personas`:
Sales Representative, Customer Service Representative, Production, Executive, or IT Admin.
Production is available only to Manager, Executive and SystemAdmin accounts and
provides read-only Acumatica manufacturing and IMP product-log tools.
The selected persona provides initial conversation context and tailored starting
questions. It does not change the IMP account role or grant additional access.
Switching personas starts a new conversation and keeps the same authenticated
session. The chat workspace is at `/chat`.

## Checks

With Node.js installed:

```sh
npm ci
npm test
```

Tests cover PKCE, state validation, auth response mapping, token expiry,
fragmented streaming, token forwarding, safe text rendering, and sign-out.

## Deployment

### Automatic deployment

GitHub Actions workflow: `.github/workflows/deploy-agent.yml`.

- Pull requests targeting `main` run syntax checks and the application tests.
- Every push to `main` runs the same checks, then deploys `web/` to the existing
  `imp-agent-web` Static Web App at https://ask.impops.work.
- A post-deployment check compares the public release files with the pushed
  commit and verifies the login, persona selection, and chat routes.
- A manual run is available under **GitHub > Actions > IMP Agent CI/CD > Run workflow**.

The repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN_IMP_AGENT` contains the
deployment token for this site. It is configured on GitHub, never in source files.
To configure it again or after rotating the Azure token, run
`.azure/configure_github_deploy.py` while signed in to Azure CLI and GitHub CLI.

The pipeline publishes the standalone agent frontend. The shared IMP .NET backend
has a separate repository and deployment process. DNS and Acumatica Connected
Application configuration are not changed on each push.

Persona-query release gates are documented in [Persona query testing](docs/persona-query-testing.md).
Run `npm run test:queries` for the browser cases or `npm test` for all UI tests.
The backend's `scripts/test-agent-ci.sh` runs the named persona-query suite and
all remaining backend regressions before any configured deployment.

### Manual deployment

After Azure CLI login, run `.azure/deploy_web.py` using Python with `requests`
installed. It deploys `web/` with Microsoft's Static Web Apps CLI, keeps the
deployment token in memory, and configures the `ask` CNAME and custom hostname.
The selected subscription must contain `imp-dev-rg`; review
`.azure/deployment-plan.md` before deployment.

The old `imp-bot/` and `imp-bot-deploy/` folders are the legacy Teams price-sheet
demo, not the standalone IMP Agent frontend.

Browser widget: see [installation and pilot checks](extensions/ask-imp/README.md). Run npm run package:widget to build the Chrome/Edge package. The compact /widget interface uses the same backend as the full website; only the pinned extension can frame it.
