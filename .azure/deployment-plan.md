# Standalone IMP Agent web deployment



Status: Validated

Recipe: AZCLI + Microsoft Static Web Apps CLI.



## 1. User requirements



Deploy a separate IMP Agent browser app at https://ask.impops.work.

IMPUI is an example of Acumatica authentication, not the agent frontend.

Use Acumatica OAuth Authorization Code + PKCE, existing IMP account permissions,

and the existing IMP API chat tools for IMP and Acumatica data.

After sign-in, automatically select the sole server-authorized persona; otherwise

require persona selection: Sales Representative, Customer Service

Representative, Production, Executive, or IT Admin. Each has tailored starting questions and

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



- Linked production progress: all validation checks pass.

  - Full backend suite verifies exact progress question, verified linked operations, genuine no-link result, unavailable progress and changed-link denial.

  - Release build with zero errors, unchanged dependencies and verified two-file runtime overlay.

  - Fresh existing Azure baseline 166, existing roles/model/scale.

  - Image-only deployment and health/readiness/traffic/anonymous denial/settings/role verification. No IaC/schema/identity changes; infrastructure validation/what-if/provisioning inapplicable.



- Material-readiness display: all validation checks pass.

  - Run full backend suite covering flattened report identity/unit projection, actual display, shortages, incomplete evidence and existing conversion checks.

  - Release build, zero errors, unchanged dependencies and verified two-file runtime overlay.

  - Fresh existing Azure baseline 165; model/scaling/six scoped roles unchanged.

  - Deploy image only; verify health/readiness/traffic/anonymous denial/settings/roles. No schema/IaC/identity changes; infrastructure validation/what-if/provisioning inapplicable.



- Order follow-up refinement: all validation checks pass.

  - Full backend suite includes exact possessive Nitto question + refinement through real pipeline, fresh search outside initial results, zero-result filter disclosure, unchanged filters and role-denial checks.

  - Release build and verified two-file runtime overlay; zero errors, no new dependencies.

  - Fresh existing Azure target baseline 164; existing model/scaling/six roles preserved.

  - Image-only deployment; verify health/readiness, traffic, anonymous denial, settings and roles. No IaC/schema/identity changes; infrastructure validation/what-if/provisioning inapplicable.



- Customer PO compound-question and full ship-to address fix: all validation checks pass.

  - Run complete backend suite including exact PO 41321 question, embedded-dot references, customer-name punctuation, full-address disclosure/rendering and existing customer ownership checks.

  - Release build and verified two-file runtime overlay, no dependency changes.

  - Fresh existing Azure target preflight: baseline revision 163, existing roles/model/scale.

  - Deploy image only and verify health/readiness/traffic/anonymous denial and settings/roles unchanged. No IaC, schema or identity changes; infrastructure validation/what-if/provisioning inapplicable.



- Order-query presentation clauses: all validation checks pass.

  - Run full backend suite including exact natural Customer Service question, display-suffix parsing, real item/PO filter preservation and ownership checks.

  - Build Release; zero errors and unchanged dependencies. Verify two-file immutable runtime overlay.

  - Verify existing approved Azure target, baseline revision 162, model, scaling and scoped identity roles.

  - Deploy image only; verify healthy readiness, traffic, anonymous denial and unchanged roles/settings. Infrastructure validation/what-if/provisioning are inapplicable because no IaC, schema or identity changes are made.



- Sales-order list inventory IDs: all validation checks pass.

  - Run full backend tests for item display, unavailable data, truncation, returned-order-only detail reads and order/customer mismatch denial.

  - Build Release with no errors; verify unchanged dependencies and two-file runtime overlay.

  - Verify approved existing Azure target, baseline revision 161, scoped roles, model and scaling.

  - Deploy immutable image only; verify healthy/readiness, anonymous denial and unchanged settings/roles.

  - No infrastructure, schema, identity or business-write changes; infrastructure validation/what-if/provisioning are inapplicable.



- Shared conversation tasks (all personas): all validation checks pass.

  - Verify Azure CLI identity and the approved existing Container App and baseline image.

  - Run complete backend regression suite, including PersonaQuery continuity, topic resumption, expiry and isolation tests.

  - Build the API in Release; verify zero build errors and unchanged dependencies.

  - Review the existing scoped role checks and verify six live managed-identity assignments.

  - Publish a verified two-file runtime overlay; deploy only its immutable image digest.

  - Verify healthy revision, readiness, anonymous chat denial, unchanged settings and scaling.

  - Infrastructure template validation, what-if and provisioning are not applicable: this update changes only the image on an existing app. No database schema or identity changes.



- Startup-catalog update: all validation checks pass with full backend tests,

  Release build, tenant-bound metadata-only service read, hard expiry,

  candidate-level own-token/ownership verification, bounded live query contract,

  and healthy revision with startup catalog counts logged before user login.

- Cache-warming update: all validation checks pass when backend and frontend

  suites cover authenticated preload, early refresh, hard expiry, single-flight,

  hidden-tab lifecycle, cancellation/retry and live ownership. Build Release,

  validate Terraform minimum1/max3, check current image and scoped RBAC, then

  confirm healthy revision, running replica, warm endpoint auth and web hashes.

- Price-class reference update: all validation checks pass when the full backend

  suite and Release build verify fallback priority, exact item/type/class scope,

  target-customer ownership, context filters and reference labels. Confirm live

  example data, current base image, resource-scoped RBAC and API health.

- Single-persona update: all validation checks pass when syntax checks and the

  frontend suite verify OAuth/session restore, single/multiple/zero persona

  choices, forbidden persona rejection and role downgrade handling.

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



Combined read-only workflow/IT usage proof (2026-10-25T01:39:49.234208+00:00):

- Full canonical backend1,417tests pass; Release0errors/1,202warnings. Frontend48tests and syntax pass. Tests include exact SysAdmin gates, monthly aggregates before user paging, cache tokens not double-counted, incomplete provider reporting, billing currency/period/partial-page checks, forecast month-end coverage, ledger idempotency, and no flush of tracked business entities. Normal-user workflow tests remain passing.

- Isolated PostgreSQL schema verifies actual EF monthly groupings and duplicate-event protection; removed afterward. Public additive telemetry schema/indexes applied; verification row rolled back. No business records or account assignments changed.

- Compiled reader used direct Azure Monitor/CostManagement query/forecast APIs: allHTTP200;718729input/29901output/748630total;actual0.47435755USD throughOct24UTC;Azure native forecast0.651881613071274760USD. Probe used correct operator tenant; deployed identity explicitly uses ManagedIdentityCredential and the six scoped assignments are verified separately.

- Scoped additions: Monitoring Reader on imp-dev-ai,Cost Management Reader on imp-dev-rg; both imported into Terraform, existing resource state keys retained. terraform fmt-check/validate pass. No broad apply, infrastructure resize or new paid resources.

- Private prompt/answer/customer text is not stored. Internal append-only usage telemetry is separate from read-only persona tools; manual admin screens preserved, KPI development deferred. No retroactive user attribution is claimed.

- Current live baseline remains155/be2dd443,min1/max3,Luna. Registry packagecd6bc2980e992158da905275c4b14d8752a112418bf3c3699575f63619a4ebaa verified: base image/config/layer digests, Linuxamd64,/app runtime, onlydll/pdb layer;DLLsha256eaad3a7d55c15fdd2c56e266a7492cbc9146ac6d294c84cd4569628cd8278176. This is the verified registry-v2 equivalent of the overlay Dockerfile. cj2c canceled while queued and never deployed. Tokens remained in memory and signed blob redirects do not forward registry credentials.

- Deploy only this immutable image plus the fixed public AiFoundryResourceId environment value; preserve all other settings. Rollback is baseline155 (telemetry table may remain). Verify health, anonymous guards, startup catalogs, six roles and frontend assets. Authenticated browser replay remains unclaimed.





Normal-user read-only workflow proof (2026-10-25T01:15:24.550087+00:00):

- Scope: Sales quote/stock, Customer Service fulfillment review, Production demand/materials/handoff reads. User deferred KPI development and explicitly retained manual KPI and Sales Access admin screens. No business write, notification or print action exposed through chat.

- dotnet test impapi.Tests/impapi.Tests.csproj --no-restore -p:BaseOutputPath=C:/source/imp-agent/.tools/read-workflows-bin/:1,397passed,zero failures. Includes grouped duplicate demand, verified UOM conversions, missing/failed/mismatched scope, own-token calls, exact role/disclosure gates, no selling data in manufacturing, full service pipeline without LLM, HTTP GET/filter escaping, sync uncertainty and existing routing.

- dotnet build impapi/impapi.csproj --no-restore -c Release with same BaseOutputPath:0errors(existing1,201warnings).

- npm run check / npm test:syntax passes,48tests pass. No package/schema/infrastructure/config changes.

- Read-only live probe: ORD247844 exact SO/type filter returns one manufacturing header, zero rows outside requested scope. SO0000178 line has MAIN warehouse, SQM, open quantity3168 and unit price returned. ShipToAddress exposes AddressLine1/2,City,State,PostalCode,Country; shipments collection returned. Diagnostic account only; no user-browser chat replay claimed. Probe logged out in finally; secrets in memory only.

- Tenant can ignore production $orderby, so production results explicitly use ERP page order without newest-first/global-total claims.

- Production role access stays1/2/99; new service readiness role7 plus1/2/99. Sales does not gain access to these new operational tools; existing own-customer guards preserved. Manufacturing schema strips prices, addresses and notes.

- Source Terraform and Azure live state verify scoped AcrPull,BlobDataContributor,KeyVaultSecretsUser,OpenAIUser. Baseline155/be2dd443,min1/max3,Luna unchanged. No provisioning/templates to validate/what-if for this assembly/static-only update.

- Docker overlay changes only tested API dll/pdb. ACR cj2c build must succeed before activation. Rollback is baseline155.





2026-10-24 Production persona proof (UTC 2026-10-25T00:50:26.636320+00:00):

- User chose exact Manager, Executive and SystemAdmin access only. Tool registry, production API access guard and disclosure role gates unchanged; Operator/Packer access remains denied.

- dotnet test impapi.Tests/impapi.Tests.csproj --no-restore -p:BaseOutputPath=C:/source/imp-agent/.tools/production-persona-bin/: 1,362 passed, zero failures. Existing production-order read/routing tests retained. New role, inactive, legacy/retained persona, tool-scope and cross-domain shortcut guards pass.

- dotnet build impapi/impapi.csproj --no-restore -c Release with same BaseOutputPath: zero errors (1,201 existing warnings).

- npm run check and npm test: syntax passes, 48 tests pass; Production UI, server capability gates and single-persona auto-selection covered.

