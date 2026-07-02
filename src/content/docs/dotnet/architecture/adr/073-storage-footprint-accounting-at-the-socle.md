---
title: "ADR-073: Storage footprint accounting at the BlobStorage socle"
description: "Account per-tenant and per-user storage at the Granit.BlobStorage layer (the storage socle) rather than in the Documents module, keep the counter limit-agnostic, drive hard upload blocking through Granit.Features via an opt-in bridge, and treat per-tenant DB volume as an approximate monitoring signal that never blocks."
sidebar:
  order: 73
  label: "073 - Storage footprint accounting at the socle"
topic: backend
---

> **Date:** 2026-07-01
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.BlobStorage.*`, new `Granit.BlobStorage.Features` bridge, `Granit.Features` (granit-dotnet); downstream `Granit.Documents.*` and an optional DB-volume producer (granit-business)
> **Status:** **Proposed**

## Context

A SaaS operator needs two things the framework does not yet provide as a socle-level
capability:

1. **A total tenant footprint** — bytes stored per tenant, across *all* blobs (documents,
   avatars, exports, imports, any module) **plus** database volume — including the fact
   that tenant-owned rows also live in host tables ([ADR-063](/dotnet/architecture/adr/063-tenant-host-data-storage-modes/)).
2. **A per-user footprint** — files only (blob bytes) attributed to the user who owns them.
3. **Hard limits driven by `Granit.Features`** — the feature carries the numeric limit
   (cascade Tenant → Plan → Default); an upload that would exceed the tenant *or* the user
   limit is rejected.

Today the only real implementation is `Granit.Documents.TenantStorageQuota` (granit-business):
a per-tenant atomic counter (`UsageBytes` / `LimitBytes`, default 5 GB), hard-enforced via
`ITenantQuotaService.TryReserveAsync`, surfaced by `GET /quota`, reconciled weekly. It works
well — but it is **business-layer, tenant-only, and scoped to blobs that pass through the
Documents module**. It cannot answer the operator's question when Documents is absent, when
blobs are uploaded by other modules, or at per-user granularity.

The relevant facts about the socle:

- `Granit.BlobStorage` (framework) is where **every** blob passes. `BlobDescriptor` is a
  `CreationAuditedAggregateRoot` carrying `TenantId`, `ContainerName`, `SizeBytes`
  (validated), `MaxAllowedBytes` (declared up front), and `CreatedBy` (the uploading user).
  So both tenant and user attribution are already present in the data.
- BlobStorage has **no** aggregation today, and deliberately does **not** reference
  `Granit.Features`.
- `Granit.Features.IFeatureLimitGuard` already resolves numeric limits with a
  Tenant → Plan → Default cascade and throws a 403 on breach.
- `Granit.Metering` (business) is a generic metering engine, but its quota model is
  monitoring + alert on **hourly aggregates** — unfit for a real-time hard cap.

## Decision

**Move storage accounting down to the socle and keep it limit-agnostic; drive blocking from
Features through an opt-in bridge; keep DB volume as an approximate monitoring signal.**

1. **Account at the socle (`Granit.BlobStorage`).** Introduce two counters, ported from the
   proven `Granit.Documents` pattern (atomic counter + reconciliation job), one layer lower:
   - `TenantStorageUsage` keyed by `TenantId`.
   - `UserStorageUsage` keyed by `(TenantId, CreatedBy)` — the per-user "files only" footprint.

   `IStorageUsageService` exposes `TryConsumeAsync(scope, bytes, limit)` (atomic
   `UPDATE ... WHERE UsageBytes + @bytes <= @limit`), `IncrementAsync`/`DecrementAsync`, and
   readers. The lifecycle mirrors Documents: **reserve `MaxAllowedBytes` at
   `InitiateUploadAsync`, reconcile to the actual `SizeBytes` at `ConfirmUploadAsync`, release
   on rejection/deletion/orphan-cleanup.** A recurring `storage-usage-reconcile` job recomputes
   the truth from `SUM(SizeBytes) GROUP BY TenantId` and `GROUP BY (TenantId, CreatedBy)`.

2. **The counter is limit-agnostic.** `TryConsumeAsync` receives the `limit` as a parameter
   (`long.MaxValue` = unlimited). `Granit.BlobStorage` therefore keeps **no dependency on
   `Granit.Features`**, while still enforcing atomically. The decision of *which* limit applies
   lives outside the socle.

3. **Enforcement via Features through an opt-in bridge.** A new `Granit.BlobStorage.Features`
   package implements an `IStorageQuotaEvaluator` seam (no-op default in BlobStorage). At upload
   initiation it reads the effective limits from two numeric features —
   `Granit.Storage.MaxTenantBytes` and `Granit.Storage.MaxUserBytes` — resolves the current user
   via `ICurrentUser`, and calls `TryConsumeAsync` for **both** the tenant and the user scope.
   Either breach throws `StorageQuotaExceededException` → **HTTP 403**. No bridge referenced ⇒
   accounting still runs, no blocking. Features absent ⇒ unlimited.

4. **Hard blocking is files-only; DB volume is monitoring-only.** Per-tenant DB volume is
   produced by a **separate, optional** producer (a recurring PostgreSQL-introspection job:
   `row_count × avg_row_size` from `pg_stats`, or `pg_column_size` `GROUP BY TenantId` off-peak),
   attributing `IMultiTenant` rows to their tenant and bucketing host-shared rows
   (`TenantId == null`) as *global*. It is **approximate and delayed**, feeds the total-footprint
   view and optionally `Granit.Metering`/threshold alerts, and **never blocks a request** —
   refusing a business write on an hourly DB estimate is not actionable.

5. **Documents becomes a consumer.** `Granit.Documents.TenantStorageQuota` is refactored to
   **delegate** to the socle counter (scoped to its containers) rather than maintain its own,
   eliminating the double-count. The existing `GET /quota` response is preserved for the UI.
   Pre-1.0, this is a clean internal change, not an `[Obsolete]` graduation.

## Evaluated Alternatives

- **Generalize the Documents quota into a shared business module.** Rejected: it cannot answer
  the operator when Documents is absent, and the socle-level "bytes on disk" concern belongs to
  the framework, not to a business module that sits above it.
- **Build on `Granit.Metering`.** Rejected: metering aggregates are hourly and soft — unfit for a
  real-time hard cap — and it would pull a business dependency into a framework concern. Metering
  remains the right home for *history and billing*, fed as a gauge, not the enforcement path.
- **Reference `Granit.Features` directly from `Granit.BlobStorage`.** Rejected: couples the socle
  to the limit source. The limit-as-parameter seam + opt-in bridge keeps `TryConsumeAsync` atomic
  while leaving BlobStorage limit-agnostic.
- **Hard-block on total tenant footprint including DB volume.** Rejected: DB attribution is coarse
  and delayed; a real-time upload guard can only be trustworthy against the precise blob counter.

## Justification

The socle is the single source of truth for bytes on disk, so accounting there captures every
blob for free and works with or without Documents — directly answering "what if Documents isn't
in the solution?". `CreatedBy` already gives per-user attribution with no schema change. The
reservation flow is not new design — it is the `Granit.Documents` pattern proven in production,
ported one layer down. Limit-as-parameter preserves strict layer purity (no Features edge on the
storage core) while the opt-in bridge makes blocking a deliberate host choice. Splitting *precise,
blocking, files* from *approximate, monitoring, DB* keeps each guarantee honest.

## Consequences

- New counter entities + configs in `Granit.BlobStorage` / `.EntityFrameworkCore`; the host owns
  the migration (framework ships no migrations).
- `IStorageQuotaEvaluator` seam in BlobStorage; the upload-initiation flow gains an evaluator call
  and, in the bridge, an `ICurrentUser` read (BlobStorage does not know the user today).
- New opt-in package `Granit.BlobStorage.Features`; two numeric feature definitions.
- `Granit.Documents.TenantStorageQuota` delegates to the socle counter — a granit-business change
  (handoff), with the `GET /quota` contract unchanged.
- Optional DB-volume producer + optional `Granit.Metering` gauge push — both monitoring-only.
- Blobs authored by background/system flows carry a system `CreatedBy`; they are attributed to a
  reserved *system/global* user bucket, excluded from per-user limits.

## Status

Proposed. Framework work tracked in granit-dotnet (Epic TBD); Documents delegation and the
optional DB/Metering producers handed off to granit-business.

## References

- ADR-063 — Tenant/Host data storage modes (tenant rows in host tables; `BlobDescriptor` is a
  tenant invariant)
- ADR-061 — `IConcurrencyAware` as the concurrency primitive (atomic counter updates)
- ADR-020 — Declarative definitions placement (usage query/export live in the base module)
- `Granit.Documents.TenantStorageQuota` / `ITenantQuotaService` — the proven counter+reconciliation
  pattern being ported to the socle
