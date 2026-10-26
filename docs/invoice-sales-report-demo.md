# Invoice sales report demo

Use the **Executive persona with an active Executive account role**. Sales, Customer Service, Manager, Sales Manager and SystemAdmin roles cannot access sales reports. Selecting another persona does not grant Executive permissions.

## Demo script

1. `Show sales by salesperson for October 2026.`
2. `Only salesperson DW.`
3. `Only customer *NITTO.` (Use a customer belonging to that salesperson; an empty intersection is legitimate.)
4. `Show the invoices behind these totals.`
5. `Page 2.`

Start a new conversation for `Show invoiced sales for October 2026, by customer.` with an Executive login and the Executive persona selected. Use exact salesperson and customer IDs to filter the report.

Clarification check: `Show sales report for October.` Reply `2026`. The report must retain October.

## Definitions and boundaries

- Source: live Acumatica AR Invoice endpoint, not SO bookings or the spreadsheet.
- Included documents: Open or Closed invoices and debit memos, less credit memos. Holds, unreleased and voided statuses are excluded. Paid and unpaid released documents both count.
- Amount: AR line amounts after document discounts, excluding tax. Freight recorded on AR lines is included. Each document must reconcile to its amount less tax; otherwise the report fails without a partial total.
- Attribution: invoice line Salesperson ID first. The invoice's saved Default Salesperson is a fallback only when populated line assignments do not conflict. Customer ownership and commission percentages never determine historical credit.
- A multi-salesperson document with a document-level discount stays Unattributed until an allocation policy is agreed. Blank unresolved assignments also stay Unattributed.
- Separate totals per currency; no invented exchange rates. Calendar month uses invoice dates, not payment or posting dates.
- All pages are read before totals are calculated. More than 10,000 documents, duplicate keys, ignored filters or missing financial fields stop the report. Invoice evidence is paged in groups of 20; group tables display at most 25 groups and are labeled.
- Customer/salesperson filters require exact IDs. The existing `*` autocomplete can supply the customer ID. Budget, prior-year comparisons, product reports and missing Sage history are outside this first demo.
- Executive role and Executive persona are required on every request, including follow-ups and invoice pages. Role checks are enforced before Acumatica reads; unauthorized roles cannot receive report evidence at the final disclosure boundary.
- Invoice links open Acumatica AR301000, which applies Acumatica's own signed-in permissions. A link does not grant access.

## Verification

A live monthly extract was reconciled against the existing integration account. Actual customer sales figures belong in authenticated report results and are not included in this public documentation. This is a point-in-time smoke check, not a claim that migration history is complete or that it matches the spreadsheet.

Automated coverage is included in backend GitHub Actions: credit signs, released states, date boundaries, complete pagination, scope validation, reconciliation, default salesperson fallback, conflicting line assignments, clarification/follow-up state, Executive-only isolation, catalog permissions and readable invoice evidence. Frontend tests cover invoice-link allowlisting.
