---
title: "How-To Guides for .NET Developers"
description: How-to guides for .NET developers — endpoints, modules, EF Core persistence, Redis caching, Wolverine jobs, multi-tenancy, webhooks, and testing.
sidebar:
  order: 0
  label: Guides
---

Task-oriented guides that show you how to accomplish specific goals with Granit.

Each guide assumes you have a working Granit application. If you are starting
from scratch, begin with [Getting Started](/dotnet/getting-started/).

## Modules and endpoints

- [Create a Module](/dotnet/guides/create-a-module/) -- build a new Granit module from scratch
- [Add an Endpoint](/dotnet/guides/add-an-endpoint/) -- Minimal API with validation and Problem Details
- [Configure Multi-Tenancy](/dotnet/guides/configure-multi-tenancy/) -- shared DB, per-schema, or per-database

## Messaging and events

- [Set Up Notifications](/dotnet/guides/set-up-notifications/) -- 6-channel notification engine
- [Implement Data Import](/dotnet/guides/implement-data-import/) -- CSV/Excel import pipeline
- [Add Background Jobs](/dotnet/guides/add-background-jobs/) -- recurring and delayed jobs
- [Configure Blob Storage](/dotnet/guides/configure-blob-storage/) -- S3-compatible file storage
- [Implement Webhooks](/dotnet/guides/implement-webhooks/) -- event delivery with retry

## Features and settings

- [Add Feature Flags](/dotnet/guides/add-feature-flags/) -- toggle, numeric, and selection features
- [Set Up Localization](/dotnet/guides/set-up-localization/) -- 18 cultures, source-generated keys
- [Use Reference Data](/dotnet/guides/use-reference-data/) -- i18n reference tables
- [Manage Application Settings](/dotnet/guides/manage-application-settings/) -- runtime settings store

## Documents and workflow

- [Create Document Templates](/dotnet/guides/create-document-templates/) -- Scriban, PDF, Excel
- [Implement Workflow](/dotnet/guides/implement-workflow/) -- FSM engine, publication lifecycle

## Caching, versioning, and API

- [Configure Caching](/dotnet/guides/configure-caching/) -- memory, Redis, FusionCache
- [Add API Versioning](/dotnet/guides/add-api-versioning/) -- URL segment and header versioning
- [Configure Idempotency](/dotnet/guides/configure-idempotency/) -- Idempotency-Key middleware

## Security and observability

- [Secure your Application](/dotnet/guides/secure-your-application/) -- end-to-end hardening guide (HTTPS, CSP, auth, BFF, encryption, audit)
- [Encrypt Sensitive Data](/dotnet/guides/encrypt-sensitive-data/) -- Vault Transit and AES-256
- [Implement Audit Timeline](/dotnet/guides/implement-audit-timeline/) -- entity change tracking
- [End-to-End Tracing](/dotnet/guides/end-to-end-tracing/) -- OpenTelemetry distributed tracing
- [Testing](/dotnet/guides/testing/) -- unit and integration test patterns with GranitTestFixture

## AI and tooling

- [Use with AI Assistants](/tools/ai-assistants/) -- ingest Granit docs into ChatGPT, Claude, Copilot
