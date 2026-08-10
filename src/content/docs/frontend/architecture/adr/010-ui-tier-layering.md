---
title: "ADR-010: Strict UI-Tier Layering — No @granit/react-ui Below the UI Tier"
description: "The shadcn/@granit/react-ui stack lives only at the UI tier — headless react-{module} adapters must not import or depend on it"
sidebar:
  order: 10
  label: "010 - UI-Tier Layering"
topic: frontend

---

> **Date:** 2026-07-01
> **Authors:** Jean-Francois Meyers
> **Scope:** All `@granit/react-*` packages

## Context

The framework front-end has settled into three package tiers:

1. **Core** `@granit/{module}` — framework-agnostic domain logic, DTOs, Axios
   calls. No React.
2. **Headless React** `@granit/react-{module}` — React Query hooks, providers,
   query-key factories. React-aware but **design-system-agnostic**: no JSX
   widgets tied to a specific UI library.
3. **UI** `@granit/react-ui-{module}` — the shadcn/ui-based pages, dialogs, and
   widgets. This is the only tier allowed to depend on the shadcn stack
   (`@granit/react-ui`, `radix-ui`/`@radix-ui/*`, `cmdk`, `sonner`,
   `class-variance-authority`, `vaul`).

ADR-004 removed UI from the framework entirely; the framework has since
reintroduced a dedicated, **published** UI tier (`react-ui-*`) that consolidates
the shadcn implementation in one place. That makes the tier boundary explicit —
but it was not enforced. In practice two conflicting idioms had appeared in the
headless tier:

- **Idiom A (clean):** a `react-{module}` package exposes only hooks/providers
  and leaves rendering to its `react-ui-{module}` sibling. Most packages.
- **Idiom B (leaky):** a `react-{module}` package reached down into the shadcn
  stack directly (importing `@granit/react-ui` or a Radix/CVA primitive, or
  declaring it as a peer dependency) to ship a ready-made widget. This dragged
  the design system below the UI tier, coupling a supposedly headless adapter to
  shadcn.

Idiom B defeats the point of the headless tier: a consumer on a different design
system (or a future React Native / non-shadcn shell) cannot reuse the adapter
without pulling shadcn. It also splits the "single UI source of truth" across
tiers and makes the dependency graph harder to reason about.

## Decision

**Option (b): strict 3-tier layering.** The shadcn/`@granit/react-ui` stack must
**not** appear below the UI tier. A headless `@granit/react-{module}` package
(prefixed `react-`, **not** `react-ui-`) must not import — nor peer-depend on —
`@granit/react-ui` (barrel or subpath) or the shadcn primitives it re-exports:
`radix-ui` / `@radix-ui/*`, `cmdk`, `sonner`, `class-variance-authority`, `vaul`.

UI composition using those primitives belongs exclusively to the `react-ui-*`
tier. Cores (no `react-` prefix) are already kept React-free by the existing
framework-agnostic arch-test and are not re-covered here.

## Alternatives considered

### Option (a): keep the status quo (convention only)

- **Advantage**: zero migration; packages ship widgets wherever convenient.
- **Disadvantage**: the tier boundary erodes silently; every new leak is a fresh
  coupling that a future multi-platform effort must unpick. Not arch-testable.

### Option (b): strict 3-tier layering (selected)

- **Advantage**: the headless tier stays design-system-agnostic and portable;
  one place owns the shadcn stack; the boundary is machine-checkable via a
  ratchet arch-test.
- **Disadvantage**: a handful of packages that had grown a UI dependency needed
  their widgets extracted into a `react-ui-*` sibling (one-off migration).

### Option (c): collapse the headless and UI tiers

- **Advantage**: fewer packages; no boundary to police.
- **Disadvantage**: reintroduces the exact logic/UI coupling ADR-004 removed and
  forecloses non-shadcn consumers. Rejected.

## Justification

| Criterion | (a) status quo | (b) strict layering | (c) collapse |
| --------- | -------------- | ------------------- | ------------ |
| Headless portability | Erodes | Preserved | Lost |
| Single UI source of truth | Split | Yes | N/A |
| Multi-platform readiness | Blocked | Kept open | Blocked |
| Arch-testable boundary | No | Yes | N/A |
| Migration cost | None | One-off extraction | High |

The core/adapter seam is what lets a domain be consumed by more than one shell.
Keeping shadcn strictly at the UI tier preserves that seam, keeps the design
system in a single published tier, and turns the rule into a regression-proof
invariant rather than a review-time convention.

## Enforcement

A ratchet arch-test in `@granit/arch-tests`
(`src/__tests__/imports.test.ts`) scans every `@granit/react-*` package that is
not `react-ui-*` and fails if it imports (in `src`, excluding test/stories) or
declares as a (peer)dependency any of the banned specifiers. The frozen set of
tolerated offenders lives in `UI_STACK_BELOW_TIER_BASELINE`
(`src/__tests__/helpers.ts`), mirroring the existing `UI_ROUTER_BASELINE`
ratchet: no NEW package may be added, and the list only ever shrinks. Any new
leak fails CI immediately.

## Migration state

The extraction work landed ahead of this ADR, so the baseline ships **empty**
(`[]`) — the target end-state — and the test documents zero remaining debt:

- `react-rich-text` renamed to `react-ui-rich-text` (it is a UI package).
- `react-analytics`, `react-geocoding`, `react-entity-merge` extracted: their
  shadcn-based widgets moved to the `react-ui-*` tier, leaving the headless
  packages hooks-only.

These were tracked by the four extraction PRs #878 / #880 / #881 / #882. With
them merged, `UI_STACK_BELOW_TIER_BASELINE` is `[]` and stays there.

### Follow-up: `react-map`

`@granit/react-map` is a headless-named package that composes
`@granit/react-ui-analytics` (a UI package) for its map controls. It does **not**
import `@granit/react-ui` or a shadcn primitive directly, so it is **not** a
violation of this rule and is deliberately **not** baselined. However, a headless
package depending on a UI package is itself a tier smell: `react-map` is a
candidate for a rename to `react-ui-map` so its name reflects the tier it
actually occupies. That rename is a separate follow-up, out of scope for this
ADR.

> **Resolved:** the follow-up shipped. The package is now `@granit/react-ui-map`;
> `@granit/react-map` no longer exists.

## Re-evaluation conditions

This decision should be re-evaluated if:

- The framework adopts a headless design-system-agnostic primitive layer (e.g.
  Ark UI / Radix headless) that a `react-{module}` package could depend on
  without coupling to shadcn — the banned list would then need refining.
- The `react-ui-*` published tier is retired in favour of a different UI
  distribution model.

## References

- ADR-004: Headless Packages — Hooks Only, UI in Consumer Apps
- `UI_ROUTER_BASELINE` ratchet (same helpers file) — the pattern this rule mirrors
- Headless UI pattern: <https://www.merrickchristensen.com/articles/headless-user-interface-components/>
