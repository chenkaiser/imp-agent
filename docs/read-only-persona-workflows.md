# Read-only persona workflows

Scope: normal-user Sales, Customer Service and Production workflows. Executive KPI development is deferred. Existing manual KPI and Sales Access administration screens remain, as requested. No persona chat tool creates orders, releases production, imports logs, syncs completion, sends email, prints documents or reserves inventory.

## Everyday questions and coverage

| Persona | Common question | Read capability |
| --- | --- | --- |
| Sales | What can I quote this customer for this item? | Existing IMP Price, latest same-customer/item order price, customer/item confirmation and assigned-customer guard |
| Sales | How much is available? | Existing live stock and lot/location lookup; availability is not a reservation |
| Customer Service | Which order matches this customer PO or item? | Existing order search and exact order details, with customer confirmation on ambiguity |
| Customer Service | Does this order have stock, and what must shipping check? | New `GetSalesOrderFulfillmentReadiness`: open quantities, recorded order prices, full ship-to, carrier/terms, notes, linked shipments and grouped stock comparison |
| Production | What demand remains on this sales order? | New `GetManufacturingSalesOrderDemand`: open items and stock, without prices, addresses or customer notes |
| Production | Which SOs need production this week? | `GetWeeklyProductionDemand`: requested-date SO page, open item demand combined across orders, current finished-goods stock and linked production; flags planning review candidates |
| Production | Is production already planned for this sales order? | New `SearchAcumaticaProductionOrders`: exact linked order/item/status filters, paging and matching saved IMP links |
| Production | Do we have the raw materials? | Existing live material availability, now displayed as a compact required/available/shortfall table |
| Production | Did the completed IMP work reach Acumatica? | New `GetProductionHandoffStatus`: compares saved IMP status and live ERP operation quantities; identifies discrepancies and missing links without asserting transaction-level sync success |
| IT Admin | Who consumed tokens, and what does each persona ask? | New SystemAdmin-only monthly usage ledger report, by user and question category; no raw prompts or customer details |
| IT Admin | What is the Azure AI bill and forecast? | New direct Azure Monitor and Cost Management API report, fixed AI resource scope, reported charges separate from estimates |
| IT Admin | What is wrong with a workflow or configuration? | Existing authorized read tools and official documentation; write actions excluded from the positive chat tool catalog |
| Executive | KPI and management reporting | Existing features unchanged; further implementation deferred |

## Permissions and evidence

- Production persona and manufacturing reads: Manager, Executive and SystemAdmin only. Operator/Packer access is unchanged.
- New Customer Service readiness read: CustomerService, Manager, Executive and SystemAdmin. It adds no Sales access. Existing Sales customer ownership checks remain unchanged.
- Each live request uses the signed-in user's Acumatica token. Shared metadata caches cannot authorize a customer or supply stock/prices.
- Every result passes a positive disclosure schema. Manufacturing demand cannot disclose selling prices, customer addresses or customer notes.
- Chat exposes only explicitly audited read tools. Newly annotated MCP methods do not become chat capabilities automatically. The API gateway retains its positive read-only endpoint catalog.
- Customer notes are untrusted source text, never instructions to the agent. Long notes are excerpts and are marked accordingly.

## Clarification across personas

Every persona asks a relevant clarification when the record type or required inputs are unclear, before selecting a speculative lookup. “List me the productions this week” asks whether the user means Acumatica Production Orders or IMPUI production logs. Confirming Production Orders retains the original week/page; an unclear “yes” repeats the choice without reading data. A log choice explains that weekly IMPUI log date filtering is not yet available and asks for a supported Ref No/status/machine/PO/part filter. Confirmation does not bypass account permissions.

When reads fail, a shared renderer gives a concise unverified-result message and a tool-specific follow-up question. It preserves successful partial data and retrieved documentation. Access restrictions and expired sessions remain explicit; they are not described as misunderstanding, and no data is invented. A verified empty/not-found response remains an empty result rather than being relabeled as a failure.

