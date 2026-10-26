# Ask IMP browser widget

Support and privacy enquiries: erp@imp-ttr.com.

Chrome or Edge 116+ with Side Panel support. This adds an **Ask IMP** button across
`https://imp-ttr.acumatica.com/`, including the Classic UI. No Acumatica customization
or publication is needed. The extension toolbar icon also opens the panel.

## Install the pilot

1. Extract `ask-imp-widget.zip` into a permanent local folder.
2. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
3. Enable **Developer mode**, choose **Load unpacked**, and select the extracted folder containing `manifest.json`.
4. Refresh the Acumatica tab, then click **Ask IMP** at the lower right.
5. Click **Sign in with Acumatica** inside the panel. Allow its popup and complete sign-in.
6. Choose an authorized persona if more than one is available. Ask a question as on the full website.

The standalone workspace remains at https://ask.impops.work. Website and panel
sessions are separate; signing into Acumatica alone does not sign into the agent.
Existing OAuth redirect URI `https://ask.impops.work/login` is reused; no new client
secret or redirect registration is required. Close the panel or switch screens
without changing ERP records. Signing out in the panel clears that panel session.

The extension loads the current hosted `/widget` interface, so normal UI/backend
updates require no extension reinstall. Reload the extension after launcher or
manifest changes. Preserve `manifest.key`: its public key pins extension ID
`iphbdlkanekjbajchkiceldloniipkfc`, the only origin allowed to frame the widget.
There is no private signing key in this package. Chrome Web Store or enterprise
distribution must preserve this identity or update the widget framing policy first.

## Access and data

Only the `sidePanel` API permission and a content script on the exact ERP host are
used. The launcher adds one button to the top page; it does not read order fields,
cookies, customer details or credentials. The extension receives no access tokens.
The hosted widget signs in through PKCE and a same-origin popup with source and
nonce verification. Tokens remain in the hosted widget's session storage. All
personas, customer ownership and read-only tools use existing backend enforcement.

## Pilot acceptance checks

- Open from Connected Applications, Sales Orders and a manufacturing screen.
- Sign in as Sales: only authorized personas/customers should be available.
- Check item/customer autocomplete, a price response table, thinking progress,
  stop, new conversation and an Acumatica order link.
- Sign out; confirm the panel cannot query until signed in again.
- Verify that the full website still signs in and answers independently.

If the button cannot open the panel, it opens the compact widget in a new tab.
If company policy blocks unpacked extensions, ask IT to deploy an approved package.
This repository's automated tests do not replace these installed-browser checks.
