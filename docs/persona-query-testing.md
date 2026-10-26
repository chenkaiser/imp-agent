# Persona query release gates

For repeatable live Sales checks, use the [Sales persona manual test checklist](sales-persona-manual-tests.md).

For repeatable live Customer Service checks, use the [Customer Service persona manual test checklist](customer-service-persona-manual-tests.md).

For repeatable live Production checks, use the [Production persona manual test checklist](production-persona-manual-tests.md).

## Agreed normal-user acceptance set

The three checklists contain **15 scenarios: five Sales, five Customer Service and five Production**. Their exact questions and follow-up messages are in `tests/queries/normal-user-scenarios.json`, mirrored as an embedded resource in the backend's `impapi.Tests/Chat/PersonaQueries/normal-user-scenarios.json`. Update both copies together when intentionally changing a question.

- Browser CI submits all 15 scenarios, including their actual follow-up text, through the chat form. Marker questions choose autocomplete suggestions first. It verifies persona, auth headers, readable rendering and conversation continuity. A separate assertion requires exactly five documented scenarios per persona.
- Backend `NormalUserAcceptanceTests` checks the exact questions' routing, extracted filters, read-only tool permissions, discount percentage and follow-up state. The unassigned-customer case also executes adversarial customer-scope regressions. Existing reader, arithmetic, formatter and full-pipeline regressions remain in the broader gate.
- `scripts/test-agent-ci.sh` explicitly runs `Category=NormalUserAcceptance` before other regressions and requires a report containing all 15 cases plus the coverage assertion. A failed, removed or empty suite stops the deployment gate. The backend GitHub Actions workflow invokes this script.

**Boundary:** four questions currently require model extraction: Sales discount, Sales stock, Customer Service pricing with notes, and Production materials. The deterministic backend suite supplies model-response fixtures for these cases; browser responses are also fixtures. This verifies the application's handling of those responses, not a real model's semantic accuracy. It does not verify tenant endpoint availability, credentials, live data completeness or deployed versions. A passing CI result is not proof that all 15 live queries work. Live model/integration evaluation remains a separate test layer.

The browser and backend have separate repositories, both using GitHub Actions. Each tests its own source; the browser job does not clone or authenticate to the private backend repository.

| Layer | Location | Checks |
| --- | --- | --- |
| Browser | `tests/queries/persona-queries.test.mjs` | All five personas submit the selected persona and both auth headers, render readable tables, display clarifications, preserve conversation IDs on confirmation, and cannot switch to a persona omitted by the server |
| Backend scenarios | `impapi.Tests/Chat/PersonaQueries/scenarios.json` in the backend repository | 30 named queries: pricing IDs/descriptions, latest SOs, shipping/PO/customer notes, weekly production/demand/handoff, existing Executive scorecards, IT token/question/cost reports and denied persona/role combinations |
| Backend normal-user gate | xUnit `Category=NormalUserAcceptance` | 15 exact scenarios plus one coverage assertion; includes both multi-turn questions |
| Backend regression gate | xUnit `Category=PersonaQuery` excluding `NormalUserAcceptance` | 333 additional checks including full query pipelines, customer ownership, role enforcement, read-only tool catalogs, clarification/confirmation, price presentation, evidence, stock arithmetic and billing parsing |

These are deterministic regression/contract tests. They use fixtures, mocks and in-memory databases, not live Acumatica data, Azure billing or model calls. They incur no LLM charges and make no business writes. They do not prove that an LLM understands every paraphrase or that a deployed user session can reach upstream services. New Executive KPI/ranking functionality remains outside this task.

## Run locally

Frontend:

```sh
npm ci
npm run check
npm test
mkdir -p test-results
npm run test:queries:ci
```

Backend, from the backend repository (Linux/macOS shell or Windows Git Bash):

```sh
sh scripts/test-agent-ci.sh
```

The backend script restores the test project, runs the named query gate, rejects an empty query report, then runs all remaining backend tests. It forces optional PostgreSQL tests off and produces both TRX and JUnit XML under `test-results/agent/`. Dedicated local-PostgreSQL integration tests remain separate.

## CI/CD behavior

