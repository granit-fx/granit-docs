---
title: "ADR-074: Http* family redesign — wiring-first, distributed-by-default, ADR-062 completion"
description: "Systematic audit of the Granit.Http* family: fix dead-but-green wiring and decorative SectionNames, fail loud on non-distributed stores, ratchet the fixes with architecture tests, and finish the ADR-062 split for Bulkhead."
sidebar:
  order: 74
  label: "074 - Http* family redesign"
topic: backend
---

> **Date:** 2026-07-13
> **Authors:** Jean-Francois Meyers
> **Status:** Accepted
> **Scope:** `Granit.Bulkhead` (+ `.Wolverine`), `Granit.Http.Bulkhead`, `Granit.Http.UrlSafety` (renamed from `Granit.Http.Security`), `Granit.Http.Hosting` (absorbs `Granit.Http.Cors` + `Granit.Http.ResponseCompression`), `Granit.Http.Idempotency` (+ new `.Abstractions`), `Granit.RateLimiting`, `Granit.Http.Cookies.CookieConsent` (Klaro deleted), `Granit.Diagnostics.Endpoints` (absorbs `Granit.Http.SecurityHeaders.Endpoints`), `Granit.Http.Abstractions` (deleted)

## Context

A systematic audit of the `Granit.Http*` family (epic
[#2986](https://github.com/granit-fx/granit-dotnet/issues/2986)) found that the
family had grown by accretion — one package per feature, added when the feature
was written — and that several packages were **wired green but functionally
dead**:

- **Dead-but-green wiring.** Modules registered services and shipped options
  classes whose configuration was never bound: a `SectionName` constant existed,
  tests asserted the constant's value, but no `BindConfiguration` call ever read
  the section. `Http:Idempotency` was the canonical case — every key under it
  was silently ignored. A green test suite proved the constants compiled, not
  that the feature worked.
- **Decorative SectionNames.** The convention "every options class declares
  `SectionName`" had become a cargo cult: the constant satisfied reviewers while
  the binding was absent. Conventions that are not machine-enforced decay into
  decoration.
- **Silently-wrong distributed behavior.** The idempotency store and the
  rate-limiting counter store fell back to in-memory implementations when no
  Redis cache was registered. In a multi-replica deployment that turns
  "at-most-once" into "at-most-once per pod" and every rate limit into
  N × limit — the worst kind of bug: invisible until an incident.
- **Package-boundary drift.** `Granit.Http.Bulkhead` predated
  [ADR-062](/dotnet/architecture/adr/062-framework-pure-core-transport-bindings/)
  and still carried its algorithm inside the ASP.NET Core binding.
  `Granit.Http.Security` was a misleading name for URL validation.
  `Granit.Http.Cors` and `Granit.Http.ResponseCompression` were two
  always-referenced-together single-feature packages. `Granit.Http.Abstractions`
  held two unrelated leftovers. `Granit.Http.Cookies.Klaro` was deprecated but
  still shipping. `Granit.Http.SecurityHeaders.Endpoints` was a whole package
  for one diagnostics endpoint.

## Decision

Three principles, applied across the family in one restack
([#3025](https://github.com/granit-fx/granit-dotnet/pull/3025)):

### 1. Wiring-first

A feature exists only if its wiring is provable: options **must** be bound from
their declared section, middleware **must** be applied (or auto-applied), and
the proof is an architecture test, not a code review. `Http:Idempotency` is now
actually bound; CORS middleware is auto-applied via `IStartupFilter`
(opt-out `Http:Cors:AutoRegisterMiddleware = false`) so a configured-but-never-
enforced policy can no longer ship.

### 2. Distributed-by-default, fail-loud

Middleware whose correctness depends on shared state refuses to start with a
per-process store outside `Development`:

- Idempotency: a non-distributed `IConditionalCache` fails startup unless
  `Http:Idempotency:AllowInMemoryStore = true`.
- Rate limiting: an in-memory counter store fails startup unless
  `RateLimiting:AllowInMemoryCounterStore = true`.

The opt-in flags exist for single-replica hosts and are documented as such. A
loud startup failure is cheaper than a silent double payment.

### 3. Ratchet architecture tests

Every fixed class of defect gets a convention test that fails on regression:
options-binding coverage (`OptionsBindingConventionTests` — every `SectionName`
must be bound), section-name alignment (`SectionNameConventionTests` —
namespace-aligned, colon-separated), and metrics wiring
(`MetricsWiringConventionTests` — every `*Metrics` class registered and its
meter reachable). The tests are ratchets: exemption lists may only shrink.

### Package moves

| Was | Now | Kind |
| --- | --- | ---- |
| `Granit.Http.Bulkhead` (monolith) | `Granit.Bulkhead` (framework-pure core: registry, quota providers, options, diagnostics, 18-culture localization) + `Granit.Bulkhead.Wolverine` (`[Bulkhead]` + convention middleware, no `WolverineFx` ref) + slimmed `Granit.Http.Bulkhead` (`.RequireGranitBulkhead()` + RFC 7807 503 mapper) | ADR-062 split |
| `Granit.Http.Security` | `Granit.Http.UrlSafety` (module `GranitHttpUrlSafetyModule`, meter `Granit.Http.UrlSafety`, no `tenant_id` tag on counters) | Rename |
| `Granit.Http.Cors` + `Granit.Http.ResponseCompression` | `Granit.Http.Hosting` (config sections unchanged) | Consolidation |
| `Granit.Http.Cookies.Klaro` | Deleted — `UseCookieConsent()` on `GranitCookiesBuilder` is the single public CMP entry point | Deletion |
| `Granit.Http.SecurityHeaders.Endpoints` | Deleted — `MapGranitSecurityHeadersAudit()` moved to `Granit.Diagnostics.Endpoints` (`Diagnostics:Endpoints:SecurityHeadersAudit`) | Fold |
| — | `Granit.Http.Idempotency.Abstractions` (`[Idempotent]` + `IIdempotencyMetadata`, namespace `Granit.Http.Idempotency`) — `*.Endpoints` packages reference the contracts, never the middleware | New contracts package |
| `Granit.Http.Abstractions` | Deleted — dissolved into the idempotency contracts package; `MinimumResponseTimeGuard` moved internal to `Granit.Identity.Local.Endpoints` (its only consumer) | Dissolution |

Breaking configuration/telemetry moves: section `Http:Bulkhead` → `Bulkhead`;
meter/ActivitySource `Granit.Http.Bulkhead` → `Granit.Bulkhead`; metrics
`granit.http.bulkhead.*` → `granit.bulkhead.*`.

## Alternatives considered

### A. Fix the wiring bugs without moving packages

Rejected. The wiring bugs were symptoms; the accretion-shaped package graph was
the cause. Leaving `Granit.Http.Bulkhead` monolithic, or the CMP with two entry
points, reproduces the same drift within a release or two.

### B. Warn instead of failing on in-memory stores

Rejected. A startup warning in a container log is read by nobody until the
incident review. The failure mode being guarded against (double side effects,
N × rate limits) is silent and financially consequential — the guard must be as
loud as the bug is quiet. Development environments and explicit opt-in flags
cover every legitimate in-memory scenario.

### C. One-off cleanup without ratchet tests

Rejected. This audit is the second time decorative wiring was found in the
family. Without machine enforcement the third time is a certainty.

## Consequences

### Positive

- Misconfiguration is now loud: unbound sections and per-process stores fail
  the build or the startup, not the incident review.
- The Http* family reads as a system: hosting concerns in `Http.Hosting`,
  contracts in `*.Abstractions`, algorithms in framework-pure cores, one CMP
  entry point, diagnostics endpoints under diagnostics.
- Net package count −1 (6 deleted, 5 created) despite three new packages —
  consolidation paid for the splits.

### Negative

- **Breaking changes (pre-1.0):** the `Bulkhead` section/meter/metric renames,
  the `Granit.Http.UrlSafety` namespace moves, and the deleted packages require
  consumer updates. Migration tables ship on the
  [Bulkhead](/dotnet/api/bulkhead/), [URL Safety](/dotnet/api/url-safety/),
  [HTTP Hosting](/dotnet/api/http-hosting/) and
  [Klaro migration](/dotnet/compliance/cookies/klaro/) pages.
- Hosts that relied on the silent in-memory fallbacks must now either provision
  Redis or set an explicit opt-in flag.

### Neutral

- Apps consuming the family through `Granit.Bundle.Essentials` /
  `Granit.Bundle.Api` pick up the moves transitively — mostly `using` changes.
- ADR-055 keeps its historical package name (`Granit.Http.Security`); ADRs are
  never retro-edited.

## References

- Epic [#2986](https://github.com/granit-fx/granit-dotnet/issues/2986) — Http* family redesign audit + stories
- PR [#3025](https://github.com/granit-fx/granit-dotnet/pull/3025) — restack landing the family in one pass
- [ADR-062 — Framework-pure core + transport bindings](/dotnet/architecture/adr/062-framework-pure-core-transport-bindings/) — the layering convention completed here
- [ADR-055 — Extract URL safety + temp-file primitives](/dotnet/architecture/adr/055-extract-url-safety-and-temp-files/) — birth of the package renamed to `Granit.Http.UrlSafety`
- [Bulkhead](/dotnet/api/bulkhead/) / [Rate Limiting](/dotnet/api/rate-limiting/) / [Idempotency](/dotnet/api/idempotency/) / [HTTP Hosting](/dotnet/api/http-hosting/) / [URL Safety](/dotnet/api/url-safety/) — updated reference pages
