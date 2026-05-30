---
title: "ADR-064: Structured AI output as a first-class Granit.AI primitive"
description: "Promote typed LLM output to a canonical IStructuredCompletion primitive in Granit.AI, with provider-enforced JSON schema and a graceful fallback. Re-base Granit.AI.Extraction on it and migrate the 13 .AI modules that today bypass it with hand-rolled JSON plumbing."
sidebar:
  order: 64
  label: "064 - Structured AI output primitive"
topic: backend
---

> **Date:** 2026-05-30
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.AI` (new `IStructuredCompletion`), `Granit.AI.Extraction` (repositioned), the 13 `.AI` consumer modules, downstream `Granit.Cms.Seo.AI` (granit-website)

## Context

The framework's *typed AI output* story is fragmented, and the repository itself
ratifies the problem.

`Granit.AI.Extraction` ships the only typed-output abstraction —
`IDocumentExtractor<TResult>` / `DefaultDocumentExtractor` — and it does the
right thing: it pins the output with
`ChatResponseFormat.ForJsonSchema<TResult>()`, so the **provider** enforces the
shape rather than the model being coaxed into emitting JSON by the prompt.

Yet **13 of the 14 `.AI` modules bypass it.** `Localization.AI`,
`Validation.AI`, `Authorization.AI`, `Workflow.AI`, `Privacy.AI`,
`BlobStorage.AI`, `QueryEngine.AI`, `Imaging.AI`, `DataExchange.AI`,
`Notifications.AI`, `Observability.AI`, `Timeline.AI`, `LanguageDetection.AI`
and `Templating.AI` all reach for `IAIChatClientFactory` directly:

```text
PromptBuilder → IAIChatClientFactory.CreateAsync() → IChatClient.GetResponseAsync()
              → LlmResponseHelper.StripMarkdownCodeFences() → JsonSerializer.Deserialize<T>()
```

This has two costs:

1. **A robustness and security gap, not just duplication.** None of the 13
   bypassing modules use `ForJsonSchema<T>()`. They ask for JSON *in the prompt*
   and then strip Markdown fences off a raw string before deserializing — the
   fragile path. Provider-enforced schema is the robust one. The fragile path is
   currently the framework's de-facto default for typed output.
2. **~100 lines of identical plumbing per module.** Timeout via a linked
   `CancellationTokenSource`, PII-safe exception handling (a `JsonException` or a
   transport error must never echo the prompt payload — issue
   [#2305](https://github.com/granit-fx/granit-dotnet/issues/2305)), the same
   `JsonSerializerOptions` (`PropertyNameCaseInsensitive` + camelCase), the same
   fence-stripping, the same confidence clamp — all re-derived in every module.

`Granit.AI` already exposes *crumbs* of the shared pattern —
`LlmResponseHelper.StripMarkdownCodeFences`, `LlmInputSanitizer` — which is the
framework half-admitting the pattern is shared, while never owning the
orchestration that would make the safe path the easy path.

The trigger was a downstream need. `Granit.Cms.Seo.AI` (granit-website) needs
**typed generation** — SEO metadata produced from an editor's page body with a
developer-controlled, per-locale instruction. `IDocumentExtractor` could not
take a custom instruction (it baked a fixed *"Extract structured data from the
following document"* prompt internally), so the consumer was about to become the
fourteenth bypass. That surfaced the real question: the framework has no
canonical typed-AI-output primitive, `Extraction` is a misplaced and
under-adopted special case, and most modules duplicate fragile plumbing.

## Decision

Introduce **`IStructuredCompletion`** as a first-class primitive in
**`Granit.AI`** — the single, canonical way to turn a prompt into a typed `T`.
Everything that produces structured output (Extraction included) layers on top of
it; nothing talks to `IChatClient.GetResponseAsync()` + manual deserialization
for typed output anymore.

```csharp
namespace Granit.AI;

public interface IStructuredCompletion
{
    Task<StructuredCompletionResult<T>> CompleteAsync<T>(
        StructuredCompletionRequest request,
        CancellationToken cancellationToken = default)
        where T : class;
}

public sealed record StructuredCompletionRequest
{
    /// Developer-controlled task instruction. NEVER sanitized — code/templates only.
    public string? Instruction { get; init; }
    /// Untrusted text, sanitized and <data>-wrapped by the primitive.
    public required string Content { get; init; }
    public string? ContentLabel { get; init; }
    /// Additional named untrusted sections (title, locale…), each sanitized/delimited.
    public IReadOnlyList<KeyValuePair<string, string?>>? Context { get; init; }
    public string? WorkspaceName { get; init; }
}

