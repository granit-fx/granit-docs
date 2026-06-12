---
title: "Core Concepts — Modules, DI & Architecture"
description: Core design principles behind Granit — module system, EF Core persistence, Wolverine messaging, multi-tenancy, GDPR compliance, and the security model.
sidebar:
  label: Overview
  order: 0
---

Granit is not a collection of independent utilities. Every design decision flows from
a small set of principles: modules compose with explicit dependency declarations, data
is always scoped to its tenant, events cross boundaries without coupling, and compliance
is structural rather than bolted on.

Understanding these concepts gives you the mental model to use Granit effectively
and extend it without surprises.

## How concepts connect

```mermaid
graph TD
    MS[Module System] --> DI[Dependency Injection]
    DI --> Config[Configuration]
    DI --> P[Persistence]
    P --> CQRS[CQRS]
    P --> MT[Multi-Tenancy]
    P --> C[Compliance]
    CQRS --> C
    MS --> Msg[Messaging]
    Msg --> CQRS
    Msg --> WO[Wolverine Optionality]
    Msg --> C
    MT --> SM[Security Model]
    SM --> C
```

Start with the **Module System** — every other concept builds on it.

## Core architecture

- [Module System](/dotnet/concepts/module-system/) — `[DependsOn]`, topological sort, conditional modules,
  two-phase lifecycle
- [Dependency Injection](/dotnet/concepts/dependency-injection/) — module service registration, Options
  pattern, PostConfigure
- [Configuration](/dotnet/concepts/configuration/) — Options (startup), Settings (runtime), Module Config
  (frontend read-only)

## Data and infrastructure

- [Persistence](/dotnet/concepts/persistence/) — isolated DbContext, interceptors (audit, soft delete,
  versioning), automatic query filters
- [CQRS](/dotnet/concepts/cqrs-command-query-separation/) — Reader/Writer separation, compliance-driven data access,
  least-privilege injection
- [Multi-Tenancy](/dotnet/concepts/multi-tenancy/) — three isolation strategies, transparent query filters,
  async-safe tenant context
- [Messaging](/dotnet/concepts/messaging/) — domain events, integration events, transactional outbox,
  automatic context propagation
- [Wolverine Optionality](/dotnet/concepts/wolverine-optionality/) — Channel fallback, crash behavior,
  when you actually need a message bus

## Security and compliance

- [Security Model](/dotnet/concepts/security-model/) — JWT authentication, provider-agnostic RBAC,
  per-role caching, back-channel logout
- [Compliance](/dotnet/concepts/compliance/) — GDPR and ISO 27001 enforcement as structural patterns

## Architecture

- [Framework vs Modules](/dotnet/concepts/framework-vs-modules/) — classification boundary and
  dependency rules between horizontal framework and vertical business modules

## Tooling

- [Bundles](/dotnet/concepts/bundles/) — meta-packages and the fluent `GranitBuilder` API for quick onboarding

## Architecture decisions

- [Modular Monolith vs Microservices](/dotnet/concepts/modular-monolith-vs-microservices/) — decision
  framework, migration path, operational trade-offs
