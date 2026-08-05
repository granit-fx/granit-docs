---
title: "Diagnostics Reference — Analyzer Rules (GRxxx)"
description: Every Roslyn diagnostic Granit.Analyzers can emit — GRAPI, GRSEC, GRMOD, GRMIGA rule IDs with severity and meaning, indexed for build-log lookup.
sidebar:
  label: Diagnostics (GRxxx)
---

<!-- Rule data extracted from the DiagnosticDescriptor declarations in
     granit-dotnet/src/Granit.Analyzers. Keep in sync when analyzers change. -->

`Granit.Analyzers` ships Roslyn analyzers that enforce framework conventions at
build time. When a build log shows a `GRxxx` warning or error, this page is the
index. Rules marked **Error** fail the build.

The analyzers load automatically with the `Granit.Analyzers` package;
`Granit.Analyzers.CodeFixes` adds the associated IDE code fixes.

## API rules (GRAPI)

| ID | Severity | Rule |
|----|----------|------|
| `GRAPI001` | Warning | Avoid the `Results` static class — use `TypedResults` |
| `GRAPI002` | Warning | Avoid `TypedResults.BadRequest` with a body — use `TypedResults.Problem` for RFC 7807 responses |
| `GRAPI003` | Error | Minimal API endpoint handler has an interface-typed parameter without an explicit binding attribute — add `[FromServices]` (or `[FromQuery]`, `[FromBody]`, …) |

## Security rules (GRSEC)

| ID | Severity | Rule |
|----|----------|------|
| `GRSEC001` | Warning | Avoid direct `DateTime`/`DateTimeOffset` clock access — inject [`IClock`](/dotnet/core/time-provider-clock/) |
| `GRSEC002` | Warning | Avoid `Guid.NewGuid()` — use `IGuidGenerator` ([sequential GUIDs](/dotnet/core/sequential-guid-generation/)) |
| `GRSEC003` | Error | Potential hardcoded secret detected |
| `GRSEC004` | Warning | Avoid direct `IResponseCookies` access — use `IGranitCookieManager` |
| `GRSEC005` | Warning | `PrivacyExportContext` subject must equal the caller |
| `GRSEC010` | Error | PII-indicative name used as a metric tag key |
| `GRSEC011` | Error | PII-indicative placeholder in a `LoggerMessage` template |

## Modularity rules (GRMOD)

| ID | Severity | Rule |
|----|----------|------|
| `GRMOD001` | Error | Cross-module reference to an internal type — reference the module's `Contracts` package instead ([module system](/dotnet/core/module-system/)) |

## Migration rules (GRMIGA)

Zero-downtime migration safety — see [Migrations](/dotnet/data/migrations/).

| ID | Severity | Rule |
|----|----------|------|
| `GRMIGA001` | Error | `DropColumn` requires a Contract-phase annotation |
| `GRMIGA002` | Error | `RenameColumn` is not zero-downtime safe |
| `GRMIGA003` | Warning | `AddColumn NOT NULL` without a default value risks a table lock |
| `GRMIGA004` | Warning | `AlterColumn` with a type change requires a Contract-phase annotation |

## Other rules

| ID | Severity | Rule |
|----|----------|------|
| `GRBROWSING001` | Warning | JS expression argument mixes user-controllable data ([browsing security](/dotnet/infrastructure/browsing/security/)) |
| `GREF001` | Warning | Use `SaveChangesAsync()` instead of `SaveChanges()` |
| `GRENUM001` | Warning | Redundant explicit enum value |

## Suppressing a rule

Prefer fixing the reported code. When a suppression is genuinely justified,
scope it as narrowly as possible and document why:

```csharp
#pragma warning disable GRSEC001 // Wall-clock comparison against an external timestamp
var skew = DateTimeOffset.UtcNow - externalTimestamp;
#pragma warning restore GRSEC001
```

## See also

- [Analyzers](/dotnet/core/analyzers/) — how the analyzer package works and ships
- [Coding standards](/contributing/coding-standards/) — the conventions these rules encode
- [Common errors](/troubleshooting/common-errors/) — runtime failures and fixes
