# Acumatica account onboarding

Status: **Sales onboarding deployed and enabled** on Azure revision `imp-dev-ca--0000142`. Customer Service mapping awaits verification of the user-selected Acumatica user type `Customer Service`. Real first-time Sales OAuth login awaits user sign-in.

Sales and Customer Service staff sign in with their existing Acumatica accounts. IMP creates its internal identity and permission record automatically after a successful, validated authorization-code exchange and a verified team-role lookup. Staff do not need an IMP password or a manually created IMP account.

## Access rules

- Acumatica `SALES` maps to IMP `Sales` (4), as confirmed by the user and observed for `salesagent1` on Acumatica's Users screen.
- Customer Service maps to the new IMP `CustomerService` (7). The user selected Acumatica user type `Customer Service` as the preferred source on 2026-10-22. That type must be verified through authenticated self-only metadata before adding a separate type mapping; the current implementation still maps verified roles only. Do not treat a user type as a role name or assume `SUPPORT` / `SO Clerk`.
- New Sales users get the Sales persona. They still need a verified salesperson assignment before customer-specific lookups are allowed. The existing assigned-customer guard fails closed when a mapping is missing. Username resemblance is not a salesperson mapping.
- Customer Service gets the Customer Service persona and sales lookup tools using the signed-in user's Acumatica access. It does not receive IT, Executive, user-management or manufacturing-write permissions.
- Automatic mappings can grant only Sales or Customer Service. Mapping to Manager, SystemAdmin, Executive, Operator or Packer is rejected.
- Conflicting Sales and Customer Service mappings are rejected instead of choosing the broader permission.
- Existing active IMP accounts retain their UUID, password and explicitly assigned role. An existing role of 0 can receive a verified Sales/Customer Service role. Disabled/deleted accounts are never reactivated.
- An issuer/subject binding prevents another tenant or a later username/email match from taking over a linked identity. Email matching is not used when onboarding is enabled. Legacy username accounts are bound only within the exact configured tenant and issuer.
- Automatically provisioned users have their ERP team roles checked again at each sign-in. A missing/conflicting/changed assignment denies a new login. Existing IMP sessions continue until logout, token expiry, or IMP account deactivation; ERP role removal alone does not instantly revoke an already issued IMP session. Administrator edits to automatically managed roles require link review.
- PostgreSQL sign-ins for the same normalized username use a transaction-scoped advisory lock; identity/subject and user bindings also have unique constraints. Local account creation and binding commit together.

## Verified integration constraint

Live diagnostics on 2026-10-22 found that expanding `Contact.UserInfo.Roles` in a collection request fails with an Acumatica optimization error (Roles has a BQL delegate). A filtered Contact header lookup for `salesagent1` returned no records, even though the Users screen shows its `SALES` assignment. Therefore the implementation does **not** assume that the standard Contact endpoint provides employee role memberships.

The dedicated OData inquiry contract is:

```json
{"value":[{"Login":"salesagent1","RoleName":"SALES","Active":true}]}
```

Each row must represent an actual assigned role of an active account. Return `Login` as the exact Acumatica login, `RoleName` as the assigned role name, and `Active` as a boolean. Do not return available-but-unselected roles or substitute a default role. No passwords, reset fields, tokens, private employee details or other security columns belong in the inquiry.

The backend filters by the validated login, selects only these three fields, checks every returned login/active flag, rejects pagination/incomplete results and rejects unavailable role data. The request uses the user's own Acumatica access token. The inquiry must additionally restrict each caller to their own role rows inside Acumatica; a client-supplied OData filter is not an authorization rule. Verify this restriction and the required Acumatica role permissions before exposing it. If the tenant cannot expose a safe self-only inquiry, implement a server-side protected directory adapter rather than granting Sales access to the full Users directory.

The configured path must be relative, without a query/fragment, on the validated issuer's HTTPS origin. Redirect following is disabled. Role results and bearer tokens are not logged or cached. Missing roles, HTTP errors, malformed data and lookup timeouts deny onboarding with a readable sign-in message.

## Configuration and rollout

1. The self-only inquiry is deployed and verified with the diagnostic user. Finish the real first-time Sales sign-in check, then confirm the Customer Service role and verify a Customer Service account before enabling that mapping.
2. Apply the additive SQL `impapi/db/migrations/2026-10-22_acumatica_login_identity.sql` to the intended backend database. No EF migrations or changes to existing user rows are needed.
3. Deploy the API and IMPUI role-editor changes. Onboarding remains disabled by default and does not query the new table until enabled.
4. Configure these settings only after replacing the placeholders with verified values:

```json
{
  "AcumaticaOnboarding": {
    "Enabled": false,
    "Issuer": "https://imp-ttr.acumatica.com/identity",
    "Tenant": "<exact tenant suffix from validated sub>",
    "RolesInquiryPath": "/<verified self-only OData inquiry path>",
    "RoleMappings": { "SALES": "Sales", "<confirmed CS role>": "CustomerService" }
  }
}
```

5. Enable, then verify first login with a real Acumatica user absent from IMP. Verify the second login reuses the UUID; ensure a Sales user cannot select Customer Service or see another salesperson's customer orders. Set or import the verified salesperson mapping through the existing Sales Access administration feature. Verify existing operator/admin/executive accounts and disabled-account denial.
6. Rollback: disable `AcumaticaOnboarding`. Keep the additive table and SSO-only records; do not replace SSO passwords with local passwords. Existing users retain their previous access. New users then need onboarding re-enabled or an explicit administrator-managed linked account.

Implementation: `AcumaticaUserOnboarding`, `AcumaticaOnboardingRoles`, `AcumaticaOnboardingOptions`, `AcumaticaLoginIdentity`, and the Acumatica login business flow in the backend repository `C:/source/imp-server-dotnet`. The role-editor change is in `C:/source/imp/src/app/imp/users/users.component.ts`.

## Validation on 2026-10-22

- Canonical backend suite: 1,219 tests passed, including 37 new onboarding and login-integration cases.
- Canonical IMPUI account-editor suite: 12 tests passed.
- Azure PostgreSQL verification: six concurrent first logins reused one SSO Sales account/UUID and one binding; a disabled account was denied. Verification used an empty isolated schema which was removed afterward. Existing user rows, assignments and permissions were not changed.
- Permanent additive identity schema installed without creating or changing accounts. IMP-UserAccess (`GI640593`) published with `Users.PKID = @me` and exposed at `/t/International%20Media%20Products/api/OData/GI/IMP-UserAccess`. User-approved SALES and Administrator roles have View Only; all other 120 roles remain Revoked. Live OData diagnostics returned five current-user rows; requesting another login returned zero. This check used the existing diagnostic account; the user-token first-login check remains pending.
- API image `sha256:f646626051e2de7cd43435ad757f533bb64cf8ad066169849086f7bf489bab8b` deployed. Revision142 Healthy/Running/Provisioned, latestReady142,100% traffic. Health200 and anonymous persona/SalesAccess/KPI endpoints401. Enabled only SALES→Sales with pinned issuer/tenant.
- IMPUI current-source Azure build and deployment succeeded, including Customer Service option. Agent frontend27 tests and syntax checks passed and frontend deployed with readable rate-limit guidance.
- The combined release includes the preceding query-plan cache, per-process user rate limits, and concurrent manufacturing MoveEntry Details-only fix. It layers on revision141 to preserve that concurrent deployment. Targeted server-side history filtering remains future work.

Frontend verification: all12 Agent release assets and5routes matched; all8 public IMPUI HTML/JS/CSS release files matched the current canonical build.
