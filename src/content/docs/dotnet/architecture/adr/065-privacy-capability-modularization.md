---
title: "ADR-065: Privacy capability modularization — extract Data Export as an opt-in module"
description: "Split Granit.Privacy so the Takeout-style export capability becomes a dedicated opt-in package (Granit.Privacy.DataExport), letting hosts adopt consent / purposes / opt-out without inheriting the export scatter-gather saga and its WolverineFx substrate."
sidebar:
  order: 65
  label: "065 - Privacy capability modularization"
topic: backend
---

> **Date:** 2026-06-03
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.Privacy` (base sheds export), new `Granit.Privacy.DataExport`, the 8 framework consumers + 4 provider modules, cross-repo `Granit.Parties.Privacy` / `Granit.Documents.Privacy` (granit-business)

## Context

`Granit.Privacy` bundles five heterogeneous capabilities in one package, and the
base `.csproj` drags `WolverineFx` and `Granit.Workflow` for all of them:

| Folder | Files | Capability | Heavy dep |
| --- | --- | --- | --- |
| `DataExport` | 36 | Takeout export (Art. 15 / 20) | WolverineFx (saga + ETOs) |
| `LegalAgreements` | 17 | Consent / legal agreements | Granit.Workflow + Wolverine |
| `DataDeletion` | 14 | Erasure (Art. 17) | WolverineFx |
| `OptOut` | 7 | CCPA do-not-sell | — |
| `ProcessingPurposes` | 3 | Legal basis / ROPA | — |

A host that only records consent must still reference `WolverineFx` and ship the
entire export scatter-gather saga it never invokes. Adoption is all-or-nothing.

The same coupling produced a concrete startup failure (#2526): opting an export
provider in via the builder drags an infra substrate (`IStagedFragmentBuilder`,
blob staging) the host never knowingly requested.

Issue #2310 makes the export pipeline production-grade *in place* (streaming,
HMAC, sharding) but does not change packaging. Modularity is a separate concern.

## Decision

Extract the export capability into a dedicated opt-in module, keeping namespaces
stable to minimise the breaking surface.

- New package **`Granit.Privacy.DataExport`** — namespace stays
  `Granit.Privacy.DataExport`, so consumer `using`s do not change. Holds
  `IPrivacyDataProvider`, the `ExportFragment` hierarchy, `PersonalDataExportSaga`,
  the security primitives (`*HmacSigner`, `EntryPathSanitizer`),
  `IDataProviderRegistry`, scope-visibility contracts, and the export ETOs.
- **`GranitPrivacyDataExportModule`** `[DependsOn(typeof(GranitPrivacyModule))]`
  registers the export-only services currently wired inside `AddGranitPrivacy`.
- The export-specific builder surface (`AddDataProvider<T>`,
  `DataProviderRegistrations`, registry population) moves off the core
  `GranitPrivacyBuilder` into Export-owned builder extensions — the same shape as
  the per-provider `AddGranitXxxPrivacyProvider()` extensions.
- Base `Granit.Privacy` keeps consent / legal agreements / processing purposes /
  opt-out.
- The export infra sub-packages (`.BlobStorage`, `.BackgroundJobs`, `.Endpoints`,
  `.EntityFrameworkCore`) and the provider modules repoint to
  `Granit.Privacy.DataExport`.
- **Scope is export-first.** This does *not* make the base Wolverine-free —
  `DataDeletion` and one `LegalAgreements`/builder reference still use it. A
  bus-free base requires a follow-up `DataDeletion` extraction, deliberately
  deferred.
- Pre-1.0 → clean breaking change, no `[Obsolete]`.
- **"Takeout"** stays a UX / endpoint / docs brand, never a package name.
- Sequencing: fix the target package name now so #2310 P6.3 / P6.4 land in the
  right place, but execute the physical move **after** P6.4 merges.

## Alternatives considered

### A. Status quo (all-or-nothing Privacy)

Rejected — the coupling is a recurring footgun (#2526) and blocks lightweight
consent-only adoption.

### B. Full split into five capability packages now

Export / deletion / consent / purposes / opt-out, all at once. Rejected as
premature segregation before demand exists — export-first captures ~80% of the
benefit; deletion follows when a consumer needs a bus-free base.

### C. Top-level `Granit.DataExport` / `Granit.Takeout`

Rejected — collides conceptually with `Granit.DataExchange`, overstates scope (it
is a privacy concern), and forces namespace churn.

### D. New package with a new namespace `Granit.Privacy.Export`

Rejected — a using-rename across every consumer for zero functional gain. Keeping
the `Granit.Privacy.DataExport` namespace makes the move a `[DependsOn]` change,
not a source-wide edit.

### E. Execute the move as PR-0 before #2310 P6.3

Rejected — rebase pain on the in-flight breaking phases. Name the package now,
move the files after P6.4.

## Consequences

### Positive

- Consent / purposes / opt-out become adoptable without the export saga, HMAC /
  sharding machinery, or the implied blob-staging substrate.
- The largest capability gets a module boundary aligned with the Google Takeout
  product concept.
- Stable namespaces → small, mechanical consumer diff.
- Closes the class of failure behind #2526 at the packaging level.

### Negative

- Base is not yet Wolverine-free (deletion remains) — partial win.
- One more package (~129 → 130) and a breaking `[DependsOn]` change for consumers,
  including cross-repo coordination with granit-business.
- Scheduling dependency: must land after #2310 P6.4.

### Neutral

- Future `DataDeletion` extraction tracked as a separate Feature.
- "Takeout" remains a brand applied at the endpoint / docs layer.

## References

- Epic #79 — Granit.Privacy
- #2310 — Takeout-style portability (capability, in place)
- #2527 — this Feature (modularization)
- #2526 — provider builder self-wiring fix (the symptom)
- ADR-062 — framework pure core / transport bindings (same modular spirit)
