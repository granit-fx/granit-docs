---
title: Migrating to Granit from Another Framework
description: Step-by-step guides to port an existing .NET application to Granit — conceptual mappings, before/after code samples, and phased cutover strategies that let both stacks coexist during the migration.
sidebar:
  label: Overview
  order: 0
---

This section helps teams already running a .NET application on another modular
or opinionated framework move that codebase to Granit incrementally. Each guide
follows the same shape:

1. **Why teams move** — an honest assessment of which projects benefit, and
   which are better served by staying put.
2. **Conceptual mapping** — a table that maps every major primitive of the
   source framework to its Granit equivalent.
3. **A phased cutover** — bootstrapping a Granit host alongside the existing
   one, porting one module at a time, then decommissioning.
4. **Before / after code** — a complete CRUD module shown in both stacks,
   side by side.
5. **What Granit does not replace** — the gaps you will need to address
   yourselves or work around.

## Available guides

- [From ABP Framework](/migrating-from/abp/) — the modular ABP.IO stack
  (open-source edition). Covers `[DependsOn]`, application services, the
  repository pattern, multi-tenancy, permissions, settings, domain events,
  and background jobs.
- [From FullStackHero](/migrating-from/fullstackhero/) — the .NET Starter
  Kit (`fullstackhero/dotnet-starter-kit`). Covers the fork-to-package
  transition, Mediator → interface-level CQRS + Wolverine, Finbuckle →
  `Granit.MultiTenancy`, ASP.NET Identity → `Granit.Identity`, and the
  `AppDbContext` → isolated `DbContext` refactor.
- [From the Clean Architecture template](/migrating-from/clean-architecture/)
  (Ardalis) — the `ardalis/CleanArchitecture` template. Covers the
  four-project → single-project collapse, MediatR + Ardalis.Specification
  → Granit Reader/Writer + `Specification<T>`, the Result pattern
  trade-off, and the cross-cutting concerns (multi-tenancy, identity,
  audit, settings, notifications, background jobs) that Ardalis CA
  deliberately ships none of.

## Coming soon

These guides are planned. Open an issue on the docs repo if you would like
to influence the order:

- **From the eShop reference app** — minimal API conventions, integration
  events, and how Granit's Wolverine integration replaces hand-rolled
  IntegrationEventService plumbing.
- **From a MediatR + FluentValidation stack** — request pipelines,
  validation behaviors, and the move to Wolverine handlers.
- **From Orleans** — virtual actors vs. Granit modules + Wolverine,
  state persistence trade-offs.
- **From Dapr** — sidecar building blocks vs. in-process Granit modules,
  service invocation, pub/sub, and state.

## Already on Granit?

If you are upgrading between Granit major versions (for example, `1.x` to
`2.x`), use the [Version Upgrades](/migration/) section instead — that
covers the package version policy, the changelog format, and the
breaking-change deprecation workflow.
