---
title: Glossary
description: Definitions of the Granit-specific terms, marker interfaces, design patterns and external technologies that appear throughout the documentation.
sidebar:
  label: Glossary
  order: 99
---

A reference for the vocabulary you'll see across the docs. Each entry is one or
two lines, with a link to the page where the concept lives in detail.

## A

**ADR (Architecture Decision Record)** — A short document capturing a single
load-bearing technical decision: context, alternatives, choice, consequences.
See the [ADR index](/dotnet/architecture/adr/).

**AddGranit / AddGranitAsync** — The single entry point that wires every
referenced `GranitModule` into the host's service collection. Resolved by
topological sort of `[DependsOn]` attributes. See
[Module system](/dotnet/concepts/module-system/).

**Aggregate** — A consistency boundary in the domain model. Mutations go
through the aggregate root; the root enforces invariants. Granit aggregates
typically derive from `Entity` / `AuditedEntity` / `FullAuditedEntity`.

**AuditedEntity** — Base class adding `CreatedAt` / `CreatedBy` /
`ModifiedAt` / `ModifiedBy` columns, populated automatically by EF Core
interceptors. See [Persistence](/dotnet/data/persistence/).

## B

**BFF (Backend For Frontend)** — A server-side proxy that holds OIDC tokens
in a session cookie so the SPA never touches an access token. See
[BFF module](/dotnet/security/bff/).

**Bundle** — A meta-package (`Granit.Bundle.*`) that pre-wires a curated
stack so the host application gets the common defaults in a single
`builder.AddXxx()` call.

## C

**Claim Check** — Messaging pattern: instead of putting a large payload on
the bus, push it to blob storage and send a reference. Granit's
implementation is in [`Granit.Wolverine`](/dotnet/infrastructure/wolverine-messaging/#claim-check-pattern).

**Contributor pattern** — IoC inversion used for module extensibility:
modules register `IXContributor` implementations that the host module
discovers at boot and calls during a specific lifecycle stage. Used by
seeders, registries, manifest builders. See [ADR-045](/dotnet/architecture/adr/045-contributor-pattern/).

**Crypto-shredding** — GDPR erasure technique: encrypt rows with a
per-subject key, then destroy the key instead of deleting the rows. See
[Crypto-shredding](/dotnet/compliance/crypto-shredding/).

## D

**DependsOn** — Attribute that declares a module dependency. Granit
topologically sorts the graph at boot so dependencies always register
before their consumers. See [Module system](/dotnet/concepts/module-system/).

**DPoP (Demonstrating Proof-of-Possession, RFC 9449)** — Binds an access
token to a cryptographic key proven on every request. Defeats stolen-token
replay. See [DPoP](/dotnet/security/openiddict/advanced/proof-of-possession-dpop/).

## E

**Entity** — Minimal Granit base class with an identity (`Id`) and equality
by identity. Subclasses add audit and soft-delete behavior.

**ETO (Event Transport Object)** — Granit suffix for integration events that
cross module boundaries (`PartyCreatedEto`). Domain events keep the
`*Event` suffix. The naming makes the boundary visible at a glance.

## F

**FAPI 2.0 (Financial-grade API Security Profile)** — High-assurance OAuth
2.0 profile combining PAR + DPoP + Private Key JWT. Granit ships a
one-switch conformance mode. See [FAPI 2.0](/dotnet/security/openiddict/advanced/fapi-2-security-profile/).

**Fan-out** — Granit Notifications dispatch pattern: a single
`PublishAsync()` produces one `DeliverNotificationCommand` per recipient
per channel after preference filtering. See
[Fan-out engine](/dotnet/infrastructure/notifications/fan-out-engine/).

**FullAuditedEntity** — `AuditedEntity` + soft-delete columns (`IsDeleted`,
`DeletedAt`, `DeletedBy`). See [Persistence](/dotnet/data/persistence/).

## G

**GranitDbDefaults** — Host-vs-tenant boundary marker on a `DbContext`.
Determines whether interceptors apply tenant filtering and which migration
runner owns the schema. See [Host vs Tenant](/dotnet/infrastructure/multi-tenancy/host-tenant/).

**GranitModule** — The marker base class every module derives from. Carries
the `ConfigureServices` lifecycle hook and is discovered through
`[DependsOn]`. See [Module system](/dotnet/concepts/module-system/).

## H

**Host vs Tenant** — Granit's two-axis isolation model. *Host* data lives
in a shared context (identity, billing, audit). *Tenant* data is partitioned
by `TenantId`. Modules declare which side they live on via `GranitDbDefaults`.

**HybridCache** — Microsoft's L1 (in-process) + L2 (distributed) cache
contract; Granit's `Granit.Caching` wraps it with tenant-aware keys and
encryption for sensitive payloads. See [Caching](/dotnet/data/caching/).

## I

**IClock / TimeProvider** — Granit's deterministic time abstraction (an
`ISystemClock`-style facade over `TimeProvider`). Always inject this
instead of calling `DateTime.UtcNow`. See [Time provider](/dotnet/core/time-provider-clock/).

