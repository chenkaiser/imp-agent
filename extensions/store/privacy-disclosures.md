# Privacy disclosure worksheet — requires publisher review

This describes both the local extension and the hosted service it embeds. Do not
declare that no data is handled merely because the extension shell does not receive
the iframe's credentials. Complete the dashboard's current data-category fields
based on the entire user flow, and keep them consistent with the final privacy policy.

## Single purpose

Provide authorized International Media Products employees with read-only IMP Agent
lookups in a side panel alongside the configured Acumatica website.

## Permissions

- sidePanel: display the hosted IMP Agent chat beside Acumatica.
- https://imp-ttr.acumatica.com/* content-script scope: add the Ask IMP launcher to
  the top-level page. The script does not read ERP field contents, cookies or tokens.
- No tabs, history, cookies, storage, identity, scripting or all-sites API permissions.

## Remote content justification

The local extension page embeds https://ask.impops.work/widget. That isolated remote
webpage provides authentication, persona selection, autocomplete and chat. Its scripts
do not run in the extension's privileged context and have no extension API bridge.
All extension-privileged scripts are bundled in the ZIP. The hosted page connects to
https://api-dev.impops.work; authorized questions may be processed using Microsoft's
Azure AI model services and IMP's configured Acumatica/IMPUI connections.

## Data handled

- Account identity and authentication information: the hosted application processes
  account identifiers, display names, role/persona access and OAuth access tokens.
  Passwords are entered into Acumatica's sign-in page. OAuth tokens are retained in
  hosted-page session storage and sent over HTTPS to the IMP backend as needed.
  They are not sent to the extension launcher or service worker.
- User-provided content: questions and selected item/customer IDs are sent to IMP's
  backend to answer requests. Relevant conversation/context and tool data may be
  sent to the configured Azure AI service.
- Authorized business content: customer/item identifiers, prices, order, shipping,
  inventory, production and other role-authorized records can appear in responses.
  Users may enter personal or confidential information into questions; that content
  must be included in the policy's handling description.
- Operational usage: IMP's usage ledger records user attribution, time, persona,
  category, model, token counters and outcome. That ledger does not store prompt or
  answer text; it is not a statement that no other service logs or caches exist.
- Infrastructure services receive normal network metadata such as client IP and
  user-agent information. The application also uses Google Fonts over HTTPS.

## Current implementation and retention evidence

ChatConversationStore keeps bounded conversation turns in process memory, with
30-minute sliding expiration and a four-hour absolute limit. This does not describe
the retention of usage events, other query caches, infrastructure logs or Azure AI
provider processing. Those organizational settings must be confirmed before final
policy publication; do not invent a universal deletion period.

No advertising, data-sale or unrelated browsing-history feature is implemented in
the extension. The publisher must confirm the organizational use restrictions and
all dashboard certifications before submission; do not attest on its behalf to
unverified practices.

## Contact confirmed by publisher

Support and privacy enquiries: erp@imp-ttr.com.

## Missing publisher inputs

- Publicly accessible privacy policy URL.
- Confirmed retention, deletion/access request process and authorized subprocessors
  for the hosted service, including Azure AI and infrastructure logs.
- Current dashboard categories/certifications reviewed against the above behavior.
