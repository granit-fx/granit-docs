---
title: "ADR-061: Optimistic concurrency strategy"
description: "Standardise on IConcurrencyAware + an auto-managed opaque string ConcurrencyStamp as the default framework optimistic-concurrency primitive. Reject manual integer counters; permit provider-native rowversion/xmin as a per-entity opt-in for entities with non-EF writers."
sidebar:
  order: 61
  label: "061 - Optimistic concurrency strategy"
topic: backend
---

> **Date:** 2026-05-27
> **Authors:** Jean-Francois Meyers
> **Scope:** `granit-dotnet` — all modules persisting mutable aggregates/entities via EF Core, plus downstream consumers (`granit-business`)
> **Status:** Accepted (2026-05-27)

## Context

Granit ships an optimistic-concurrency primitive that has never been formalised
in an ADR:

- `Granit.Domain.IConcurrencyAware` — a single `string ConcurrencyStamp { get; set; }`
  (GUID, 36 chars).
- `ConcurrencyStampInterceptor` regenerates the stamp on **every** `SaveChanges`
  for `Added`/`Modified` entries.
- `ApplyGranitConventions` auto-detects implementers by reflection and applies
  `.HasMaxLength(36).IsConcurrencyToken()` — no per-entity boilerplate.
- A conflict surfaces as `DbUpdateConcurrencyException` → HTTP 409 via
  `EfCoreExceptionStatusCodeMapper`.
- `IConcurrencyStampRequest` is an optional input contract for disconnected
  (CQRS) updates.

Two facts motivated this ADR.

**1. The primitive is barely used and under-governed.** In `granit-dotnet`, only
two **internal infrastructure** rows implement it — `IndexingRebuildCheckpointRow`
and `ExportAssemblyCheckpointRow` — both pure server-side race guards between
competing background workers. Neither is ever exposed over HTTP.
`IConcurrencyStampRequest` has **zero implementers** framework-wide. A thorough
docs page exists (`dotnet/data/concurrency`), but there is **no ADR** formalising
the choice and **no enforcement** stopping an entity from declaring
`.IsConcurrencyToken()` on a hand-rolled column outside `IConcurrencyAware`.

**2. A consumer reinvented it — inconsistently with itself.** `granit-business`
added a `uint RowVersion` token to `Tag`, `Category` and `Document` (manually
`++`-ed in every behavior method, hand-configured with `.IsConcurrencyToken()`,
exposed in `*Response` DTOs but **never round-tripped** — only a server-side retry
guard plus a leaked write-counter). Yet the **same repo** uses `IConcurrencyAware`
correctly on `BalanceAccount` and `DocumentPublicLink`. The divergence is therefore
not a discoverability gap in the documentation (which is good) but a missing
authoritative decision + missing enforcement: nothing flagged the hand-rolled
token, and no ADR said "there is one primitive, use it".

## Decision

**`IConcurrencyAware` with an auto-managed, opaque `string ConcurrencyStamp` is
THE single optimistic-concurrency primitive of the framework.** Modules and
downstream applications that need optimistic concurrency MUST implement
`IConcurrencyAware` rather than rolling their own token.

Specifically:

1. **Keep the opaque `string` stamp; keep auto-management.** No type change. The
   stamp is opaque — neither callers nor clients may interpret it. The reason it
   is the right *default* is not that SQLite "cannot do concurrency" (it can — see
   the opt-in below): it is an **explicit, application-set** token, so it works
   **identically on PostgreSQL, SQL Server and SQLite through a single code path,
   with no DDL**, and the conflict it raises is **faithfully reproducible on the
   SQLite test provider** (`Granit.Testing.EntityFrameworkCore`). The
   `ConcurrencyStampInterceptor` is the portable, application-layer equivalent of
   a DB trigger — it cannot be forgotten and needs no per-provider configuration.
2. **Reject provider-native row versions *as the default* — but permit them as a
   per-entity opt-in.** `SQL Server rowversion`/`timestamp` and `PostgreSQL xmin`
   (via `UseXminAsConcurrencyToken`) are **store-generated** tokens. The SQLite
   EF provider supports *explicit* concurrency tokens (a column it puts in the
   `WHERE` clause) but **not** store-generated row versions, so the native path
   would need three divergent model configurations plus trigger emulation to stay
   testable — machinery that buys nothing over the interceptor for EF-only
   writers. We therefore do **not** make it the convention. We **do** allow a
   single entity to opt into a native token when it has **writers outside EF
   Core** (raw SQL, replication, another service writing the same table) — the
   one case the interceptor genuinely cannot guard. Such an entity configures the
   native token explicitly, dispatched by provider via `GranitDbProviders`, with a
   documented SQLite/InMemory fallback — exactly the precedent already set by
   `EntityMergeConcurrencyLock` / `MeteringConcurrencyLock` for advisory locks.
   Generated triggers are **not** used: the framework ships no schema DDL.
