# Customer pricing in IMP Agent

Sales-price questions follow a classification, extraction and enrichment step before any business lookup. The planner stores a structured `ChatSalesPriceQuery`: customer name/ID, inventory ID or full description, and optional date, currency, UOM and quantity. The original dimensions and revision codes are retained. The common `what is price of … for customer …` form is deterministic; other wording and follow-up choices use the structured classifier and conversation context.

`GetAcumaticaCustomerItemPrice` resolves a real customer ID, then finds the item through stock/nonstock inventory descriptions. When no inventory description matches, it checks that customer's invoice/order line descriptions in the requested history dates. More than one matching customer or item always returns a confirmation question. An exact customer ID is validated directly. No model-generated candidate selection can override the enriched query arguments during a turn.

Price-source priority is customer, the customer's assigned price class, base, then positive reference prices from other customer price classes, then a positive inventory default. Other-class rows are explicitly labeled **Customer Price Class reference** with their class code; they are not presented as the target customer's assigned price. Customer-specific rows belonging to other customers are never requested or disclosed. All qualifying rows in the selected tier remain visible so quantities, promotions, currencies and units are not silently conflated. A failed inquiry is not evidence that a customer price is absent. Zero/negative inventory defaults are not selling prices; explicitly listed zero customer/class/base prices remain distinguishable. Item defaults without complete currency/break/date context are references, not quotes; defaults cannot satisfy unverified explicit currency or quantity filters. No currency conversion, UOM conversion or discount calculation is performed. Reference-based discount estimates also identify the source class.

History includes the latest 10 matching invoice/order lines, locally sorted by date and document number, for the same resolved customer and item. The default window is the two years through the pricing date. Types and statuses are shown; an order and invoice can represent the same sale and must not be summed together. Historical unit prices are not current quotes. Missing legacy history and inaccessible extracts are explicitly described.

All reads use the caller's Acumatica token and existing Sales/manager role authorization. Customer, date, item and paging scopes are checked. Reads are bounded; an ignored filter or incomplete/unverifiable response cannot support a verified result. Endpoint field names were checked against the captured tenant Default/24.200.001 OpenAPI schema. Signed-in price and completed-order history verification succeeded on October 22, 2026.

Regression coverage includes the reported `25.98" x 15748' TTM-282 Jumbo Roll (FTX307)(R7)` question for NITTO, structured extraction, ambiguity confirmation, description/line resolution, price fallback, history separation, access checks and source filter validation.

Customer-name correction: names such as Horne Label and Printing are searched as names, with significant tokens and and/ampersand equivalence. Customer IDs use a verified collection filter; this avoids the tenant's HTTP 500 for a missing customer key. Multiple matching names still require confirmation.

Answers show current listed price, dated invoice/order history, and source-returned price/line notes. The last recorded use of a current price is matched against the full bounded history using amount, currency and UOM; missing currency/UOM cannot support a match. Cancelled/voided documents and invoice credit memos are excluded from that match. Order/invoice dates are recorded document dates, not proof of when a quotation was sent. Notes are scoped to the selected price and same-customer/item lines, treated as source data and rendered as literal text.

History repair: tenant bulk expansion of sales document details fails with HTTP 500. Header pages are read without expansion; each selected document is then retrieved individually and checked against its header/customer/date. The newest 200 headers per source are inspected, four requests at a time. Boundaries, failed details and unavailable sources are reported as partial/unavailable coverage; verified lines are retained. An unavailable history source never supports a no-sales claim. Current prices are shown in a table with separate currency and unit columns.

The UI receives authenticated SSE progress for real lookup steps: customer, product, prices, history and answer preparation. Messages are fixed application strings and carry no business data. Pending answers animate with CSS, stop on completion/error/cancellation, expose aria-busy and respect reduced-motion preferences. Sales-order details and customer prices render as tables rather than flattened record paths.

