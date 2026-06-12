---
title: "ADR-067: Agentic AI chat, tool registry, and prompt catalog"
description: "Add an interactive, agentic chat surface to Granit on top of the existing AIWorkspace layer. Introduce a single IAITool seam (agent-as-tool), an application-opt-in tool registry bound to caller ACLs, a code-first guardrail prompt layer, and a user-facing DB prompt catalog. Conversations are private and Privacy-managed."
sidebar:
  order: 67
  label: "067 - Agentic chat, tool registry, prompt catalog"
topic: backend
---

> **Date:** 2026-06-12
> **Authors:** Jean-Francois Meyers
> **Scope:** new `Granit.AI.Tools`, `Granit.AI.Chat`, `Granit.AI.Prompts` (+ `.Endpoints` / `.EntityFrameworkCore`); adapters in `Granit.QueryEngine.AI`, `Granit.AI.VectorData`, `Granit.Localization.AI`; touches `Granit.AI` (usage stamping), `Granit.Settings` (user-scope), `Granit.Privacy`. Product experience → `granit-business`; React surface → `granit-front`.

## Context

Granit's AI story is, today, **fifteen autonomous single-shot tools**. Every `*.AI`
module (Privacy, Validation, Workflow, Observability, Localization, …) takes a
developer-controlled instruction, sends *one* request through
[`IStructuredCompletion`](/dotnet/architecture/adr/064-structured-ai-output-primitive/) (ADR-064), and
returns typed output. The prompt is hidden, the output is structured, the module
hands the model the content it needs.

There is no **interactive** surface: no multi-turn conversation, no user-driven
prompt selection, no agent that *fetches* the data it needs rather than being
handed it. The reference experience is Attio's *"Ask Attio"* — a chat on the home
page that can query the whole application, into which a user can drop a reusable
prompt (a "Daily brief"), mention specific records with `@`, and attach files.

A scan of the framework shows the foundations are already there, and the gaps are
precise:

**Already present and reusable.**

