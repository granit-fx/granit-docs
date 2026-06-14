---
title: "ADR-069: Bank accounts as the single source of truth"
description: "Centralize every bank account number in Granit.BankAccounts (Odoo res.partner.bank), expose only masked snapshots across module boundaries, and have legally-binding artefacts stamp their own encrypted snapshot instead of depending on the mutable referential."
sidebar:
  order: 69
  label: "069 - Bank accounts single source of truth"
topic: backend
---

> **Date:** 2026-06-14
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.BankAccounts.*`, `Granit.Payments.SepaDirectDebit.*`, `Granit.Payments.SepaTransfer.*` (granit-business, EPIC #24)

## Context

Bank account numbers were scattered across the payment modules and stored
inconsistently:

- SEPA Direct Debit kept the **creditor** IBAN/BIC in `SepaDirectDebitBuiltinOptions`
  (host config), and the **debtor** IBAN only on the `Mandate`.
- SEPA Transfer kept the **beneficiary** IBAN/BIC in `SepaTransferOptions` (host
  config).
- Nothing answered "which accounts does this customer hold?", account numbers were
  IBAN-only (breaking outside SEPA), and masking was applied in some places but not
  others — a clear IBAN could reach a grid, an export, or a log depending on the path.

Two requirements pull in opposite directions. **Deduplication and a single answer**
want one shared store. **Legal durability** wants a mandate's signed IBAN to be immune
to a later edit of "the same" account — a bank rejects a collection if the coordinates
on file no longer match what the debtor signed.

## Decision

Introduce `Granit.BankAccounts` — a centralized bank-account referential modelled on
Odoo `res.partner.bank` — as the single source of truth for account **numbers**, and
make every consumer depend on it through abstractions only:

1. **One store, owned by a Party.** A `BankAccount` aggregate (IBAN + domestic schemes:
   US ACH, Canada EFT, AU/NZ BSB, India IFSC, Other) hangs off a `PartyId`. The account
   identifier is `[Encrypted]` at rest; routing code and BIC are public identifiers in
   clear.

2. **Masked across boundaries.** Cross-module reads go through `IBankAccountResolver`,
   returning a `BankAccountSnapshot` whose identifier is **always masked**. The clear
   IBAN never crosses a module boundary, and is deliberately excluded from the query
   grid, search, and export ([ADR-020](/dotnet/architecture/adr/020-declarative-definitions-placement/)).

3. **Resolve-or-create, deduplicated.** `IBankAccountProvisioner.ResolveOrCreateAsync`
   deduplicates by `(PartyId, normalized identifier)`, so repeated setups never spawn
   duplicates. Payment modules reference this contract, never the persistence.

4. **Binding artefacts stamp their own snapshot.** A `Mandate` carries `DebtorPartyId`
   plus an **immutable, encrypted signed IBAN/BIC snapshot** and a *non-binding*
   `DebtorBankAccountId` (no foreign key). The per-tenant `SepaDirectDebitConfiguration`
   and `SepaTransferConfiguration` likewise stamp an encrypted creditor / beneficiary
   snapshot from a `BankAccount`. pain.008 generation and transfer instructions read the
   stamped snapshot — **never** the referential at use time. The creditor/beneficiary
   coordinates were removed from `SepaDirectDebitBuiltinOptions` / `SepaTransferOptions`.

## Evaluated Alternatives

- **Foreign key from mandate/config to `BankAccount`.** Rejected: archiving or editing
  the source account would shift or invalidate a historically-signed mandate's
  coordinates, corrupting a legally-binding artefact (and breaking referential
  integrity on soft-archive).
- **Keep account numbers per module (status quo).** Rejected: duplication, inconsistent
  masking, no cross-module view, no dedup.
- **Centralize and *always read live* from the referential.** Rejected: the masked
  projection cannot serve a real pain.008/transfer instruction, and a live read makes
  the signed value mutable — the exact failure mode SEPA forbids.

## Justification

The split — *single source of truth for the number, stamped snapshot for the binding
artefact* — satisfies both forces. Centralization gives dedup, a per-party view, and a
uniform masking/encryption boundary; the immutable snapshot gives legal durability.
The soft, FK-less `DebtorBankAccountId` keeps traceability back to the referential
without coupling the artefact's correctness to the referential's mutability.
Scheme-awareness removes the IBAN-only assumption for non-SEPA deployments.

## Consequences

- Adopters install `Granit.BankAccounts` (+ EF Core + Endpoints); the SEPA modules now
  depend on `IBankAccountProvisioner`. Two new packages ship for SEPA Transfer
  (`.EntityFrameworkCore`, `.Endpoints`).
- **Breaking for adopters** who set creditor/beneficiary coordinates in `appsettings`:
  those options were removed and must move to the per-tenant configuration endpoints
  (`PUT /sepa-direct-debit/configuration`, `PUT /sepa-transfer/configuration`).
- Mandate setup now requires a `DebtorPartyId`; existing signed mandates keep their
  stamped IBAN unchanged.
- The clear IBAN is constrained to legitimate in-process flows only; grids, exports, and
  API responses are masked-or-absent by construction.

## Status

Accepted. Shipped in granit-business EPIC #24. See
[Bank Accounts](/dotnet/business/bank-accounts/) and
[SEPA configuration](/dotnet/saas/payments/sepa-configuration/).
