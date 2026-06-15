---
title: "ADR-070: Value-object persistence and query capabilities"
description: "SingleValueObject columns are mapped as an opaque scalar ValueConverter by default — great for equality/sort/display, impossible for substring search, range, group-by, cursor keys. Define three persistence strategies (converter / ComplexProperty / read-model projection), a choice rule, and a fail-loud QueryEngine contract."
sidebar:
  order: 70
  label: "070 - Value-object persistence & querying"
topic: backend
---

> **Date:** 2026-06-15
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.Domain.SingleValueObject<T>`, `ApplyGranitConventions` (persistence), `Granit.QueryEngine.*` (search / filter / sort / group-by / cursor)

## Context

`ApplyGranitConventions` maps every `SingleValueObject<T>` property as a **scalar column through an EF `ValueConverter`** (`vo => vo.Value`). EF Core treats a value converter as an **opaque whole-value round-trip** — it never decomposes `vo.Value` into a column operation (deliberate: a converter may encrypt, hash, or JSON-encode, where `LIKE` is meaningless). This is documented: *"It isn't possible to query into value-converted properties, e.g. reference members on the value-converted .NET type in your LINQ queries"* ([EF Core — Value Conversions, Limitations](https://learn.microsoft.com/en-us/ef/core/modeling/value-conversions#limitations); [dotnet/efcore#10434](https://github.com/dotnet/efcore/issues/10434)). Empirically verified (EF Core 10 / SQLite, the real `SingleValueObjectConverter`):

| Operation on a converter-mapped VO column | Result |
| --- | --- |
| Equality (`Eq`), `In`, sort, display, JSON | ✅ translate |
| Substring (`Contains`/`StartsWith`/`EndsWith` → `LIKE`) | ❌ cannot translate |
| Range (`Gt`/`Lt`/`Between`) | ❌ no ordering operator on the VO type |
| `GROUP BY` | ❌ EF cannot materialise `g.Key.Value` through the converter |
| Cursor keyset (`(key) > (lastKey)`) | ❌ comparison operator on the VO type |

This was a **silent** trap before #2767: a global search over a VO column returned the whole (scoped) table, `Eq` filters mistranslated to `column == null`, and a definition that drilled `e.Vo.Value` to dodge it threw an opaque error at construction. #2769 and #2770 made it fail loud / enabled equality.

The friction is not the value object as a *domain* concept — it is that the `QueryDefinition` read path operates directly on the **domain entity**, so a converter-wrapped column cannot serve read-model needs (search, analytics) that legitimately exist (search sites by slug substring; group events by hostname).

## Decision

### 1. Default mapping is unchanged — converter (scalar)

`SingleValueObject<T>` stays mapped as a scalar `ValueConverter`. It supports **equality, `In`, sort, display**. This is correct for identifier-like VOs (`EventTypeName`, `BlobReference`, `ContentType`, `ScheduledActionId`) where substring/analytics are not needed.

### 2. Three strategies for a *queryable* VO column

| Strategy | What | Enables | Cost |
| --- | --- | --- | --- |
| **A. Plain string at the boundary** | The entity column is `string`; the VO validates in the factory / `*Request`. | Everything (it is a primitive). | The entity property loses the VO type. Established pattern (`EventTypeName`/`FileName` exist as VOs while the column is `string`). |
| **B. `ComplexProperty` opt-in** | Map the VO as an EF complex type so `.Value` is a **genuinely mapped scalar column** (`builder.ComplexProperty(e => e.Slug, b => b.Property(s => s.Value).HasColumnName("Slug"))`). | Substring, range, `GROUP BY`, cursor — **all translate**; the VO type is kept on the entity. | **Required (non-nullable) columns only** — a nullable VO complex property builds but throws `DbUpdateException` on a null value (verified, EF Core 10). Default column name is `X_Value` unless renamed. |
| **C. Read-model projection** | The grid/analytics runs over a flat read DTO (primitives) via `ProjectTo` or a dedicated read store; the domain entity keeps its VOs. | Everything, with full CQRS separation. | A second model to maintain; best when read needs diverge from the domain shape. |

### 3. The QueryEngine contract is fail-loud (converter-mapped VOs)

On a converter-mapped VO column the engine never silently misbehaves:

- `GlobalSearch`, `AllowGroupBy`, `Aggregate`, `SupportsCursorPagination` with a VO selector **throw at definition build** (`ArgumentException`, pointing here and to #2767).
- A nested `.Value` selector (`e => e.Vo.Value`) is rejected by `GetPropertyName` with the same hint.
- A runtime substring/range filter on a VO column is **dropped and logged**, never mistranslated.
- `Eq`/`In`/sort remain supported (the engine reconstructs the VO for equality).

## Choice rule

> - **Converter (default)** — a column carrying invariants/identity that you only **filter by equality, sort, and display**.
> - **B — `ComplexProperty`** — you need **substring search / group-by** on the column **and** want to keep the VO type, **and** the column is **non-nullable**.
> - **A — plain string** — the column is **nullable and searchable**, or the VO buys nothing at read time.
> - **C — read-model** — the read surface diverges enough from the domain to deserve its own model.

## Consequences

- VO column capabilities are now explicit and safe rather than silent (#2769, #2770). Authors learn the limit at build time, with the escape hatch named.
- Strategy **B** is offered as an **opt-in** (a `[QueryableValueObject]` marker drives the `ComplexProperty` mapping and tells the engine to drill into `.Value`); it is **not** the default — the migration blast radius (column mapping change across all consumers) is not justified for VOs that never needed substring/group-by.
- **Nullability nuance.** A converter never receives `null` (*"a null in a database column is always a null in the entity instance"*), so a **nullable converter-mapped VO works fine** for equality/sort/display — it just is not searchable. Strategy **B** is the one that cannot be nullable (EF complex-type limit, verified: a null value throws on save). So a nullable *searchable* column uses **A**.
- **Possible future avenue (not yet evaluated): JSON column.** The EF docs suggest a JSON column as the alternative to query into otherwise-opaque values, and a JSON column *can* be null. Mapping a VO to a JSON column and querying `e.Vo.Value` via JSON path could cover the nullable-searchable gap that **B** leaves open — to be spiked if a real consumer needs it (multi-field queryable VOs already use JSON per ADR-058).
- Related: #2767 (umbrella), #2769 (fail-loud), #2770 (equality/`In` + cursor/group-by/aggregate guards), #2771 (the `== null` mistranslation), #2772 (strategy B prototype: `[QueryableValueObject]`), ADR-017 (DDD VO strategy), ADR-058 (JSON persistence policy).