3. **Reject manual integer counters** (the `granit-business` `uint RowVersion`
   pattern). Manual `++` is silently forgettable — a missed bump removes the
   guard with no compile-time signal — whereas the interceptor cannot be
   bypassed. `uint` has no native PostgreSQL or SQL Server type; the stored
   mapping is non-obvious and a portability sharp edge. A monotonic counter also
   discloses write-count to clients for no benefit.
4. **HTTP / disconnected concurrency uses the opaque stamp as an ETag.** Where a
   resource needs client-driven optimistic concurrency, expose
   `ConcurrencyStamp` as an opaque `ETag`, accept it back via `If-Match`
   (mismatch → 409/412), and bind it through `IConcurrencyStampRequest`. Opaque
   is the correct contract — clients must not depend on ordering. Do **not**
   expose a human-readable monotonic version for concurrency purposes.
5. **A displayed, monotonic version number is a *different* concern.** If an
   application genuinely needs a human-facing "version N" it uses `IVersioned`
   (row-history: shared `VersionId` + incrementing `Version`), which is not a
   concurrency token. The two must not be conflated.

## Consequences

- **Framework:** additive only. The token type, interceptor, convention and
  exception mapping are unchanged. We add documentation, this ADR, and (optional)
  a small `SetConcurrencyStampOriginalValue(...)` helper / ETag-If-Match endpoint
  filter so the disconnected story is no longer copy-paste. No public API break →
  SemVer minor/patch.
- **`granit-business`:** migrates `Tag`/`Category`/`Document`/`DocumentPublicLink`/
  `BalanceAccount` off `uint RowVersion` onto `IConcurrencyAware`. Behaviour is
  preserved: existing `catch (DbUpdateConcurrencyException)` retry loops keep
  working against the auto-regenerated stamp; the manual `RowVersion++` lines and
  per-config `.IsConcurrencyToken()` are deleted. Exposed `RowVersion` response
  fields are either dropped or replaced by an opaque ETag. DB migration: add
  `concurrency_stamp varchar(36)`, drop the `row_version` column. This is an
  application-side breaking change owned by `granit-business`, not the framework.
  **Token-rotation semantics differ slightly** and must be noted in the migration:
  `RowVersion++` fires only on a *real* state change (behaviour methods short-circuit
  no-ops, e.g. `Tag.Rename` to the same name), whereas the interceptor regenerates
  the stamp on **every** `Modified` `SaveChanges`. For a retry guard this is
  equivalent-or-stricter (safe); the only risk is a test that asserts token
  *stability* across a no-op save — such a test must be updated.
- **Enforcement (the primary lever, recommended follow-up):** since the docs are
  already good, the missing piece is a guard. A Roslyn analyzer or
  `ArchitectureTests` rule should flag any property configured with
  `.IsConcurrencyToken()` (or named `*RowVersion`) on a type that does **not**
  implement `IConcurrencyAware`, the way GRSEC/enum conventions are enforced. This
  is what would actually have caught the `granit-business` divergence.
- **Risk if we did nothing:** every new module is free to reinvent a fourth and
  fifth concurrency token, each with its own portability and exposure mistakes.

## Alternatives considered

| Option | Verdict | Why |
| ------ | ------- | --- |
| Status quo, no ADR | Rejected | Undiscoverability is the documented root cause of the `granit-business` divergence. |
| Change stamp to an interceptor-incremented `int`/`long` | Rejected | Auto-management is **not** the objection — an interceptor increments as easily as it regenerates. Rejected because it breaks the existing contract + the 2 entities for **zero benefit**: a client-exposable monotonic version is a non-goal for a concurrency token, and a genuine human-facing version is already served by `IVersioned`. |
| Change stamp to `byte[]` (SQL Server `rowversion`) | Rejected | Store-generated → loses **both** SQLite portability **and** interceptor auto-management. Same family as the provider-native option below. |
| Adopt `uint RowVersion` framework-wide | Rejected | Manual/forgettable, non-portable `uint`, write-count disclosure. |
| Provider-native `rowversion`/`xmin` as the convention | Rejected as default; allowed as opt-in | Store-generated → not testable on SQLite without per-provider config + trigger emulation; for EF-only writers the interceptor already does the job portably. Permitted per-entity (via `GranitDbProviders`, à la `EntityMergeConcurrencyLock`) only when non-EF writers exist. |
| SQLite triggers to emulate a native counter | Rejected | The interceptor is already the portable equivalent; triggers would be framework-generated schema DDL (against the "apps own migrations" principle) and reintroduce per-table boilerplate. |
| Drop SQLite as the test provider | Rejected | 29 test files would migrate to Testcontainers/PostgreSQL (slower CI, external dependency) and it still would not remove provider branching (`xmin` vs `rowversion`). High cost, partial benefit. |
| Remove `IConcurrencyStampRequest` (0 impl) | Deferred | Keep as the input contract for the ETag/If-Match flow; revisit if HTTP optimistic concurrency never materialises. |
