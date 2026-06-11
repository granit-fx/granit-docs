---
title: "ADR-066: Validation message key naming convention"
description: "Give validation localization keys a deterministic shape — Validation:{Category}:{Rule} for framework keys, {Module}:Validation:{Rule} for module-owned domain keys — replacing four incompatible ad-hoc styles, and enforce it with an architecture test."
sidebar:
  order: 66
  label: "066 - Validation key naming"
topic: backend
---

> **Date:** 2026-06-11
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.Validation` resource + every module that owns validation messages (framework + granit-business + granit-iot)

## Context

Validation localization keys grew four incompatible styles under one flat `Validation:` namespace:

| Family | Style | Examples |
| --- | --- | --- |
| FluentValidation built-ins | `{Rule}Validator` | `Validation:NotEmptyValidator`, `Validation:MinimumLengthValidator` |
| Granit format/identifier validators | `Invalid{Format}` (mostly) | `Validation:InvalidIban` — but `Validation:UrlMustBeHttps`, `Validation:CodeInvalidFormat` break it |
| Pattern hints | `Hints:{Code}` | `Validation:Hints:Alpha2Code` |
| Domain rules | ad-hoc | `CalendarRangeInverted`, `MaxBatchSize`, `ScopeRequired`, `PeriodSpecBoundsCode`, `DueAtMustBeAfterIssuedAt` |

Nothing in the name tells you **who owns** the key, **which category** of rule it is, or **what** it constrains. Two failure modes followed:

1. **Domain messages leaked into the framework resource.** When commercial modules moved to granit-business, their validation keys (Payments, Metering, Analytics, Parties merge, …) were left behind in `Granit.Validation`, with no framework consumer.
2. **The #2205 prefix rename (`Granit:Validation:*` → `Validation:*`) was never propagated to the consuming repos.** granit-business validators still emit `Granit:Validation:*` codes that match no key in the post-#2205 SPA dictionary, so those messages resolve to the raw code client-side.

## Decision

One deterministic shape, owner-first:

- **Framework keys** — `Validation:{Category}:{Rule}`, `Category ∈ { Builtin, Format, Hint, Problem }`:
  - `Validation:Builtin:NotEmpty` (FV built-ins; drop the redundant `Validator` suffix)
  - `Validation:Format:Iban` (format/identifier validators; `Format` already implies "invalid")
  - `Validation:Hint:Alpha2Code` (pattern hints)
  - `Validation:Problem:Title` (the 422 problem-details title)
- **Module-owned domain keys** — `{Module}:Validation:{Rule}` in the **owning module's** resource, never in `Granit.Validation`:
  - `Payments:Validation:AmountOutOfRange`, `Parties:Validation:InvalidMergeChoice`, `Invoicing:Validation:DueAtAfterIssuedAt`
- **`Rule`** is PascalCase from a **closed constraint vocabulary**: `Invalid`, `Required`, `TooLong`/`TooShort`, `OutOfRange`, `Ordering`, `Empty`, `TooMany`, …
- **Wire contract unchanged for built-ins.** FluentValidation's `ErrorCode` stays `{Rule}Validator`; only the *localization lookup key* is remapped inside `GranitErrorCodeLanguageManager`. For `WithErrorCodeAndMessage`, code == key == the value in the 422 `errors` map, so the scheme is the wire contract there (a pre-1.0 breaking change — no `[Obsolete]` graduation).

## Enforcement

`ValidationKeyConventionTests` (architecture shard) asserts every `Validation:*` key matches `Validation:(Builtin|Format|Hint|Problem):{PascalCase}`. A `PendingMigration` set holds the keys still on the legacy scheme — the canonical, CI-tracked migration backlog. It shrinks to empty as keys migrate; a stale entry (migrated or removed) fails the test, and a **new** non-conforming key fails unless explicitly justified. Each consuming repo (granit-business) adds the sibling rule for its `{Module}:Validation:*` keys.

## Consequences

- The migration is **phased per package/shard** (the framework forbids whole-solution builds), tracked by `PendingMigration`:
  1. Framework built-ins → `Builtin:`, format → `Format:`, hints → `Hint:`, `ProblemTitle` → `Problem:Title`.
  2. Relocate the ~20 domain leftovers from `Granit.Validation` to their owning business modules; fix the stale `Granit:Validation:*` references there at the same time.
- **Breaking for API clients** that read the per-field `ErrorCode`/message from the 422 `errors` map for `WithErrorCodeAndMessage` rules. Built-in messages are unaffected on the wire.
- Future keys are self-documenting (owner + category + constraint) and the framework resource stays restricted to genuinely framework-shipped validators.

## Status

Accepted. Convention + architecture test landed; migration in progress (see `PendingMigration`).