Final sales/customer-service presentation has three sections only: IMP Price, recent same-customer/item sales prices (up to five lines), and returned special notes. Technical coverage tables and generic quotation disclaimers are omitted; unavailable history is a brief factual status. Recorded completed sales are historical price evidence even when no current price-list record exists. Live verification found HORNE01 / DMX165360PVW on completed SO0000181, dated 2026-10-22, 12 ROLL at USD 7.27 per ROLL. This transaction currency is kept separate from the current price-list row when that inquiry omits currency.

Customer popup notes: a verified Customer resource read explicitly requests `$custom=BAccount.NotePopupText,BAccount.NotePopupTextExists`, confirmed against this tenant's Customer ad-hoc schema. The ordinary inherited `note` field is separate and can be empty while popup instructions exist. Extract relevant source excerpts from both, plus matching sales-document header notes. Show exact item/description/group matches and customer-wide commercial terms with their original conditions and source. Suppress unrelated product groups, billing addresses and unrelated text. Invoice-unit instructions are displayed as terms; they never silently convert prices. Optional note failures retain verified prices/history and say notes could not be checked. Sales roles retain their existing permission to read unit selling prices; other financial and secret masking remains unchanged.

Live popup-note validation (October 22, 2026): NITTO, Inc / ZEB060300R7 -Z returned its Zebra-specific instructions, invoice MT/SQM condition and conditional Lakewood freight terms in the third section. Recent-price table retained completed ORD247510 (October 7) and invoice INV000062 (October 22), both USD 21.76/ROLL. Verify notes with the signed-in user's token: the separate diagnostics account returned a shorter popup and is not proof of the notes visible to the caller. Backend suite: 1025 passed on a merged snapshot preserving the material-line-export release. Azure revision132 healthy.

Order/customer note routing: SO and ORD document references such as ORD247510 resolve directly to GetAcumaticaSalesOrderDetails. Their item lines are not inventory IDs for a warehouse-stock inquiry. Order responses include the verified customer ID, optional verified name and all returned item descriptions/quantities. A missing optional customer-name lookup preserves the order. Standalone requests such as `show me notes of customer Nitto` use GetAcumaticaCustomerNotes, resolve ambiguous names with choices, and read ordinary plus popup notes without requiring a product. Source notes are literal text with existing role/secret masking, bounded excerpts and explicit unavailable statuses. These reads use the caller's Acumatica token and Sales/manager access.


Sales ownership: Sales accounts require an explicit, administrator-managed IMP
user UUID → Acumatica Salesperson ID assignment. There is no Employee mapping
dependency and no username, email or salesperson-name guessing. The caller's
Acumatica userinfo subject must match their authenticated IMP login and configured
tenant before the persisted assignment is used. Current Customer.Salespersons
records determine access on each request. Missing/unverifiable assignments deny
access. Checks apply to current customer prices, price/history enrichment,
customer notes, direct and production-linked orders, and customer/order search.
Customer choices omit unauthorized customers; latest-order searches query only
assigned customer IDs and reject source rows outside the verified scope.

At `/sales-access`, an IMP administrator, manager or executive can select an
active Sales user and an active Acumatica salesperson. Review the exact login and
salesperson before Save assignment. Choosing Unmapped revokes access. The server
enforces authorization independently of persona selection and records immutable
assignment revisions, actor and UTC time. A stale revision is rejected with 409.
Database setup is the additive manual SQL `impapi/db/sales-user-assignment.sql`;
it creates no assignments. Existing manager/executive access is unchanged.

Selected example: salesagent1 → IMPAGENT (SalesBot). Acumatica verified IMPAGENT
active and assigned to NITTO and ORORA01 on October 22, 2026. The selected mapping
must be saved before this Sales login can read customer prices or orders. Live
allow/deny checks require signing in as that Sales account; an administrator's
successful lookup does not verify Sales restrictions.


Sales calculations: order search includes source order totals and currencies. The
server sums only the orders actually returned, never the extra truncation row;
separate currencies stay separate and missing amounts prevent a complete total.
A percentage increase/discount on a customer price is calculated with decimal
arithmetic from approved same-turn source prices. The answer identifies original
price, percentage, estimated price, currency, UOM, source and formula, rounded to
two decimals. Estimates never update the ERP price list. Historical year requests
use dated transactions within that year, with no fallback to current price data.
Follow-up estimates retain only resolved customer/item query context and fetch
again through ownership checks; old assistant text is never calculation evidence.
Role changes clear conversation context. User profile lookup now checks the current database row instead of retaining a
daily cache. TokenValidationService already reads the current database user on
each authenticated request; the confirmed bypass was the stored Manager role.