public sealed record StructuredCompletionResult<T> where T : class
{
    public required StructuredCompletionStatus Status { get; init; }
    public T? Value { get; init; }
    public string? ModelId { get; init; }
    public string? ErrorMessage { get; init; } // always PII-safe
    // Provenance needed by layered scorers (e.g. Extraction's confidence estimate),
    // which today reads response.FinishReason and response.AdditionalProperties["confidence"].
    public ChatFinishReason? FinishReason { get; init; }
    public IReadOnlyDictionary<string, object?>? Metadata { get; init; }
    // Token usage so typed calls are tracked like IAIChatCompletionService (see decision 6).
    public UsageDetails? Usage { get; init; }
}

public enum StructuredCompletionStatus
{
    Succeeded,        // typed value present
    ModelRefused,     // model declined / returned empty / safety refusal
    SchemaViolation,  // output did not match the schema / failed to deserialize
    TransportFailure, // timeout, provider, or network error
}
```

The six decisions this ADR settles:

| # | Decision | Resolution |
| - | -------- | ---------- |
| 1 | **Name + home** | `IStructuredCompletion` in `Granit.AI` — pairs with the existing `IAIChatCompletionService`. |
| 2 | **Generic per call vs per interface** | **Per call**: `CompleteAsync<T>(request)`. One injected service serves every `T`. A per-interface `IStructuredCompletion<T>` would force ~13 DI registrations and re-create today's per-module shape. |
| 3 | **Confidence** | **Not computed by the primitive.** It returns `T` + `ModelId` + a raw `Status`, and **surfaces the provenance** (`FinishReason`, `Metadata`) so a layer can score. Confidence and a review threshold are a document-extraction concern; translation, moderation, and anomaly detection each have their own domain scoring. The provenance fields exist *because* Extraction's `EstimateConfidence` reads `response.FinishReason` and `response.AdditionalProperties["confidence"]` — dropping them would block the re-base (decision 5). |
| 4 | **Schema fallback** | **The core of the value.** The primitive uses `ForJsonSchema<T>()` when the workspace's provider/model advertises the **`structured-output` capability** (a new `WellKnownAICapabilities.StructuredOutput` key each provider opts into), and otherwise injects the JSON schema into the prompt, strips fences, and deserializes — so **no consumer ever strips a fence by hand again**, and the safe path is the default. |
| 5 | **`Granit.AI.Extraction`** | Becomes a **thin "document + confidence" surface** over the primitive. `DefaultDocumentExtractor` delegates to `IStructuredCompletion`, maps `StructuredCompletionStatus` → `ExtractionStatus`, and re-derives the confidence estimate from the result's `FinishReason`/`Metadata`. `ExtractionResult<T>` (data, confidence, warnings, `ModelId`) is preserved — the public `IDocumentExtractor` contract is unchanged for downstream consumers (incl. granit-business). |
| 6 | **Cross-cutting: usage tracking, quota, rate-limiting, sampling** | The primitive builds on `IAIChatClientFactory` (it needs `ChatOptions.ResponseFormat`) **and owns the cross-cutting plumbing the factory path lacks today**: it records usage via `IAIUsageTracker` / `IAIUsageRecordFactory` (typed calls are currently **untracked** — that block lives only in `IAIChatCompletionService`), applies the quota guard, and consumes rate-limiting (`AICallRateLimiter`) + content sampling (`AIContentSampler`), **both moved up from `Granit.AI.Extraction` into `Granit.AI`** so every consumer shares one implementation. It emits an `AIActivitySource` span and `AIMetrics` counters (`granit.ai.structured_completion.*`) per the diagnostics convention. |

The **status taxonomy** is deliberately four-valued (added at the request of the
first downstream consumer): a caller must be able to distinguish a *model
refusal / empty answer* (→ no suggestion created) from a *schema violation* (→
log + fail) from a *transport failure* (→ retry/backoff). A single
success/failure boolean is not enough to drive a consumer's own status mapping
(e.g. granit-website's `SuggestionStatus`).

**Governance.** Once the primitive lands and the modules migrate, an
architecture test forbids the bypass pattern — a `.AI` module calling
`IChatClient.GetResponseAsync` followed by a manual `JsonSerializer.Deserialize`
for typed output — so the fragmentation cannot silently return.

This ADR is sequenced **ADR-first**: the surface above is ratified before any
implementation. The work is then cut into an Epic (primitive → reposition
Extraction → migrate the 13 → governance test → docs).

## Alternatives considered

### A. `IStructuredCompletion<T>` (generic per interface)

Rejected. It mirrors today's `IDocumentExtractor<TResult>` and would require a
DI registration per result type — ~13 across the framework, plus one per
downstream type. The per-call generic `CompleteAsync<T>` lets a module inject a
single service and call `.CompleteAsync<SeoExtraction>(request)`. This was the
initial downstream instinct and was reconsidered.

### B. Widen `Granit.AI.Extraction` to cover generation (the original #2451 shape)

Rejected. It entrenches the *"extraction"* misnomer for what is generation,
keeps the canonical capability inside a sub-module the 13 consumers don't
reference, and does nothing about the root fragmentation. Pre-1.0 we can afford
the clean break of moving the primitive up into `Granit.AI` instead. PR
[#2451](https://github.com/granit-fx/granit-dotnet/pull/2451) — which added a
custom `Instruction`, `PromptBuilder` isolation, and `ModelId` to Extraction — is
**paused** and folds into the Extraction-repositioning step rather than shipping
as a widening of the wrong module.

### C. Publicize only the helpers

Rejected. Exposing `LlmResponseHelper`, a shared timeout/error helper, and
letting each module keep its own orchestration leaves the fragile
raw-text-plus-fence-strip path as the default and never delivers
provider-enforced schema. The orchestration duplication (timeout, error mapping,
status taxonomy) also persists.

### D. Put confidence on the primitive

Rejected. Confidence and a review threshold are meaningful for document
extraction; for translation, moderation, and access-anomaly detection they are
either domain-specific or absent. Keeping the primitive minimal
(`T` + `ModelId` + `Status`) avoids a field that 13 of 14 consumers would ignore
or misuse, and keeps the extraction-specific workflow where it belongs.

## Consequences

### Positive

+ **One canonical, safe path.** Provider-enforced schema wherever the model
  supports it; a single, audited fence-strip fallback everywhere else. The
  robustness/security gap that today affects 13 modules is closed by adoption.
+ **~100 LoC × 13 of plumbing removed** over the migration: timeout, PII-safe
  error handling, deserialization options, fence stripping, status mapping.
+ **Uniform error semantics.** One PII-safe error contract and one status
  taxonomy across every AI feature, instead of per-module ad-hoc handling.
+ **Downstream unblocked cleanly.** `Granit.Cms.Seo.AI` consumes
  `CompleteAsync<SeoExtraction>` with a per-locale instruction and gets `ModelId`
  for audit and a four-valued status to map onto its own `SuggestionStatus`.
+ **Typed calls become tracked and governed.** Routing every typed call through
  the primitive brings usage tracking, the quota guard, rate-limiting, and
  sampling to paths that bypass them today (the factory path used by Extraction
  and all 13 consumers records no usage), plus uniform spans/metrics.

### Negative

+ **Breaking changes (pre-1.0).** Extraction is re-based on the primitive; the 13
  consumers are migrated module by module. Each migration is behavior-preserving
  but touches public-ish internals and DI.
+ **A multi-PR Epic, not a single change.** The new public surface in `Granit.AI`
  plus the sequenced consumer migration is deliberately spread across many PRs.
+ **Rate-limiting and sampling move packages.** `AICallRateLimiter` /
  `AIContentSampler` relocate from `Granit.AI.Extraction` up into `Granit.AI`
  (pre-1.0 namespace break); the `Granit.AI.Extraction.StackExchangeRedis`
  distributed limiter follows. Migration note ships on the AI reference page.
+ **No downstream dev-NuGet of the typed-generation API until this surface is
  built and ratified** — pinning granit-website to an interim shape (e.g. the
  paused #2451) would risk an API condemned by this ADR.

### Neutral

+ `ExtractionResult<T>` keeps its shape (data, confidence, warnings, `ModelId`);
  the extraction review-threshold workflow is unchanged from the caller's view.
+ `Indexing.AI` already uses `ForJsonSchema<T>()` directly (without the Extraction
  abstraction); it migrates to the primitive like the others, with no behavior
  change.

## References

+ PR [#2451](https://github.com/granit-fx/granit-dotnet/pull/2451) — Extraction
  `ExtractionRequest` + `ModelId` (paused; folds into the Extraction-repositioning step)
+ Issue [#2305](https://github.com/granit-fx/granit-dotnet/issues/2305) — PII-safe
  AI error handling (the contract the primitive centralizes)
+ `Granit.AI` — `IAIChatClientFactory`, `PromptBuilder`, `IAIChatCompletionService`,
  `LlmResponseHelper`, `LlmInputSanitizer` (the crumbs this primitive consolidates)
+ Epic [#2452](https://github.com/granit-fx/granit-dotnet/issues/2452) — Canonical
  structured AI output: primitive (#2453) → reposition Extraction (#2454) →
  migrate the 13 `.AI` modules (#2455) → governance test (#2456) → unblock
  downstream (#2457)
+ `Granit.AI` cross-cutting — `IAIChatCompletionService` (the usage-tracking
  block the primitive replicates), `IAIUsageTracker` / `IAIUsageRecordFactory`,
  `WellKnownAICapabilities` (new `structured-output` key), `AIActivitySource` /
  `AIMetrics`, and `Granit.AI.Extraction`'s `AICallRateLimiter` / `AIContentSampler`
  (relocating up)
