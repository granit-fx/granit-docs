---
title: "ADR-063: Tenant/Host data storage modes"
description: "Formalise the per-module Host/Tenant storage taxonomy: invariant vs archetype-sensitive semantic scope, DualScopeStorageMode { Shared, Segregated } for the storage variant, and the physical-placement axis. Establish the boundary between framework-decided invariants and app-decided options, and the criteria for the interface-only exemption."
sidebar:
  order: 63
  label: "063 - Tenant/Host data storage modes"
topic: backend
---

> **Date:** 2026-05-28
> **Authors:** Jean-Francois Meyers
> **Scope:** `granit-dotnet` — all `*.EntityFrameworkCore` packages; `granit-business`, `granit-iot`, `granit-website`, downstream consumers (showcase, microservice template)
> **Status:** Proposed (2026-05-28)

## Context

Every Granit module that persists data does so under one of four implicit
conventions today:

| Pattern | Registration | DbContext base | Entity placement |
| ------- | ------------ | -------------- | ---------------- |
| Host-only | `AddGranitDbContext<T>` | `DbContext` or `GranitDbContext` | `host.*` only; no `IMultiTenant` |
| Dual-scope row-level | `AddGranitDbContext<T>` | `GranitDbContext` | `host.*`; `IMultiTenant` with nullable `TenantId`; row-level filter |
| Tenant-isolated | `AddGranitIsolatedDbContext<T>` | `GranitDbContext` (if `IMultiTenant`) or `DbContext` | `<tenant>.*` / per-tenant DB / shared prefix |
| Interface-only | none — interface implemented by the host `AppDbContext` | n/a | follows the app's `AppDbContext` shape |

The choice is hardcoded per module, leaving the consuming app only one degree
of freedom: the *physical placement* of the tenant portion in tenant-isolated
modules (`SharedDatabase` / `SchemaPerTenant` / `DatabasePerTenant`, exposed by
PR #2021).

Three pressures have surfaced that this taxonomy cannot express:

**1. Defense-in-depth for dual-scope modules.** Row-level filtering is
state-of-the-art when implemented correctly, but the framework has already
shipped a bug in this exact area
(`MultiTenantFilterParameterizationReproTests.cs` reproduces a closure-captured
tenant ID leaking across requests, fixed by `GranitDbContext` exposing
`CurrentTenantId` as an instance member). Regulated deployments
(ISO 27001 A.8.12 DLP, RGPD Art. 25 privacy-by-design, healthcare, defence)
have a legitimate need to *physically* separate host and tenant rows so a row-level
filter regression cannot leak. There is no current API for that choice.

**2. Generalisation of Epic #2377.** The Webhooks epic proposes a per-deployment
choice between "single host table with row-level filter" (today) and "host table
in `host.*` + tenant table in `<tenant>.*`" (new). Restricting that choice to
Webhooks is arbitrary; the same security argument applies to `Notifications`,
`Auditing`, `Identity`, `Authorization`, `Timeline`, and others. Without a
formal framework, every dual-scope module would reinvent the same options API.

**3. Archetype-sensitive business modules.** Some modules (`Payment`,
`Subscription`, `Invoice`, `Catalog`) have a semantic scope that is not
invariant: it depends on the *business archetype* of the consuming app.
`Payment` is host-owned in a SaaS billing model (host bills tenants), tenant-owned
in an e-commerce model (each tenant bills its own customers), and dual-scope in
a marketplace model (commission to host + per-tenant payments). Hardcoding one
scope per module prevents reuse across archetypes; declaring a single
`Granit.Archetype` global forces every archetype-sensitive module to support
every archetype uniformly and prevents mixing.

The framework needs an explicit, named, documentable taxonomy that captures
*who decides what*, with stable enums and a documented default.

## Decision

A module's storage shape is defined by **four orthogonal axes**, each with a
defined authority (framework vs application) and a stable vocabulary.

### Axis 1 — Entity semantic scope

| Class | Authority | Definition |
| ----- | --------- | ---------- |
| **Invariant** | **Granit** | The entity's scope is fixed by its business meaning. Examples: `Tenant` is host (it *is* the tenant registry); `BlobDescriptor` is tenant (a blob belongs to one tenant); `AuditEntry` is dual-scope (SOC2 host-wide audits + tenant business events). |
| **Archetype-sensitive** | **App**, via a module-specific `*Scope` enum at registration time | The same module serves different business archetypes with different semantic placements. Granit declares the allowed values; the app picks one. |

Every module publishes its classification in the README of its base package and
in the xmldoc of its `*Options` type. New `Granit.*` modules MUST be classified
explicitly in their introductory ADR.

The framework already exposes `Granit.MultiTenancy.MultiTenancySides { Host, Tenant, Both }`
as the vocabulary for declaring the applicability of a capability (used today by
permission providers in `Settings`, `Authentication.ApiKeys`, `Mcp.Server`, etc.).
The same enum is the natural shorthand for this axis: an *invariant* module is
pinned to one value of `MultiTenancySides`; an *archetype-sensitive* module
declares its own `*Scope` enum because the framework cannot anticipate every
archetype-specific value set. Axis 2 below applies only to entities whose
applicability resolves to `MultiTenancySides.Both`.

### Axis 2 — Dual-scope storage variant

When an entity ends up dual-scope (whether by invariant or by archetype choice),
the app additionally chooses *how* the dual scope is physically realised:

```csharp
public enum DualScopeStorageMode
{
    /// <summary>
    /// Single physical table in <c>host.*</c>; <c>TenantId</c> nullable;
    /// host rows have <c>TenantId == null</c>, tenant rows have a value.
    /// Scoping is enforced by an EF Named Query Filter per request.
    /// Default mode — lowest infrastructure cost, lowest provisioning ceremony.
    /// </summary>
    Shared,

    /// <summary>
    /// Two physical tables — <c>host.x</c> for host-scope rows and
    /// <c>&lt;tenant&gt;.x</c> (or per-tenant DB) for tenant-scope rows.
    /// No row-level filter — separation is physical. Store dispatch logic
    /// selects the context per request scope. Provides defense-in-depth
    /// against row-level filter bypass; <c>DROP SCHEMA &lt;tenant&gt; CASCADE</c>
    /// lessivage works natively for RGPD Art. 17.
    /// </summary>
    Segregated,
}
```

Authority: **the app**, declared at `AddGranit*EntityFrameworkCore` time.
Default: `Shared` (preserves current behaviour, zero migration burden).

### Axis 3 — Tenant data physical placement

Unchanged from PR #2021. When tenant data exists (either scope=Tenant or
DualScopeStorageMode=Segregated), the app picks one of:

