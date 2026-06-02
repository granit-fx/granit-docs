---
title: "ADR-063: Tenant/Host data storage modes"
description: "Original V1/V2/V3 rollout of DualScopeStorageMode.Segregated across 6 modules has been reverted. Single DbContext + row-level IMultiTenant filter + nullable TenantId + domain discriminator remains the baseline for all dual-scope modules. Physical segregation is preserved as a deployment-level future option, not a framework opt-in."
sidebar:
  order: 63
  label: "063 - Tenant/Host data storage modes"
topic: backend
---

> **Date:** 2026-05-28 (original), 2026-05-31 (revert / reframe)
> **Authors:** Jean-Francois Meyers
> **Scope:** `granit-dotnet` — all `*.EntityFrameworkCore` packages; downstream consumers
> **Status:** **Superseded — reverted to single-DbContext baseline** (2026-05-31). The 4-axis taxonomy is retained as analytical reference; the `DualScopeStorageMode.Segregated` opt-in is no longer a framework feature.

## TL;DR

The original ADR introduced `DualScopeStorageMode { Shared, Segregated }` as a per-module opt-in to physically split host-scope and tenant-scope rows into separate `*HostDbContext` / `*TenantDbContext` pairs, dispatched at runtime by a `*ContextResolver`. The pattern was rolled out across 6 framework modules (`Webhooks`, `Identity`, `Identity.Federated`, `Notifications`, `Timeline`, `Auditing`) over Epic #2382 (V1+V2+V3).

That work has been **reverted** in PRs #2474–#2479 (May 2026). The framework returns to the pre-#2382 baseline:

- One `*DbContext` per module.
- Dual-scope modules carry a nullable `Guid? TenantId` on rows, gated by the parameterised `IMultiTenant` query filter installed at `GranitDbContext` level.
- Modules that must distinguish billing direction or row provenance carry an in-domain discriminator (e.g. `Issuer { Host, Tenant }` enum on `Invoice`).
- Cross-tenant aggregations (host-admin MRR, SOC2 audit views) bypass the filter under host-admin scope — a single SQL JOIN, not an N+1 over `ITenantsAccessor`.

Physical segregation remains a legitimate deployment concern. When it materialises, it will be addressed per-client and per-module with the consumer in the loop, not as a framework opt-in baked into every package.

## Why the revert

Three reasons converged.

**1. The leak motivation was solved independently.** The original ADR cited `MultiTenantFilterParameterizationReproTests.cs` (closure-captured tenant ID leaking across requests) as the defense-in-depth justification for `Segregated`. That leak was fixed at the framework root in PR #2130 (`fix(persistence): migrate 20 framework DbContexts to GranitDbContext`) by promoting `CurrentTenantId` to an instance member so EF Core parameterises the filter (`@ef_filter__CurrentTenantId`) instead of inlining a frozen constant. After PR #2130, the row-level filter is the secure baseline; `Segregated` adds no security guarantee that the parameterised filter doesn't already provide.

**2. The 3 business cases are covered by the simple model.** Real-world rehearsal of the 3 target billing archetypes — Host invoices Tenant (SaaS), Tenant invoices end-customer, Both simultaneously (marketplace / hybrid) — confirmed that the simple model handles them natively:

- `Invoice` carries `Guid? TenantId` (nullable) + `Issuer { Host, Tenant }` (discriminator) + `Guid? BilledCustomerId` (set in the "Tenant bills customer" case, null in the SaaS case).
- The row-level filter shows the right rows to the right tenant; host-admin can bypass for cross-tenant metrics.
- Subscriptions × Plan joins for MRR/ARR run as a single SQL `JOIN` because both ends of the join are co-located in either the host DB or the tenant DB (never split across them).

None of these required a Host/Tenant DbContext split.

**3. The accidental complexity tax was real and recurrent.** Per dual-scope module the Segregated pattern added:

- A pair of physical DbContexts (`*HostDbContext` / `*TenantDbContext`) plus an `I*DbContext` interface they shared.
- A `*ContextResolver` deciding at every store call which physical context to use.
- An `*EntityFrameworkCoreOptions` class + Options-based `AddGranit*EntityFrameworkCore` extension (breaking the consistent `Action<DbContextOptionsBuilder>` signature used elsewhere).
- A `*DualScopeIntegrationValidator` fail-fast hosted service.
- Cross-tenant aggregation code paths that traded a single SQL JOIN for N+1 `ICurrentTenant.Change` materialisation loops.