IMPUI's role editor no longer mixes reactive form state with value/selected
bindings. Its role options retain stable identities during change detection;
editing uses a copied row so a failed save cannot alter the visible user list.
Twelve browser tests cover the role editor and user administration. Live saving
and reopening salesagent1 retained Sales on October 22, 2026.


If the current price inquiry is unavailable, a verified LatestCompletedSale for
the same customer/item can support a percentage estimate. The response explicitly
labels the historical basis and source document/date; it never fabricates a
current IMP Price. Historical-year requests cannot substitute a sale from another
year. Regression suite: 1,100 passed on October 22, 2026.


Customer Service order searches (October 22, 2026)

The service persona offers customer, item and customer-PO starting questions.
SearchAcumaticaSalesOrders accepts customerName/customerId, product (inventory ID
or line description), customerPo and includeShipping. Customer PO matches both
the standard customer reference and the tenant-specific AttributeREF1 reference.
Filtering runs before the result limit; description matches with multiple item
IDs require confirmation. All searches preserve the existing account permissions
and salesperson customer scope, regardless of persona.

Shipping answers show order/customer/PO, item quantities and prices, carrier,
shipping terms, destination city/state/country, scheduled ship dates and linked
shipment numbers/status/dates/quantities. Missing dates are unavailable; requested
dates are never substituted for estimated shipping dates. Scheduled dates are
estimates, and shipment dates do not confirm delivery. Tracking numbers and
carrier delivery predictions are not currently supplied by this order endpoint.
Searches are bounded at 2,000 headers and 200 detailed documents per date window;
large item searches require a narrower customer or date range rather than
claiming a complete result from a partial scan. UI progress follows actual order
search and shipping-detail reads.

Validation: 1,115 backend tests and 20 frontend tests passed, including pagination,
custom PO references, item ambiguity, date semantics and customer-scope rejection.


Persona access update (October 22, 2026)

IT Admin requires exactly SystemAdmin (role1). Executive requires exactly
Executive (role99). Administrators do not inherit Executive persona/KPI access;
managers receive neither restricted persona. Sales and Customer Service retain
their existing role and customer-scope checks for each lookup. The frontend loads
GET /v1/Chat/personas with the IMP bearer token and displays only server-authorized
personas. Every chat request carries a persona ID; the backend also verifies
legacy persona-prefixed messages, retained conversation personas and role changes.
UI labels, session storage and DOM changes cannot grant persona access. Direct
KPI requests require Executive; direct salesperson assignment administration
requires SystemAdmin. These exact checks supersede earlier broader Manager/Admin/
Executive access to the agent's assignment editor and Admin access to KPI data.

Sales-order lists show individual order amounts. Summary totals and total-missing
warnings appear only when the current question explicitly requests aggregation;
planner/tool descriptions and persona instructions cannot request totals on the
user's behalf. Tests:1,160 backend and26 frontend passed.

Sales persona correction: Sales role4 now receives only the Sales persona. Customer Service is denied for Sales accounts, including already-open service conversations and forged/legacy requests. The existing frontend reads this server policy on refresh; no frontend runtime change or account reassignment is required. Other roles retain their current persona permissions. Backend1,163 and frontend26tests passed.


Query optimization phase1 (October 22, 2026)

Business lookups normalize into ChatBusinessQuery: customer pricing, order search,
order details, customer notes and inventory. Fixed parsing now preserves completed/
open status, explicit date ranges/year and count; supported model output uses the
same validated contract and executes directly. Ordinary latest-order questions do
not need a classifier/model tool-selection round. Totals still require user intent.