- az account show and containerapp show: correct subscription, baseline154 immutable imagea6ad490, min1/max3. No provisioning/configuration/schema/dependency changes. Bicep/what-if not applicable to assembly/static-assets-only update.

- Static Terraform role definitions reviewed; az role assignment list --all confirms four scoped identity roles: AcrPull, Storage Blob Data Contributor, Key Vault Secrets User, Cognitive Services OpenAI User. No role changes needed.

- Dockerfile overlays only tested impapi.dll/pdb on verified live image; ACR build cj2b pending verification before activation. Rollback image remains baseline154.





2026-10-23 autocomplete failure/session isolation validation: kchen confirmed failing account. Existing telemetry shows /lookups?kind=item&q=zeb503 despite userinfo200 and outbound StockItem200, whereas earlier identicallookup200; fullquery integration-account probe returns valid40rows and zeroNonStockItems. Root cause under investigation; no claim of resolved kchen replay. Default IHttpClientFactory previously shared cookie-enabled handler between service-cookie and bearer calls. Dedicated AcumaticaBearer client now UseCookies=false/AllowAutoRedirect=false, no session-cookie inheritance. Candidate401/redirect becomes session-expired401,403 remains accessdenied, other malformed/scope failures still failclosed with sanitized diagnostic logging. Full1,324tests passed; Release0errors(existing1,201warnings), ownership/metadata guards preserved. Base153/image2ec2bf, min1/max3/Luna/scopedroles unchanged, no packages/schema/secrets/ERP assignments changed. This release adds safe session isolation and diagnostic evidence for continued investigation.



Session-isolation deployment: ACR cj2a digesta6ad490ccc76f2ad1d6252a9819461fc86d885f92e067643a30503501e3cc836; revision imp-dev-ca--0000154 Healthy/Running/latestReady. Startup log confirmed688customers/4222items; all14webfiles/fiveroutes verified, four MIroles and min1/max3 unchanged. Requested kchen retry through asynchronous question; account-specific success remains pending, not claimed.



2026-10-23 startup catalog validation: full backend1,321tests passed; Release0errors(existing1,201warnings). Hosted worker loads active Customer/StockItem/NonStockItem metadata immediately on launch, refresh20min, retries1min, hardexpiry30min. Dedicated read-only cookie session binds to current OAuth tenant (legacy service Company differs; no secret changed), HTTPS host checked and logout finally; service credentials already configured in KV. Shared catalogs contain metadata only. Every suggestion verifies current user/tenant; own-token candidate queries re-read active metadata and Salespersons for Sales users before any result disclosure. No cached ownership or other customer prices/notes. Up to80 ranked candidates in40-ID batches; broad searches bounded and markedmoreMatches. Existing per-session cache remains fallback. Warm endpoint no-ops when shared catalogs ready. Live scoped queries verified two customer rows with assignments217ms and exact item203ms; no ERP record mutations. Startup base152/b60337, Luna, min1/max3 and four scoped MIroles verified. No new packages/schema/Azure resources or roles.



Startup preload deployment complete: final ACR cj29 digest2ec2bfdc077a3da5f88a6ab0ba72e7e47d32bccb5670416f481fcd3c9563592d; revision imp-dev-ca--0000153 latestReady, min1/max3, latest traffic100%. New-container log explicitly confirmed automatic preload before user login: 688 customers and 4,222 active items. All14webfiles/fiveroutes verified unchanged. Final worker catches transient configuration/provider/network failures without stopping the API. Current counts supersede earlier diagnostic counts as ERP active records change.



2026-10-23 cache warming validation: full canonical backend1,313 tests passed; frontend46tests and JS syntax checks passed. Release0errors (existing1,201warnings). POST /v1/Chat/lookups/warm authenticated/role/token/salesperson gated, same90/min per-user rate limiter, returns204/no records. Both per-user/role/OAuth-session metadata catalogs preloaded without waiting for chat; visible-tab refresh20min and server softrefresh20min/hardexpiry30min, single-flight loads, valid old metadata available during refresh, failed/cancelled refresh cannot extend hardexpiry. Browser45s timeout,1min transient retry,401/403stop, visibility resume and signout abort tested. Customer ownership remains live for actual suggestions/submission. Azure checked minReplicas unset(default0),max3,0.5vCPU/1GiB; setting min1 with max3 retained, ACR Basic unchanged. Terraform default/example/existing tfvars min1, targeted fmt and validate passed; unrelated existing main.tf formatting not changed. Current base151/image5a6c1c/Luna and four scopedMIroles verified; no schema/dependency/secret/ERP/permission changes. New processes and scale-out may still require session preload; no shared Redis or token-retaining background worker.



Cache warming deployment completed: ACR cj27 succeeded, digestb6033760a7304b4b34f7b2c89ff04906ed29df7bb2a311dfd67394d7334190e0; revision imp-dev-ca--0000152 Healthy/Running/latestReady, one Running replica verified, min1/max3 and latest-revision traffic100%. API health200, unauthenticated POST warm401, four MI roles unchanged, ACR Basic unchanged. SWA production release verified14files plus all five routes. Browser visible-session warm lifecycle verified by DOM tests; live authenticated salesagent1 latency replay not claimed.



2026-10-23 price-class reference validation: full canonical backend suite passed 1,308 tests; Release build zero errors (existing 1,201 warnings). Regressions cover customer/assigned-class/base priority, explicit zero listed prices versus zero item default, positive references from multiple classes, currency/UOM/quantity/date filters, unknown/mixed customer/item/class scope denial, readable highlighted class code and reference-based discount labels. Live read-only exact item ZEB110300VR -LLI for LLT001 verified empty Customer/LLT001-class/Base inquiries, DefaultPrice0ROLL, and Customer Price Class LABLOG13.52ROLL. Currency/break absent on live row remain unknown. No customer with ID LABLOG returned. Broadened inquiry is constrained to Customer Price Class and exact inventory; target-customer ownership rechecked before it, no other-customer prices requested, no reference-class notes exposed. Four resource-scoped MI roles verified live/static; latest base150/image0eeea8 and Luna preserved. API assembly-only change; no packages/schema/secrets/ERP mutations or infrastructure changes.



Price-class reference deployment completed: ACR cj26 succeeded, digest5a6c1c6ce15a6d6a0958eb2e9413799964f3ff1a067fab068502d4c366a0534a, revision imp-dev-ca--0000151 Healthy/Running/latestReady. Existing latest-revision traffic100%, API health HTTP200, 13 frontend release files and all five routes verified. Live source inquiry verified; authenticated salesagent1 chat replay not performed because browser has only ERP tabs.



2026-10-23 single-persona validation: npm run check passed; npm test passed all 40 tests. OAuth callback and restored sessions automatically open the single recognized server-authorized persona, with duplicate/unknown IDs handled safely; multiple choices retain selection. Failed/empty capability lookups stay closed. Role downgrade clears restricted conversation and selects the remaining allowed persona. No automatic chat/model call. Desktop/mobile switch controls hidden for one option. Static frontend only; no build compilation, API/schema/RBAC/dependency changes. Existing approved subscription and imp-agent-web Free CentralUS custom domain verified through az account show and az staticwebapp show. Existing backend permissions remain enforced server-side.



Single-persona deployment: SWA CLI 2.1.0 production release succeeded. node scripts/verify-deployment.mjs confirmed all 13 release files and login/persona/chat/KPI/sales-access routes at https://ask.impops.work. Four existing resource-scoped backend managed-identity roles verified unchanged. Authenticated sign-in behavior covered by DOM integration tests; no claim of live account replay.



2026-10-23 persona pricing validation: canonical1298tests passed; Release0errors(existing1201warnings); web35tests plus JS syntax checks passed. Trusted selected/retained persona reaches deterministic formatter. Sales currentIMPPrice+latestSOprice only, no notes/history list; Service at most3distinctSOidentities with price rows and relevant notes. Both personas skipinvoicehistoryreads; partial-history caveats preserved. Order links generated only for validated OrderType/OrderNbr; Complete allowlist derived from authorized positive-schema evidence, frontend restricts exact ERP origin/company/SO301000 and matching orderlabel, noopener/noreferrer. Live browser link SO0000181 opened correct SO301000 record. Testing exposed CS7 denied by genericOperator response nodes and HTTP chat filter: fixed only approved Sales-tool defaultfields and active-known-account chat authentication; production/Manager/admin roles remain restricted and regression-tested. No schema/package/secret/ERP/Azure role changes. Base149 verified; four scoped MI roles verified, static definitions unchanged; existing autocomplete/Luna preserved.



2026-10-23 autocomplete validation: backend1,285tests pass; Release0errors. Web33tests pass plus JS syntax checks. GET /v1/Chat/lookups role/token gated with own-session metadata cache30min and bounded200k records; live Sales login/mapping/assigned customer set checked on every suggestion request; final selected customer ownership rechecked before lookup. Only active StockItem/NonStockItem/Customer metadata, no prices/notes; no browser persistence. Dedicated90/min per-user suggestion limiter. Verified exact selected IDs preserved through pricing; duplicates/stale/forged selections rejected. Live read-only catalogs688activecustomers/4,223activeitems, knownrecordsfound; customer716ms/item4391ms cold. 200ms debounce,2char minimum,max8 results, cancellation/IME/keyboard/accessibility/chips tested. One item and one customer only; batch pricing deferred by user. Cacheperprocess/peruser/role/OAuthsession; no schema/dependency/infrastructure/permission changes. Base148 latest image6b993a and four scopedMIroles verified; preserving concurrent existing changes. Authenticated browser replay pending because available tab still shows login.



2026-10-22 Brook name confirmation validation: canonical backend1,261tests pass; Release0errors (existing1201warnings). Exact read-only deployed-method diagnostic brooks whittle returns two verified Brook/Whittle candidates with NeedsConfirmation=true; signed-in ownership filters run before any candidate disclosure. No product, prices or notes read before confirmation; four sales-tool ownership-denial regressions passed. Existing ambiguity fixture expanded to two candidates, single candidate wording now confirmation. User explicitly confirmed LLT001. Live customer/class/base inquiries for item091018000EWR empty; itemdefault0.07SQM reference, currency unverified. Accessible LLT001 history checked21orders/7invoices, no exact itemlines. No accounts, ERP assignments, schemas, dependencies, secrets or Azure roles changed. Base146 and Luna preserved. Existing four scoped MI roles and static Terraform role definitions verified this session; no infrastructure provisioning.



2026-10-22 named-customer scope fix: salesagent1 live role Sales4 confirmed. Live Acumatica AbeTech ABET01 belongs to JB; LLT001 Brook + Whittle currently includes IMPAGENT. Deterministic parser dropped bare of/for/from customer and searched owned customers. Fix preserves name; no authorized candidate now fails closed with access denied, no order fallback. Cache interpretation version bumped. Regression exact user question and alternate phrasing passed; full backend1,254 tests passed, Release0errors (existing1201warnings). Base145 Luna image/config verified unchanged; no schema, role, secret, dependency or ERP assignment mutation. Existing managed identity scoped roles checked before release.