- `SharedDatabase` (tenant rows tagged or prefixed in a shared DB)
- `SchemaPerTenant` (one Postgres schema per tenant)
- `DatabasePerTenant` (one DB per tenant)

via the existing `configureShared` / `configureSchemaPerTenant` /
`configureDatabasePerTenant` / `configureTenantSchema` callbacks.

### Axis 4 — Connection strategy

Derived from axes 1–3; **no explicit app choice**. Granit wires the appropriate
`IDbContextFactory<T>` (host-pinned, tenant-scoped, or one of each for
`Segregated`) and the corresponding interceptors
(`TenantSchemaConnectionInterceptor`, audit, soft-delete, concurrency-stamp).

## API shape

### Tenant-only invariant module

```csharp
services.AddGranitBlobStorageEntityFrameworkCore(
    configureSchemaPerTenant: (opts, schema) => opts.UseNpgsql(connStr));
```

### Dual-scope, Shared (status quo, default)

```csharp
services.AddGranitNotificationsEntityFrameworkCore(opts =>
{
    // opts.StorageMode = DualScopeStorageMode.Shared; — implicit default
    opts.Configure = b => b.UseNpgsql(hostConn);
});
```

### Dual-scope, Segregated (Epic #2377 prototypes this on Webhooks)

```csharp
services.AddGranitWebhooksEntityFrameworkCore(opts =>
{
    opts.StorageMode = DualScopeStorageMode.Segregated;
    opts.ConfigureHost          = b => b.UseNpgsql(hostConn);
    opts.ConfigureSchemaPerTenant = (b, schema) => b.UseNpgsql(...);
});
```

### Archetype-sensitive module

```csharp
// SaaS — host bills tenants
services.AddGranitPayment(opts => opts.Scope = PaymentScope.Host);

// E-commerce — each tenant bills its own customers
services.AddGranitPayment(opts => opts.Scope = PaymentScope.Tenant);
```

The `*Scope` enum is module-specific; no global `Archetype` declaration is
imposed on the app. A marketplace can freely mix `PaymentScope.Host` with
`CatalogScope.DualScope`.

