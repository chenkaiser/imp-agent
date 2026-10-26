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