ChatPlanCache retains validated model-generated, context-free plans for5minutes,
maximum500entries, keyed by version/date/user/role/persona/tool catalog/question
hash. Follow-ups and open-page contexts bypass it. It stores no ERP records, prices,
notes, answers, tokens or permission results. Every cache hit executes fresh,
authorized data reads. Conversation choices are user-owned, expire after5minutes,
require a listed ID/number, preserve original filters/calculations and recheck
ownership. Changing role/persona clears pending choices. Cancel clears the choice.

Invoice and order history reads run concurrently; shared collections merge only
after both return. One scoped client limits document-detail calls to4 concurrently.
The pricing path now uses a live-verified bulk `Details` projection containing only price, unit, quantity, amount and description fields. Acumatica rejects item-detail predicates and ignores REST ordering, so customer/date filtering happens in Acumatica and exact item matching happens after complete date windows are locally sorted. A recent seven-day window precedes the remaining requested period. Pagination rejects duplicate or out-of-scope documents; each window is limited to 1,000 rows and each source has a 12-second deadline. Ten matching lines satisfy recent-history output; stopping early produces explicit partial-coverage text. The newest matching document per source receives one additional full read to preserve its notes. Customer notes and current IMP Price remain separate verified reads. The legacy 200-document reader remains only for backward compatibility; the customer-price tool no longer calls it.

ChatRateLimits.RequestsPerMinute defaults to10; MaximumConcurrentQueries defaults
to2. User-ID-based limits count requests even on plan-cache hits, and concurrency
leases release when requests finish. 429 responses carry retry guidance. These
limits, plan cache and conversation memory are process-local. Azure currently has
one replica and can scale to3; shared storage is needed for global limits/shared
state across replicas. No Redis or embedding/vector service is provisioned.

Timings emit fixed stage names and role only, without raw questions, credentials,
customer IDs or notes. Backend1,178tests and frontend27tests passed. Cache integration
test proves one planner model call for two identical standalone questions; history,
role, persona and account changes do not reuse that plan. No production p95 or
percentage speed/cost saving is claimed before measuring live traffic.


Bulk history verification (October 22, 2026): backend1,241 tests passed, Release zero errors. Read-only diagnostic runs of the actual reader took1.538seconds/4requests for NITTO ZEB110300PVW (no exact historical lines),3.433seconds/6requests for NITTO ZEB060300R7 -Z (order and invoice priced lines), and2.300seconds/5requests for HORNE01 DMX165360PVW (SO0000181 verified). These are history-stage samples, not full-chat or production p95 measurements. UTC offset dates are normalized before checking date-window scope.

Multi-item verification: `what is price of item x, y, z for customer A` currently parses as one description, `item x, y, z`, with one customer-price call. Reliable batch pricing is not implemented; do not represent this wording as a supported multi-item lookup.


Model migration (October22,2026): active model is Azure GPT-5.6 Luna, deployment `gpt-5.6-luna`, version `2026-07-09`, GlobalStandard capacity20. The previous GPT-4.1 mini deployment was retired at the user's request. The pinned SDK is adapted through ChatModelPolicy to send max_completion_tokens and reasoning_effort=none for Luna; documentation Responses requests likewise use none. Structured output, streaming function calls, token usage, actual IMP planner extraction and official documentation retrieval passed live checks. Backend1,248 tests passed. Published Luna reference rates are used for the displayed estimate; actual Azure invoices may differ.

## Persona presentation (2026-10-23)

Sales persona: IMP Price plus the latest matching non-cancelled sales-order price; omit the recent-record list and special-notes section. Customer Service persona: IMP Price, at most three distinct matching sales orders (multiple line prices for one order stay distinct), relevant special notes, and direct Acumatica SO301000 links. Both use only sales-order history for pricing. Missing and partial history remain explicit. Existing unselected legacy/Executive/IT display contracts stay compatible.

Order links use only verified order numbers/types from the authorized response evidence and the current deployment ERP/company. Frontend links are restricted to that exact sales-order route, match their visible order number, open in a new tab with noopener/noreferrer, and never contain credentials. Customer Service chat authentication and sales-field projection are scoped separately from Operator/production and admin permissions. Persona changes do not alter account roles or customer ownership.