2026-10-22 requested GPT-5.6 Luna migration validation: existing imp-dev-ai CentralUS catalog/GlobalStandard quota verified; deployment gpt-5.6-luna version2026-07-09 capacity20 created Succeeded. Canonical backend1,248 tests passed; Release zero errors. Actual Azure SDK strict structured extraction, streamed function calls and usage passed; real IMP planner preserved synthetic customer/item scope; official Acumatica documentation search returned2 verified sources. Luna-specific handler translates max_tokens to max_completion_tokens and disables reasoning for lookup/tool flows. Reference cost estimate updated; unrelated models retain existing request parameters. Terraform model defaults updated and fmt/validate passed; state mapping will be reconciled after retiring the user-requested GPT-4.1 mini deployment. Existing API base revision144/image53a7e9 verified; four scoped managed-identity roles unchanged. No schema, secret, permission or dependency changes. API assembly/config update uses existing AZCLI recipe, no full infrastructure apply.



2026-10-22 bulk item-price history validation: canonical dotnet test1,241 passed; Release zero errors. Verified live minimal $expand=Details with selected price/quantity/unit/description fields works, whereas detail predicates and unrestricted expansion fail. New reader uses complete non-overlapping recent/older date windows, validates customer/date/item/paging, sorts locally, keeps ten recent matching lines and a12-second deadline per source, preserves newest matching document notes with at most one extra read per source, and reports partial coverage. UTC offset boundary regression covered. No schema, dependencies, permissions, infrastructure or configuration changes. Existing live image8c42a25/revision143 is base/rollback. Existing four scoped identity roles unchanged; static Terraform roles reviewed. Infrastructure validate/what-if inapplicable to application-only update. User multi-item example verified to parse as one description; batch pricing is not implemented.



2026-10-22 price/stock routing fix: canonical `dotnet test`1,228 passed, including9 new cases proving price questions bypass the stock shortcut with fresh and pending inventory context, exact Nitto price tool selection without model calls, and preserved stock routing. Canonical Release build zero errors. Existing live revision142/imagef646626 verified. Application-only assembly patch; no infrastructure, dependencies, schema, role grants or runtime configuration changes. Existing scoped static/live identity roles unchanged; infrastructure what-if inapplicable. Rollback is revision142.



2026-10-22 onboarding release: `dotnet test` 1,219 passed; Release build zero errors; IMPUI role tests12 passed; `npm test`27 passed and `npm run check` passed. `verify-onboarding-inquiry.ps1` verified own-user role rows and zero cross-user rows. `run-onboarding-postgres.py` concurrency/disabled-account check passed and additive production schema installed. `az account show`, `az containerapp show`, `az role assignment list --all` verified the existing subscription, revision141 and four unchanged scoped runtime roles. Terraform static scoped roles reviewed; no IaC or permission changes to Azure. Detailed onboarding proof is recorded at the end of this plan.



2026-10-22 Query optimization phase1 validation:

- `dotnet test --no-restore`:1,178 passed, including model-call counting for exact plan reuse, user/role/persona/history isolation, structured status/date/count preservation, explicit confirmation with revoked ownership, parallel history reads and per-user concurrency isolation. `npm test`:27 passed; syntax checks passed. Canonical and Release builds:zero errors. All canonical runtime sources match the tested assembly; dependencies unchanged.

- `az account show`, `az role assignment list --all`, `az staticwebapp show`, `az containerapp show` and `az containerapp replica list` confirmed existing subscription, four unchanged scoped roles, ask.impops.work, imagebf66f2/revision0000140 and one current replica with maximum3. Existing AZCLI application-only recipe; no provisioning, database, network, credentials or role grants. Infrastructure validate/what-if inapplicable to this application-only assembly update. Static Terraform role definitions unchanged and previously verified.

- Exact plan cache:500 entries,5-minute absolute expiry, only validated context-free model-generated data plans. Key includes version/date/user/role/persona/tool catalog/exact question hash. Follow-ups/open-page contexts bypass cache; no ERP data or authorization results cached. Every execution rechecks live permissions and source data.

- User limits default10requests/minute and2concurrent queries, configurable ChatRateLimits. Both are per-process; Redis/shared storage is required for one global quota across replicas. No Redis resource provisioned. CORS runs before rejection so the frontend can read quota guidance.

- Invoice/order history reads overlap with one scoped four-document-detail concurrency budget. Existing200-document reader is preserved: a verified server-side customer/item query remains phase2. Broader generic tool loops remain; common typed queries avoid a second tool-selection model call. Stage logs cover planning/execution/formatting/customer/product/prices/history/cache events.

- Rollback/current base: revision0000140/digestbf66f290b8146229fced6cde1c002627d636b84ea898d0cfee38362551155882.





2026-10-22 Sales persona-only correction validation: Sales role4 receives only

sales in GET Chat/personas; service requests, legacy headers and retained service

conversations are rejected before model/data reads. `dotnet test --no-restore`

passed1,163; `npm test` passed26; canonical and Release builds passed with zero

errors. All canonical runtime sources match the tested build. `az account show`,

`az containerapp show` and `az role assignment list --all` confirmed the same

subscription/currentrevision0000139 and four unchanged scoped roles. Existing

AZCLI app-only recipe, unchanged static Terraform/RBAC definitions. No database,

frontend runtime, dependencies or infrastructure changes; Bicep validate/what-if

inapplicable to this app-only assembly replacement. Base/rollback digest83b55908b00e302880f0296ff450dd69f34eedfe17e7f0460ba9c84402e0637f.





2026-10-22 persona security and requested-only totals validation:

- Exact SystemAdmin-only IT persona and assignment editor; Executive-only Executive persona and KPI endpoints/tools. Manager has neither restricted persona. Browser capabilities come from the authenticated current database user. Every chat request, legacy persona header and retained conversation is checked before data/model reads.

- `dotnet test impapi.Tests/impapi.Tests.csproj --no-restore`: 1,160 passed. `npm test`:26 passed; `npm run check` passed. Canonical and staged Release builds:zero errors.

- `az account show`, `az containerapp show`, `az role assignment list --all`, `az staticwebapp show` verified the existing subscription, live revision0000138, ask.impops.work and four existing scoped runtime roles. Static Terraform role definitions already verified and unchanged.

- Preserve newer PROD28 material mapping fix from canonical AcumaticaJumboIssue.cs and AcumaticaJumboBomTests.cs; no project/dependency changes. No infrastructure/database/credential/role grants. Application-only assembly image on exact current digestf2931bab9c8e14e86ccc5dcb3ca25508bc90d73697373b33a7da337158584de4; infrastructure validation/what-if is inapplicable to this application update.

- Sales-order summary totals render only on explicit current-question requests; individual order amounts remain visible. Rollback is existing revision0000138/digestf2931b.





2026-10-22 Customer Service update: `dotnet test impapi.Tests/impapi.Tests.csproj --no-restore` passed 1,115 tests; `npm test` passed 20; `npm run check` passed. Canonical Debug and staged Release builds succeeded. `az account show`, `az containerapp show`, `az staticwebapp show` and `az role assignment list --all` verified the existing target and scoped roles. Application-only update: no provisioning or dependency changes. Full evidence and rollback digest are recorded below.



2026-10-22 salesperson guard validation: `dotnet test` in .tools/guard-release

passed 1,082 tests, `npm test` passed 20 tests, `npm run check` passed, canonical

`dotnet build --no-restore` succeeded with zero errors. `az containerapp show`

confirmed image order-customer-notes / ready revision 0000133; `az role assignment

list --all` confirmed the existing identity's four scoped roles. Additive

sales-user-assignment.sql was applied to the verified existing PostgreSQL host;

insert/read succeeded and verification row was rolled back. Live read-only

Acumatica check found active salesperson IMPAGENT (SalesBot), assigned to NITTO

and ORORA01 in the returned 720-customer collection. No mappings saved yet.





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





## Sales access and order price release — 2026-10-22



Existing target only: imp-dev-ca API and imp-agent-web frontend in imp-dev-rg,

subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0. AZCLI/SWA CLI recipe.

No provisioning, DNS, secret, network or Azure role changes.



All validation checks pass:

- Backend full suite: 1,082 tests passed; explicit IMP salesperson mapping,

  audit/revocation, stale revision rejection, Sales admin endpoint denial,

  token/login/tenant verification, customer ownership on all sales tools.

- Frontend: 20 tests passed; JavaScript syntax checks pass; review before saving,

  authenticated API calls, access denial, literal text rendering.

- Existing UserAssigned API identity retains scoped AcrPull, Key Vault Secrets

  User, Storage Blob Data Contributor, Cognitive Services OpenAI User.

- Live baseline verified as order-customer-notes, revision 0000133. Release source

  includes existing material-line export and the order price/identity fix.

- Additive salesuserassignment table only; schema verifier uses a transaction

  rollback, creates no live access grants. Deploy API only after schema passes.

- Final image build, API health, anonymous authorization and frontend asset hashes

  must pass before claiming deployment verified.



Mapping choice supplied by user: salesagent1 → IMPAGENT. Validate live salesperson

before saving; sales users cannot edit mappings. Customer ownership remains in

Acumatica Customer.Salespersons, with no Employee link dependency.



Deployment verification: image sha256:ca2102b892e2399801d1dfc4e9976fadb7dd01e4984666832c9b5b3d8a9ca8c4

built successfully (ACR cj1d); API revision 0000134 is Healthy/Running/Provisioned.

API health200, anonymous SalesAccess401 and Chat401. All12 frontend release

assets and login/persona/chat/KPI/sales-access routes matched workspace hashes.

Live administrator verification: ORD247510 completed, NITTO, 96ROLL at USD21.76,

order totalUSD2088.96. Direct order UUID read and selling price fields work.

Live salesagent1 diagnostic found role2/manager, not Sales4. Automatic approval

review blocked correcting it without explicit user approval; no role update or

assignment has been saved. Per-user allow/deny verification remains pending.





## IMPUI role editor and sales calculations — 2026-10-22



Existing authorized frontend target: imp-dev-web, app-dev.impops.work. Fix only

role form bindings, stable role option tracking and copying the edited user row.

The regression reproduced Operator displayed for a saved Sales user; 12 browser

user-admin tests pass after correction. Azure production build succeeded.

Baseline main bundle compared with live f3cc2424659561eb4f7cdb2328e5e25898df61378fd8aa84f39af0a5a2d2ab0f:

normalized code differs only in webpack module/chunk IDs and Moment module maps;

all user-facing strings match. Existing material export remains in source/build.



