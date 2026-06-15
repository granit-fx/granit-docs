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

### 2. Four strategies for a *queryable* VO column

| Strategy | What | Enables | Cost |
| --- | --- | --- | --- |
| **A. Plain string at the boundary** | The entity column is `string`; the VO validates in the factory / `*Request`. | Everything (it is a primitive). | The entity property loses the VO type. Established pattern (`EventTypeName`/`FileName` exist as VOs while the column is `string`). |
| **B. `ComplexProperty` opt-in** | Map the VO as an EF complex type so `.Value` is a **genuinely mapped scalar column** (`builder.ComplexProperty(e => e.Slug, b => b.Property(s => s.Value).HasColumnName("Slug"))`). | Substring, range, `GROUP BY`, sort — **all translate** (the inner `.Value` is a real, **indexable** column); the VO type is kept on the entity. **Nullable supported.** | Column nameable to match the existing schema (no rename). A **nullable** column needs a **shadow discriminator** — an all-optional complex type cannot otherwise distinguish `null` from a present-but-empty value (verified, EF Core 10; EF's own message points to a discriminator *or* a JSON column). So nullable adds one shadow column. |
| **C. Read-model projection** | The grid/analytics runs over a flat read DTO (primitives) via `ProjectTo` or a dedicated read store; the domain entity keeps its VOs. | Everything, with full CQRS separation. | A second model to maintain; best when read needs diverge from the domain shape. |
| **D. JSON column** | Map the VO as a JSON column (`OwnsOne(e => e.Slug, o => o.ToJson())`); query `e.Slug.Value` via the provider's JSON path. | Substring, `GROUP BY`, **and `null`** — all translate (verified, EF Core 10 / SQLite). An alternative for **nullable** VOs that avoids B's shadow discriminator column. | Stores `{"Value":"…"}` (JSON), not the bare value → **switching to it is a data migration**; **weaker indexing** (needs an expression/`jsonb` index — B keeps a plain indexable column); needs a carve-out from the framework's "no `OwnsOne` for VOs" convention rule (ADR-058). |

### 3. The QueryEngine contract is fail-loud (converter-mapped VOs)

On a converter-mapped VO column the engine never silently misbehaves:

- `GlobalSearch`, `AllowGroupBy`, `Aggregate`, `SupportsCursorPagination` with a VO selector **throw at definition build** (`ArgumentException`, pointing here and to #2767).
- A nested `.Value` selector (`e => e.Vo.Value`) is rejected by `GetPropertyName` with the same hint.
- A runtime substring/range filter on a VO column is **dropped and logged**, never mistranslated.
- `Eq`/`In`/sort remain supported (the engine reconstructs the VO for equality).

## Choice rule

> - **Converter (default)** — a column carrying invariants/identity that you only **filter by equality, sort, and display** (nullable is fine).
> - **B — `ComplexProperty`** — you need **substring search / group-by** on the column and want to keep the VO type. The default for queryable VOs: a real indexable scalar column, no storage change. Works for nullable too (adds one shadow discriminator column).
> - **D — JSON column** — same need as B, the column is **nullable**, and you'd rather store JSON than carry B's discriminator column — accepting JSON storage + weaker indexing.
> - **A — plain string** — the VO buys nothing at read time, or you want a plain indexable column without the complex-type/JSON machinery.
> - **C — read-model** — the read surface diverges enough from the domain to deserve its own model.

## Consequences

- VO column capabilities are now explicit and safe rather than silent (#2769, #2770). Authors learn the limit at build time, with the escape hatch named.
- Strategy **B** is offered as an **opt-in** (a `[QueryableValueObject]` marker drives the `ComplexProperty` mapping and tells the engine to drill into `.Value`); it is **not** the default — the migration blast radius (column mapping change across all consumers) is not justified for VOs that never needed substring/group-by.
- **Nullability nuance.** A converter never receives `null` (*"a null in a database column is always a null in the entity instance"*), so a **nullable converter-mapped VO works fine** for equality/sort/display — it just is not searchable. For *searchable* nullable columns, **B** works (EF requires a shadow discriminator for the all-optional complex type — verified, EF Core 10) and keeps the indexable scalar column; **D** is the discriminator-free alternative at the cost of JSON storage.
- **The QueryEngine `.Value` drilling is mapping-agnostic.** The engine builds `e.Vo.Value`, which translates identically whether the VO is mapped via **B** (`ComplexProperty`) or **D** (JSON) — so the same `[QueryableValueObject]` marker can drive either mapping (B for required, D for nullable) with no engine change. Verified for both against SQLite.
- Related: #2767 (umbrella), #2769 (fail-loud), #2770 (equality/`In` + cursor/group-by/aggregate guards), #2771 (the `== null` mistranslation), #2772 (strategy B prototype: `[QueryableValueObject]`), ADR-017 (DDD VO strategy), ADR-058 (JSON persistence policy).