Multiplied by 6 modules, ~10 extra types per module, plus the downstream migration burden to update every consumer (`granit-microservice-template`, `granit-showcase-dotnet`, `granit-business`), the tax was paying off no observable benefit.

For a pre-1.0 framework with a solo maintainer, accidental complexity multiplies on every store / test / PR. The cost wasn't worth the marginal isolation gain over what the parameterised filter already delivers.

## Revert mechanics

The revert is captured in 6 module-scoped PRs against `granit-dotnet`, each restoring the relevant `*EntityFrameworkCore` package to its pre-#2382 baseline:

- PR #2474 — Webhooks (reverts #2387 / #2402 / #2403 / #2407).
- PR #2475 — Notifications (reverts #2438).
- PR #2476 — Timeline (reverts #2436).
- PR #2477 — Identity (reverts #2431).
- PR #2478 — Identity.Federated Phase B Segregated (reverts #2420). **Phase A** (#2406, sortie interface-only → dedicated `IdentityFederatedDbContext`) and the public `UserCacheModelBuilderExtensions` hotfix (#2437) are preserved as orthogonal cleanups.
- PR #2479 — Auditing (reverts #2440).

A follow-up PR drops the `DualScopeStorageMode` enum and `DualScopeValidation` helper from `Granit.Persistence` once all 6 module reverts have landed.

The `ITenantsAccessor` / `NullTenantsAccessor` / `TenantReaderTenantsAccessorAdapter` primitives in `Granit.MultiTenancy` survive — they are lightweight, useful for the rare process-code cases where iterating tenants is appropriate, and unrelated to the Segregated split.

## The 4-axis taxonomy (kept as analytical reference)

The taxonomy introduced in the original ADR remains a useful mental model for classifying modules even though Axis 2 (`DualScopeStorageMode`) no longer corresponds to a framework opt-in.

### Axis 1 — Entity semantic scope

| Class | Authority | Definition |
| ----- | --------- | ---------- |
| **Invariant** | **Granit** | The entity's scope is fixed by its business meaning. Examples: `Tenant` is host (it *is* the tenant registry); `BlobDescriptor` is tenant (a blob belongs to one tenant); `AuditEntry` is dual-scope (SOC 2 host-wide audits + tenant business events). |
| **Archetype-sensitive** | **App**, via a module-specific `*Scope` enum at registration | The same module serves different business archetypes with different semantic placements (e.g. `Payment` host-owned for SaaS billing vs tenant-owned for e-commerce). Granit declares the allowed values; the app picks one. |

### Axis 2 — Dual-scope storage variant (no longer a framework opt-in)

When an entity is dual-scope, the framework uses a **single DbContext** with the row-level `IMultiTenant` filter as the canonical implementation. Rows carry `Guid? TenantId` (nullable, `null` for host rows); the filter installed by `GranitDbContext.OnGranitModelCreating` is parameterised on `CurrentTenantId` so the filter is per-request, not per-context-instance.

Physical segregation (separate `host.*` and `<tenant>.*` schemas with no row-level filter) is **not** a framework feature. If a deployment needs it for regulatory reasons (e.g. ISO 27001 A.8.12 documented physical isolation, an HDS-certified healthcare deployment that contractually requires per-tenant DB), it will be designed per-client at the deployment layer — typically by hosting the same `*DbContext` against a tenant-specific connection string and accepting that cross-tenant aggregation moves to the application layer.

### Axis 3 — Tenant data physical placement

Unchanged. When tenant data exists (whether under a single-context dual-scope model or a future deployment-level segregated model), the existing `AddGranitIsolatedDbContext<T>` family still offers `SharedDatabase` / `SchemaPerTenant` / `DatabasePerTenant` for tenant-only modules.

### Axis 4 — Connection strategy

Derived from axes 1 and 3; no explicit app choice. Granit wires the appropriate `IDbContextFactory<T>` and the standard interceptors (`AuditedEntityInterceptor`, `SoftDeleteInterceptor`, `TenantSchemaConnectionInterceptor`).

## API shape (post-revert)

### Tenant-only invariant module

Unchanged:

```csharp
builder.AddGranitBlobStorageEntityFrameworkCore(
    configureSchemaPerTenant: (opts, schema) => opts.UseNpgsql(connStr));
```

### Dual-scope module (the canonical pattern)