Backend: no role/status cache on authorization reads; current DB row is checked

for every request. Sales order searches include OrderTotal and CurrencyID; totals

sum only returned orders and keep currencies separate; missing source amounts

prevent a complete total. Percentage estimates are deterministic decimal math

from approved same-turn price evidence, show source/formula/rounding, and do not

change IMP Price. Follow-ups re-fetch/re-authorize the customer. Historical-year

requests use that year's dated sales records, with no current-price substitution.

Backend suite passed 1,098 tests; final canonical build and ACR image must pass.

No new Azure resources, secrets, RBAC or DB schema changes in this update.

User explicitly approved salesagent1 Manager→Sales and IMPAGENT assignment:

saved mapping revision1; live SO0000177 denied and SO0000178 returned for NITTO.





Final sales release evidence, 2026-10-22:

- 1,099 backend tests passed, including an actual pipeline follow-up estimate

  denying a customer whose ownership changed; no stale assistant price was used.

- API image sha256:530d91a28b18b1c1b08c16e1a02f0cedd6b8a0eed951129c90f793e3686d5924

  built successfully in ACR run cj1g. Revision0000135 is Healthy/Running/Provisioned.

- API health200 and anonymous SalesAccess401 after deployment.

- IMPUI role-fix deployment matched all9 root release files/build metadata.

  Live saved/reopened salesagent1 retained Sales; mapping IMPAGENT revision1 saved.

- Live Sales account latest NITTO orders SO0000180/SO0000179/SO0000178 returned

  USD3359.04 each and a server-calculated total USD10077.12 for those3 orders.

- Live revision0000136 discount verification passed: NITTO / ZEB060300R7 -Z

  showed USD21.76/ROLL from INV000062 (2026-10-22), 5% discount estimate

  USD20.67/ROLL, and ORD247510 historical USD21.76/ROLL. Current IMP Price

  inquiry was unavailable and clearly disclosed; estimate used the recorded sale.

  Screenshot: .tools/verified-nitto-discount-estimate.png.





Completed-sale estimate correction validated: full backend suite 1,100 passed;

Release assembly built locally with zero errors using unchanged project/package

references. Runtime update is based on exact image530d91a28b18b1c1b08c16e1a02f0cedd6b8a0eed951129c90f793e3686d5924,

replacing only impapi.dll and matching PDB; manifest stores both SHA256 values.

ACR run cj1h succeeded, imageeb216442f28b0f90e7e782109b2f2160b13b2a8bbd742997b0e0049d3d3a0fd9.

A current inquiry failure does not become a fabricated IMP Price. An estimate can

use LatestCompletedSale, with source document/date and explicit historical basis;

2025 requests still cannot substitute a 2026/current price. Existing access guards

and dependency/config/runtime layers remain unchanged.



Clarification: TokenValidationService already queries the current DB user directly

for authorization. The removed one-day cache was in GetByUuIdAsync profile lookup;

the live access root cause was salesagent1's stored Manager role, now corrected

with user approval. Final runtime revision0000136 is Healthy/Running/Provisioned.





2026-10-22 Customer Service order search validation proof:

- Backend suite 1,115 passed; new PO/item, pagination, ambiguity, shipping-date and customer-scope tests. Frontend 20 passed; syntax checks passed.

- Canonical backend and Release assembly builds passed, zero errors.

- Existing API revision0000136/imageeb2164 verified Running; same four scoped managed-identity roles verified. Subscription and ask.impops.work target verified.

- No infrastructure, dependency, database, permission, credential or runtime configuration changes. AZCLI infrastructure validate/what-if is inapplicable to this application-only update; Dockerfile layers the tested assembly on the exact current live digest.

- Rollback: revision0000136 / imageeb216442f28b0f90e7e782109b2f2160b13b2a8bbd742997b0e0049d3d3a0fd9.



Customer Service deployment: ACR cj1k succeeded, digestsha256:b44ee80a6201f2f669d5f622a972b9e432e3719390eb9c6a549b7125fd18b749; revision0000137 Healthy/Running/Provisioned, latestReady137,100% traffic. Agent frontend12files and all5 application routes byte-verified. API health200 and anonymous SalesAccess401. Canonical13source/testfiles match the tested release. Authenticated live PO check awaiting user sign-in after session expiry.



Persona security / requested-only totals deployment complete: ACR cj1n succeeded; image sha256:83b55908b00e302880f0296ff450dd69f34eedfe17e7f0460ba9c84402e0637f. API revision0000139 Healthy/Running/Provisioned,100%traffic,latestReady139. All12frontendreleasefiles and5applicationroutes byte-verified. API health200; anonymous Chat/personas, SalesAccess and Kpi/catalog401. Backend1,160tests and frontend26tests passed. All canonical runtime source files match the tested combined release. No active browser tabs were available to verify signed-in role behavior live; do not claim that browser check passed.



Sales-only persona deployment completed: ACR cj1p succeeded; digestsha256:bf66f290b8146229fced6cde1c002627d636b84ea898d0cfee38362551155882; revision0000140 Healthy/Running/Provisioned,100%traffic,latestReady140. Existing frontend12files/5routes byte-verified. API200 and anonymous persona-capabilities401. Backend1,163/frontend26tests passed. No authenticated browser role check was available; role-specific behavior verified in automated tests.





2026-10-22 Acumatica Sales onboarding validation proof:

- Canonical backend 1,219 tests passed, Release build zero errors. Runtime C# source matches tested staged source after newline normalization, including concurrent MoveEntry Details-only correction. IMPUI account editor 12 tests passed.

- Permanent additive acumatica_login_identity schema applied without changing existing accounts. Six parallel first logins on an isolated schema reused one UUID; inactive account denied; isolated schema removed.

- IMP-UserAccess GI640593 published read-only with Users.PKID = @me. Approved SALES and Administrator View Only saved; all other 120 roles remain Revoked. Live OData returned five own-user role rows with valid fields; a different-login filter returned zero.

- Existing subscription and Container App revision0000141 verified; four scoped identity assignments unchanged. Current imagea76390 is the runtime base, preserving concurrent manufacturing deployment. No infrastructure or dependency changes; infrastructure validate/what-if inapplicable to this app/config-only update.

- Enable only SALES to Sales; Customer Service source role remains unconfirmed. Exact issuer and tenant pinned. No default privilege or salesperson mapping is inferred. Rollback: disable AcumaticaOnboarding__Enabled and return to revision0000141 if needed; keep additive schema.



Onboarding deployment result: ACR cj1u succeeded, digestf646626051e2de7cd43435ad757f533bb64cf8ad066169849086f7bf489bab8b, based on concurrent live revision141/imagea76390. Revision142 Healthy/Running/Provisioned,latestReady142,100%traffic. SALES mapping enabled with verified issuer/tenant/self-only GI path. Health200; anonymous Chat/personas,SalesAccess,Kpi/catalog401. IMPUI Azure production build/deployment and agent frontend deployment completed. First-time user OAuth verification pending user sign-in; Customer Service source role remains unconfirmed.



Frontend post-deployment verification: Agent12files/5routes byte-matched. IMPUI all8HTML/JS/CSS release files byte-matched; staticwebapp.config.json is consumed by SWA, not served publicly.



Price/stock routing build: ACR cj1v succeeded, digest8c42a25c180c284005dd2029c448938a6283e9cc83abcd798e4a98946f6a3e7d. Revision143 created from revision142 without configuration changes. Await health and latestReady verification. Exact user example now selects GetAcumaticaCustomerItemPrice deterministically. Live price data check requires authenticated session; do not claim a Nitto price was verified. Customer Service user-type mapping remains pending authenticated verification.



Price-routing deployment verified: revision143 Healthy/Running/Provisioned, latestReady143,100%traffic. Public health200; anonymous personas/SalesAccess/KPI401. Backend1,228 tests passed. No authenticated live pricing check yet.



Bulk-history live proof (read-only diagnostic account, same compiled reader): NITTO/ZEB110300PVW1538ms/4requests/no exact matching historical lines; NITTO/ZEB060300R7 -Z3433ms/6requests/order and invoice priced lines; HORNE01/DMX165360PVW2300ms/5requests/SO0000181 and its priced line verified. Includes latest matching document note enrichment. Query-only timing, not end-to-end chat latency. ACR cj1w succeeded, digest53a7e9c2cb2705dbd2cb33aa22074d1ada6a1c2433aea3fdda13f2e92bf6eb03. Tests1,241, Release0errors. No new permission, infrastructure, config, dependency or schema changes.



Bulk-history deployment verified: revision144 Healthy/Running/Provisioned,latestReady144,100%traffic, image53a7e9c2cb2705dbd2cb33aa22074d1ada6a1c2433aea3fdda13f2e92bf6eb03. Health200; anonymous personas/SalesAccess/KPI401. Backend1,241 passed. Live diagnostic reader performance and known SO0000181 evidence verified before deployment; signed-in browser round-trip not claimed.



Luna build proof: ACR cj1x succeeded, immutable image0e4d71f151af91e5d0270a3d1b676ddd7bd0a3f64b8b544d51780ce3e234e9f7. New model deployment Succeeded; SDK/planner/docs live checks passed;1,248 backend tests; Release0errors. User explicitly requested retiring GPT-4.1 mini, so remove its deployment only after Luna app revision is ready and serving traffic. Update the single Terraform chat-deployment state reference to the existing Luna deployment; do not perform a broad infrastructure apply.



Luna activation: revision145 reached latestReady145 with100%traffic, Healthy/Running; health200 and anonymous persona/SalesAccess/KPI401. Previous revision144 became inactive/Stopped/0replicas. User-requested GPT-4.1 mini deployment deleted; Azure deployment list contains only gpt-5.6-luna. Terraform chat import/default/output reconciliation in progress, without any broad infrastructure apply.



Final Luna migration verified: revision145 Healthy/Running/latestReady145,100%traffic; active modelgpt-5.6-luna. Only Luna remains in imp-dev-ai; GPT-4.1 mini removed. Terraform default, single chat deployment state and ai_foundry_deployment_name output point to Luna; all other managed-resource instances unchanged (an empty configured custom-domain state entry was normalized by Terraform). Targeted refresh-only updated state/output values without infrastructure mutation. Health200; prior anonymous guards401. Pre145 images require old SDK token compatibility and are not valid rollback targets for retired GPT-4.1; use the Luna-compatible145 image for subsequent rollback.



Customer-name scope fix deployed 2026-10-22: ACR cj1y Succeeded, image sha256:5ddcbfad438a3a1560cb5a3ca751b0d52fce25f856edaa2ae8c6dacc774ee48e, revision imp-dev-ca--0000146 latestReady/Healthy/Running/100%traffic. Health200; anonymous Chat/personas and SalesAccess401. Exact live customer ABET01/AbeTech has JB as its sole salesperson. Full1,254 tests passed including planner preservation and denial before any order read; Release0errors. Signed-in salesagent1 browser replay was not performed. Customer and user assignments unchanged. GPT-5.6 Luna configuration and compatibility retained.



