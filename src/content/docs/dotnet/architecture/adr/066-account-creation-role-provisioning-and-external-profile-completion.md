---
title: "ADR-066: Account creation — role provisioning and external profile completion"
description: "One master gate for both registration flows, one opt-in default-role setting with a shared, non-blocking handler, and a signed continuation token for external sign-ups missing data — with a cross-tenant guard and no plaintext provider key."
sidebar:
  order: 66
  label: "066 - Account creation, role provisioning & profile completion"
topic: backend
---

> **Date:** 2026-06-11
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.Identity.Local`, `Granit.Identity.Local.Endpoints`, `Granit.OpenIddict`
> **Status:** Accepted (2026-06-11)
> **Implements:** granit-dotnet PR #2613

## Context

Granit ships two ways to create a self-service account: the local
`POST /api/account/register` flow (email + password) and the external-provider
flow (sign in with Google / Microsoft / GitHub). Before PR #2613 the external
flow was wired but **never worked end-to-end**, and neither flow provisioned a
role:

- The OAuth callback authenticated the external cookie and linked or created the
  account but **never called `SignInAsync`** — no Identity session was
  established, so the OIDC authorization request could not resume.
- No endpoint issued the real OAuth challenge; the "challenge" endpoint only
  validated that a provider was configured.
- A provider returning **insufficient data** (e.g. no email) was one-click
  account-created anyway, producing accounts with no usable email.
- Neither local nor external registration assigned **any** role. A self-registered
  user passed authentication but carried zero authorizations — able to sign in,
  unable to do anything.

These are four separate gaps, but they share one design question: **what is the
single, predictable policy for turning an authenticated external identity (or a
local form submission) into a usable, correctly-scoped account — across tenants,
without leaking provider secrets or blocking on misconfiguration?** This ADR pins
down that policy. The frontend SDK and showcase wiring land as separate handoffs.

## Decision

### 1. `Identity.Local.AllowSelfRegistration` is the single master gate for both flows

Account *creation* — local or external — is governed by exactly one setting:
[`Identity.Local.AllowSelfRegistration`](/dotnet/security/openiddict/account-management-api/#identitylocalallowselfregistration)
(boolean string, default `"false"`, per-tenant `T` + global `G` providers).

- The local `POST /api/account/register` endpoint already checked it; the external
  callback and the new `complete-registration` endpoint now check the **same**
  setting, resolved per-tenant.
- The gate distinguishes **authentication** from **creation**: when disabled, an
  external login still authenticates an *existing* linked account, but a *new*
  account is never created (the callback returns `403`).
- The previously-separate `AutoRegisterExternalUsers` registry flag becomes
  **subordinate** to the master gate — it can only narrow, never widen, what
  `AllowSelfRegistration` permits.

There is deliberately **no** second switch for "external registration" as
distinct from "local registration". One gate is the whole policy; a tenant that
turns self-registration on accepts both doors.

### 2. One opt-in default-role setting, one shared handler, degraded-but-non-blocking

A single new setting,
[`Identity.Local.DefaultUserRole`](/dotnet/security/openiddict/account-management-api/#identitylocaldefaultuserrole)
(default `""` — opt-in disabled), names the role assigned to **every** newly
self-registered user. A single Wolverine handler, `AssignDefaultRoleHandler`,
subscribes to `UserRegisteredEto` — the event published by **both** the local
registration endpoint and the external `complete-registration` endpoint — so the
two paths provision roles symmetrically through one code path.

The handler is **idempotent** (a user already in the role is skipped without
throwing) and, critically, **non-blocking and secure-by-default**:

> When `DefaultUserRole` is set to a role that **does not exist** (no seed), the
> registration **still succeeds** — the user is created and signed in — but
> receives **no role at all**. The missing role is logged at `Warning` and
> skipped; it never throws, never poisons the Wolverine outbox, and never blocks
> the other registration side effects (welcome notification, session).

This is the deliberate failure mode. A misconfigured `DefaultUserRole` must not
take down sign-up, and it must **fail closed on authorization**: the safe outcome
of "I could not grant the intended role" is "grant nothing", never "grant
something broader" and never "abort the account". An operator who typos the role
name gets users who can authenticate but can do nothing — visible, recoverable,
and harmless — rather than a broken registration endpoint or an over-privileged
account.

### 3. Missing provider data → signed continuation token, never a one-click account

When the external provider returns too little to create an account (typically no
email), the callback **does not create anything**. Instead it returns a
`needs-profile-completion` result:

- A **signed, time-limited continuation token** minted with ASP.NET Core
  **Data Protection** (`ITimeLimitedDataProtector`, **~10 minute** lifetime). It
  carries the provider, the **provider key**, the provider email (if any), name
  hints, and the issuing tenant id.
- **Non-sensitive prefill** (email / first name / last name) handed back
  separately so the client can pre-fill the registration form.

The user completes the form and calls
`POST /api/account/external-logins/complete-registration`, which creates the
account, links the external login, establishes the session, and publishes
`UserRegisteredEto` (which triggers default-role assignment, §2).

Two guard-rails are non-negotiable:

> **The provider key never leaves the server in plaintext.** It travels *only*
> inside the encrypted token — never as a response field, query parameter, or
> request body field. The `complete-registration` request carries the opaque
> token, not the provider/provider-key pair; those are read back out of the token
> server-side. A client cannot assert "I am provider-key X" — it can only present
> a token the server itself minted.
>
> **A token is redeemable only in the tenant that issued it.** The issuing tenant
> id is sealed into the token at callback time and re-checked at completion: a
> token minted in tenant A presented in tenant B (or the host) is rejected with
> `403`. This blocks cross-tenant replay of a captured token.

Additional integrity rules: a provider-**verified** email is authoritative — the
user cannot swap it (mismatch → `422`); when the provider gave no email, the
user-entered email is **unverified** and a confirmation email is sent. A failed
login-link rolls back the just-created account so a half-finished completion never
leaves an orphan.

### 4. Role resolution runs under the tenant's schema

Default-role assignment resolves and writes the role **inside the registering
user's tenant scope**. `AssignDefaultRoleHandler` opens `ICurrentTenant.Change(evt.TenantId)`
before touching `IIdentityRoleManager`, so under **SchemaPerTenant** the role
lookup and assignment hit the correct tenant schema, and a per-tenant
`DefaultUserRole` override wins over the global value. `evt.TenantId` is `null`
for host / local registration, which resolves to the host scope.

This reuses the tenant-aware role-resolution semantics formalised in
[ADR-023](/dotnet/architecture/adr/023-tenant-aware-role-lookup/): roles are
resolved through the tenant-scoped lookup with a host-scope fallback for
`Both`-scope roles, so a default role seeded platform-wide stays assignable from
every tenant. The cross-tenant token guard (§3) and the tenant-scoped role write
(§4) are the same isolation principle applied to two different operations.

## Consequences

### Positive

- **One mental model for "who can create an account":** flip
  `AllowSelfRegistration`. No matrix of local-vs-external sub-flags.
- **Symmetric provisioning:** local and external new users get the same default
  role through the same handler — no drift between the two paths.
- **Misconfiguration is survivable:** a missing default role degrades to "no
  role", not "no sign-up" and not "wrong role". Operators recover by seeding the
  role; existing users pick it up on their next registration-equivalent event or
  via an explicit admin assignment.
- **No provider-secret exposure and no cross-tenant replay:** the provider key is
  encrypted at rest in transit through the token, and the token is bound to its
  tenant.
- **The external flow actually completes:** the callback establishes the Identity
  session and can resume the original OIDC authorization request via a
  carried, site-relative `returnUrl`.

### Negative / trade-offs

- **Silent zero-role on a missing seed.** Because the failure is non-blocking and
  only logged at `Warning`, an operator who never reads logs can ship a tenant
  where every new user has no role. Mitigation: the setting is opt-in (empty by
  default, so the trap only exists once someone deliberately sets it), and the
  warning names both the role and the user id. A future enhancement could surface
  it as a health-check or settings-validation warning.
- **A ~10-minute window to finish profile completion.** A user who dawdles past
  the token lifetime must restart the external sign-in. The lifetime is a
  deliberate balance: long enough to fill a short form, short enough to bound the
  replay window of a captured token. It is not configurable in this iteration.
- **Two response shapes for one callback.** The callback answers with either a
  `302` redirect (when a frontend URL is configured) or JSON (headless hosts /
  `?mode=json`). Clients must handle both, or pin `?mode=json`. This is documented
  on the [account API page](/dotnet/security/openiddict/account-management-api/#oauth-callback).

## Alternatives considered

| Option | Verdict | Why |
| ------ | ------- | --- |
| Separate `AllowExternalRegistration` gate alongside `AllowSelfRegistration` | Rejected | Two switches for one policy ("can a stranger create an account here?") invites inconsistent states (local on / external off) with no real use case, and doubles the surface every endpoint must check. The registry's `AutoRegisterExternalUsers` is kept but demoted to a narrowing-only flag. |
| Block registration when `DefaultUserRole` names a missing role | Rejected | Turns an authorization-grant misconfiguration into an availability outage. Sign-up is the wrong place to fail hard; "create the user with no role" is the secure, recoverable outcome. |
| Assign the default role inline in each endpoint | Rejected | Two endpoints (local + external) would each need the assignment, drifting over time. A shared `UserRegisteredEto` handler is the single source of truth and is naturally idempotent/retriable through the outbox. |
| One-click create on insufficient provider data, patch the profile later | Rejected | Produces accounts with no real email (unconfirmable, undeliverable security mail) and bypasses the registration validators. Deferring creation until the form completes keeps every account well-formed. |
| Carry the provider key in the `complete-registration` request body | Rejected | Lets a client assert an arbitrary provider identity and leaks a provider secret to the browser. The signed token is the only thing the client should hold; the server reads provider/key out of it. |
| Stateful continuation record in the database instead of a signed token | Rejected | Adds a table, a write on every insufficient-data callback, and a cleanup job, to replicate what a Data-Protection time-limited token gives statelessly. The token's tenant binding already provides the isolation a DB row would. |
| Make the role resolution tenant-agnostic (host scope only) | Rejected | Breaks SchemaPerTenant: a per-tenant default role would be invisible and the write would target the wrong schema. Reusing [ADR-023](/dotnet/architecture/adr/023-tenant-aware-role-lookup/) semantics is mandatory. |

## References

- granit-dotnet PR #2613 — *feat(identity): complete account creation — default
  role, external session, profile completion*.
- [ADR-023](/dotnet/architecture/adr/023-tenant-aware-role-lookup/) — Tenant-aware
  role lookup (role resolution under SchemaPerTenant).
- [ADR-051](/dotnet/architecture/adr/051-user-aggregate-and-parties-bridge/) —
  User aggregate; a canonical `User` row is auto-created alongside the
  `LocalIdentity`.
- [Account Self-Service API](/dotnet/security/openiddict/account-management-api/) —
  endpoint reference for registration, the OAuth callback, and
  `complete-registration`.
- [Identity module](/dotnet/security/identity/#default-role-provisioning) —
  default-role provisioning overview.