Single DbContext, single connection-string callback:

```csharp
builder.AddGranitWebhooksEntityFrameworkCore(opts => opts.UseNpgsql(connStr));
builder.AddGranitNotificationsEntityFrameworkCore(opts => opts.UseNpgsql(connStr));
builder.AddGranitAuditingEntityFrameworkCore(opts => opts.UseNpgsql(connStr));
// ... and so on for every dual-scope module
```

The `Action<DbContextOptionsBuilder>` signature is consistent across all dual-scope `*EntityFrameworkCore` modules. There is no Options class, no `StorageMode` selector, no `ConfigureHost` / `ConfigureTenant` callback pair.

### Archetype-sensitive module (future)

Module-specific `*Scope` enums remain a valid pattern for genuine business archetype questions like `Payment` (host bills vs tenant bills) — but that lives in `granit-business`, not the framework, and is decided per business module ADR.

## Interface-only exemption (unchanged)

The original ADR's clarification of interface-only as an exemption — not a fourth storage mode — still holds. `Granit.Authorization` and `Granit.Workflow` remain exempt for the documented atomic-transaction reasons (see ADR-024). `Granit.Identity.Federated` has been migrated out of interface-only (PR #2406 Phase A) and stays there. `Granit.Settings` has been migrated out of interface-only (PR #2441).

## Lessons learned

The Segregated rollout was a clear case of pattern-spreading a primitive across modules on the speculation that a future client would need it. The corrective lesson, captured locally for future framework work:

- **Default to one DbContext per module.** Row-level filter + nullable TenantId + (when needed) domain discriminator covers most dual-scope cases including the cross-billing archetypes.
- **Validate the demand before generalising.** A primitive that ships on 6 modules without a single client demand is overhead, not infrastructure.
- **Solve the safety property at the lowest layer.** The filter-leak repro was the load-bearing motivation for Segregated. Fixing it at `GranitDbContext` (PR #2130) removed the motivation; the rollout that followed was unnecessary.
- **Pre-1.0 means clean reverts.** No `[Obsolete]` graduation; remove the API and consumers update at the next dev-package bump.

## Cross-repository impact

- **`granit-business`** — consumes the framework's dual-scope modules through NuGet. After the revert, the `AddGranit*EntityFrameworkCore` calls in business modules return to the single-callback signature. The `EfSeatWriter` and similar stores that started referencing `*HostDbContext` / `*TenantDbContext` need to revert to the single `*DbContext` reference; this is a small mechanical patch on the consumer side.
- **`granit-microservice-template`**, **`granit-showcase-dotnet`** — same: their `Program.cs` registration calls become slightly shorter and revert to the consistent `Action<DbContextOptionsBuilder>` signature.
- **`granit-iot`**, **`granit-website`** — not impacted.

No cross-repo migration of any volume is required.

## Alternatives reconsidered

The original ADR rejected "Status quo, no ADR." Post-revert, the status-quo (single DbContext + parameterised filter + nullable TenantId + optional discriminator) is in fact the chosen path. The taxonomy itself is preserved as analytical scaffolding because it captures who-decides-what cleanly; it just no longer maps to a framework opt-in for Axis 2.

If a regulated client demand for physical segregation arrives, the design space remains open: a deployment-level pattern (`*DbContext` against tenant-specific connection strings + application-layer cross-tenant aggregation) is the path of least framework complexity. Re-introducing `DualScopeStorageMode` as a framework primitive would require the demand to materialise at scale across multiple modules, not as a single one-off.

## References

- PR #2130 — `fix(persistence): migrate 20 framework DbContexts to GranitDbContext` (resolves the filter-leak motivation independently of Segregated)
- PRs #2474 / #2475 / #2476 / #2477 / #2478 / #2479 — module-scoped reverts (May 2026)
- ADR-024 — Shared-connection EF Core transaction for role orchestration (justifies the `Granit.Authorization` interface-only exemption — still valid)
- ADR-061 — `IConcurrencyAware` as the concurrency primitive (orthogonal, still valid)
- ADR-017 — DDD aggregate / value object strategy
- Original V1+V2+V3 implementation now superseded: PRs #2387 / #2402 / #2403 / #2407 (Webhooks V1), #2406 + #2420 (Identity.Federated Phase A + Phase B), #2431 (Identity V2), #2436 (Timeline V3), #2438 (Notifications V3), #2440 (Auditing V3)
