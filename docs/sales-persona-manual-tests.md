# Sales persona manual test checklist

Use these questions to check the deployed IMP Agent at https://ask.impops.work or through the Acumatica browser widget.

## Before testing

- Sign in with an account whose actual IMP role is **Sales**, then use the Sales persona. Selecting the Sales persona on a Manager or Admin account does not restrict that account to assigned customers.
- Confirm the account's salesperson mapping and assigned customers. Use another assigned customer if BROTHER or NITTO is not assigned to your test account.
- For the access-denial test, use a customer confirmed to be unassigned to the account. AbeTech is the example below.
- Compare returned values with current Acumatica records. Prices, stock, order status and customer assignments can change; this checklist does not prescribe fixed numeric answers.

## 1. Continue a pricing question after clarification

Ask:

> What is the price of #ZEB110074ECO-LL2?

When asked for the customer, reply in the same conversation:

> *BROTHER

Expected result:

- The agent retains item ZEB110074ECO-LL2 and uses BROTHER as the customer search term.
- It completes the lookup if the customer is assigned to you, rather than repeating the missing-customer question.
- Ambiguous matches require confirmation; an unassigned customer must be denied.
- The answer clearly shows IMP Price, currency, unit and price type when available, plus the latest same-customer/item sales-order price when available.

## 2. Calculate a discounted price

Ask:

> What is the IMP Price of #091018000EWR for *NITTO, and what would it be after a 5% discount?

Expected result:

- The answer shows the source IMP Price and a clearly labeled calculated price using source price × 0.95.
- Currency and unit are preserved; missing context is not invented.
- The calculation does not change the price or create a quotation in Acumatica.

## 3. List recent orders with inventory IDs

Ask:

> Show me the latest 5 sales orders for *NITTO.

Expected result:

- Up to five matching, authorized orders appear in a readable table, newest order date first.
- The table includes order number, customer, status, order date, customer PO, inventory IDs and order amount when available.
- Multiple distinct inventory IDs are shown per order. More than five distinct items are indicated with a remaining-item count.
- Unavailable item data is labeled **Unavailable**, rather than implying the order has no items.
- No combined total is added unless requested.

## 4. Check available inventory

Ask:

> How much #ZEB110300PVW is available in MAIN warehouse?

Expected result:

- The answer identifies the item and MAIN warehouse, with available quantity and unit when verified.
- Available quantity is distinguished from on-hand quantity.
- Missing or failed stock data is not represented as zero.

## 5. Deny access to another salesperson's customer

Ask:

> Show me the latest sales orders for AbeTech.

Expected result, when AbeTech is not assigned to the account:

- Access is denied.
- No order numbers, item IDs, prices, amounts or shipping details are disclosed.
- The agent does not broaden the search or substitute a different customer.

## Record each test run

| Test | Pass / Fail | Actual response or issue |
| --- | --- | --- |
| 1. Pricing clarification | | |
| 2. Discount calculation | | |
| 3. Recent orders and inventory IDs | | |
| 4. Available stock | | |
| 5. Customer-access denial | | |

Record the test date, login, actual role, salesperson ID and the customer assignments used. Do not record passwords or access tokens.

## Customer requirements and demo questions

Review date: 2026-10-25. This is a **code review of implemented capabilities**, not a completed live acceptance run. Use an actual Sales account and assigned customers. Replace example orders/items with records verified immediately before the demo. The original five regression scenarios above remain unchanged; the questions below extend the customer demo and backlog, not the fixed 15-question CI acceptance set.

| Customer requirement | Current readiness | What can be demonstrated honestly |
| --- | --- | --- |
| Real-time inventory | Implemented; live rehearsal required | Read available stock for an identified item and warehouse, including unit and check time. Availability is a point-in-time inquiry, not a reservation or promise to ship. |
| Shipping status and tracking | Partial | SO status, shipping carrier, scheduled shipment date and linked shipment number/status/date/quantity are supported. Package tracking numbers, clickable carrier tracking and confirmed delivery events are not implemented. |
| Sample order processed and tracking | Partial; no dedicated sample workflow | An existing sample order can be inspected using its confirmed SO number. There is no explicit sample flag/type search or package tracking reader. A zero-value order is not proof it is a sample. Processing/creating sample orders is outside read-only chat. |
| Sales reports by customer, product and timeframe | Partial | Authorized SO search supports customer/item/date/status filters, line prices and requested totals. Searches return at most 50 SOs; totals cover returned orders only. This is not a complete invoiced-sales report, export or financial reporting feature. |
| Sales compared with previous year and percentage of budget | Not available to Sales | General IMP budget/report APIs exist but the agent gateway reserves them for Executive-level access. There is no scoped Sales tool combining actuals, previous-year sales and approved budget with validated completeness. Partial legacy history also prevents assuming complete annual comparisons. |
| Quick access to current customer price lists | Partial | One customer/item price lookup is implemented, including pricing tier and latest same-customer/item SO price. Exact-item price rows can include quantity breaks and validity dates. There is no customer-wide catalog, browse/export price list or verified multi-item batch list. |

### D1. Real-time inventory — rehearse for the demo

> How much #ZEB110300PVW is available in MAIN warehouse right now?

Check the inventory ID, warehouse, available quantity, selling/base unit and source/check time against Acumatica. Do not substitute on-hand quantity for available quantity. If a live lookup fails, the answer must not invent zero stock.

