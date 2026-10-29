# Invoice sales report demo

## Five-tab sales workbook

Use the Executive persona and ask `Show the complete sales report for January 2027` or `Show all sales report tabs for October 2026`. The report year and month control every tab. January 2027 compares January 2027 with January 2026; February compares February and January–February YTD. Prior-year annual totals use the preceding calendar year. The workbook contains the five report tabs from the reference, in their original order:

1. Sales Growth
2. Sales Growth By Saleperson (the reference worksheet spelling)
3. Sales Budget By Salesperson
4. Sales Growth and Budget
5. Sales By Salesperson

The browser provides five selectable views and **Download all five tabs (.xlsx)**. Export preserves the reference's header rows, year groups, month columns, territory/salesperson/customer hierarchy, source formatting and grand totals. Multiple currencies receive separate sets of worksheets; they are never converted or added together. The simple existing monthly salesperson report and its download remain available.

Budgets are on-demand planning scenarios: preceding-year monthly recorded sales × (1 + increase percentage). The approved default is **10%**. Follow up with `Set *NITTO to 15%` for a customer override or `Set default increase to 12%`; these assumptions stay with that conversation task. They are not saved as approved budgets, and no Acumatica records are changed. Historical credit continues to use invoice salesperson attribution, matching the existing report. Territory mapping comes from the approved workbook configuration; missing mappings are visibly Unmapped territory.

Missing baseline months use a clearly marked estimate from that customer/salesperson's available elapsed calendar months. If only the current baseline month is recorded, its actual-to-date amount is the provisional fallback, without annualizing it. Estimates are marked `~` in the browser and receive an explanatory cell note and yellow fill in Excel. Missing actuals and unknown comparisons stay `—`, never invented zeroes. A month with records does not certify complete migrated history. Customers without any recorded sales in either year are not included. Source coverage and assumptions travel with every worksheet.

The ratio formulas follow the reference, including `SIGN(actual)` when a known denominator is zero. If a required input is unavailable, the ratio remains unavailable. Monthly customer budgets are rounded to cents before subtotals, so customer rows and grand totals reconcile. The backend reads all accessible pages for every requested month with at most three concurrent month reads; more than 10,000 documents in a month or 1,000 customer/salesperson/currency groups requires narrowing the scope. Source errors stop the workbook rather than produce partial financial totals.

Regression coverage includes January 2027 versus January 2026, dynamic September/January budget columns, five worksheet names/order, formulas and cached numeric results, subtotals, rounding, estimates, unknown data, currencies, literal spreadsheet text, task continuation and Executive-only access. Synthetic tests do not establish live historical coverage or replace reconciliation of tenant data.

Use the **Executive persona** with an active IMP Executive role or a verified Acumatica role named exactly **Executive**. Sales, Customer Service, Manager, Sales Manager and SystemAdmin roles alone do not grant sales-report access. Selecting another persona does not grant Executive permissions. Existing IMP roles are preserved: for example, SystemAdmin plus verified Acumatica Executive can use both IT Admin and Executive. Acumatica entitlement is checked with the signed-in user token against the self-only role inquiry during persona discovery and on every Executive chat request; failed verification denies the additional access.

## Demo script

1. `Show sales by salesperson for October 2026.`
2. `Only salesperson DW.`
3. `Only customer *NITTO.` (Use a customer belonging to that salesperson; an empty intersection is legitimate.)
4. `Show the invoices behind these totals.`
5. `Page 2.`

Start a new conversation for `Show invoiced sales for October 2026, by customer.` with an Executive login and the Executive persona selected. Use exact salesperson and customer IDs to filter the report.

Clarification check: `Show sales report for October.` Reply `2026`. The report must retain October.

Click **Download Excel (.xlsx)** on a completed report to save the same full-name hierarchy and amounts. The worksheet preserves the reference's B2 title, B3:C5 filters, B7:C7 headers, indented customer rows, salesperson subtotals and grand total. Amounts are numeric Excel cells; the export is a snapshot of the displayed report, with its source and coverage note below the table. Different currencies use separate worksheets. No report data is sent to an export service, and downloading does not run another Acumatica query.

## Definitions and boundaries

- Source: live Acumatica AR Invoice endpoint, not SO bookings or the spreadsheet.
- Included documents: Open or Closed invoices and debit memos, less credit memos. Holds, unreleased and voided statuses are excluded. Paid and unpaid released documents both count.
- Amount: AR line amounts after document discounts, excluding tax. Freight recorded on AR lines is included. Each document must reconcile to its amount less tax; otherwise the report fails without a partial total.
- Attribution: invoice line Salesperson ID first. The invoice's saved Default Salesperson is a fallback only when populated line assignments do not conflict. Customer ownership and commission percentages never determine historical credit.
- A multi-salesperson document with a document-level discount stays Unattributed until an allocation policy is agreed. Blank unresolved assignments also stay Unattributed.
- Separate totals per currency; no invented exchange rates. Calendar month uses invoice dates, not payment or posting dates.
- All pages are read before totals are calculated. More than 10,000 documents, duplicate keys, ignored filters or missing financial fields stop the report. The main report follows the uploaded Sales By Salesperson tab: Year, Period, Territory (All), then Salesperson and Total Sales Amount, with each salesperson subtotal followed by indented customer names and a Grand Total. Names come from Acumatica, including inactive records needed for historical invoices. All customer groups are displayed, up to a safety limit of 1,000 groups; larger populations require a filter. Invoice evidence is a separate requested detail table, paged in groups of 20.
- Territory-specific filtering is not enabled because the workbook territory-to-Acumatica mapping has not been verified. Territory (All) is supported.
- Customer/salesperson filters require exact IDs. The existing `*` autocomplete can supply the customer ID. Budget, prior-year comparisons, product reports and missing Sage history are outside this first demo.
- Executive role and Executive persona are required on every request, including follow-ups and invoice pages. Role checks are enforced before Acumatica reads; unauthorized roles cannot receive report evidence at the final disclosure boundary.
- Invoice links open Acumatica AR301000, which applies Acumatica's own signed-in permissions. A link does not grant access.

## Verification

A live monthly extract was reconciled against the existing integration account. Actual customer sales figures belong in authenticated report results and are not included in this public documentation. This is a point-in-time smoke check, not a claim that migration history is complete or that it matches the spreadsheet.

Automated coverage is included in backend GitHub Actions: credit signs, released states, date boundaries, complete pagination, scope validation, reconciliation, default salesperson fallback, conflicting line assignments, clarification/follow-up state, Executive-only isolation, catalog permissions and readable invoice evidence. Frontend tests cover invoice-link allowlisting.