Brook customer-name fix deployed 2026-10-22: ACR cj20 Succeeded; immutable image sha256:f14ee9e5a84cd52843ed572b6180c8a71ba0a0043881d945a6ffedb842f467e4; revision147 latestReady,Healthy,Running,100%traffic. API health200; anonymous Chat/personas and SalesAccess401; four scoped MI roles verified; Luna retained. Full1,261tests pass, Release0errors. Live exact corrected search verified candidate suggestions and confirmation; live user browser replay not performed. User confirmed Brook + Whittle LLT001; no ERP assignment/account/price changes. Item091018000EWR customer/class/base price inquiries empty, default0.07SQM currency unverified; accessible LLT001 history21orders/7invoices checked, no exact itemlines.



Autocomplete deployed 2026-10-23: ACR cj24 Succeeded; immutable API image sha256:e1e284a03858bbc6e415bad20f72ecb96bd3fb5e44892112472388887a27e081, revision149 latestReady/Healthy/Running/100%traffic. API health200, anonymous item/customer lookups401 and personas401. Frontend published to existing imp-agent-web; all13releaseasset hashes plus5routes verified at https://ask.impops.work. Canonical1285tests pass; frontend33tests plus JS syntax checks pass. Live read-only catalog reader688customers/4223items. Existing four scoped MI roles verified; no resource/role/schema/package changes. Authenticated user browser replay remains unverified: browser tab21 remained on Acumatica login despite user reporting sign-in; no credentials collected or substituted. Local preview server stopped; no test fixtures deployed. One item/customer selection, batch pricing deferred.



Persona pricing deployed 2026-10-23: ACR cj25 Succeeded; immutable API image sha256:0eeea81578dd00b220de02d1717f19536fea1eb2393b696585ebc7055d0a0764; revision150 latestReady/Healthy/Running/100%traffic. Health200; anonymous persona/lookup401. Frontend13asset hashes and5routes verified at https://ask.impops.work. Backend1298tests, web35tests, Release0errors. Full service pipeline link survival, exact safe frontend links, Sales note suppression, latestSO-only selection, three-distinct-SO Service limit, invoice exclusion, and CS sales-versus-production/admin permissions verified. Direct live ERP SO0000181 URL opened correct SO301000 record. No authenticated IMP Agent browser replay claimed. No database/ERP assignment/Azure permission/package changes; autocomplete and Luna retained.





2026-10-24 Production persona validation checklist (existing AZCLI/SWA targets):

All validation checks pass:

- Core validation: existing CLI authentication/subscription, current app image/config and role assignments; no infrastructure template or resource changes, so Bicep validation/what-if are inapplicable.

- Docker build: tested Release assembly-only overlay of verified current image; no dependency changes. Final ACR build must succeed before activation.

- Azure Policy: no resource provisioning, identity, network, policy or configuration changes; existing resource constraints retained.

- Backend tests, frontend tests/syntax, role/tool-scope restrictions, Release build and scoped identity checks.





Production persona deployed 2026-10-24: ACR cj2b Succeeded; image sha256:be2dd44387d681cd12e94f4fcb82dc5cd3b242bc5dbc07a8137f51cd0087c476; revision imp-dev-ca--0000155 latestReady, Healthy/Running/Provisioned, 1 replica, min1/max3. API health200, anonymous personas/lookups401. Startup catalogs ready688customers/4222items. Agent frontend deployed;14assets/fiveroutes byte-verified. Backend1,362tests,frontend48tests and syntax passed;Release0errors. Exact Production role eligibility1/2/99 per user decision; existing registry, endpoint and disclosure role gates unchanged, no new Operator/Packer privileges. No ERP/account/Azure permission/schema/dependency mutations. No authenticated user browser replay claimed. The subsequent sales-on-hold/order-approval discussion is a recommendation only; no order write features or Acumatica workflow changes were made.





2026-10-24 Normal-user read-only workflow validation checklist:

All validation checks pass:

- Core: verify existing Azure CLI session, approved subscription, current API baseline155, min1/max3, Luna model and scoped roles. No provisioning, template/config/schema/dependency changes; Bicep validate/what-if inapplicable.

- Docker build: tested Release assembly-only overlay on verified immutable live image; ACR build must succeed before activation.

- Azure policy: existing resource topology, network, identity and scale retained; no new resources or permissions.

- Full backend regression tests, role/scope/read-only catalog, stock arithmetic/unknowns/UOM, caller-token and model-free pipeline tests; frontend syntax/tests and deploy asset verification.

- User narrowed scope to normal users; KPI feature work deferred. Existing manual administration screens preserved by explicit user choice.





2026-10-24 Extended normal-user + IT Admin read-only release validation checklist:

All validation checks pass:

- Existing target155/be2dd443, correct subscription/resource group, min1/max3, Luna retained. User deferred KPI work and retained manual admin screens.

- Full backend1,417tests, frontend48tests/syntax and Release0errors (1,202 existing/compatibility warnings).

- New additive telemetry-only table/indexes: actual PostgreSQL isolated EF aggregates/idempotency verified; scratch schema removed. Public schema applied; verification row rolled back. No business records changed.

- Terraform fmt/validate pass; only Monitoring Reader on AI resource and Cost Management Reader on resource group were added to the existing managed identity, as required for requested API reports. Both assignments imported into state, no broad apply.

- Compiled Azure reader verified against Monitor/CostManagement/forecast: allHTTP200,718729input+29901output=748630tokens,0.47435755USD actual throughOct24UTC,0.651881613071274760USD Azure forecast. Operator-identity live probe; deployed managed-identity roles verified separately.

- Packaging: registry-v2 two-file layer equivalent of the existing overlay Dockerfile, preserving the baseline runtime/configuration/dependencies; verify layer DLL hash and published manifest digest before app activation. Intermediate ACR cj2c was canceled while still queued; it was never activated. No ACR/hosting plan upgrade.

- SystemAdmin-only token-user/topic/billing tools, no raw prompts/answers/customer details in ledger, no historical attribution invented. Per-user history begins with activation. Complete meter flags missing provider usage and excludes cached input from double counting.

- No new business write tools; chat uses positive read catalog. Cost API POSTs are read queries, and telemetry insert is internal accounting only.



Combined normal-user and IT Admin release deployed: revision imp-dev-ca--0000156 latestReady, 100% traffic, min1/max3; immutable image sha256:cd6bc2980e992158da905275c4b14d8752a112418bf3c3699575f63619a4ebaa. Startup catalogs ready: 688 customers and 4222 items. API health200; anonymous personas and item lookups401. Six scoped managed-identity assignments verified, including new AI Monitoring Reader and RG Cost Management Reader. Existing environment effective values preserved; Azure normalized an omitted value to an empty string on the unchanged IMPBudgetDbConn secret reference. Only new environment setting is the fixed AI resource ID. Frontend published to existing imp-agent-web; all14assets and five routes byte-match tested local files. Backend1417tests and frontend48tests pass; Release0errors. Live Azure APIs verified with operator identity; signed-in chat and deployed managed-identity report invocation were not replayed. Per-user telemetry starts at activation, without historical backfill. Executive ranking/KPI work remains deferred; manual admin screens preserved.



Question-category presentation refinement validated: backend1418tests pass, Release0errors. Same baseline156/runtime/dependencies/configuration/identity/scale, no infrastructure/schema/frontend changes. Global top categories aggregate the complete monthly category groups before limiting; per-persona request keeps persona categories. Question-only queries omit token/user tables, show count/share and explicit UTC recording coverage, and never imply historical backfill or stored exact questions. Positive SystemAdmin disclosure remains enforced. Publish tested two-file assembly overlay on immutable baseline156; no new permissions or resource provisioning, so infrastructure what-if inapplicable.



Question-category refinement deployed: revision157 latestReady157, image sha256:674c6692856cbb381f782b2e2c89a121553e012428ffa63107857bda721fe51b. Effective environment values and secret references match baseline156 (Azure omitted/empty secret value serialization normalized); min1/max3 retained, revision template omits default cooldown300/polling30 returned by app GET. Startup688customers/4222items, health200, anonymous personas401. Frontend14assets/fiveroutes remain byte-verified. Full1418tests pass, Release0errors; no user browser replay claimed. No historical questions backfilled.



Weekly production review validation checklist:

All validation checks pass:

- Core Validation: current Azure CLI authentication, approved subscription and live baseline157; full1438backend tests, exact role/disclosure and model-free user-question pipeline. Existing topology/configuration/dependencies unchanged; Bicep compile/validate/what-if inapplicable to assembly-only update.

- Docker Build: preserve immutable baseline157 runtime and dependencies; verify tested two-file assembly overlay hash before activation.

- Azure Policy Validation: no provisioning, RBAC, networking, scale, schema or policy changes. Existing restrictions retained.

- Live isolated Acumatica compiled-reader probe: weekOct19–25,5headers/5details/6openlines/5linkedproductionqueries/5verifiedstockreads (probe deliberately capped5). Scope/dateoffset conversion verified, more headers available. No business mutations. Per-user OAuth browser replay not claimed.

- Weekly tool requires exact roles1/2/99, positive Production tool catalog and positive final disclosure. No prices/notes/address fields. Aggregate stock once across page demand; unknown quantities/links stay unknown; no new-production conclusion from failed/truncated reads. Missing/overdue requested dates excluded and disclosed.



Weekly review validation proof (2026-10-25UTC / Oct24 New York): dotnet test impapi.Tests --no-restore BaseOutputPath=workspace/.tools/it-usage-bin:1438passed/0failed; dotnet build impapi --no-restore -cRelease:0errors/1203warnings. Read-only preflight-weekly.py verified subscription, baseline157, min1/max3,Luna,sixexistingRBAC; Terraform roles unchanged. run-weekly-probe.py verified the same compiled REST readers and demand builder against the live tenant. Published verified registry manifest26948f9b571cfb6f01ac0608fd84985c3fb4fa07f531955e0d22bbd1d7d5b3ca, DLL74739b00d225e247b8fdb6f100339d76a65214b957d2a2e4256a6286b7d3778e, base157. No Docker daemon needed for deterministic two-file overlay; no dependency changes. No schema/frontend/infrastructure changes, no Acumatica business writes. Deployment proceeds on existing approved targets; no subscription/region reselection or new resources.