## Module classification (initial inventory)

### Invariant — Granit decides

**Host invariant** (no `IMultiTenant`)

- `Granit.MultiTenancy`, `Granit.BackgroundJobs`, `Granit.Bff`,
  `Granit.EntityMerge`, `Granit.Presence`, `Granit.Settings`

**Tenant invariant**

- `Granit.BlobStorage`, `Granit.Privacy`, `Granit.Authentication.ApiKeys`

**Dual-scope invariant**

- `Granit.AI`, `Granit.Auditing`, `Granit.DataExchange`, `Granit.Features`,
  `Granit.Identity`, `Granit.Identity.Federated` (currently interface-only;
  see below), `Granit.Indexing`, `Granit.Localization`,
  `Granit.Notifications`, `Granit.OpenIddict`, `Granit.Scheduling`,
  `Granit.Templating`, `Granit.Timeline`, `Granit.Webhooks`

### Archetype-sensitive — App decides via `*Scope`

No current modules. Reserved for future business modules; likely candidates
when they land:

- `Granit.Payment` — `PaymentScope { Host, Tenant }`
- `Granit.Subscription` — `SubscriptionScope { Host, Tenant }`
- `Granit.Invoice` — `InvoiceScope { Host, Tenant, DualScope }`

Existing `granit-business` modules to reclassify:

- `Granit.Catalog` — `CatalogScope { Tenant, DualScope }`
  (today tenant-only; marketplace archetype would need DualScope)

The classification of each new archetype-sensitive module is captured in the
module's introductory ADR.

### Interface-only — exemption, not a fourth mode

The interface-only pattern (`I*DbContext` implemented by the consuming
`AppDbContext`) is **not** a peer of the three modes above. It is an
**exemption** from the "own DbContext per module" convention, justified only
when atomic shared-connection transactions across modules are required:

- `Granit.Authorization` — role + grant + user-role mapping must commit
  atomically with `Granit.Identity.Local` user writes (see ADR-024). **Exempt.**

- `Granit.Workflow` — `WorkflowTransitionInterceptor` must write the audit
  row in the *same* transaction as the transitioning aggregate; an
  independent DbContext would split the transaction. **Exempt.**

- `Granit.Settings` — no transactional reason; legacy from before
  `AddGranitIsolatedDbContext` existed. **Migration to dedicated
  `SettingsDbContext` recommended** (out of scope of this ADR; tracked separately).

