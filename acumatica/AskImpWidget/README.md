# Native Ask IMP integration — Classic UI

Target: imp-ttr.acumatica.com, Acumatica 2026 R1 (26.101.0225.3).
This is the native integration source, separate from the earlier browser extension.

## Implemented component

`Files/Scripts/AskImp/launcher.js` supplies a floating Ask IMP button and embedded
chat panel in the shared Classic Main shell. The panel survives navigation within
Acumatica's `main` content frame. It loads the existing hosted compact chat on
first opening and keeps its conversation when closed/reopened. It does not copy
Acumatica cookies or credentials, infer user roles, read order fields, or call any
ERP business write APIs. The existing agent sign-in and backend permissions apply.

## Integration status: not published, not an import-ready customization package

The installed site's shared shell source has not been obtained. Do not zip these
source files and label them an Acumatica deployment package. Do not replace Main.aspx
with a guessed template or patch it from a runtime publication plugin.

The authenticated cloud Customization Projects screen is accessible. Existing
projects must be preserved. The Source Code screen's Find in Files lookup for the
visible shell's `navBarMaster` did not expose its source. No existing project was
edited or published during inspection.

## Required next steps

1. Obtain the current shared Classic shell file(s), plus an existing customization
   export/sample, from the site's Acumatica hosting provider or customization partner.
   A full local installation is not essential if that provider can build and validate
   the project on a version-matched test instance.
2. Confirm whether imp-ttr is test or live production, and identify the test target.
3. Verify the shell's supported customization point against those exact files.
   Add the local script above once through that customization point. Keep the shared
   shell's existing code and vendor customizations intact. No screen-specific script
   should inject itself into a parent window as a substitute for a global hook.
4. Build/export a genuine AskImpWidget customization package with the platform's
   editor or BuildProject. Include a clean rollback procedure. Validate on the test
   target with all currently published projects included.
5. Before an embedded test, authorize only `https://imp-ttr.acumatica.com` as an
   additional `frame-ancestors` source for `/widget` and `/widget.html` on the hosted
   agent. This header change is intentionally not applied until native integration
   is ready; standalone routes must retain `frame-ancestors 'none'`.
6. Verify open/close, sign-in popup roundtrip, tables, autocomplete, permissions,
   order links, screen navigation, and no change to order entry. Publication is not
   successful until the button and panel are visibly verified inside Acumatica.

Chat business tools remain read-only. The existing administrative screens retain
their authorized behavior. Publishing may reload the ERP application and must use
the site's agreed maintenance and customization publication process.
