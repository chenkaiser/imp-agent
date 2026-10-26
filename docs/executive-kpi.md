# Executive KPI implementation

The Executive workspace contains the 2026 Derek, Sales, CS/Shipping/Receiving and Production scorecards, supporting records, a commission ledger, rule and coverage review, and immutable snapshots.

## Access and reporting rules

Dashboard access requires a live, verified Acumatica role named exactly **KPI** (case-insensitive). Executive, SystemAdmin, other IMP roles and persona selection do not grant it. The backend binds the ERP token to the signed-in IMP username and tenant, then reads roles through the self-only IMP-UserAccess inquiry. Failed verification denies access. The inquiry must be readable by the account; this feature does not assign roles or change Acumatica permissions. Every dashboard, evidence/export and editing request rechecks the entitlement. KPI chat lookups also require this role. Sales reports continue to require Executive access separately.

The dashboard button is controlled by the server's `kpiAccess` capability, including mobile and direct `/kpi` links. A 403 clears any displayed KPI evidence without signing out the user. KPI responses use `Cache-Control: no-store`; signing out clears the browser's KPI state and cancels outstanding requests.

All four profiles allocate 100 points. Sales uses column E. Production uses ERP integration 21, packaging efficiency 8 and 5S 4. Unresolved workbook definitions remain pending until an Executive records a rule, period target, rationale and evidence. Annual workbook revenue budgets are labelled as annual targets and are never automatically prorated. Other reporting years require a new approved rule/budget version.

Actual evidence is submitted as a draft. It needs a review decision and complete population coverage before points can be awarded. Financial measures additionally need a separate reconciliation decision for the exact period and company scope. Missing values, a zero denominator, incomplete history and an unfinished reporting day cannot become a final score. Financial losses can be represented as negative amounts. Operational counts cannot be negative.

## Sources and evidence

### Acumatica actuals and manual fallback

Approved budgets and period targets are maintained in IMP Agent configuration. Fixed formulas and weights cannot be changed through the target editor. Revenue for a partial year requires an explicitly approved target for those exact dates; an annual budget is never automatically divided into months.

The dashboard reads released Acumatica AR invoices and debit memos less credit memos for **Sales revenue / All companies**, using the existing verified invoice-report reader. All pages contribute to the total, document discounts are deducted, tax is excluded and AR-line freight is included. Different currencies are never combined. An absent population is not assumed to be zero. USA/Mexico mapping and other metric sources remain manual until verified.

Live actuals take precedence over ordinary manual observations and are labelled **Acumatica live**, with a checked time, document count and linked invoice preview. The daily revenue chart uses the complete invoice population, independently of the preview limit. If the source cannot be verified, the metric remains open for reviewed manual input. When ERP data is incomplete, an explicit manual override can be entered with an explanation and supporting references; it takes precedence only after approval and is labelled **Reviewed manual override**. Financial coverage must still be reconciled before points are awarded; an endpoint population is not proof that migrated history is complete. Dashboard reads do not write source records. Snapshots retain the live values and proof used at creation; closed periods display their frozen snapshot until reopened.

Legacy IMPUI budget/history/production source collection is disabled for this workflow. Existing archived evidence is retained. Actuals without a mapped Acumatica source can be entered manually with supporting references, saved as draft, and reviewed.

Approved financial formulas: revenue earns proportional points capped at its allocation; margin and collections earn full points at/above target; expenses, bad debt and safety earn full points at/below target. Otherwise threshold-based metrics earn zero. Production ERP integration requires completion by Aug 3 of at least 80%, adoption of at least 95% and on-time transactions of at least 90%; if all three pass, points are current completion times 21, capped at 21, otherwise zero.

Unresolved definitions remain visible rather than being guessed: production paperwork audit failures, scrap basis and excess-band rounding, production-return denominator and band rounding, and Derek's separate bonus boundaries.

Source collection saves an immutable extract. Current collection options are Acumatica AR invoices, shipments, purchase receipts, service cases and physical-inventory reviews. Except for the verified AR invoice reader, these extracts still require tenant field/population verification before automatic metric calculation. Acumatica reads use the signed-in user's access token and a fixed endpoint/field allowlist. Pagination, unique keys, date boundaries and population limits are checked. No ERP write actions or shared service-account fallback are used.

Source extracts support review; they do not automatically assert every KPI numerator and denominator. Shipping populations can require overdue unshipped orders, and production attainment requires a reconciled plan with comparable units. Surveys, complaints, incident registers, 5S and FIFO inspection results need a verified Acumatica mapping or explicit reviewed manual evidence. The Executive enters or reconciles unmapped actuals from their supporting records.

Legacy production extracts used separate flat queries for jobs, rolls and packing to prevent join multiplication. Those archived records remain available as historical proof; new KPI source collection does not read IMPUI jobs, imported sales history or budget inputs.

Evidence revisions are append-only. Revisions return actuals to draft and stale reviews fail with HTTP 409. Downloads preserve the stored JSON's numeric precision. Workbooks are archived privately in the KPI evidence table, with a SHA-256 reference; they are never public frontend assets.

## Commission

Commission lines record operator UUID, production work date, payroll period, machine, SQM, rate, currency, source reference and review state. Base and supervisor calculations preserve unrounded line precision; aggregate approved totals round to cents. Supervisor amounts are separate. Adjustments and corrections are explicit entries. Corrections reference existing evidence for the same operator. A stable source reference prevents duplicate lines.

The supplied seven-operator XLSX summary layout can be imported. The importer checks machine calculations, operator totals and the grand total, bounds expanded ZIP size, and rejects repeat imports by file hash. Imported names are unresolved operator identities and work dates remain unknown. Imports cannot be approved directly: reconciled entries must use existing IMP user UUIDs and verified work dates, retaining the import as proof. No payroll payment is submitted.

## Snapshots and period closing

Snapshots freeze scorecard definitions, results, evidence references and the commission ledger. Provisional snapshots are allowed. Closing requires resolved metrics, complete coverage and no draft commission lines. Period writes contend on a unique transactional guard revision; closed periods reject changes. Reopening requires a recorded reason and retains the original snapshot.

## API and database

The frontend route is `/kpi`, accessible to users with the verified Acumatica KPI entitlement. API routes are under `/v1/Kpi`: `catalog`, `dashboard`, `events`, `evidence/{id}`, `evidence/{id}/export`, `observations`, `evidence/{id}/review`, `coverage`, `rules`, `sources/{dataset}`, `commissions`, `commissions/import`, `snapshots` and `period`. Chat uses the read-only `GetExecutiveKpis` tool and the same scoring service.

Apply `impapi/db/migrations/2026-10-22_kpi_event.sql` explicitly to the intended PostgreSQL database before the API release. It adds only `kpievent` and its indexes. Do not scaffold EF migrations or alter production/finance tables. Local fresh SQLite databases use the EF model. Existing SQLite databases also need the new table created explicitly.

An application rollback can leave the KPI table and its evidence intact. Do not drop it as part of rollback. The archive currently bounds each reporting year to 20,000 events and source extracts to 10,000 primary records; larger populations must be partitioned before results can be certified complete.