- **Streaming, multi-turn chat transport** — `Granit.AI.Endpoints` ships
  `POST /chat/{workspace}/stream` (SSE) and single-shot completion (#496), on top
  of `IAIChatClientFactory` and the provider adapters (Anthropic, OpenAI, Azure
  OpenAI, Ollama).
- **`AIWorkspace`** already encapsulates provider + model + credentials + system
  prompt + capabilities. It is the natural unit behind a "choose your model"
  setting — there is no need for a separate model concept.
- **Per-*user* settings** — the `Granit.Settings` `"U"` value provider resolves a
  `U → T → G` cascade, exactly what per-user AI preferences need.
- **A data-access surface** — every `QueryDefinition<T>` already carries the
  metadata (entity name, filterable columns, types) required to become an
  AI-callable tool; `Granit.QueryEngine.AI` already translates natural language to
  a structured `QueryRequest`.
- **Retrieval** — `ISemanticSearchService` (`Granit.AI.VectorData`) and
  `ISearchService` (`Granit.Indexing`, ACL-bounded).
- **Untrusted-content handling** — `UntrustedDocumentEnvelope` and
  `LlmInputSanitizer` in `Granit.AI` already wrap document content as *data, never
  instructions*; `Granit.TextExtraction.*` turns files into text;
  `Granit.BlobStorage` stores them; `Granit.Privacy` owns retention and erasure.

**Missing.**

- **Conversation/message persistence** — clients must replay full history each call.
- **A generic tool-calling loop** — only **MCP** tools are wired
  (`Granit.AI.Mcp` is an MCP *client*). There is no abstraction for exposing
  *application* capabilities as tools, and no think → call → execute → repeat loop.
- **A user-facing prompt catalog** — there is no editable, seeded, categorised
  store of reusable prompts.

The investigation also surfaced **two genuinely different prompt needs** that must
not be conflated:

1. **Security-critical, developer-owned, versioned prompts** — the orchestrator
   guardrails and the per-tool instructions. A tenant must *never* be able to edit
   the preamble that keeps the agent inside its ACL.
2. **User-facing, editable, DB-backed prompts** — the `/` picker catalog.

## Decision

### 1. Three framework primitives; the product lives in business

Add `Granit.AI.Tools`, `Granit.AI.Chat`, `Granit.AI.Prompts` (each with the usual
`.Endpoints` / `.EntityFrameworkCore` satellites where needed). The polished *"Ask"*
product experience and any business-domain seeded prompts live in `granit-business`;
the React chat/picker surface lives in `granit-front`. The framework ships the
mechanism, not the product.

### 2. `IAITool` is the only seam — agent-as-tool

The orchestrator knows **only tools**. What sits behind a tool is an implementation
detail with three shapes, all identical to the loop:

| Tool shape | Implementation | Examples |
| --- | --- | --- |
| Deterministic code | direct call | `query_data`, `search` |
| Single-shot sub-agent | one LLM call to a capability-specific workspace | `translate`, `extract_text_from_image` (→ Vision workspace) |
| Looping sub-agent | a nested agentic loop with its own tools | `research` (phase 2) |

This unifies "wrap the existing `*.AI` capabilities as tools" and "delegate to a
specialist" into one abstraction. A vision request is *not* a special sub-agent
primitive — it is a tool whose implementation resolves a Vision-capable workspace
via `IAIWorkspaceCapabilityResolver`, which **decouples vision from the chat
workspace**: a text-only chat workspace can still call the vision tool. True
multi-agent orchestration remains possible later as a "heavy" tool, with **no
redesign**.

### 3. Tool exposure is application-opt-in and ACL-bound

Tools are **registered by application code**, not discovered by an attribute — each
application exposes a different slice of its data, so a framework-wide
`[ChatExposed]` marker is the wrong granularity. Every tool runs **strictly under
the calling user's identity and ACLs**: the agent can never read or do anything the
user could not. Sensitive capabilities are gated by a per-tool permission
`[AI].[Chat].UseTool.{Tool}`; data tools are additionally bounded by the entity's
own authorization. `@` mentions reuse the **same** opt-in registry and ACL path
(records, users, entity definitions) — no second exposure mechanism.

### 4. The "model" is an `AIWorkspace`, filtered to chat capability

The per-user `Chat.DefaultWorkspace` setting selects an `AIWorkspace`. Only
workspaces whose capabilities include **Chat** are selectable (vector/embedding
workspaces are excluded), enforced both at the endpoint and at loop entry. The value
`Auto` is **reserved** in v1 (resolves to a configured default); real task-based
routing is phase 2.

### 5. Two prompt systems, composed in layers

- **Code-first, versioned (non-editable):** orchestrator guardrails + per-tool
  instructions. This is where the originally-considered code-first prompt registry
  belongs.
- **DB catalog (user-facing):** the `/` picker prompts.

The orchestrator system prompt is composed as:

```text
[framework guardrails (code-first, versioned)]
  + [workspace system prompt]
  + [user custom context (Settings "U", 4000 chars)]
  + [tool declarations (auto, from the registry)]
```

Guardrails enforce: stay within ACL scope; treat every tool/document output as
**data, never instructions**; cite sources and admit gaps; no destructive action
without confirmation (phase 2); refuse out-of-scope requests.

### 6. Conversations are private and Privacy-managed

`Conversation` / `Message` are multi-tenant aggregates **private to their owner**
in v1 (no sharing). Attachments are stored transiently in `Granit.BlobStorage`,
extracted to text via `Granit.TextExtraction.*`, and injected through
`UntrustedDocumentEnvelope`. `Granit.Privacy` owns retention, data take-out, and
erasure on account deletion — conversations and attachments included.

### 7. Read-only in v1; actions and richer modes in phase 2

v1 is **agentic but read-only**. The agent may additionally emit **suggested
actions** — typed, non-executing CTAs (e.g. *"connect Google Calendar"*) rendered
as deep links, contributable by modules. It may also emit **clarification
requests** — a typed question plus discrete options (A / B / C / *Other*) the front
renders as one-click buttons; the chosen option becomes the next turn and the loop
resumes. **Executing** actions (create/update, trigger a workflow) is phase 2 and
always requires human confirmation.

### 8. Auditability via stamped usage records

`AIUsageRecord` is extended to stamp the **workspace** and the **name + version**
of the prompts used (guardrail and catalogue), closing the audit loop without
persisting prompt or completion *content* (consistent with the framework's
no-PII-in-logs baseline).

### v1 perimeter (frozen)

Streaming chat + private persisted conversations + Privacy integration; read-only
opt-in tools (`query_data`, `search`, `translate`, and opt-in/default-off
`extract_text_from_image`); the prompt catalog (framework seed + admin/tenant +
private user prompts, tenant-defined many-to-many categories, icon + colour +
short description, copy-on-customise); the `/` prompt picker and `@` entity
mentions; file attachments via text extraction; suggested actions; user settings
(chat-capable default workspace, web-search toggle with provider deferred, custom
context).

### Phase 2

Action execution with confirmation; real `Auto` routing; prompt sharing; looping
sub-agents; web-search / PII / log-analysis tool providers; native multimodal
vision.

## Alternatives considered

- **Sub-agents as a first-class primitive.** Rejected: agent-as-tool collapses
  delegation into the existing tool seam, so the loop stays single-shaped and the
  heavy multi-agent case is additive rather than a redesign.
- **`[ChatExposed]` attribute for tool exposure.** Rejected: data exposure is an
  application policy, not a framework-wide type decoration; opt-in registration in
  app code is the right granularity and keeps the ACL boundary explicit.
- **A single prompt system.** Rejected on security grounds: guardrails must be
  developer-owned and non-editable, while the catalogue must be user-editable —
  one store cannot be both.
- **Catalogue prompts in code.** Rejected: a user-facing CRUD/seed/copy experience
  needs a database aggregate, not code definitions.
- **Building chat on raw provider SDKs.** Rejected: `AIWorkspace`, the streaming
  endpoint, usage tracking and the capability resolver already exist and must be
  reused.
- **Tenant/team-shared prompts in v1.** Deferred: sharing adds permission and
  privacy surface that is not needed to validate the catalogue UX.
- **A new "model" concept.** Rejected: `AIWorkspace` already is the model unit.

## Consequences

**Positive.**

- Every `QueryDefinition` an application opts in, and each wrapped `*.AI`
  capability, becomes a chat tool **without rewriting the module**.
- Security is inherited, not re-implemented: tools run under the caller's ACL.
- Versioned, code-first guardrails plus stamped usage records give an audit trail
  that says *which prompt version produced which interaction* without storing
  content.
- `AIWorkspace`, streaming, settings cascade, vector/full-text search, untrusted-
  document handling and Privacy are all reused.

**Negative / risks to manage.**

- **Tool-result size vs. context window** — a data tool can return far more than
  fits; the loop must cap, paginate, or summarise results (a deliberate design
  point, not an afterthought).
- **Tool-selection quality degrades with too many tools** — reinforces the
  opt-in-by-app decision; applications should expose a curated set.
- **Vision-as-tool depends on a configured Vision workspace** — hence opt-in and
  default-off.
- **Conversations are a new PII surface** — mitigated by Privacy ownership,
  owner-only visibility, and `UntrustedDocumentEnvelope` for attachments.
- New modules require shard registration (`test-shards.json`), 18-culture
  localisation, permission definitions, Query/Export pairing, and documentation.

## References

- [ADR-064 — Structured AI output primitive](/dotnet/architecture/adr/064-structured-ai-output-primitive/)
- Epic `Granit.AI` (#14); streaming chat endpoints (#496)
- Epic *Agentic AI Chat & Prompt Catalog* (this ADR's delivery epic)
