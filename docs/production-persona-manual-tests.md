# Production persona manual test checklist

Use the **Production** persona with an existing Manager, Executive or SystemAdmin account. Operator and Packer access is unchanged. Start a fresh chat for each question and compare answers against current Acumatica and IMPUI records.

## 1. Weekly production demand

> Which sales orders need production orders this week?

Expect requested-date scope, item demand, verified stock coverage and existing production links. Missing data must remain unknown; a shortage is not an instruction to create an order.

## 2. Released production orders

> List released production orders starting this week.

Expect Released status and this week's scheduled start-date filter. Show order numbers, dates and available quantities; explain paging and ordering accurately.

## 3. Raw-material readiness

> Do we have enough raw materials for production order PROD0000003?

Expect material inventory IDs, verified units, remaining requirements, available quantities and shortages in a readable table. Missing IDs, units or conversions must prevent an unqualified readiness conclusion. Missing data is not zero.

## 4. Linked production progress

> What production orders are linked to sales order SO0000178, and how far along are they?

Expect explicit Acumatica sales-order links and live operation status with planned, completed and remaining quantities. If no link is returned, explain that linked progress is unavailable; do not infer a link from a shared item or imply stock fulfillment is impossible.

## 5. IMPUI completion and Acumatica status

> Has PROD0000003 finished in IMPUI and synced to Acumatica?

Expect separate saved IMPUI status and live Acumatica status/operations. IMPUI Complete alone does not establish successful synchronization. Show discrepancies clearly; missing operation quantities stay unknown and explicit zero stays zero.

## Record each run

| Test | Pass / Fail | Actual response or issue |
| --- | --- | --- |
| 1. Weekly demand | | |
| 2. Released orders | | |
| 3. Material readiness | | |
| 4. Linked progress | | |
| 5. Completion and synchronization | | |

Record date, login, actual role and compared records. These are read-only checks: no releases, production planning writes or synchronization actions. Examples do not guarantee current records or fixed numeric results.
