---
title: "ADR-059: Enum persistence strategy"
description: "Persist domain enums as varchar by default via ApplyGranitConventions, with [PersistAsInt] as the explicit opt-out. Rejects Postgres native enums and int-by-default."
sidebar:
  order: 59
  label: "059 - Enum persistence strategy"
topic: backend
---

> **Date:** 2026-05-24
> **Authors:** Jean-Francois Meyers
> **Scope:** `granit-dotnet` — all modules persisting enum-typed entity properties via EF Core

## Context

Granit had an unwritten but widely followed convention: every domain enum
persisted to a relational column should use
`.HasConversion<string>().HasMaxLength(N)`. The rationale — operational
readability, refactor safety, wire/storage symmetry, and traceable diffs —
was solid. The enforcement was nonexistent.

A 2026-05 audit found **29 violations** across two repositories plus
downstream effects in the TypeScript packages:

| Repo | Sites |
|------|-------|
| `granit-dotnet` (framework) | 7 confirmed integer-by-default + 2 unconfirmed |
| `granit-business` | 13 integer-by-default + 9 explicit `.HasConversion<int>()` |
| `granit-iot` (framework) | 0 (already conforming) |
| `granit-front` + `granit-showcase-react` | 3 TypeScript numeric enums misaligned with the JSON wire format |
| `granit-showcase-dotnet` / `granit-iot-showcase-dotnet` | Cascading EF migrations on consuming contexts |

The root cause was the absence of any enforcement mechanism: no architecture
test, no convention in `ApplyGranitConventions`, no compiler diagnostic.
Drift accumulated module by module.

## Decision

Adopt a **convention-first** design with a documented opt-out.

1. **Convention.** `ApplyGranitConventions` injects
   `EnumToStringConverter<TEnum>` on every enum property of every entity
   type, with `MaxLength = max(20, longestMemberName + 4)`. The same logic
   covers `Nullable<TEnum>`.
2. **Opt-out.** A new `[PersistAsInt]` attribute on the entity property
   suppresses the convention for that property and leaves it as the
   underlying integer.
3. **Auto-skip.** Enums decorated with `[Flags]` are skipped — bitmask
   semantics require integer storage. Properties with an explicit
   `ValueConverter` are also left untouched, so existing overrides win.
4. **Wire format unchanged.** `JsonStringEnumConverter` remains the global
   wire-format authority; this ADR only governs database storage. After the
   migration, wire and storage agree, which was not previously guaranteed.
5. **Migration helper.** `MigrationBuilderExtensions.AlterEnumColumnIntToString<TEnum>`
   ships in `Granit.Persistence.EntityFrameworkCore` and emits the required
   `USING CASE` SQL so consuming apps never write the cast by hand.

The full developer-facing rules and the migration recipe live in
[Enum Persistence](/dotnet/data/enum-persistence/).

## Alternatives considered

### A. PostgreSQL native enum (`CREATE TYPE ... AS ENUM`)

Rejected.

- **Provider lock-in.** Granit ships both SQL Server and Postgres
  providers from the same `*Configuration.cs` files. Native enums require
  Postgres-only mapping and break that symmetry.
- **Migration rigidity.** `ALTER TYPE ... ADD VALUE` is non-transactional
  on most Postgres versions. Renaming or removing a value requires
  recreating the type and rewriting every dependent column.
- **Multi-`DataSource` wiring.** Npgsql requires every enum to be
  registered on the `NpgsqlDataSource` builder before connection — a
  global registration that is awkward in a framework where modules ship
  their own enums independently and may be mixed-and-matched per host.

### B. Integer by default + architecture test

Rejected.

- **Doesn't address the root cause.** The integer-by-default convention is
  exactly what generated the drift. Codifying it would freeze the
  unreadable state.
- **Boilerplate at every site.** Every new entity would need
  `HasConversion<string>().HasMaxLength(N)` to opt in to the readable
  default. The convention exists precisely to remove that ceremony.
- **Drift by omission.** An archi-test catches only what it knows to look
  for. The convention guarantees correctness at the source.

### C. Site-by-site fix without a convention

Rejected.

- **One-shot vs. continuous.** Patching 29 sites is feasible; preventing
  the 30th, 31st, … is not. Without a convention, the drift returns the
  moment the audit ages.

## Consequences

### Positive

- **Operational readability.** `psql` shows `'Queued'`, not `0`. On-call
  diagnostics no longer require a lookup table that drifts from the code.
- **Refactor safety.** Reordering enum members — a routine C# refactor —
  becomes a no-op for stored data. Today, it silently corrupts every row.
- **Wire/storage symmetry.** `JsonStringEnumConverter` already produces
  PascalCase strings on the wire; storage now matches, eliminating an
  entire class of mental-model bugs.
- **One mental model across providers.** SQL Server and Postgres consumers
  see the same convention.

### Negative

- **Storage overhead of +20–40 % on enum columns.** Accepted: enum
  cardinalities are small (4–20 members), member names are short (6–16
  bytes), and most enum columns are not the dominant column on their
  table. The few hot-write tables where this matters can opt out via
  `[PersistAsInt]`.
- **One-shot migration cascade across 30+ tables in consuming apps.**
  Mitigated by the `AlterEnumColumnIntToString<TEnum>` helper and
  Phase-2 / Phase-3 rollout sequencing. Large business tables get the
  zero-downtime treatment (new column + backfill + swap) rather than the
  in-place `ALTER COLUMN`.

### Neutral

- The 11 existing `.HasConversion<string>().HasMaxLength(N)` sites become
  redundant but harmless — the convention reapplies the same converter
  idempotently. We leave them alone unless a file is touched for another
  reason; cleanup is opportunistic, not a tracked task.

## References

- [Enum Persistence](/dotnet/data/enum-persistence/) — developer-facing reference
- [ADR-058](/dotnet/architecture/adr/058-json-persistence-policy/) — companion
  policy for JSON-shaped columns
- PR [#2215](https://github.com/granit-fx/granit-dotnet/pull/2215) —
  framework convention + `[PersistAsInt]` + `AlterEnumColumnIntToString<TEnum>`