- `Granit.Identity.Federated` — legacy from before `AddGranitIsolatedDbContext`;
  the `IUserCacheDbContext` sub-folder shows the original intent was a real
  DbContext. **Migration recommended** (covered by Epic #2377 V2 wave).

New modules MUST NOT adopt interface-only without an ADR amendment.

## Consequences

### Framework

- New: `DualScopeStorageMode` enum and `Granit.Persistence` primitives for dual-context
  dispatch (likely an abstract `DualScopeStore<T>` or `IDualScopeContextFactory
  <THost, TTenant>`) reused by every `DualScopeStorageMode.Segregated` module.

- Updated: every dual-scope module's `*EntityFrameworkCore` package gains an
  `*Options` carrying `StorageMode = DualScopeStorageMode.Shared` as default. PR #2377 ships
  the prototype for Webhooks.

- New ArchitectureTest: coherence between declared `Mode`, registration call,
  and entity placement — extending the spirit of
  `WebhooksDualScopeIntegrationValidator` to all dual-scope modules.

### Consuming applications

- **Zero breaking change by default.** `DualScopeStorageMode.Shared` reproduces
  today's behaviour. Apps opt in module-by-module as framework support rolls
  out.

- Apps targeting regulated deployments can now select `Segregated` per
  module for defense-in-depth.

### Migration tooling

- A new `MigrationBuilderExtensions.MoveDualScopeTenantRowsToTenantSchema
  <TEntity>` helper emits the SQL to port rows with `TenantId IS NOT NULL`
  from `host.x` to `<tenant>.x`, mirroring `AlterEnumColumnIntToString
  <TEnum>` introduced in ADR-059.

- Reversal (`Segregated` → `Shared`) is supported but requires merging rows
  across schemas and is more involved.

## Implementation plan

Sequenced by sensitivity × demand. Each wave is an independent sub-epic.
Apps opt in module-by-module — no forced migration.

| Wave | Modules | Driver |
| ---- | ------- | ------ |
| **V1 — Epic #2377** | `Webhooks` | Already proposed; design done |
| **V2 — IAM sensitivity** | `Identity`, `Authorization` (after promoting it out of interface-only), `Identity.Federated` | IAM leak surface; conformance audits |
| **V3 — User personal data** | `Notifications`, `Auditing`, `Timeline` | RGPD Art. 17 facilitated by schema drop |
| **V4 — opportunistic** | `AI`, `DataExchange`, `Templating`, `Localization`, `Indexing`, `Scheduling`, `OpenIddict`, `Features` | On demand |

## Cross-repository impact

This ADR is framework-pure but has fan-out across the Granit family:

- **`granit-business`** — Catalog (currently tenant-only) is the first
  candidate for reclassification to archetype-sensitive (marketplace
  archetype needs `DualScope`). CustomerBalance, future Subscriptions and
  Invoicing follow. Granit-business consumes the framework `DualScopeStorageMode`
  enum through Granit NuGet packages; no code change required until a
  consumed dual-scope module ships V2/V3.

- **`granit-iot`** — IoT device telemetry has a strong physical-isolation
  requirement (per-tenant time-series volumes can be massive); the IoT
  framework's persistence packages will likely default to `Segregated` once
  the framework primitive is available.

- **`granit-website`** — public marketing site has no tenant data; not
  impacted directly. Will document the modes in the framework section once
  the website goes live.

- **`granit-showcase-dotnet`** — reference integration. When each V2/V3
  module ships `Segregated` support, showcase adds a deployment profile
  exercising the new mode to keep the reference up to date.

- **`granit-iot-showcase-dotnet`** — mirrors showcase for the IoT framework.
- **`granit-microservice-template`** — the template currently scaffolds one
  `AppDbContext`. It will gain a comment block illustrating how to opt a
  module into `Segregated` once V2 ships.

Each downstream change is tracked in the originating repo, not as a child of
this framework ADR.

## Alternatives considered

| Option | Verdict | Why |
| ------ | ------- | --- |
| Status quo, no ADR | Rejected | Hardcoded scope blocks Epic #2377 generalisation; the convention is informal and drifts. The `WebhooksDualScopeIntegrationValidator` shipped only because the choice was implicit and a consumer got it wrong. |
| Single `Granit.Archetype` enum driving all scope choices | Rejected | Forces every archetype-sensitive module to support all archetypes uniformly; prevents mixed archetypes (e.g. SaaS billing + e-commerce catalog in the same deployment). |
| Module dédoublé (e.g. `Granit.Payment.Saas` vs `.Ecommerce`) | Rejected | Doubles surface (entities, migrations, tests, docs); not extensible to hybrid archetypes (marketplace). |
| Always `Segregated` (deprecate `Shared`) | Rejected | Over-isolation for low-stakes deployments (single-tenant, internal tools, dev/test); UNION-read cost across schemas does not justify itself uniformly. |
| Always `Shared` (deprecate `Segregated`) | Rejected | Prevents physical defense-in-depth; blocks RGPD-by-schema-drop; blocks regulated industries (ISO 27001, healthcare, finance, defence). |
| Make `DualScopeStorageMode` a single global choice for the whole app | Rejected | Different modules have different risk profiles; an app may legitimately want `Auditing = Shared` (cross-tenant SOC2 queries) but `Notifications = Segregated` (personal data). |
| Entity-level scope (e.g. `[Host]` / `[Tenant]` attributes) | Rejected | Too granular; multiplies decisions and complicates store dispatch without benefit over module-level choice. |
| Generalise interface-only as the fourth mode | Rejected | Kills modularity (single monolithic `AppDbContext`, all migrations interleaved, no microservice subset deployment); see CLAUDE.md isolated-DbContext-per-module rule. Only justified for atomic-transaction couplings. |

## References

- PR #2021 — clarified isolated vs dual-scope boundary across 13 modules
- PR #2376 — `WebhooksDualScopeIntegrationValidator` (runtime guard)
- Epic #2377 — Webhooks `Segregated` mode (V1 of this ADR)
- ADR-024 — Shared-connection EF Core transaction for role orchestration
  (justifies `Granit.Authorization` interface-only exemption)

- `MultiTenantFilterParameterizationReproTests.cs` — proof of row-level
  filter fragility motivating `Segregated`

- ADR-017 — DDD aggregate / value object strategy
