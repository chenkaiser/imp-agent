# Executive KPI implementation

The Executive workspace contains the 2026 Derek, Sales, CS/Shipping/Receiving and Production scorecards, supporting records, a commission ledger, rule and coverage review, and immutable snapshots.

## Access and reporting rules

Dashboard access requires a live, verified Acumatica role named exactly **KPI** (case-insensitive). Executive, SystemAdmin, other IMP roles and persona selection do not grant it. The backend binds the ERP token to the signed-in IMP username and tenant, then reads roles through the self-only IMP-UserAccess inquiry. Failed verification denies access. The inquiry must be readable by the account; this feature does not assign roles or change Acumatica permissions. Every dashboard, evidence/export and editing request rechecks the entitlement. KPI chat lookups also require this role. Sales reports continue to require Executive access separately.

The dashboard button is controlled by the server's `kpiAccess` capability, including mobile and direct `/kpi` links. A 403 clears any displayed KPI evidence without signing out the user. KPI responses use `Cache-Control: no-store`; signing out clears the browser's KPI state and cancels outstanding requests.

All four profiles allocate 100 points. Sales uses column E. Production uses ERP integration 21, packaging efficiency 8 and 5S 4. Unresolved workbook definitions remain pending until an Executive records a rule, period target, rationale and evidence. Annual workbook revenue budgets are labelled as annual targets and are never automatically prorated. Other reporting years require a new approved rule/budget version.

Actual evidence is submitted as a draft. It needs a review decision and complete population coverage before points can be awarded. Financial measures additionally need a separate reconciliation decision for the exact period and company scope. Missing values, a zero denominator, incomplete history and an unfinished reporting day cannot become a final score. Financial losses can be represented as negative amounts. Operational counts cannot be negative.

## Sources and evidence

Source collection saves an immutable extract. Available sources are IMPUI production/packing, annual budget inputs, imported monthly sales history, and Acumatica sales invoices, shipments, purchase receipts, service cases and physical-inventory reviews. Acumatica reads use the signed-in user's access token and a fixed endpoint/field allowlist. Pagination, unique keys, date boundaries and population limits are checked. No ERP write actions or shared service-account fallback are used.

Source extracts support review; they do not automatically assert every KPI numerator and denominator. Shipping populations can require overdue unshipped orders, and production attainment requires a reconciled plan with comparable units. SalesInvoice is not the complete GL/AR revenue population. Surveys, complaints, incident registers, 5S and FIFO inspection results need explicit reviewed evidence. The Executive enters or reconciles the metric's actual from its supporting records.

Production reads use separate flat queries for jobs, rolls and packing to prevent join multiplication. Duplicate main/offcut roll rows fail collection. Company-specific collection requires machine/company mappings. Source notes distinguish a complete database query from complete financial history. The current Azure database returned no 2026 budget-input or imported sales-history rows during validation.

Evidence revisions are append-only. Revisions return actuals to draft and stale reviews fail with HTTP 409. Downloads preserve the stored JSON's numeric precision. Workbooks are archived privately in the KPI evidence table, with a SHA-256 reference; they are never public frontend assets.

## Commission

Commission lines record operator UUID, production work date, payroll period, machine, SQM, rate, currency, source reference and review state. Base and supervisor calculations preserve unrounded line precision; aggregate approved totals round to cents. Supervisor amounts are separate. Adjustments and corrections are explicit entries. Corrections reference existing evidence for the same operator. A stable source reference prevents duplicate lines.

The supplied seven-operator XLSX summary layout can be imported. The importer checks machine calculations, operator totals and the grand total, bounds expanded ZIP size, and rejects repeat imports by file hash. Imported names are unresolved operator identities and work dates remain unknown. Imports cannot be approved directly: reconciled entries must use existing IMP user UUIDs and verified work dates, retaining the import as proof. No payroll payment is submitted.

## Snapshots and period closing

Snapshots freeze scorecard definitions, results, evidence references and the commission ledger. Provisional snapshots are allowed. Closing requires resolved metrics, complete coverage and no draft commission lines. Period writes contend on a unique transactional guard revision; closed periods reject changes. Reopening requires a recorded reason and retains the original snapshot.

## API and database

The frontend route is `/kpi`, accessible from the Executive persona's workspace. API routes are under `/v1/Kpi`: `catalog`, `dashboard`, `events`, `evidence/{id}`, `evidence/{id}/export`, `observations`, `evidence/{id}/review`, `coverage`, `rules`, `sources/{dataset}`, `commissions`, `commissions/import`, `snapshots` and `period`. Chat uses the read-only `GetExecutiveKpis` tool and the same scoring service.

Apply `impapi/db/migrations/2026-10-22_kpi_event.sql` explicitly to the intended PostgreSQL database before the API release. It adds only `kpievent` and its indexes. Do not scaffold EF migrations or alter production/finance tables. Local fresh SQLite databases use the EF model. Existing SQLite databases also need the new table created explicitly.

An application rollback can leave the KPI table and its evidence intact. Do not drop it as part of rollback. The archive currently bounds each reporting year to 20,000 events and source extracts to 10,000 primary records; larger populations must be partitioned before results can be certified complete.
