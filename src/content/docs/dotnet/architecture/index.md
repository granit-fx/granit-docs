---
title: "Granit Architecture — ADRs, patterns and design principles"
description: "Why does Granit isolate every DbContext per module, ban shared Reader/Writer interfaces, mandate Microsoft.Extensions.AI, refuse silent OData defaults? Every load-bearing decision is captured as an Architecture Decision Record — context, alternatives, trade-offs, consequences. Plus 60 design patterns mapped to their concrete Granit implementation."
sidebar:
  label: Architecture
  order: 0
---

Pick any senior .NET codebase and ask why a specific call uses `IReader` instead of
`IRepository`, why authentication never reaches a shared library, or why the
framework ships eight modules just to expose OData to Power BI. The honest answer is
almost always "someone decided this two years ago and we never wrote it down".
Granit does the opposite: every architectural decision that constrains future code
is captured in writing — with context, evaluated alternatives, and explicit
consequences — the moment it's made.

This section is the trail of those decisions, plus the pattern library that maps
each design choice to its concrete implementation in the framework.

## What lives here

- **[Pattern Library](./patterns/)** — 60 design patterns with their concrete
  implementation in Granit, organized by category (architecture, cloud/SaaS, GoF,
  data, concurrency, .NET idioms, security, AI).
- **[ADRs](./adr/)** — 56 Architecture Decision Records documenting library
  selections, design pivots, and the trade-offs behind each. Read these when a
  convention surprises you — the *why* is in the record.
- **[Architecture Styles](./architecture-styles/)** — DDD ≠ architecture style.
  Granit supports both Clean Architecture and Vertical Slice Architecture; pick
  what fits your team.
- **[Dependency Graph](./dependency-graph/)** — visual map of every Granit
  package and how it depends on the rest. Read before adding a reference.
- **[HTTP Conventions](./http-conventions/)** — status codes, RFC 7807 Problem
  Details, DTO naming, pagination — the contract every Granit endpoint honours.
- **[Tech Stack](./tech-stack/)** — every direct production dependency, organized
  by domain, with the ADR that justifies it.

## Design principles

Six rules that explain most of Granit's apparent peculiarities. Each appears in
multiple ADRs — they're not retrofits, they're the framework's spine.

| Principle | What it means | Why it matters |
|-----------|----------------|----------------|
| **Convention over configuration** | Sensible defaults; explicit overrides | New modules don't need to declare what hasn't changed — every line of config is a line you can get wrong |
| **Module isolation** | Each module owns its `DbContext`, DI registrations, and public API surface | Modules can be replaced, removed, or upgraded without ripple effects |
| **CQRS everywhere** | `IReader` and `IWriter` interfaces stay separate; never merged into a single `IRepository` | Read paths can scale and cache independently; write paths can enforce invariants without leaking through reads |
| **Soft dependencies** | Modules access cross-cutting concerns (tenancy, time, user context, AI) via `Granit` interfaces with null-object defaults | Removing an optional package is a one-line config change, not a refactor |
| **Compliance by design** | GDPR (right to erasure, data minimization) and ISO 27001 (audit trail, immutability) are architectural decisions | Compliance reviews don't trigger code rewrites |
| **No silent defaults for risky surfaces** | OData EntitySets must declare `RequirePermission` + expand policy explicitly; webhook target URLs are SSRF-validated by default; `MapGranitGroup` enforces FluentValidation | Convention drift toward "unprotected by default" is the top cause of data leaks |

## How to use this section

Three reading paths depending on what you're trying to do:

- **Onboarding a Granit module for the first time** → start with the relevant
  [pattern](./patterns/) page. It's the shortest description of how a concept is
  implemented, with file paths to the actual source.
- **A convention is blocking you and you want to know if you should fight it** →
  search the [ADRs](./adr/). If the constraint isn't justified there, it's
  probably accidental and open for change. If it is, the *Consequences* section
  tells you what breaks when you bend it.
- **You're picking a library or pattern for a new module** → check
  [Tech Stack](./tech-stack/) first (libraries Granit already uses) and the
  [Pattern Library](./patterns/) (idioms the rest of the framework follows).
  Aligning saves you from reinventing what's already tested.

## See also

- [Architecture Decision Records (ADRs)](/dotnet/architecture/adr/) — every load-bearing decision with context and consequences
- [Pattern Library](/dotnet/architecture/patterns/) — 60+ patterns mapped to Granit implementations
- [Dependency Graph](/dotnet/architecture/dependency-graph/) — visual map of package coupling
- [Tech Stack](/dotnet/architecture/tech-stack/) — the libraries Granit already uses
- [Core concepts](/dotnet/concepts/) — module system, DI, configuration, security model
