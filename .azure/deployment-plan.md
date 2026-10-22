# Standalone IMP Agent web deployment

Status: Deployed; Acumatica redirect registration pending
Recipe: AZCLI + Microsoft Static Web Apps CLI.

## 1. User requirements

Deploy a separate IMP Agent browser app at https://ask.impops.work.
IMPUI is an example of Acumatica authentication, not the agent frontend.
Use Acumatica OAuth Authorization Code + PKCE, existing IMP account permissions,
and the existing IMP API chat tools for IMP and Acumatica data.
After sign-in, require persona selection: Sales Representative, Customer Service
Representative, Executive, or IT Admin. Each has tailored starting questions and
initial conversation context. Persona selection never changes account permissions.
Switching personas clears the conversation and generates a new conversation ID.

## 2. Azure target

Subscription: Azure subscription 1 (d5f280e5-f697-4938-9ba4-fb792e1b39f0).
Resource group: imp-dev-rg. Region: Central US.
New dedicated Static Web App: imp-agent-web, Free SKU.
Existing backend: imp-dev-ca at https://api-dev.impops.work.

## 3. Application and authentication

Static app in web/, no runtime server or build step.
Public auth config: GET /v1/impuser/auth/acumatica/config.
Callback: https://ask.impops.work/login, state checked and PKCE verifier stored
in browser session storage for at most 10 minutes.
Token exchange: POST /v1/impuser/auth/acumatica/code, handled by IMP backend.
Chat: POST /v1/Chat, with IMP bearer token and X-Acumatica-Access-Token header.
Access tokens retained only in session storage, cleared on expiry/sign-out.
No model keys, Acumatica secrets, or shared service credentials in the frontend.

## 4. Deployment

Create separate Free Static Web App, publish web/ using the SWA CLI deployment
token captured in memory, remove the mistakenly added ask binding from imp-dev-web,
point ask CNAME to the new host, bind ask.impops.work and provision managed HTTPS.
IMPUI app-dev.impops.work and backend remain unchanged.

## 5. Validation steps

- Node syntax checks and node:test PKCE/state/session/SSE tests.
- DOM tests: invalid callback blocked, valid exchange, both tokens forwarded,
  untrusted chat rendered as text, mobile sign-out clears session and messages.
- Backend health and CORS already confirmed.
- No RBAC roles assigned; existing backend retains all authorization enforcement.
- Verify deployment, public host, JavaScript assets, custom domain and TLS.

## 6. External authentication dependency

Acumatica accepts the existing https://app-dev.impops.work/login redirect but
returns unauthorized_client for https://ask.impops.work/login. User has been
asked to add that exact URI to Connected Application
A01E22A2-0818-05B5-65FF-4DF0D97A69FE@International Media Products.
Do not claim end-to-end sign-in passed until this is fixed and verified.

## 7. Validation Proof

2026-10-22: PKCE RFC 7636 vector, authorize parameters, response casing,
IMP/Acumatica expiry, fragmented SSE tests passed (5 checks). JavaScript syntax
checks passed. Live backend CORS allows ask.impops.work. Acumatica callback
comparison confirms the new redirect needs provider registration.

All 7 automated checks pass, including both DOM application flows. npm audit
reports zero vulnerabilities. Node syntax checks pass. No infrastructure
RBAC requirements for the static frontend. Provider callback registration is
an explicit pending external action; the deployed sign-in screen can be reviewed
before it is registered. Build and deployment validation otherwise passed.

2026-10-22 persona update: all 8 automated checks passed. Verified all four
personas, selection required before chat, selection and mobile switching,
conversation reset, unchanged bearer token/account role, context within the API
message length limit, and safe handling of unknown persona IDs. Syntax checks pass.

## Deployment progress

Dedicated imp-agent-web is live at https://gray-pebble-018b02310.6.azurestaticapps.net.
Root, /login and JavaScript assets return 200 with security headers. Removed the
incorrect ask binding from imp-dev-web and updated DNS to the dedicated host.
Azure reports ask.impops.work as Ready and public HTTPS is working.

Final checks (2026-10-22): https://ask.impops.work/ and /login, /personas, /chat
all return 200. All five deployed app assets match the tested workspace files.
The dedicated frontend includes all four personas and is separate from IMPUI.
Eight automated tests pass. Acumatica still rejects the new redirect with
unauthorized_client; real sign-in and an authenticated live chat cannot be
verified until the Connected Application allows https://ask.impops.work/login.
Browser visual inspection was unavailable because no browser surface is enabled;
application flow was verified through DOM tests and public HTTP checks.