## Decision boundaries

- Duplicate item lines are combined by item and warehouse before comparing stock. Only verified unit conversions are used.
- Missing warehouse, unit, conversion or failed stock request means **not verified**, not zero stock. Checks are bounded; uncovered lines remain unknown.
- Stock coverage does not establish shipment readiness. Customer Service still verifies price, address, approval/credit holds, allocations, lot requirements and instructions in Acumatica.
- Shortfall is a prompt to review allocations, planned receipts and existing production before requesting manufacture or purchasing. It does not prove a new order is required.
- Recorded order prices are shown; the readiness check does not automatically compare every line with current IMP Price. Existing customer/item pricing tools provide that separate lookup.
- IMP completion, ERP completion, stock posting and shipment readiness remain separate facts. Matching completion states do not prove which sync transaction posted stock.
- Production search preserves ERP page order. Live probing showed that the tenant can ignore `$orderby`; the answer does not claim newest-first ordering or a global total.
- Changing sales/production records, converting to logs, synchronizing completion, and printing picking/packing documents remain manual operations in Acumatica/IMPUI.

## Examples

- Customer Service: “Can we ship SO0000178?”
- Customer Service: “Check fulfillment readiness for SO0000178.”
- Production: “Check stock for SO0000178.”
- Production: “What are the SO need Production Orders this week?” Use “next week”, “last week”, or append “page 2” for another bounded page. Week is Monday–Sunday in America/New_York, filtered on SO requested date. Overdue/undated orders are outside that filter. Page stock totals are not a complete company demand plan, and do not allocate stock among orders.
- Production: “Find production orders for ORD247844.”
- Production: “Show released production orders.”
- Production: “List me the production orders this week.” Uses scheduled start dates, Monday–Sunday in America/New_York. “List production orders ending this week” uses scheduled end dates. Next/last week, status filters and explicit page numbers are supported. The date basis and range appear above the table; undated orders are excluded and no creation-date claim is made.
- Production: “Check material availability for PROD0000003, order type MO.”
- Production: “Check sync progress of PROD0000003.”

## Remaining integrations

Mailbox contents and formal customer confirmation are not connected to the agent. Supplier purchase-order status and expected receipt dates need a separately verified procurement read contract. Transaction-level sync provenance and exact inventory-posting reconciliation also require additional evidence; the handoff result explicitly marks those checks as unverified. These are not inferred from order or IMP status.

## IT Admin usage and billing

- Examples: “List users by token consumption this month”; “What are the most common questions by each persona?”; “Show Azure AI Foundry costs and forecast this month”.
- Question-only requests show category counts and shares without unrelated token/user tables. Overall rankings aggregate across personas; requests mentioning personas show the per-persona breakdown. Coverage begins with recorded telemetry, and its UTC timestamp is explicit. Exact historical question text is not stored.
- Reports require SystemAdmin, independently of persona labels and Executive access. Ledger queries aggregate all recorded requests before user paging; the top five fixed categories are shown for each persona.
- The ledger contains UUID, UTC timestamp, persona, fixed category, model, token counters, metering completeness and outcome. It contains no prompts, answers or customer/price data. Internal telemetry inserts never flush other tracked entities.
- Historical per-user attribution is unavailable before activation; Azure resource totals include all deployments/callers. They are displayed separately. Cached input is part of input, never counted twice.
- Azure reports use a fixed configured AI resource, managed identity, Monitoring Reader on the AI account and Cost Management Reader at the resource-group query scope. The agent cannot provide arbitrary resource IDs, URLs or queries.
- Pre-tax billing costs retain their returned currency. Native Azure forecast is preferred; a labeled run rate based on the latest reported billing date is used only when native forecast is unavailable. Empty/failed/incomplete responses are not zero charges.
- Reports cache for five minutes and honor billing API throttling. UTC billing months are explicit. This is an AI-resource cost report, not a final tax invoice or the entire Azure subscription bill.
