---
title: "ADR-060: Notification type auto-discovery — spike outcome"
description: "Should the framework auto-ingest NotificationType<T>.Instance singletons to make INotificationDefinitionProvider redundant? Spike concludes: keep the manual provider, with the archi test as the safety net."
sidebar:
  order: 60
  label: "060 - Notification type auto-discovery (spike)"
topic: backend
---

> **Date:** 2026-05-25
> **Authors:** Jean-Francois Meyers
> **Status:** Spike — decision recorded, no implementation work scheduled.
> **Scope:** `granit-dotnet` — `Granit.Notifications` + every `*.Notifications` package
> **Related:** granit-dotnet #2219 (manual-registration cleanup), #2221 (archi-test backstop), #2225 (UI filter fields)

## Context

`NotificationFanoutHandler` reads channels, opt-out enforcement and DnD bypass
exclusively from `INotificationDefinitionStore`. The store is populated only by
registered `INotificationDefinitionProvider` implementations. Each provider
duplicates information already declared on the corresponding
`NotificationType<T>` subclass: the type's `Name`, `DefaultSeverity` and
`DefaultChannels` are mirrored, with the provider adding only the cross-cutting
fields (`GroupName`, `DisplayName`, `Description`, `AllowUserOptOut`,
`AllowDoNotDisturbBypass`, and the new `RequiredPermission` /
`RequiredFeature` from #2225).

The duplication is the root cause of #2219: nine `*.Notifications` modules
were shipped without a provider, the engine silently fell back to
InApp-only fan-out with `AllowUserOptOut = true`, and the
`/api/v1/notifications/types` endpoint returned an empty list.

This spike asks: **could the store auto-ingest every `NotificationType<T>.Instance`
singleton, so authors never need to write — or remember to register — a
provider?**

## Options considered

### Option A — Full auto-discovery

At startup, scan opted-in assemblies for `NotificationType<>` subclasses,
materialise their `Instance` singleton, project to a `NotificationDefinition`
by reading the public properties. Discard `INotificationDefinitionProvider`
entirely.

**Pros**

- One source of truth (the `NotificationType<T>` class).
- Provider drift impossible by construction.
- No archi test (#2221) needed.

**Cons**

- Loses the *cross-cutting* metadata the engine actually consumes today.
  `GroupName`, `DisplayName`, `Description`, `AllowUserOptOut`,
  `AllowDoNotDisturbBypass`, `RequiredPermission`, `RequiredFeature` —
  none of these belong on `NotificationType<T>` (they are deployment /
  presentation concerns, not domain payload concerns) and bolting them on
  bloats the class and forces every consumer to depend on Granit.Authorization
  / Granit.Features just to declare a payload type.
- Reflection at boot — slower for large catalogs and harder to debug than an
  explicit `Define()` method that shows up in stack traces.

### Option B — Hybrid: auto-discover defaults, provider overrides

Auto-ingest the three fields that already live on `NotificationType<T>`
(`Name`, `DefaultSeverity`, `DefaultChannels`). Keep
`INotificationDefinitionProvider` for everything else, but make it optional
where the defaults are acceptable.

**Pros**

- Removes the most common cause of drift (channels falling back to
  `[InApp]` because the provider forgot to mirror them).
- Module authors only write a provider when they need cross-cutting metadata
  — most do.
- Backwards-compatible: a `RegisterFromAssembly` call seeds the store; the
  provider then patches the entry by Name.

**Cons**

- Two-source-of-truth for `DefaultChannels` (one from the type, one
  potentially overridden by the provider) — a different, subtler drift surface.
- The merge rule has to be specified and documented (provider always wins?
  union of channels? merge by field?). Each answer creates a footgun.
- The non-opt-out posture (the most security-sensitive field) is *not* on
  the type. So the provider is still required for every security-relevant
  notification — which is most of them — defeating the simplification goal.

### Option C — Keep the manual provider, fix the docs, enforce with archi test

Status quo as patched by #2219 (manual providers), #2220 (doc clarification:
the provider is **required**, not optional), and #2221 (archi test fails the
build when a `NotificationType<>` assembly ships without a matching
registered provider).

**Pros**

- One source of truth per concern: `NotificationType<T>` for payload shape,
  `NotificationDefinition` for deployment / presentation. Clean separation.
- The archi test catches drift at PR time with a precise error message.
- No reflection at runtime — the boot path stays simple and predictable.
- No new abstraction to teach (`INotificationDefinitionProvider` already
  exists, ships in every module, is documented in `conventions.mdx`).

**Cons**

- Duplication of three fields between type and definition remains. Module
  authors must mirror `DefaultChannels` — easy to mistype.
- The cross-cutting metadata (`AllowUserOptOut`, `RequiredPermission`, …)
  still lives in a separate file from the type, so the reader has to look
  in two places to understand a notification.

## Measurements

A 30-minute prototype of Option B (in a scratch branch, not committed)
showed:

- Boot cost: ~12 ms added to host startup for the full Granit catalog
  (~33 types across 10 assemblies). Acceptable.
- Type-side declaration surface would need 5 new optional virtuals on
  `NotificationType<T>` (display name, group, opt-out posture, DnD bypass,
  permission). That's a 3× growth of the public surface.
- Merge logic: provider-wins is unambiguous but means the type-side fields
  are "default values nobody reads if a provider exists". For modules that
  always ship a provider, the type-side fields become dead code.

## Decision

**Option C — keep the manual provider, with #2221 as the safety net.**

The duplication is real but small (one provider class per module). The
archi test reduces the failure mode to a build failure with an actionable
message. The alternative designs grow `NotificationType<T>`, introduce
merge semantics, or duplicate the security-sensitive `AllowUserOptOut`
into a second source of truth — each fix worse than the original problem.

The pragmatic improvement over status quo is the trio shipped this sprint:

- **#2219** — every existing `*.Notifications` module now ships a provider.
- **#2220** — the docs no longer call the provider "optional".
- **#2221** — the build fails when a future module ships a `NotificationType<>`
  without a registered provider.

## Consequences

- `NotificationType<T>` keeps its current public surface
  (`Name`, `DefaultSeverity`, `DefaultChannels`). No new virtuals.
- `INotificationDefinitionProvider` remains the canonical registration path.
  Conventions doc (D4 #1331, updated by #2220) is authoritative.
- The `NotificationDefinitionProviderCoverageTests` archi rule is the
  single backstop. Failure messages cite the exact missing types and point
  to the canonical `IdentityNotificationDefinitionProvider`.
- No follow-up implementation work is scheduled. This ADR closes #2223.

## When to revisit

Reopen this decision if any of the following becomes true:

- The duplication of `DefaultChannels` between the type and the definition
  produces a runtime regression that the drift test (per-module
  `NotificationTypeDefinitionDriftTests`) does not catch.
- A future feature — for example a generic type-safe publisher overload —
  ends up needing the cross-cutting metadata at the type level. At that
  point Option B becomes the natural fit, and the merge semantics question
  can be answered in context.
- The boot-time cost of running providers grows past ~50 ms (currently
  ~3 ms for ~33 types). Reflection-based auto-discovery would be faster
  *only* if we drop the call to `Define()` entirely, which Option B does not.
