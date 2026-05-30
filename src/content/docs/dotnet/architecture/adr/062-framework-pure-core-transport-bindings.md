---
title: "ADR-062: Framework-pure core + transport bindings"
description: "Split modules with enforcement points into a framework-pure core plus one binding package per transport (.Http for ASP.NET Core, .Wolverine for messaging). Applied to Granit.RateLimiting and Granit.Features."
sidebar:
  order: 62
  label: "062 - Framework-pure core + transport bindings"
topic: backend
---

> **Date:** 2026-05-27
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.RateLimiting`, `Granit.Http.RateLimiting`, `Granit.RateLimiting.Wolverine`, `Granit.Features`, `Granit.Http.Features`, `Granit.Features.Wolverine`

## Context

`Granit.RateLimiting` and `Granit.Features` both ship a transport-agnostic
algorithm (per-tenant counters; multi-level value resolution) and one or more
*enforcement points* that live in a specific transport — an ASP.NET Core endpoint
filter, a Wolverine pipeline middleware, an MVC action filter.

Until now each module was a **single package** that carried an ASP.NET Core
`FrameworkReference`. That coupling had concrete costs:

- A **worker service**, a **console host**, or a **scheduled-job** project that
  only needs the algorithm still dragged in the whole web stack.
- The **AI extraction path** (`Granit.AI.Extraction.StackExchangeRedis`)
  deliberately duplicated a ~20-line Redis sliding-window Lua script rather than
  depend on `Granit.RateLimiting`, *specifically* to avoid pulling ASP.NET Core
  into a self-contained distributed limiter. That objection was reconsidered in
  the #2364 follow-up.
- `Granit.Features` carried an MVC `IFilterFactory` (`[RequiresFeature]` on a
  controller action) even though the framework is Minimal-API-first everywhere
  else — a second, lightly-used enforcement surface to maintain.

The transport binding is also where the *unwanted* heavy dependencies enter:
`Granit.Http.ExceptionHandling` for the 429 RFC 7807 mapping, the ASP.NET Core
filter pipeline, the Wolverine middleware contract. None of that belongs in the
algorithm.

## Decision

Split any module that has both an algorithm and transport-specific enforcement
points into:

1. A **framework-pure core** — no ASP.NET Core `FrameworkReference`, no
   `WolverineFx` reference. Holds the stores, algorithms, options, exceptions,
   the resolution logic, and the core `GranitModule`.
2. **One binding package per transport**, each depending on the core:
   - `*.Http` (e.g. `Granit.Http.RateLimiting`, `Granit.Http.Features`) — the
     ASP.NET Core Minimal-API endpoint filter and any RFC 7807 mapping. Its
     module `[DependsOn]` the core (and `GranitHttpExceptionHandlingModule` where
     a custom status mapping is needed).
   - `*.Wolverine` (e.g. `Granit.RateLimiting.Wolverine`,
     `Granit.Features.Wolverine`) — the `[…]` attribute (in a
     `*.Wolverine.Attributes` namespace) and the pipeline middleware. The
     middleware is discovered by Wolverine convention and uses no Wolverine
     types, so the package carries **no `WolverineFx` reference** — the host's
     Wolverine setup is sufficient.

Each binding module pulls in the core module automatically via `[DependsOn]`, so
a consumer references only the binding(s) it actually uses.

**MVC controller support is dropped.** `[RequiresFeature]` no longer implements
`IFilterFactory`. Granit is Minimal-API-first; gate endpoints with
`.RequiresFeature()` or move the check into the handler via
`IFeatureChecker.RequireEnabledAsync()`.

This is applied now to two modules and is the **precedent** for any future module
with the same shape.

| Concern | Core (framework-pure) | `*.Http` | `*.Wolverine` |
| ------- | --------------------- | -------- | ------------- |
| Rate limiting | `Granit.RateLimiting` | `Granit.Http.RateLimiting` | `Granit.RateLimiting.Wolverine` |
| Feature flags | `Granit.Features` | `Granit.Http.Features` | `Granit.Features.Wolverine` |

The `Granit.AI.Extraction.StackExchangeRedis` limiter **continues to not reuse**
the rate-limiting core, even now that the core is framework-pure. The pure core
still transitively pulls `Granit.Features → Granit.Caching + Granit.Localization`
(the SaaS feature-flag, cache, and localization stacks) into any consumer — the
wrong abstraction for a self-contained algorithm that never changes. Reuse was
reconsidered and deliberately declined (#2364 follow-up).

## Alternatives considered

### A. Keep a single package, drop the `FrameworkReference`, guard with reflection

Rejected. You cannot offer an ASP.NET Core endpoint filter *and* a Wolverine
middleware from one package without referencing both surfaces. Optional/`#if`
multi-targeting hides the dependency from the graph but not from the restore — a
worker project still resolves the web transitive closure.

### B. One package per module, multi-target `net10.0` and `net10.0-aspnetcore`

Rejected. Multi-targeting on a `FrameworkReference` boundary is brittle, doubles
the build matrix, and still cannot express "ASP.NET Core *and* Wolverine"
cleanly. It also leaks into consumers' `csproj` as conditional references.

### C. Split the core but keep both bindings in one `*.Integrations` package

Rejected. It re-introduces the `WolverineFx`-adjacent and ASP.NET Core
dependencies together, so a pure-HTTP API still references the messaging binding
(and vice-versa). One package per transport keeps each consumer's graph minimal.

## Consequences

### Positive

- **Non-web hosts stay lean.** A worker or console host references
  `Granit.RateLimiting` (or its Wolverine binding) with no ASP.NET Core closure.
- **The AI path's objection is now explicit, not structural.** Purity removed the
  "drags in ASP.NET Core" reason; the remaining reason (Features → Caching →
  Localization) is documented and owned, not incidental.
- **Consistent, predictable naming.** `*.Http` and `*.Wolverine` bindings read
  the same across modules. New transports follow the same shape.
- **Smaller dependency graphs** per consumer; the core's public surface is
  transport-free and easier to reason about.

### Negative

- **More packages.** Two modules became six. Mitigated by `[DependsOn]`
  auto-wiring — referencing a binding is enough, and most apps reference one or
  two bindings, not all of them.
- **Breaking changes (pre-1.0).** Namespace moves for the attributes and the
  endpoint filter, a separate `AddGranitHttp*()` registration, one module
  becomes three, and the removal of MVC controller support. Migration tables ship
  on the [Rate Limiting](/dotnet/api/rate-limiting/) and
  [Feature Flags](/dotnet/infrastructure/feature-flags/) reference pages.

### Neutral

- The split is invisible to apps that already used Minimal API + Wolverine and
  referenced the modules through bundles — they pick up the binding packages
  transitively and only the `using` lines change.

## References

- [Rate Limiting](/dotnet/api/rate-limiting/) — package layout + migration table
- [Feature Flags](/dotnet/infrastructure/feature-flags/) — package layout + migration table
- PR [#2366](https://github.com/granit-fx/granit-dotnet/pull/2366) — `Granit.RateLimiting` split into core + `Granit.Http.RateLimiting` + `Granit.RateLimiting.Wolverine`
- PRs [#2367](https://github.com/granit-fx/granit-dotnet/pull/2367) / [#2368](https://github.com/granit-fx/granit-dotnet/pull/2368) — `Granit.Features` split into core + `Granit.Http.Features` + `Granit.Features.Wolverine`; MVC support removed
- PR [#2369](https://github.com/granit-fx/granit-dotnet/pull/2369) — `Granit.AI.Extraction.StackExchangeRedis` keeps its duplicated Lua (reuse declined, #2364 follow-up)