### D2. Shipping status and tracking — partial capability

Customer's full question:

> Has sales order SO0000178 for Nitto shipped? Show its shipment status, estimated ship date, carrier and tracking number.

Use this confirmed SO only if NITTO is assigned to the demo Sales login. Current code can show the order/shipment status, scheduled date and carrier when returned. It cannot verify a carrier tracking number or delivery events. The agent should acknowledge that limitation rather than invent a tracking link or claim delivery. For the ready portion, ask:

> Show the shipping status, scheduled ship date and linked shipments for sales order SO0000178.

Shipment numbers and carrier tracking numbers are different identifiers. A scheduled date is an estimate; a shipment date does not establish delivery.

### D3. Sample-order processing and tracking — backlog acceptance question

> Has the sample order for Nitto with customer PO [verified sample PO] been processed? What shipped, when, and what is the tracking number?

**Not a ready end-to-end demo.** First confirm a real sample PO/SO with Customer Service; do not use a fictional record. Existing PO/SO lookup can inspect the known order and its linked shipment status, but dedicated sample identification and tracking are missing. Do not infer samples from a zero order amount, or confuse an Acumatica shipment number with carrier tracking. No sample order is created or changed by the agent.

### D4. Customer/product/timeframe sales report — bounded SO demonstration

Full customer requirement:

> Show sales for Nitto for item 091018000EWR from October 1 through October 31, 2026, with quantities and total sales amount.

**A complete sales report is not implemented.** Clarify whether “sales” means SO bookings or posted invoice sales and the currency/date basis. For the implemented subset, rehearse:

> Show the latest 10 sales orders for customer Nitto containing item 091018000EWR from October 1 through October 31, 2026. Include item details and the total order amount for those returned orders.

Check customer, item and date filters, currencies and order references. The displayed total is for returned whole orders; if an order includes other products, its order total is not this item's sales total. Do not describe a bounded SO result as all monthly sales or include orders and invoices in the same sales total. Complete reporting needs pagination, a defined invoice/order basis, product-line aggregation, returns/credits handling and explicit coverage.

### D5. Previous year and budget achievement — backlog acceptance question

> For my customer Nitto, compare October 2026 sales with October 2025. Show the percentage change and percentage of the approved October 2026 sales budget achieved.

**Not available to a Sales account today.** Do not switch to Admin/Executive to imply Sales has this capability or weaken the permission policy for the demo. A future implementation must use authorized customer scope, comparable periods and currencies, verified actuals and an approved budget mapped to the same customer/period. Required calculations are `(current - previous) / previous × 100` and `actual / budget × 100`; zero/missing denominators and incomplete legacy history must be identified, never treated as zero sales or zero budget.

### D6. Current customer price list — item lookup ready, full list missing

Full customer requirement:

> Show Nitto's current customer price list with inventory IDs, prices, currency, units, quantity breaks and effective dates.

**The complete customer-wide list is not implemented.** For the ready subset, use an assigned customer and an item whose price context you have verified, for example:

> What is the current IMP Price of #091018000EWR for *NITTO, and what price did we use on the latest sales order for this same item and customer?

Use autocomplete to select the exact customer/item. Verify currency and UOM before quoting; this example previously had incomplete currency context, so choose another verified item if that remains unresolved. Prices may depend on unit, quantity break, promotion and validity date. A Customer Price Class reference from an unassigned class must be highlighted as a reference, not represented as an agreed customer price. Sales responses should remain concise: IMP Price and the latest SO price; no special-notes section or longer history list.

## Recommended customer demo sequence

1. Confirm the Sales account's customer assignments and verify a real item, a real customer order and (if desired) a sample order in Acumatica.
2. Demonstrate inventory (D1), customer/item price lookup (D6 subset), recent order details (original test 3) and shipping status (D2 subset).
3. Demonstrate the existing clarification, discount and unauthorized-customer guard tests above using verified records with complete currency/UOM.
4. Present D3–D5, carrier tracking and the full D6 customer price list as gaps/planned work, not completed functionality. No dates or delivery commitments have been approved.

| Demo check | Pass / Fail / Not implemented | Verified source / follow-up |
| --- | --- | --- |
| D1. Available inventory | | |
| D2. SO/shipment status and planned dates | | |
| D2. Carrier tracking and delivery events | Not implemented | |
| D3. Known sample SO inspection | | |
| D3. Dedicated sample identification and tracking | Not implemented | |
| D4. Bounded customer/item/date SO lookup | | |
| D4. Complete product sales report | Not implemented | |
| D5. Sales YoY and budget percentage | Not implemented for Sales | |
| D6. Customer/item IMP Price and latest SO price | | |
| D6. Complete current customer price list | Not implemented | |

Implementation evidence: backend `impapi/Mcp/ImpMcpTools.Inventory.cs`, `ImpMcpTools.SalesOrders.cs`, `ImpMcpTools.SalesPrices.cs`, `ImpMcpTools.CustomerPricing.cs`, `impapi/business/Chat/ChatCustomerPriceAnswer.cs`, and `ChatApiGateway.cs`. Shipping projections currently include shipment number/status/date/quantity, not package tracking fields. The gateway applies an Executive floor to Budget/ImpReport APIs; that does not provide Sales with scoped report access.