Weekly review deployed: revision158 latestReady158/100%traffic, image26948f9b571cfb6f01ac0608fd84985c3fb4fa07f531955e0d22bbd1d7d5b3ca. Effective environment values/secret references verified against immutable baseline157, min1/max3 retained. Initial update response assertion was caused by response serialization; subsequent known-revision comparison confirmed settings unchanged. Startup catalogs688customers/4222items; health200, anonymous personas/lookups401. Existing frontend14assets/fiveroutes byte-verified. Exact user question passes full model-free Production pipeline test; live diagnostic tenant probe passed. Signed-in production browser query not replayed. SystemAdmin/Manager/Executive eligibility unchanged, all business writes excluded.



Scheduled production-week search validation checklist:

All validation checks pass:

- Core Validation: existing approved subscription and baseline158, full1445backend tests/Release0errors. User exact question executes through full Production pipeline without LLM; status and start/end date filters preserved, unknown/undated/out-of-range rows rejected, role restrictions unchanged.

- Docker Build: tested two-file assembly overlay preserves baseline158 runtime/configuration/dependencies. Verify layer/manifest before activation. No schema, frontend or infrastructure changes; Bicep compile/what-if inapplicable.

- Azure Policy Validation: no resource, RBAC, network, scale or policy mutations. Existing six managed-identity assignments retained.

- Live compiled REST reader probe verified both scheduled-start and scheduled-end weekOct19–25 queries;10rows each/HasMoretrue; returned dates revalidated. Read-only diagnostic session, no business records changed.



Scheduled search proof: dotnet test canonical impapi.Tests:1445passed/0failed; dotnet build canonical impapi Release:0errors/1203warnings. preflight-production-week.py verified approved target158,existing six roles,min1/max3,Luna. Source Terraform RBAC unchanged. Live compiled ReadProductionOrderHeadersCoreAsync start/end probes both passed with scoped date validation. Verified two-file overlay image d24fa45792fc429effaf3f94aeda44d8530d8151a9ee33501e2e7a8f8db00fa3 on immutable158, DLL6961719b4b250fa4c9224bb6bb5b93fa1b70c3925d957d71ea9ba37ca1fcdcc5. No new schema/dependencies/frontend/configuration or infrastructure, no writes. Validation completed Oct24 New York (Oct25UTC). Existing deployment authorization and Azure target retained.



Scheduled production-week search deployed: revision159 latestReady159, Healthy/Running,100%traffic, imaged24fa45792fc429effaf3f94aeda44d8530d8151a9ee33501e2e7a8f8db00fa3. Effective settings and secret references verified unchanged against baseline158; min1/max3/Luna retained. Startup688customers/4222items. Public health200; anonymous personas/lookups401. Six live identity roles unchanged. Existing frontend14assets/fiveroutes byte-verified. Both date bases verified against live tenant through compiled reader; exact natural-language request verified through full Production pipeline test. Signed-in user browser round-trip not replayed. Dates exclude undated orders and are explicitly labeled scheduled-start (default) or scheduled-end, not creation date.



Shared clarification release validation checklist:

All validation checks pass:

- Core Validation: full1467backend tests, including all five personas, no-tool ambiguous first turn, repeated choice, retained original week/page, authorized confirmation, failure follow-up, access/session messages, partial results/docs, and empty-result preservation. Existing approved subscription/baseline159; no endpoint/data/schema changes, no business writes.

- Docker Build: test Release0errors, two-file overlay on immutable159 preserves runtime/dependencies/configuration. No frontend changes.

- Azure Policy Validation: no provisioning, permissions, networking, scaling, policy or infrastructure changes. Existing six roles and min1/max3 retained; infrastructure what-if inapplicable.



Shared clarification validation proof: canonical dotnet test1467passed/0failed; Release0errors/1203warnings. preflight-shared-clarification.py verified baseline159, approved subscription, six existing roles,min1/max3,Luna. Static Terraform assignments unchanged. Exact ambiguous query and user confirmation verified through full Production pipeline; all five persona clarification routes verified without tools; all five failure paths tested for safe follow-up. Layer image4de32e1688c536228c8ee79f54107b828ab620fecd173218cee1c97f3a17b3bf verified against immutable159; DLL90373d3e3d77326f1eb5081b5b35698964f669be9ac18dc7f7bc9ec66172fc81. No ERP data contract, API permissions, database schema, frontend or runtime dependency changes. Existing approved Azure deployment target reused; no new resource provisioning.



Shared clarification deployed: revision160 latestReady160/Healthy/Running/100%traffic, image4de32e1688c536228c8ee79f54107b828ab620fecd173218cee1c97f3a17b3bf. Effective environment values and secret references match baseline159; min1/max3/Luna retained. Public health200; anonymous personas/lookups401; existing six live MI roles unchanged. Frontend14assets/fiveroutes byte-verified. Optional startup catalog log fetch failed at Azure CLI transport; readiness and HTTP checks passed, no preload-count claim made for160. All1467tests passed. Full multi-turn confirmation and all-persona policy verified in backend tests; authenticated user browser replay not performed.





Widget release validation (2026-10-25):

All validation checks pass:

- Core validation: existing Azure subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0 and Static Web App imp-agent-web/custom domain ask.impops.work verified. Existing deployment authorization reused.

