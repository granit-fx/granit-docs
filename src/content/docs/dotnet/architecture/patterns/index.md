---
title: "Pattern Library — 60 Design Patterns for .NET"
description: Catalogue of 60 design patterns in Granit — GoF, architecture, cloud/SaaS, data, concurrency, security, AI, and .NET idioms with source references.
sidebar:
  label: Pattern Library
  order: 0
  badge:
    text: "60"
    variant: note
---

A catalogue of design patterns used in the Granit framework, organized by category.

Each pattern documents the general concept, how it is implemented in Granit,
and references to the actual source files where the pattern is applied.

## Architecture patterns

| Pattern | Description |
| ------- | ----------- |
| [Module System](/dotnet/architecture/patterns/module-system/) | Topological loading with `[DependsOn]` |
| [Hexagonal Architecture](/dotnet/architecture/patterns/hexagonal-architecture/) | Ports and Adapters for infrastructure decoupling |
| [Layered Architecture](/dotnet/architecture/patterns/layered-architecture/) | Domain / Application / Infrastructure separation |
| [Middleware Pipeline](/dotnet/architecture/patterns/middleware-pipeline/) | Dual ASP.NET Core + Wolverine pipeline |
| [Event-Driven](/dotnet/architecture/patterns/event-driven/) | IDomainEvent (local) + IIntegrationEvent (durable) |
| [REPR](/dotnet/architecture/patterns/repr/) | Minimal API Request-Endpoint-Response |
| [CQRS](/dotnet/architecture/patterns/cqrs/) | IReader / IWriter separation, ArchUnitNET enforcement |
| [Vertical Slice Architecture](/dotnet/architecture/patterns/vertical-slice-architecture/) | Feature-organized code, per-use-case slices |
| [Aggregate Root](/dotnet/architecture/patterns/ddd-aggregate-roots/) | DDD aggregate roots for business invariants and domain events |
| [Anti-Corruption Layer](/dotnet/architecture/patterns/anti-corruption-layer/) | Isolation of Keycloak, S3, Brevo, FCM via internal DTOs |
| [Backends For Frontends (BFF)](/dotnet/architecture/patterns/bff-proxy/) | Secure token proxy for SPAs — OIDC tokens live server-side, browser sees cookies only |

## Cloud and SaaS patterns

| Pattern | Description |
| ------- | ----------- |
| [Multi-Tenancy](/dotnet/architecture/patterns/multi-tenancy/) | 3 isolation strategies, soft dependency, async propagation |
| [Feature Flags](/dotnet/architecture/patterns/feature-flags/) | Multi-level resolution Tenant to Plan to Default |
| [Transactional Outbox](/dotnet/architecture/patterns/transactional-outbox/) | Atomic event publishing via Wolverine Outbox |
| [Idempotency](/dotnet/architecture/patterns/idempotency/) | Stripe-style HTTP idempotency with state machine |
| [Pre-Signed URL](/dotnet/architecture/patterns/pre-signed-url/) | Direct-to-cloud S3 upload/download |
| [Sidecar / Behavior](/dotnet/architecture/patterns/sidecar-behavior/) | Context propagation via Wolverine Behaviors |
| [Circuit Breaker and Retry](/dotnet/architecture/patterns/circuit-breaker-retry/) | Standard resilience + Wolverine RetryWithCooldown |
| [Cache-Aside](/dotnet/architecture/patterns/cache-aside/) | FusionCache L1/L2 with native stampede protection |
| [Rate Limiting](/dotnet/architecture/patterns/rate-limiting/) | Per-tenant rate limiting with dynamic quotas |
| [Saga / Process Manager](/dotnet/architecture/patterns/saga-process-manager/) | GDPR export, import/export orchestrators |
| [Fan-Out](/dotnet/architecture/patterns/fan-out/) | Wolverine cascade for notifications and webhooks |
| [Claim Check](/dotnet/architecture/patterns/claim-check/) | Soft dependency IClaimCheckStore for large payloads |
| [Bulkhead Isolation](/dotnet/architecture/patterns/bulkhead-isolation/) | Queue isolation, parallelism, tenant quotas |

## GoF behavioral patterns

| Pattern | Description |
| ------- | ----------- |
| [Strategy](/dotnet/architecture/patterns/strategy/) | TenantIsolationStrategy, IBlobKeyStrategy, IStringEncryptionProvider |
| [Chain of Responsibility](/dotnet/architecture/patterns/chain-of-responsibility/) | TenantResolverPipeline, blob validation |
| [Command](/dotnet/architecture/patterns/command/) | SendWebhookCommand, RunMigrationBatchCommand |
| [Template Method](/dotnet/architecture/patterns/template-method/) | GranitModule lifecycle, GranitValidator |
| [State Machine](/dotnet/architecture/patterns/state-machine/) | IdempotencyState, BlobStatus |
| [Observer / Event](/dotnet/architecture/patterns/observer-event/) | Wolverine implicit event subscription |
| [Mediator](/dotnet/architecture/patterns/mediator/) | Wolverine message bus |
| [Null Object](/dotnet/architecture/patterns/null-object/) | NullTenantContext, NullCacheValueEncryptor |

