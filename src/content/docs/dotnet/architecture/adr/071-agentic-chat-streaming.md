---
title: "ADR-071: Agentic chat streaming via FunctionInvokingChatClient"
description: "Stream the agentic chat answer token-by-token over SSE by adopting Microsoft.Extensions.AI's FunctionInvokingChatClient, flushing the conversation frame immediately, and extending the SSE protocol with live tool-status frames."
sidebar:
  order: 71
  label: "071 - Agentic chat streaming"
topic: backend
---

> **Date:** 2026-06-18
> **Authors:** Jean-Francois Meyers
> **Scope:** `Granit.AI.Tools` (orchestrator), `Granit.AI.Chat` (chat service), `Granit.AI.Chat.Endpoints` (SSE endpoint). New dependency `Microsoft.Extensions.AI` (MIT). React surface → `granit-front` (handoff).

## Context

The agentic chat endpoint (`POST {basePath}/conversations/messages`, ADR-067) streamed its
answer over Server-Sent Events, but the pipeline was **buffered end to end**: the endpoint
`await`-ed the whole agentic loop before returning the `ServerSentEvents` result, so the SSE
response headers only committed once the entire loop had finished. Time-to-first-byte therefore
equalled the full agent duration, and the front (axios, 10s) timed out on any non-trivial turn.
The `StreamAsync` iterator merely replayed the already-computed answer word-by-word — cosmetic
streaming.

Two things were wrong:

1. **No early flush.** Nothing was written to the response until the loop settled.
2. **No real streaming.** The orchestrator (`AIToolOrchestrator`) hand-rolled the
   think → call → execute → repeat loop on `IChatClient.GetResponseAsync` (buffered), not
   `GetStreamingResponseAsync`.

## Decision

### 1. Adopt `FunctionInvokingChatClient` (Microsoft.Extensions.AI)

Replace the hand-rolled loop with M.E.AI's built-in agentic loop — the idiomatic, long-term .NET
primitive. The orchestrator wraps the workspace `IChatClient` in a per-run
`FunctionInvokingChatClient` and drives it with `GetStreamingResponseAsync`. Granit-specific
concerns ride the client's extension points rather than a custom loop:

- **Per-tool authorization** — only authorized tools are declared in `ChatOptions.Tools`.
- **Truncation, metrics, audit, and the clarification interrupt** — the `FunctionInvoker` hook
  resolves the `IAITool`, guards the result size, records metrics/outcomes, and turns a tool's
  `AIToolResult.Interrupt` into a graceful loop stop via `FunctionInvocationContext.Terminate`.
- **Iteration accounting** — a thin counting `DelegatingChatClient` reports the number of model
  round-trips and whether the last one still wanted tools (so `Iterations` /
  `MaxIterationsReached` stay exact without mining synthesized streamed updates).

`IAIToolOrchestrator.RunStreamingAsync` becomes the primitive (yields `Delta` / `ToolCall` /
`ToolResult` / `Completed`); the buffered `RunAsync` is a thin drain over it.

### 2. Two-phase chat service (validate-then-stream)

`IChatService.SendAsync` is replaced by `PrepareAsync` + `StreamAsync`. `PrepareAsync` runs all
fast validation (workspace chat-capability, conversation ownership, mention/attachment/prompt
resolution) and returns a handle whose `ConversationId` is known up front — so the endpoint can
map failures to a clean `404`/`422` **before** the SSE stream opens. `StreamAsync` then streams the
loop and persists.

### 3. Immediate `conversation` frame + extended SSE protocol

The endpoint flushes the `conversation` frame **first** (its `ConversationId` is known from the
handle), committing the response headers in milliseconds. The wire contract is **extended** with two
live tool-status frames (front-rendered as chips, à la Claude.ai/ChatGPT):

| Frame | Payload | Meaning |
| ----- | ------- | ------- |
| `conversation` | `conversationId` | flushed first |
| `delta` | `content` | assistant text token |
| `tool_call` | `toolName`, `toolCallId` | a tool started |
| `tool_result` | `toolName`, `toolCallId`, `succeeded` | a tool finished |
| `usage` | `inputTokens`, `outputTokens` | terminal |
| `suggestions` / `clarification` | … | terminal |

Tool frames carry **only** the tool name and call id — never arguments or raw results (privacy);
the front maps the name to a localized label. Tool frames are **de-duplicated by call id** (streamed
`FunctionCallContent` arrives fragmented). No `thinking` frame is emitted: the front derives the
"Thinking…" indicator from a `tool_result` not yet followed by a `delta`, keeping the wire minimal.

### 4. Persist the user turn before the stream

`StreamAsync` persists the user message (and creates the conversation) **before** the loop runs,
and appends the assistant turn at the end. Usage is stamped with a 5-second guard token so it
records even if the client disconnects mid-stream, without leaking an orphaned write.

## Consequences

- **Time-to-first-byte drops to milliseconds**; the answer streams token-by-token. The front keeps
  `timeout: 0` (gaps between tokens remain legitimate).
- **Wire contract change** — `granit-front` (`@granit/ai-chat`, `@granit/ai`) must render the new
  `tool_call`/`tool_result` frames and derive the thinking state. Handled as a separate front PR.
- **New dependency** `Microsoft.Extensions.AI` 10.7.0 (MIT) — the middleware package, separate from
  the abstractions already referenced.
- **Behaviour shifts** vs. the hand-rolled loop, by design: an unknown tool call is handled by the
  function-invoking client itself (error result fed back, loop continues) rather than the Granit
  invoker; the iteration cap (`MaxIterations` → `MaximumIterationsPerRequest`) allows one final
  round-trip that still wants tools, which is the signal used to report `MaxIterationsReached`.
- **Residual data-loss window (documented, accepted):** the user turn is persisted before the
  stream, but the assistant turn is persisted only after it settles. A server crash between
  stream-end and persistence loses the assistant turn (regenerable); the user turn and conversation
  survive. Incremental assistant persistence is a possible future refinement.

## Alternatives considered

- **Keep the hand-rolled loop, add streaming.** Lower risk, but perpetuates a bespoke agentic loop
  that duplicates `FunctionInvokingChatClient`. Rejected in favour of the standard primitive.
- **Text-only streaming (no tool frames).** Would not change the wire contract, but loses the
  live tool-status UX. Rejected — the product wants the Claude.ai-style experience.
- **Migrate to a pipeline-wide `UseFunctionInvocation`.** A shared pipeline can't hold per-run
  capture state (interrupt, outcomes); the orchestrator wraps the client locally instead, leaving
  the non-agentic `/ai/workspaces` chat path untouched.

## References

- [ADR-067: Agentic chat, tool registry, prompt catalog](/dotnet/architecture/adr/067-agentic-chat-tool-registry-prompt-catalog/)
- [`FunctionInvokingChatClient`](https://learn.microsoft.com/dotnet/api/microsoft.extensions.ai.functioninvokingchatclient)
