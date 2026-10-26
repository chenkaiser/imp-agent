# Customer Service persona manual test checklist

Use these questions to check IMP Agent at https://ask.impops.work or through the Acumatica browser widget.

## Before testing

- Sign in with an account authorized for the **Customer Service** persona, then select that persona.
- Start a new chat for each numbered test. Keep both messages in test 5 in the same conversation.
- Compare answers with current Acumatica records. Order status, prices, stock, addresses and scheduled dates can change. The examples below do not assert that matching orders currently exist.
- These are read-only tests. The agent must not create orders, release holds, create shipments, print documents or change prices.

## 1. Recent orders with items, prices and shipping status

Ask:

> Show me the latest 3 sales orders for Nitto, including inventory IDs, prices and shipping status.

Expected result:

- The customer resolves to Nitto; display instructions are not included in the customer or item search terms.
- Up to three matching orders appear, newest order date first, with inventory IDs, order-line prices and shipping information when available.
- Order references are clickable links to the corresponding Acumatica Sales Order.
- Missing fields are identified as unavailable; no values are invented.

## 2. Find an order by customer PO

Ask:

> Find the sales order with customer PO 41321. What is its shipping address and estimated ship date?

Expected result:

- The PO search uses exactly **41321**; the second sentence is not included in the PO reference.
- The answer shows the matching order number and verified ship-to address, including available street lines, city, state, postal code and country.
- The scheduled ship date is labeled as an estimate, separate from actual shipment dates.
- Multiple matches require clarification before treating one order as the intended order.
- No match is reported honestly; the agent must not assume SO0000181 is still the matching record without verifying it.

## 3. Review shipping readiness

Ask:

> Is SO0000181 ready to ship? Show any remaining quantities, stock shortages or holds.

Expected result:

- The answer uses the current order status and shows verified remaining quantities and stock coverage.
- A completed order is identified as completed; it is not presented as a new shipment awaiting creation.
- Holds or other checks that cannot be verified are marked unknown, rather than cleared.
- Stock coverage alone is not treated as permission to ship. The agent makes no workflow changes.

## 4. Customer pricing, recent sales and notes

Ask:

> What is the IMP Price of #091018000EWR for *NITTO? Include the latest 3 sales-order prices and relevant customer notes.

Expected result:

- The answer clearly shows the current IMP Price, price type, currency and unit when returned.
- It shows at most three recent same-customer/item sales-order prices, with dates and clickable Acumatica order references.
- Applicable customer notes are shown, especially product-specific pricing or unit requirements. Operational instructions must not be misrepresented as pricing conditions.
- Ambiguous customers or items require confirmation. Missing notes, prices or history must not be invented.

## 5. Refine an existing order search

First ask:

> Show me Nitto’s orders.

Then reply in the same conversation:

> Only open orders containing 091018000EWR, including estimated ship dates.

Expected result:

- The agent retains Nitto as the customer.
- It applies **Open** status and item **091018000EWR**, and requests estimated ship dates.
- Other existing filters remain intact unless explicitly changed.
- It performs a fresh authorized search, rather than filtering only the first five displayed orders.
- A genuine empty result shows the applied customer, status and item filters. It must not invent an order to satisfy the request.

## Record each test run

| Test | Pass / Fail | Actual response or issue |
| --- | --- | --- |
| 1. Recent orders, items, prices and shipping | | |
| 2. Customer PO, address and estimated date | | |
| 3. Shipping readiness | | |
| 4. IMP Price, recent sales and notes | | |
| 5. Conversation-based order refinement | | |

Record the test date, login, actual account role and relevant Acumatica records. Do not record passwords or access tokens. These are acceptance expectations, not a claim that every test has been verified against live data.