**ICurrentTenant** — Ambient access to the resolved tenant for the current
scope. Used by EF Core query filters and interceptors. See
[Multi-tenancy](/dotnet/infrastructure/multi-tenancy/).

**ICurrentUserService** — Ambient access to the authenticated subject,
propagated by Wolverine and EF interceptors. Drives audit fields.

**Idempotency key** — Client-supplied header that lets the server detect
and short-circuit a retried request. See [Idempotency](/dotnet/api/idempotency/).

**Integration event** — Event that crosses a module or service boundary.
Suffix: `*Eto`. Contrast with *domain event* (`*Event`) which stays inside
the module.

**Isolated DbContext** — Granit convention: every module owns its own
`DbContext` rather than sharing one. Enables independent migrations,
schema, and provider choices. See [Persistence](/dotnet/data/persistence/).

## K

**Keyed Services** — .NET 8+ DI feature; Granit uses it to register multiple
implementations of the same interface under string keys (e.g., Notification
email providers under `"Smtp"`, `"SendGrid"`, `"Brevo"`). See
[Email channel](/dotnet/infrastructure/notifications/email-channel/).

## L

**LGTM stack** — Grafana's observability bundle: **L**oki (logs), **G**rafana
(dashboards), **T**empo (traces), **M**imir (metrics). Granit emits OTLP
data the stack can scrape directly. See [Observability](/dotnet/operations/observability/).

## M

**Marker interface** — Empty interface used as a convention trigger. Granit
uses `IAuditedEntity`, `ISoftDeletable`, `IMultiTenant`, `IMetadata`,
`IActive`, `IProcessingRestrictable` as triggers for EF Core interceptors
and query filters. See [Marker interface pattern](/dotnet/architecture/patterns/marker-interface/).

**MJML** — XML-based markup that compiles to email-safe HTML (table
layouts, inline CSS, MSO conditionals). Granit ships an MJML transformer
that runs in-process — no Node.js. See [MJML email templates](/dotnet/building-blocks/templating/mjml-email-templates/).

**Modular monolith** — Architecture style: one deployment unit, strict
module boundaries enforced by the type system and architecture tests.
Granit's default. See [Modular monolith vs microservices](/dotnet/concepts/modular-monolith-vs-microservices/).

**Module-local DbContext** — See *Isolated DbContext*.

## N

**Named query filter** — EF Core 9+ feature letting you name and toggle
individual global query filters (e.g., disable soft-delete filter alone
without disabling tenant filter). Granit ships `ISoftDeletable`, `IActive`,
`IMultiTenant`, `IProcessingRestrictable`, `IPublishable` filters this way.

## O

**OData host feed** — Granit-specific OData EDM, whitelist-driven by
`EntityDefinition`, exposing curated query surfaces for Power BI / Excel.
See [OData exposure](/dotnet/business/analytics/odata-host-feed/).

**OpenIddict** — Self-hosted OIDC / OAuth 2.0 server library. Granit
wraps it for multi-tenancy, impersonation, passkeys, and FAPI 2.0
conformance. See [OpenIddict module](/dotnet/security/openiddict/).

