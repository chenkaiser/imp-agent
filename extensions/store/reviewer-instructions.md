# Reviewer testing instructions

Purpose: an authorized employee can use IMP Agent beside Classic Acumatica without
modifying Acumatica or installing a server customization.

The publisher must arrange review access before submission. Do not expose a live
employee account or production customer records. Use an approved, restricted test
account and test data, or agree a suitable review demonstration with Google.
Credentials, if required by the dashboard, should be entered by the publisher only
in the developer dashboard's private Test Instructions fields, not this repository,
the public listing, screenshots or chat.

## Steps

1. Install the review build. Open the toolbar action to display the side panel.
2. Confirm the hosted Ask IMP sign-in page loads. If framing is blocked, the
   publisher has not completed the store-ID allowlist step and must not submit yet.
3. With the publisher-provided restricted test account, click Sign in with Acumatica,
   complete sign-in in the popup, and return to the panel.
4. Verify persona selection follows that account's permissions. Ask a question
   about an approved test item/customer or production order.
5. Confirm a readable response and progress messages. Test # item autocomplete
   and * customer autocomplete when permitted by the selected persona.
6. Visit the configured Acumatica host with the approved account. The Ask IMP
   launcher should appear at the lower right. Click it to open the same panel.
7. Switch Acumatica screens. The launcher remains available on the outer Classic
   page. Close/reopen the panel and verify behavior in the actual installed browser.
8. Sign out of the agent. No subsequent lookup should be possible without signing in.

The user must be authorized by the IMP backend; extension installation grants no
additional personas or customer access. Screenshots must use approved test data.
