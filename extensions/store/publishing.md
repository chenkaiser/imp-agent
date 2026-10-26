# Unlisted release runbook

The user has authorized unlisted distribution. No public distribution should be
selected. Nothing has been uploaded or submitted while Google verification is pending.

1. Owner completes Google verification and, if necessary, developer registration,
   payment and acceptance of the developer agreement personally.
2. Run `npm run check`, `npm test` and `npm run package:store`.
3. Upload `dist/ask-imp-webstore.zip` as a new draft. The package omits the pilot
   `manifest.key`; obtain the assigned item/extension ID from the dashboard. Creating
   this draft is not a live publication.
4. Run `node scripts/bind-store-extension.mjs THE_ASSIGNED_ID` to preview and then
   append `--write` to bind it locally. This permits only the exact pilot/store
   origins to frame the two widget routes; standalone routes remain protected.
5. Test and deploy the updated hosted framing policy. Obtain the draft item's public
   key from the Package tab for a development build that reproduces the store ID;
   do not assume the pilot's ID will become the store ID. Update local testing
   identity in a separate build as needed, retaining pilot compatibility until retired.
6. Verify the extension installed in real Chrome, including side-panel sign-in,
   lookup, role/customer restrictions and screen navigation. Capture a genuine store
   screenshot with approved test data at Google's accepted dimensions. Automated DOM
   tests are not installed-browser evidence.
7. Fill Store Listing from `listing.md`, owner-approved privacy disclosures/policy,
   support details and private reviewer test instructions. Do not claim zero data
   collection for the embedded hosted app. Do not put reviewer credentials in source.
8. Set visibility **Unlisted** in Distribution. Review all required attestations
   against actual organizational practices. Registration, financial, legal or new
   sensitive-access prompts remain owner actions when required.
9. Submit the prepared listing for Google review. Record the item ID and submission
   status only after observing them in the dashboard. Approval/publication is a
   separate external event; do not call the extension live merely after submission.
10. Verify the final Chrome Web Store installation link and report it to the user.

No Acumatica server customization or business record change is part of this release.

## Blocking inputs as of preparation

- Google verification/developer dashboard access.
- Confirmed policy details and a publicly accessible privacy policy. The owner has
  supplied erp@imp-ttr.com as both the support and privacy contact.
- Store-assigned extension ID after draft upload.
- Installed-browser acceptance and genuine screenshots.
- Approved restricted review access and test data when Google requires login.

Official references:
- https://developer.chrome.com/docs/webstore/publish
- https://developer.chrome.com/docs/webstore/images
- https://developer.chrome.com/docs/extensions/reference/manifest/key
- https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements


## Observed release outcome — October 25, 2026

- Uploaded item kchcjmpfddihbhikfpmnlbmcpenpelmm under publisher 301b1740-d443-4e7d-be77-e2d17f29913a.
- Description, Workflow & Planning category, English (United States), icon and actual hosted-widget sign-in screenshot saved. Screenshot requirement cleared in Google validation after upload/save completed.
- Public privacy/support page deployed; 19 hosted assets and exact widget ancestors verified.
- Owner supplied restricted reviewer credentials privately in Google dashboard; no credential values read into tool outputs or stored in source.
- Publisher contact erp@imp-ttr.com observed Verified email address after owner verification and reload.
- Unlisted was reselected and explicitly saved, save completion awaited, then verified after reload (Unlisted checked, Public false). Final submitted state also confirms Unlisted checked.
- Submission accepted; status Pending review. Automatic publication after approval selected. No claim of Google approval, live store availability or installed-browser acceptance.
- Screenshot proof: dist/webstore-pending-review.jpg. Google review timing and approval are external.