**Outbox (transactional outbox)** — Atomically write business state and
outgoing messages to the same database in one transaction; a dispatcher
publishes the messages after commit. Granit's outbox is Wolverine-backed.
See [Wolverine messaging](/dotnet/infrastructure/wolverine-messaging/#transactional-outbox).

## P

**PAR (Pushed Authorization Requests, RFC 9126)** — OIDC flow where the
client pushes the authorization parameters to a back-channel endpoint
first, then redirects with only a reference. See [PAR](/dotnet/security/openiddict/advanced/pushed-authorization-requests/).

**Privacy regulation profile** — Per-tenant choice of GDPR / LGPD / CCPA /
PIPL / DPDPA / 14 others, resolved through `IPrivacyRegulationResolver`.
Drives deadlines, copy, and consent semantics. See
[Regulations](/dotnet/compliance/privacy/regulations/).

## R

**RoleMetadata** — Granit aggregate representing a role's host/tenant
scope, source identity provider, and orphan-cleanup policy. Distinct from
the IdP's role object. See [Roles](/dotnet/security/authorization-roles/).

## S

**Saga** — Long-running orchestration (Wolverine concept). Granit uses
sagas for tenant provisioning, payment lifecycle, data export, deletion.

**Scriban** — Granit's chosen templating engine. Sandboxed, fast, no
Node.js dependency. See [Scriban engine](/dotnet/building-blocks/templating/scriban-engine/).

**Section content / What's next** — Convention for module index pages: a
list of child pages with one-sentence descriptions, so readers can pick
the next page without depending solely on the sidebar.

**See also** — Granit docs convention for the trailing-cross-references
section on a page. Always `## See also` (never `## Related` / `## Related pages`).

**Self-hosted OIDC** — Running OpenIddict as part of your application,
rather than relying on Keycloak / Entra / Cognito. Granit supports both
modes. See [OpenIddict](/dotnet/security/openiddict/).

**Soft delete** — DELETE-becomes-UPDATE: mark `IsDeleted = true` instead
of removing the row. Preserved for ISO 27001 audit and GDPR cooling-off.
See [Soft delete pattern](/dotnet/architecture/patterns/soft-delete/).

## T

**Tenant resolution** — Determining which tenant the current request
belongs to. Granit ships domain, header, JWT-claim, and query-string
resolvers. See [Tenant resolvers](/dotnet/infrastructure/multi-tenancy/resolvers/).

**Tier (privacy regulation)** — Granit groups the 18 supported privacy
regulations into Tier 1 (full feature parity with GDPR) and Tier 2
(simplified / regional). Drives which features the resolver exposes.

## U

**UUIDv7** — Time-ordered UUIDs (RFC 9562). Sortable by creation time,
better for B-tree indexes than UUIDv4. Granit's `Granit.Guids` default.
See [Sequential GUID](/dotnet/core/sequential-guid-generation/).

## V

**VAPID (Voluntary Application Server Identification, RFC 8292)** —
Server-key signing for Web Push. Granit ships a VAPID-aware Web Push
provider. See [SMS, push & real-time](/dotnet/infrastructure/notifications/sms-push-realtime/#web-push).

**Vault (Granit.Vault)** — Abstraction over HashiCorp Vault / Azure Key
Vault / AWS Secrets Manager / GCP Secret Manager exposing three
provider-agnostic interfaces. See [Vault](/dotnet/data/vault/).

## W

**Wolverine** — Granit's chosen message bus (CQRS, sagas, transactional
outbox). Optional; Granit runs without it for simple hosts. See
[Wolverine messaging](/dotnet/infrastructure/wolverine-messaging/) and
[ADR-005](/dotnet/architecture/adr/005-wolverine-cronos/).

## See also

- [Architecture overview](/dotnet/architecture/) — design principles and ADRs
- [Pattern library](/dotnet/architecture/patterns/) — design patterns with Granit-specific implementations
- [Core concepts](/dotnet/concepts/) — module system, DI, configuration, security model