- Build verification: npm run check; node --test tests/*.test.mjs tests/queries/*.test.mjs (58 tests); npm run package:widget; Python ZipFile.testzip. All passed. Static frontend has no compilation step.

- Security/static role verification: no backend, Terraform, identity, role, data contract or business write changes. Only /widget and /widget.html can be framed, by pinned extension iphbdlkanekjbajchkiceldloniipkfc. All standalone routes retain frame-ancestors none. Tokens remain inside same-origin hosted widget/popup, with PKCE, nonce and source checks; no tokens in extension messages or URL.

- Docker Build: inapplicable to static-only frontend update.

- Azure Policy Validation: no provisioning, resources, subscription policy, permissions, networking, DNS, SKU or scaling changes; existing free SWA reused. Infrastructure validate/what-if is inapplicable to a static content upload.

- Deployment verification will hash all published assets and both widget routes and check standalone/widget CSP response headers. Installed Chrome/Edge side-panel and live popup sign-in verification require installing the pilot package; automated fixtures do not claim these pass.



Widget deployment verified 2026-10-25T14:10:09.206565+00:00: existing imp-agent-web production static upload succeeded. All17 hosted release files and seven application routes match local SHA256 bytes; widget CSP allows only pinned extension; five standalone routes retain frame-ancestors none. Existing six backend managed-identity roles unchanged. In-app browser visibly loaded compact widget and its ready sign-in button; clicking displayed separate-window sign-in guidance. Installed-extension launch and complete OAuth popup roundtrip remain manual acceptance checks, not claimed as verified. Extension archive testzip passed.





Chrome Web Store release validation 2026-10-25T14:53:55.329399+00:00:

All validation checks pass:

- Core validation: existing approved subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0 and free Static Web App imp-agent-web with ask.impops.work verified through Azure CLI. Google draft kchcjmpfddihbhikfpmnlbmcpenpelmm observed in authenticated developer dashboard; Unlisted saved.

- Build verification: npm run check and all63 frontend tests passed. Store ZIP contains only bundled extension assets and valid PNG icons, with no pilot key, credentials or internal review documents.

- Static role/security verification: no backend roles, infrastructure, ERP permissions, business records or auth scopes change. Only widget frame-ancestors adds the exact observed Google store ID alongside the existing pilot ID. Five standalone routes retain frame-ancestors none. Added static privacy/support notice describes observed implementation and erp@imp-ttr.com contact.

- Docker build/infrastructure validate/what-if/policy modification: inapplicable to static file/CSP upload into existing SWA; no resources, SKU, DNS, scale, identity or networking changes.

- Verification: hosted asset hashes, both widget routes and exact frame-ancestor list will be checked after deployment. Authenticated installed-browser acceptance is separate from automated tests and not yet claimed.



Web Store support deployment verified 2026-10-25T14:57:57.601338+00:00: all19 static files and7 app routes match local hashes; exact pilot/store extension ancestors verified in both widget responses, standalone frame-ancestors none retained; six backend MI roles unchanged. Public privacy/support page deployed. No ERP changes.



### Shared conversation state validation — 2026-10-25



- Scope: common task lifecycle and follow-up context for Sales, Customer Service, Production, Executive and IT Admin. Topic-scoped state retains validated query parameters, bounded recent turns, missing-input questions and domain selection adapters. Explicit resumption asks on ambiguous topic names. Persona/role changes clear active and archived state.

- `dotnet test impapi.Tests/impapi.Tests.csproj --no-restore`: 1,526 passed, 0 failed. Includes all-persona continuation/resumption, context size, expiry, user isolation, role/persona invalidation, live-reader mocks for resumed pricing/production and customer ownership denial.

- `dotnet build impapi/impapi.csproj --no-restore -c Release -o C:/source/imp-agent/.tools/generic-state-bin`: 0 errors; 1,203 existing warnings. No project/dependency changes. Test/build logs in `.tools/generic-state-tests.log` and `.tools/generic-state-release.log`.

- Fresh preflight verifies subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0, imp-dev-rg / imp-dev-ca, baseline revision 160, model gpt-5.6-luna and min/max replicas 1/3.

- Static role review: no new cloud data operations, roles, scopes or IaC changes. Existing Terraform assigns AcrPull, resource-scoped Storage Blob Data Contributor, Key Vault Secrets User, Cognitive Services OpenAI User, Monitoring Reader and RG-scoped Cost Management Reader; live preflight confirms all six for the existing app identity.

- Infrastructure build/validate/what-if and provisioning are inapplicable to this existing-app image-only update. No schema migration, account changes or business writes. Existing approved subscription, location and permissions persist.

- Packaging verifies original immutable runtime/config/layer digests and changes only `/app/impapi.dll` and `/app/impapi.pdb`. Registry tag verification passed. Frontend tests are not claimed for this backend-only update.

- Persistence limitation: task state remains bounded process-local memory (30-minute inactivity / 4-hour absolute conversation expiry). Cross-replica/restart persistence requires a separate shared-store implementation; this release does not claim that capability.

- Published immutable image: `impdevacrfnxcy.azurecr.io/impapi@sha256:ddc3c142aaee78d1fca8ab7375c33c24c10c81250c2aee4aaa3e0c5bba28cb0b`; API DLL SHA-256 `e96651e4a2b16b33d305b83739af5b6acaf57f2332f7baf67cff5d50c5489bf6`.

- Proof recorded UTC: 2026-10-25T23:45:43.275476+00:00. No unresolved validation failures.



- Post-deployment verification 2026-10-25T23:47:04.898364+00:00: revision `imp-dev-ca--0000161` Healthy / Running / latest ready, 100% traffic. Public health/readiness HTTP 200; anonymous chat HTTP 401. Effective environment/secret references, min/max replicas 1/3 and six roles unchanged. Automated functional tests use mocked data providers; authenticated browser replay was not performed.



### Sales-order list inventory IDs — 2026-10-25 validation



- Scope: add up to five distinct inventory IDs and remaining-item count per returned Sales Order. Reuse existing verified lines, otherwise read displayed orders only with concurrency capped at three. The existing tenant reader does not support bulk line expansion, so its verified entity-ID read is reused without endpoint-contract or dependency changes. Optional item-read failure preserves verified headers and displays Unavailable; an order/customer mismatch fails closed.

- Full backend `dotnet test --no-restore`: 1,531 passed, 0 failed. Includes displayed-orders-only reads, inventory-ID disclosure/rendering, duplicate IDs, truncation, read failures, wrong-order/wrong-customer denial, and existing Sales ownership/price/totals regressions.

- Release `dotnet build --no-restore -c Release`: 0 errors, 1,203 existing warnings. Test and build logs: `.tools/order-items-tests.log`, `.tools/order-items-release.log`.

- Fresh Azure preflight: approved subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0; imp-dev-rg / imp-dev-ca baseline revision 161; model gpt-5.6-luna, min/max replicas 1/3. Six existing scoped managed-identity roles verified. No IaC, schema, RBAC or configuration changes. Static role requirements unchanged; existing Acumatica reads use the caller's bearer token and existing customer scope. Infrastructure validation/what-if/provisioning are inapplicable to this image-only update.

- Runtime overlay verifies original immutable runtime/config/layers and changes only impapi.dll/PDB. No frontend changes or frontend tests claimed. No business writes. No unresolved validation failures.

- Published image: `impdevacrfnxcy.azurecr.io/impapi@sha256:0647110e491e9c4ce15b99ae854a6b369626f90b3f9d3429f548f58bfcd2d4b0`; DLL SHA-256 `710cfa45d85c9154b6b121e53487265af8fa96b73a72eb205ea9073951e9d990`. Proof UTC 2026-10-25T23:52:22.471650+00:00.

- Post-deployment UTC 2026-10-25T23:53:27.256741+00:00: revision `imp-dev-ca--0000162` Healthy / Running / latest ready, 100% traffic. Health/readiness HTTP 200; anonymous chat HTTP 401. Effective settings, roles and min/max replicas unchanged. No authenticated live ERP replay performed; functional and ownership checks use the automated backend suite.



### Order-query display suffix fix — 2026-10-25 (America/New_York)



- Root cause: the deterministic order classifier treated parts of `including inventory IDs, prices and shipping status` as customer/item search terms. Fix separates fully recognized display-only suffixes before selector extraction and preserves shipping requirements from the original question. Real item/PO filters remain intact. Unknown include/showing suffixes fall back to structured extraction instead of contaminating customer names.

- Full backend suite: `dotnet test impapi.Tests/impapi.Tests.csproj --no-restore` passed 1,537 tests, zero failures. New cases cover bare/named Nitto, with/including display fields, actual item/PO filters, and the exact Customer Service question through the real planner/pipeline/read tool with mocked ERP data. Existing authorization regressions pass.

- Release build: zero errors, 1,203 existing warnings. No dependencies or endpoint contracts changed. Logs: `.tools/order-presentation-tests.log`, `.tools/order-presentation-release.log`.

- Fresh preflight verifies approved existing subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0, imp-dev-rg / imp-dev-ca baseline 162, model gpt-5.6-luna, min/max replicas 1/3, six scoped roles. Static cloud permissions unchanged: parser-only code adds no cloud operation or role. No schema, IaC, identity, account or business-write changes; infrastructure validation/what-if/provisioning are inapplicable.

- Verified overlay changes only DLL/PDB, preserving immutable base runtime/config/layers. No frontend tests claimed. All validation failures resolved.

- Published image `impdevacrfnxcy.azurecr.io/impapi@sha256:af213f08ef33046bbb7ab7c5a388822a93faf775991dfc6f25bcae131a961fed`; DLL SHA-256 `6dd7888004af6948be80ec774f2ffeb5bb884e19d0981878121acc5b2fa25ffc`. Proof UTC 2026-10-26T00:00:57.337012+00:00.

- Verified deployment UTC 2026-10-26T00:02:06.101010+00:00: revision `imp-dev-ca--0000163` Healthy/Running/latest ready, 100% traffic; health/readiness 200, anonymous chat 401; roles, effective environment values/secret references and scale unchanged. Functional regression used mocked ERP data, not an authenticated live customer read.



### Customer PO sentence boundary / full shipping address — 2026-10-25 (America/New_York)



- Root cause: compound sentence `customer PO 41321. What is its shipping address...` polluted the PO selector. Recognized question boundaries now terminate customer/item/PO selector values while preserving embedded dots in literal references and shipping intent from the complete question.

- Authorized order detail DTO/disclosure/renderer now include available ShipToAddress street lines and postal code alongside city/state/country. Scheduled ship dates remain estimates. Existing user/customer ownership gates apply unchanged, including returned-order identity checks.

- Full `dotnet test --no-restore`: 1,541 passed, zero failed. New tests cover the exact question through real deterministic planner/pipeline/tool with mocked ERP data, full address, embedded-dot PO references and customer-name punctuation. Existing Sales ownership and disclosure regressions pass.

- Release build: zero errors; 1,203 existing warnings. No dependency/endpoint-request changes. Logs: `.tools/po-address-tests.log`, `.tools/po-address-release.log`.

- Fresh target preflight: subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0, imp-dev-rg / imp-dev-ca baseline 163, model gpt-5.6-luna, min/max 1/3, six scoped roles verified. Static cloud role requirements unchanged: this reuses the existing authorized order-detail read and adds no cloud data operation. No schema/IaC/role/account/business-write changes; infrastructure validation/what-if/provisioning inapplicable.

- Verified two-file runtime overlay; no frontend tests claimed and no unresolved validation failures.

- Published image `impdevacrfnxcy.azurecr.io/impapi@sha256:7d42f5ab29f855039515592de7d3a8c08521dd9ff7aca13a8097acb0ed0bbadb`; DLL SHA-256 `518c4454474e268df585d7d83cd33f5a4ca7d5e695edd812d790ebf1110299fc`. Proof UTC 2026-10-26T00:05:37.179661+00:00.

- Deployment verified UTC 2026-10-26T00:06:35.733349+00:00: revision `imp-dev-ca--0000164` Healthy/Running/latest ready, 100% traffic; health/readiness HTTP 200, anonymous chat HTTP 401. Roles, effective settings and scaling unchanged. Functional tests used mocked ERP responses; authenticated live PO lookup was not replayed.



### Order-search follow-up refinement — 2026-10-25 (America/New_York)



- Reliability gap: explicit `Only open orders containing ... including estimated ship dates` depended on model reconstruction despite a server-held SalesOrders task. A shared domain adapter now applies validated status/product/shipping updates to the saved business query, preserving customer/exact customer ID, dates, PO and count. Unknown compound filters fall back to contextual extraction; role and customer access are checked by the existing normal execution path.

- Possessive customer wording `Show me Nitto’s orders` has a deterministic route. Empty order results show the actual returned customer/item/status/date filters. Fresh refinements search ERP, not the initial displayed result page.

- Full backend suite: 1,544 passed, zero failed. Exact two-turn real pipeline/read-tool test covers a match outside the first displayed results and a genuine empty result. Additional regression verifies all unchanged filters and operator denial. ERP responses are mocked; no live existence claim for the customer/item/open combination.

- Release build: zero errors, 1,203 existing warnings. No endpoint-request/dependency/IaC/schema/role changes. Logs: `.tools/order-refinement-tests.log`, `.tools/order-refinement-release.log`.

- Fresh approved Azure preflight: subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0, imp-dev-rg / imp-dev-ca baseline 164; model gpt-5.6-luna; min/max replicas 1/3; six existing scoped roles. Static cloud permission requirements unchanged: existing caller-authorized readers reused, no new cloud operations. Infrastructure validation/what-if/provisioning inapplicable.

- Verified two-file immutable runtime overlay. No frontend tests claimed. No unresolved validation failures. Existing process-local task persistence limitation remains.

- Image `impdevacrfnxcy.azurecr.io/impapi@sha256:45fb4d03edfed128552089c2e02ae90dc941bf22492f973d601d07fd2d89e703`; DLL SHA-256 `523f47463324312fdcfb0180733def82f38f83b0a2d1ab5222b5acfffaf35431`. Proof UTC 2026-10-26T00:19:21.545137+00:00.

- Post-deployment UTC 2026-10-26T00:20:23.025591+00:00: revision `imp-dev-ca--0000165` Healthy/Running/latest ready, 100% traffic; health/readiness HTTP 200; anonymous chat HTTP 401. Roles, effective settings and scaling unchanged. Exact two-turn functional tests used mocked ERP data, not an authenticated live lookup.



### Material readiness DTO display — 2026-10-25 (America/New_York)



- Confirmed defect: generic wrapped Acumatica material schema canonicalized keys to InventoryID/UOM while the readiness formatter consumed InventoryId/Uom. Flattened server material reports now have a dedicated positive DTO contract, preserving material IDs and base units without admitting free-text descriptions. Wrapped ERP material entities retain their existing schema.

- Reader refuses material reports with missing IDs/units. Formatter withholds both success and shortage conclusions for incomplete identity/unit/numeric evidence. Readiness conclusion is shown before a comma-grouped quantity table. Existing service converts remaining requirements to verified inventory base units; conversion and requirement arithmetic were not changed.

- Full backend suite: 1,549 passed, zero failed. New regressions traverse material service mock -> MCP reader -> disclosure -> formatter for covered/short cases, and reject missing identity/unit plus malformed projected evidence. Existing material conversion tests pass.

- Release: zero errors; 1,203 existing warnings. Logs `.tools/material-display-tests.log`, `.tools/material-display-release.log`. No dependencies, Acumatica endpoint requests, schema, IaC, identity, roles or business-write changes.

- Fresh approved Azure preflight: subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0, imp-dev-rg / imp-dev-ca baseline 165, model gpt-5.6-luna, min/max 1/3, six scoped roles verified. Static permission requirements unchanged: existing caller-authorized material service reused. Infrastructure validation/what-if/provisioning inapplicable.

- Verified immutable two-file runtime overlay; no frontend tests claimed. All validation failures resolved. Live numeric quantities for PROD0000003 were not independently re-read; tests use fixtures.

- Image `impdevacrfnxcy.azurecr.io/impapi@sha256:3dc7e6a731b58d21d510c76a59df970a0b4c07705a14fe70843d50026fd3dec7`; DLL SHA-256 `9de3299231d603a89ca7be5df619096bf1ce66e29dba561ba5b7e814f2882298`. Proof UTC 2026-10-26T00:26:27.683992+00:00.

- Deployment verified UTC 2026-10-26T00:27:26.657388+00:00: revision `imp-dev-ca--0000166` Healthy/Running/latest ready, 100% traffic; health/readiness HTTP 200; anonymous chat HTTP 401. Effective settings, six roles and scale unchanged. No authenticated live production-order replay performed.



### Linked production order progress — 2026-10-25 (America/New_York)



- Existing search returned production headers/IMP links only, omitting live operations requested by `how far along`. Optional includeProgress now reuses the existing caller-authorized production summary reader for displayed orders, verifies production keys and the requested SO link, and exposes up to 25 operation rows per order with explicit truncation. Existing maximum page size remains 20. Changed identity/link fails closed; optional API progress errors retain verified headers and mark progress unavailable.

- Exact linked-SO progress wording deterministically requests includeProgress. Empty search output names the SO filter and states linked progress cannot be reported; it does not infer shipment readiness or invent relationships by item similarity. No linked-record existence claim made for SO0000178. User replied no when asked whether its lines show a production-order link. Browser inspection was blocked by an unsaved-form dialog; temporary unauthenticated inspection tab closed, user form left unsaved.

- Full backend tests: 1,553 passed, zero failed. New regressions cover exact progress route, live-summary fixture disclosure/rendering, genuine no-link result, optional progress failure and changed-link denial. Existing permissions/read-only tests pass.

- Release: zero errors, 1,203 existing warnings. Logs `.tools/linked-production-tests.log`, `.tools/linked-production-release.log`. No dependency, schema/IaC/identity/role or business-write changes. Existing endpoint readers reused; API tool parameter is optional and backward compatible.

- Fresh approved Azure preflight verifies subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0, imp-dev-rg / imp-dev-ca baseline 166; gpt-5.6-luna; scale 1/3; six scoped roles. Static role requirements unchanged, manufacturing roles only and production persona whitelist preserved. Infrastructure validation/what-if/provisioning inapplicable to existing-app image-only change.

- Verified immutable DLL/PDB overlay; no frontend tests claimed. No unresolved validation failures.

- Image `impdevacrfnxcy.azurecr.io/impapi@sha256:6a26e5e065107b7f05db897a8c8ced070578c92658918b811fa64bc8d8807e25`; DLL SHA-256 `b8cb4b344cab7e769cd2a916e250460ec8cc98431f2fa480de6b672ece1ea44f`. Proof UTC 2026-10-26T00:32:38.990606+00:00.

- Deployment verified UTC 2026-10-26T00:33:38.675028+00:00: revision `imp-dev-ca--0000167` Healthy/Running/latest ready, 100% traffic; health/readiness 200; anonymous chat 401. Settings, roles and scaling unchanged. Functional progress tests use mocked ERP data; authenticated live SO0000178 link inspection was not completed.


### Production operation unknown quantities and text encoding - 2026-10-25 (America/New_York)

- User output shows IMP Complete versus live Acumatica Released and links PROD0000003 to ORD247844, not SO0000178. These recorded states indicate a mismatch requiring review, not proof of a failed sync transaction. No ERP/IMP business records changed.
- Corrected mixed UTF-8/Windows-1252 source encodings in workflow headings and order-query apostrophe handling, plus the affected Customer Service test fixture. Files now explicitly saved as UTF-8. Added rendered Unicode-heading regression.
- Production summary response parser now removes missing/null/non-numeric operation quantity wrappers before conversion to the existing shared decimal models. Empty objects cannot silently default to zero. Explicit numeric zero is preserved, as is an explicit remaining quantity of 336. Shared write-side model types and arithmetic unchanged; no percentage or replacement planned quantity inferred.
- Full backend tests: 1,555 passed, zero failed. New raw-response test covers empty/null wrappers and explicit zero, plus formatter test for valid Unicode and unavailable quantities. Existing material/unit/ownership tests pass. No independent live verification of operation 0020 raw values or sync transactions.
- Release build: zero errors, 1,203 existing warnings. Logs `.tools/production-quantities-tests.log`, `.tools/production-quantities-release.log`. No endpoint-request/dependency/schema/IaC/identity/role changes. Fresh approved Azure preflight: imp-dev-rg / imp-dev-ca baseline 167, subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0, gpt-5.6-luna, min/max 1/3 and six scoped roles unchanged. Static cloud permissions unchanged; infrastructure validation/what-if/provisioning inapplicable.
- Verified immutable DLL/PDB overlay; no frontend tests claimed. No unresolved validation failures.
- Image `impdevacrfnxcy.azurecr.io/impapi@sha256:76f9c104b1bf9ca9fdb5e8e810626afd2a08d88ee00b9b84809260c5b76854cc`; DLL SHA-256 `03e14cd2b393ebcc9c57d2dbfd9f24ee4a854a008789395650dee1c395837840`. Proof UTC 2026-10-26T00:37:43.319764+00:00.
- Deployment verified UTC 2026-10-26T00:38:42.677506+00:00: revision `imp-dev-ca--0000168` Healthy/Running/latest ready, 100% traffic; health/readiness HTTP 200; anonymous chat HTTP 401. Roles, effective settings and scale unchanged. No authenticated live operation/sync-transaction replay performed.


### Conversation pipeline architecture fixes — 2026-10-25 (America/New_York)

- Scope: existing approved imp-dev-ca backend image update only, base revision168. No infrastructure, identity, SDK dependency, database schema, endpoint-version or business-write change. Persona availability tightened for Operator/Packer; existing customer-scope guards retained.
- Validation steps: exact 15-question gate and coverage assertion; broader persona and backend regressions; browser regression suite and syntax; Release build; fresh subscription/revision/image/model/scale/six-role checks; immutable DLL/PDB overlay; post-deploy settings/scale/health/traffic/auth checks. No Bicep/Terraform/provisioning changes; IaC build/what-if/provisioning is inapplicable.
- Confirmed fixes: state-driven production choice, full-sentence clarification context, preserved requested totals including detailed shipping output, explicit persona-role matrix and tool recheck, shared America/New_York period resolver with current business date in model prompt, reference/date-basis clarification, inclusive production date ranges, verified discount/quantity/shipping arithmetic, evidence-only SO/production links, required identity/unit checks, optional empty-column reduction and readable fallback tables.
- Shared conversation persistence is PREPARED ONLY and not installed: automatic approval review rejected this new persistent payload/destination pending explicit user approval. Existing process-local context remains a known limitation until approved.
- Tests: 16 normal-user checks (15 scenarios + coverage), 327 additional PersonaQuery checks and 1,249 remaining backend checks all pass (1,592 total). Browser 79/79 pass. Release build zero errors. Logs `.tools/pipeline-final-gate.log`, `.tools/pipeline-web-full.log`, `.tools/pipeline-release.log`. Live evaluation workflow added separately, never represented as executed without dedicated sessions.
- Fresh preflight: subscription d5f280e5-f697-4938-9ba4-fb792e1b39f0, imp-dev-rg / imp-dev-ca, baseline168, model gpt-5.6-luna, replicas1–3, six roles unchanged. Static required cloud roles unchanged. User's previous approved subscription/location remains applicable.

- Deployment verified: revision imp-dev-ca--0000169 Healthy/Running/latest ready, 100% latest traffic; health/readiness200, anonymous chat401, effective settings/scale/six roles unchanged. Immutable image impdevacrfnxcy.azurecr.io/impapi@sha256:79577e4e888d662a55b317d02b2d42991b2ea771bb740f97e3ef6d8088281912. Shared storage remains excluded pending approval.


### Pipeline live-review follow-up — 2026-10-25

- New scope after authenticated UI checks: include Document.AttributeREF1 in SO details and preserve verified header PO when detail custom data is empty; natural pricing replies accept “Please use customer …”; plan-cache keys follow the business date; unqualified relative-period order searches get explicit dates. Shared conversation storage remains excluded pending user approval.
- Live Production material rows now show verified IDs and units. The UI still rendered production links as literal Markdown: added exact AM201500/ProdOrdID allowlisting beside SO301000/OrderNbr in the shared browser formatter. Wrong hosts, duplicate keys, admin screens, extra parameters and mismatched labels remain rejected. No extension permissions/CSP/DNS changes.
- Validation proof: backend CI passes 16 normal-user acceptance checks +331 additional persona checks +1249 other checks =1596; browser81/81; syntax check passes; Release build zero errors/warnings. Logs pipeline-reviewed-gate.log, pipeline-reviewed-build.log, pipeline-web-final-tests.log under .tools. Existing approved Azure target and identity roles unchanged. No dependencies, schema, IaC or business writes.
- Deployment validation steps remain fresh target/image/model/roles/scale preflight, tested immutable DLL/PDB overlay and static-web-assets update, post-deploy backend health/auth/settings/roles plus frontend asset hash/CSP checks. No IaC provisioning or what-if applies to this scope.

- Final deployment verified: imp-dev-ca--0000170 Healthy/Running/latest ready with100%traffic, health/readiness200 and anonymouschat401; settings, scaling and six roles unchanged. Image impdevacrfnxcy.azurecr.io/impapi@sha256:d9589ba577b929d771e1b16e35c71ce62cf7fe38c264d1f7152378b9e575a6f0. Frontend verification matches all19releasefiles and route/CSPchecks at ask.impops.work.


### Typed record references and quote-context verification — 2026-10-25

- Links are rendered from verified document fields/types rather than global replacement of matching text. Linked SO references in production outputs are supported; IMPUI Ref No remains an IMP identifier. Multiple order types retain their exact evidence destinations. The final URL allowlist still only accepts positive role-projected evidence.
- Percentage quote estimates now require verified source currency and selling unit. Actual tenant price-class rows lacking currency are explicitly incomplete; no currency is inferred from customer defaults or historical transactions. This is an unresolved upstream data limitation, not a successful quote result.
- Fresh full CI gate:16 normal-user checks +333 additional persona checks +1249 backend regressions =1598 passed; browser81 passed; Release zero errors/warnings. Proof logs pipeline-typed-gate.log, pipeline-typed-build.log, pipeline-web-final-tests.log. No dependencies, business writes, identity/role/cloud-configuration/schema changes.
- Validation steps: fresh baseline170 subscription/image/scale/model/six-role preflight; existing static role proof unchanged; immutable two-file overlay; post-deploy health/readiness/auth/settings/traffic checks. No IaC/provisioning/what-if is applicable. Shared conversation storage remains excluded pending user approval.

- Final typed-link deployment verified: imp-dev-ca--0000171 Healthy/Running/latest ready,100%traffic; health/readiness200, anonymouschat401; settings/scale/six roles unchanged. Image impdevacrfnxcy.azurecr.io/impapi@sha256:477be15cbded1bf3397cf5d6f7447fd3be808bdaa1012e580e8cc5066eb76355. No shared storage installed.