- Frontend GitHub Actions (`chenkaiser/imp-agent`): PRs and `main` pushes run UI tests and a separate `persona-queries` job. Frontend deployment requires both jobs.
- Backend GitHub Actions (`chenkaiser/imp-server`): `.github/workflows/agent-ci-cd.yml` runs the 15-question acceptance gate, remaining persona regressions and all backend regressions. Reports are uploaded even after a failure. Azure deployment requires passing tests, the default branch, configured OIDC authentication and the explicit `AZURE_DEPLOY_ENABLED` repository variable. Deployment is disabled during migration.
- Legacy Bitbucket and CodeBuild definitions remain in the imported source for compatibility; they are not the GitHub release pipeline. Avoid enabling concurrent deployments from both systems.

Hosted CI uses the checked-in versions. Both repositories' pending application/test/workflow changes must be committed and pushed before the hosted gates run. Running the scripts locally does not publish workflow changes or configure protected-branch merge checks.

## Add a regression

1. Add a uniquely named JSON scenario to the backend fixture. Specify persona, account role, query and expected route/tools, plus extracted customer/item/arguments or expected clarification when relevant.
2. Add a full-pipeline test when the failure involves confirmation, customer ownership, returned data, arithmetic or presentation. Apply `[Trait("Category", "PersonaQuery")]` to include it in the release gate.
3. Add or extend the browser contract when UI behavior changes. Its responses are controlled fixtures; server correctness belongs in backend tests.
4. Run both gates. Never weaken an expected result merely to make a new behavior pass; first verify the intended contract.

No production credentials are required for these jobs. A later opt-in staging smoke/evaluation workflow can test real integrations using dedicated least-privilege accounts, without making normal builds depend on mutable ERP data.

## Live integration evaluation

`.github/workflows/live-personas.yml` now provides a separate, manually triggered **Live persona acceptance** workflow. It calls `scripts/test-live-personas.mjs --live` against the fixed `https://api-dev.impops.work` endpoint and runs the 15 questions with the actual deployed model and upstream integrations.

Configure the `agent-live-tests` GitHub environment with short-lived sessions for dedicated test accounts: `LIVE_SALES_JWT`, `LIVE_SALES_ACUMATICA_TOKEN`, `LIVE_SERVICE_JWT`, `LIVE_SERVICE_ACUMATICA_TOKEN`, `LIVE_PRODUCTION_JWT`, and `LIVE_PRODUCTION_ACUMATICA_TOKEN`. The Sales test must use an actual Sales role, the Customer Service test an actual CustomerService role, and the Production account must have authorized manufacturing access. Never substitute an administrator account to claim the Sales ownership test passed.

The fixture customers/items must exist and have the intended assignments, including an AbeTech customer unassigned to the Sales test account. Otherwise investigate the failed fixture expectation instead of weakening permission assertions. Sessions can expire during a run; missing sessions fail the workflow, rather than silently skipping cases. No credentials belong in source control or chat.

Reports contain case IDs, pass/fail and durations; response bodies and credentials are excluded. These checks detect failed/incomplete responses, lost follow-up context, missing price/calculation sections, denied-customer disclosure and missing record links. Exact ERP values still need comparison with authoritative records; a formatting check does not prove every business fact correct. No live pass is claimed until the workflow or browser checks have actually run.

## Pipeline architecture regressions

The backend `PipelineArchitectureRegressionTests` suite is part of the normal PersonaQuery gate. It covers business dates around UTC midnight, relative sales and production periods, ambiguous document references/date bases, full-sentence clarification replies, state-driven production choices, discount/quantity/shipping arithmetic, currency/unit mismatches, shipping-currency follow-ups, evidence-only links, reused document numbers, incomplete records, and requested totals with shipping details.

Shared conversation persistence is a separate prepared change awaiting explicit approval. Until enabled and verified, state remains local to a container; a restart or replica change can lose pending context.

Live browser checks on October 25, 2026 used a SystemAdmin account selecting Customer Service and Production. They verified order details, customer PO 41321, shipping readiness, customer/item/status follow-up retention, material IDs/units and production comparison output. They also exposed and led to fixes for custom-PO consistency and the browser's production-link allowlist. These checks do not prove Sales customer isolation under a Sales account. The Nitto price-class response did not supply currency; it was flagged as incomplete and must not be treated as a quote-ready result. No all-15 live pass is claimed.
