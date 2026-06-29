---
title: "ADR-072: Address platform — geocoding & verification materialized"
description: "An address is three independent facts — postal text, geocoding outcome, deliverability verdict — not one. Model them as three mutualized value objects persisted as flat ComplexProperty columns; verify through three evidence tiers; expose provider abilities through a capability model; name the tier-1 contract 'Deliverability' to avoid a namespace clash with the verdict it feeds."
sidebar:
  order: 72
  label: "072 - Address platform"
topic: backend
---

> **Date:** 2026-06-29
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.Domain.ValueObjects` (`Address`, `AddressGeocoding`, `AddressVerification`, `GeoCoordinate`), `Granit.Geocoding.*` (Abstractions / engine / Nominatim / Photon / Endpoints), `Granit.AddressEnrichment`, `Granit.AddressDeliverability.Abstractions`, `Granit.Persistence.EntityFrameworkCore` (`MapAddressGeocoding` / `MapAddressVerification`), consumed by `granit-business` Parties

## Context

Multiple modules need to *act* on addresses — plot them on a Map widget, route
deliveries, offer type-as-you-go entry, decide whether to trust one for billing.
Before this work each reached for an ad-hoc shape: a `(lat, lon)` pair bolted onto
an entity, a bool `IsVerified`, a direct call to a hosted geocoder that logged the
address. Three problems recurred:

1. **Conflation.** "We found a coordinate" was treated as "the address is real",
   and "a provider verified it" as the same fact as "a parcel was delivered". They
   are different, and they routinely disagree — a rural address geocodes `Failed`
   yet a courier delivered to it; a well-mapped address geocodes `Rooftop` yet the
   building was demolished.
2. **Un-queryable storage.** Coordinates and verdicts stored as JSON or an opaque
   value-converter column (see [ADR-070](/dotnet/architecture/adr/070-value-object-persistence-and-querying/))
   can't answer "every customer whose address is `Failed`" or "count
   `DeliveryConfirmed` this quarter" without a table scan.
3. **PII leakage.** A postal address is personal data. Hosted geocoders log the
   request URI (which carries the address), and a plaintext address used as a
   cache key spreads PII across shared cache infrastructure.

## Decision

### 1. Three orthogonal axes, three value objects

An address is modelled as **three independent** mutualized value objects, not one
aggregate:

- **`Address`** — the postal fact (street, city, postal code, country,
  delivery-point type).
- **`AddressGeocoding`** — the spatial outcome: a `Status`
  (`Pending` / `Resolved` / `Approximate` / `Failed` / `Stale`), a `GeoCoordinate`,
  a `GeocodeMatchPrecision` (`Rooftop` / `Street` / `Locality`), freshness, and
  parsed components.
- **`AddressVerification`** — the deliverability verdict: a `Status`
  (`Unverified` / `ProviderVerified` / `Corrected` / `ManuallyConfirmed` /
  `DeliveryConfirmed` / `Invalid`) plus the `Source` that produced it.

They are stored side by side on an entity and may freely disagree. `Failed`
geocoding is **not** `Invalid` verification — the distinction is load-bearing.

### 2. Persist them flat, as queryable columns

Both derived value objects are mapped with EF **`ComplexProperty`** through the
`MapAddressGeocoding` / `MapAddressVerification` helpers — real, indexable scalar
columns, enums stored as their PascalCase **string** names ([ADR-059](/dotnet/architecture/adr/059-enum-persistence-strategy/)).
This is the `ComplexProperty` opt-in [ADR-070](/dotnet/architecture/adr/070-value-object-persistence-and-querying/)
prescribes for a VO column you must filter, sort, or group by: `Status`,
`MatchPrecision`, `Latitude` / `Longitude` are first-class columns, so analytics
and admin queries translate straight to SQL. The computed `GeoCoordinate`
projection is not persisted; the scalar `Latitude` / `Longitude` pair is the
source of truth. A PostGIS `geography(Point)` column, when a host opts in, is a
*derived* spatial index over those same scalars — never the source.

### 3. A capability model for providers, capability-gated endpoints

Geocoding providers implement **segmented capability interfaces**
(`IGeocodingProvider` forward, `IReverseGeocodingProvider` reverse,
`IAddressAutocompleteProvider` autocomplete) rather than one fat interface. The
engine aggregates the registered set into a `GeocodingCapabilities` record. HTTP
endpoints are mapped **only** for present capabilities — a Nominatim-only host
exposes `/reverse` but not `/autocomplete`, and the OpenAPI document reflects
exactly what the deployment can do. A single provider instance serves every
capability it implements, so all calls share one rate-limit throttle.

### 4. Three evidence tiers; tier-1 contract named "Deliverability"

Verification is a verdict backed by evidence of escalating strength: **tier 0**
geocoding plausibility (free, OSM), **tier 1** an authoritative provider
(DPV/RDI), **tier 2** real-world evidence (manual confirm, successful delivery).
`IAddressEnrichmentService` runs the two automatable tiers (0 always; 1 when a
provider is registered, as an optional soft dependency); tier 2 is recorded by the
consuming module and is **promote-only** — a later provider pass never downgrades
a `ManuallyConfirmed` / `DeliveryConfirmed` verdict.

The tier-1 contract package is `Granit.AddressDeliverability.Abstractions`, named
**Deliverability** deliberately:

- `Granit.AddressVerification` would put a namespace on top of the
  `AddressVerification` *value object*, shadowing it in every consumer.
- The `Granit.Validation*` family is FluentValidation-based *format* validation —
  a different concern from an authoritative real-world check.

No concrete provider ships in the baseline; the contract lets modules depend on
deliverability without a vendor.

### 5. Privacy-first by default

The default geocoding services are **no-ops** that resolve to `null` — reaching a
geocoder requires a deliberate `AddGranitGeocoding*` call. Addresses and
coordinates are never logged (HTTP-client loggers removed, trace spans redacted)
and never used as a cache key (keys are SHA-256 hashes); autocomplete is not
cached at all. Persisted coordinate and address fields carry
`[SensitiveData(Confidential)]` and are erased through the consuming module's
`IPrivacyDataProvider`. The IP-derived geolocation of a session is a distinct
regime and is deliberately **not** persisted.

## Consequences

**Positive**

- One vocabulary for addresses across the framework and business modules; no more
  ad-hoc `(lat, lon)` + `IsVerified` shapes.
- Geocoding, verification, and freshness are **queryable columns** — admin grids,
  dashboards, and the Map widget read them directly, no per-render geocoding.
- The three axes can disagree truthfully, so downstream logic (ship / re-check /
  drop the marker) has the signal it needs.
- PII posture is set once, at the seam, and is safe by default.
- New capabilities (a new provider, autocomplete) light up endpoints without
  touching consumers.

**Negative / trade-offs**

- More moving parts than a single `(lat, lon)` field: seven packages and two
  derived value objects. Justified for a cross-cutting concern; overkill for an
  app that only ever needs a coordinate (which can still call `IGeocodingService`
  directly).
- `ComplexProperty` adds columns to every address-holding table, and a **nullable**
  complex column needs a shadow discriminator (per ADR-070).
- Tier 1 is a contract with **no baseline provider** — deliverability stays at
  tier 0 until a host integrates a vendor, accepting that vendor as a GDPR
  sub-processor.
- Host responsibility for the HTTP endpoints: they must apply a **per-principal**
  rate limit, or the shared upstream quota is a denial-of-wallet target.

## References

- [Address platform overview](/dotnet/building-blocks/address-platform/)
- [Address value objects](/dotnet/building-blocks/address-value-objects/) ·
  [Geocoding](/dotnet/building-blocks/geocoding/) ·
  [Geocoding endpoints](/dotnet/building-blocks/geocoding-endpoints/) ·
  [Address enrichment](/dotnet/building-blocks/address-enrichment/) ·
  [Address deliverability](/dotnet/building-blocks/address-deliverability/)
- [ADR-070 — Value-object persistence & querying](/dotnet/architecture/adr/070-value-object-persistence-and-querying/) ·
  [ADR-059 — Enum persistence strategy](/dotnet/architecture/adr/059-enum-persistence-strategy/)
