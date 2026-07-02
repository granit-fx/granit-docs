---
title: "Frontend Pattern Library — React & TypeScript @granit/*"
description: Battle-tested React and TypeScript patterns for @granit/* — solve auth, data fetching, module wiring, and reactivity with Factory, Adapter, Provider, Hooks, and more.
sidebar:
  order: 0
  badge:
    text: "8"
    variant: note
---

A catalogue of design patterns used in the Granit frontend SDK, organized by category.

Each pattern documents the general concept, how it is implemented in the `@granit/*`
packages, and concrete code examples from the SDK.

## Creation patterns

| Pattern | Description |
| ------- | ----------- |
| [Factory](/frontend/architecture/patterns/factory/) | Hide instance creation complexity behind simple functions |
| [Module Singleton](/frontend/architecture/patterns/module-singleton/) | Cross-package state sharing via ES module cache |

## Structural patterns

| Pattern | Description |
| ------- | ----------- |
| [Adapter](/frontend/architecture/patterns/adapter/) | Convert 3rd-party APIs into React-compatible interfaces |

## Behavioral patterns

| Pattern | Description |
| ------- | ----------- |
| [Interceptor](/frontend/architecture/patterns/interceptor/) | Transparent HTTP request/response pipeline processing |
| [Strategy](/frontend/architecture/patterns/strategy/) | Pluggable implementations behind a common interface |
| [Observer](/frontend/architecture/patterns/observer/) | Event notification without direct coupling |

## React patterns

| Pattern | Description |
| ------- | ----------- |
| [Provider](/frontend/architecture/patterns/provider/) | Context-based dependency injection with typed hooks |
| [Hook Composition](/frontend/architecture/patterns/hook-composition/) | Layer framework + application logic via hook wrapping |