## GoF creational patterns

| Pattern | Description |
| ------- | ----------- |
| [Factory Method](/dotnet/architecture/patterns/factory-method/) | VaultClientFactory, DbContext tenant factories |
| [Singleton](/dotnet/architecture/patterns/singleton/) | AsyncLocal singletons, NullTenantContext.Instance |
| [Builder](/dotnet/architecture/patterns/builder/) | Fluent `AddGranit*()` extensions |

## GoF structural patterns

| Pattern | Description |
| ------- | ----------- |
| [Adapter](/dotnet/architecture/patterns/adapter/) | S3BlobClient, MailKitSmtpTransport |
| [Decorator](/dotnet/architecture/patterns/decorator/) | EncryptingFusionCacheSerializer, CachedLocalizationOverrideStore |
| [Proxy](/dotnet/architecture/patterns/proxy/) | FilterProxy for EF Core, Interceptors |
| [Facade](/dotnet/architecture/patterns/facade/) | DefaultBlobStorage, GranitExceptionHandler |
| [Composite](/dotnet/architecture/patterns/composite/) | Auditable entity hierarchy |

## Data patterns

| Pattern | Description |
| ------- | ----------- |
| [Repository](/dotnet/architecture/patterns/repository/) | Store interfaces + EF Core / InMemory implementations |
| [Soft Delete](/dotnet/architecture/patterns/soft-delete/) | ISoftDeletable + SoftDeleteInterceptor (GDPR) |
| [Data Filtering](/dotnet/architecture/patterns/data-filtering/) | IDataFilter with ImmutableDictionary AsyncLocal |
| [Unit of Work](/dotnet/architecture/patterns/unit-of-work/) | Implicit DbContext + interceptor chain |
| [Specification](/dotnet/architecture/patterns/specification/) | QueryDefinition whitelist-first, expression trees |
| [Metadata Property Bag](/dotnet/architecture/patterns/metadata/) | JSON property bag with optional SQL column promotion for indexing |
| [Data Lookup](/dotnet/architecture/patterns/data-lookup/) | Unified typeahead — one registry feeds QueryEngine filters + form dropdowns + refdata |

## Concurrency patterns

| Pattern | Description |
| ------- | ----------- |
| [Scope / Context Manager](/dotnet/architecture/patterns/scope-context-manager/) | `using` pattern for context restoration |
| [Copy-on-Write](/dotnet/architecture/patterns/copy-on-write/) | ImmutableDictionary for thread-safe state |
| [Double-Check Locking](/dotnet/architecture/patterns/double-check-locking/) | Anti-stampede for token caching and singletons |

## .NET idiom patterns

| Pattern | Description |
| ------- | ----------- |
| [Expression Trees](/dotnet/architecture/patterns/expression-trees/) | Dynamic EF Core query filter construction |
| [Marker Interface](/dotnet/architecture/patterns/marker-interface/) | ISoftDeletable, IMultiTenant, IDomainEvent |
| [Options Pattern](/dotnet/architecture/patterns/options-pattern/) | 93 Options classes, ValidateOnStart |

## Security patterns

| Pattern | Description |
| ------- | ----------- |
| [Claims-Based Identity](/dotnet/architecture/patterns/claims-based-identity/) | JWT Keycloak + dynamic RBAC |
| [Guard Clause](/dotnet/architecture/patterns/guard-clause/) | Systematic fail-fast, semantic exceptions |

## AI patterns

| Pattern | Description |
| ------- | ----------- |
| [Retrieval-Augmented Generation](/dotnet/architecture/patterns/rag/) | Vector retrieval + LLM grounding (`AI.VectorData`) |
| [AI Workspace](/dotnet/architecture/patterns/ai-workspace/) | Named, per-tenant provider configuration (`IAIChatClientFactory`) |
| [Graceful AI Fallback](/dotnet/architecture/patterns/ai-fallback/) | Timeout + deterministic baseline (`QueryEngine.AI`, `DataExchange.AI`) |
| [Structured Output](/dotnet/architecture/patterns/structured-output/) | Type-safe LLM response via JSON schema (`CompleteAsync<T>`) |

## Granit-specific variants

| Pattern | Description |
| ------- | ----------- |
| [Granit Variants](/dotnet/architecture/patterns/granit-variants/) | 10 hybrid patterns unique to Granit |
