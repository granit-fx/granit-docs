---
title: Frontend npm Registry
description: Hybrid publication strategy for @granit/* packages — local source-direct and GitLab npm registry.
sidebar:
  order: 21
---

## Overview

The `@granit/*` packages are published on the **GitLab npm package registry**.
A hybrid strategy keeps local development performant (hot-reload) while
supporting Docker builds and standalone CI/CD.

```mermaid
graph LR
    subgraph "Local development"
        DEV["guava-admin / guava-front"]
        DEV -->|"link:"| SRC["granit-front source<br/>(TypeScript)"]
    end

    subgraph "Docker / CI"
        CI[Dockerfile]
        CI -->|"npm install"| REG["GitLab npm Registry<br/>(compiled packages)"]
    end

    subgraph "Publication"
        TAG["Tag vX.Y.Z"] -->|CI pipeline| BUILD["tsup build<br/>(ESM + .d.ts)"]
        BUILD -->|"pnpm publish"| REG
    end
```

## Hybrid strategy

| Context | Resolution | Source | Hot-reload |
| --- | --- | --- | --- |
| Local development | `link:` + Vite aliases | TypeScript source | Yes |
| Docker / CI | GitLab npm registry | Compiled JavaScript + `.d.ts` | No |

### Local development

Applications use `link:` in `package.json` to point to TypeScript sources:

```json
{
  "dependencies": {
    "@granit/logger": "link:../../../granit-front/packages/@granit/logger"
  }
}
```

Combined with Vite aliases, this provides instant hot-reload when modifying
framework code.

### Docker / CI

In Docker, the `granit-front` directory does not exist. The Dockerfile:

1. Copies `.npmrc` (scope `@granit` → GitLab registry)
2. Replaces `link:` dependencies with `*` (registry resolution)
3. Injects the authentication token via `--build-arg NPM_TOKEN`
4. Installs compiled packages from the registry

## Publication

### Versioning

All packages share the same version, aligned with Git tags on the
granit-front project. Semantic versioning (`vMAJOR.MINOR.PATCH`).

### Automatic publication (CI)

Publication is triggered by a **Git tag** matching `vX.Y.Z`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The CI pipeline runs:

1. `quality` — lint + typecheck
2. `test` — unit tests
3. `build` — `tsup` (ESM + `.d.ts`) for each package
4. `publish` — `pnpm -r publish` to the GitLab registry

Authentication uses `CI_JOB_TOKEN` (automatic, no secret to configure).

### Manual publication

For manual publication (not recommended in production):

```bash
# Create a deploy token in GitLab > Settings > Repository > Deploy tokens
# Scope: write_package_registry

pnpm build
pnpm -r publish --no-git-checks --access restricted
```

## Consumer configuration

### `.npmrc`

Each consuming application needs an `.npmrc`:

```ini
@granit:registry=https://gitlab.digitaldynamics.be/api/v4/projects/9/packages/npm/
```

### Conditional Vite aliases

The `@granit/*` aliases in `vite.config.ts` are **conditional** — they only
apply when the local `granit-front` directory exists:

```typescript
import fs from 'fs';

const GRANIT = path.resolve(__dirname, '../../../granit-front/packages/@granit');
const useLocalGranit = fs.existsSync(GRANIT);

// Local dev: aliases → TypeScript source (hot-reload)
// Docker/CI: no aliases → resolved via node_modules (registry)
```

### Docker build

```bash
docker build \
  --build-arg NPM_TOKEN=<deploy-token-or-ci-job-token> \
  -t guava-admin .
```

In CI, `CI_JOB_TOKEN` is used automatically.

## Package build configuration

### tsup

Each package is compiled with **tsup**:

- **Format**: ESM only
- **Output**: `dist/index.js` + `dist/index.d.ts`
- **Externals**: `@granit/*` (inter-packages), `peerDependencies`

### publishConfig

The `package.json` of each package uses `publishConfig` to separate local
exports (source) from published exports (compiled):

```json
{
  "exports": {
    ".": "./src/index.ts"
  },
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.js"
      }
    },
    "registry": "https://gitlab.digitaldynamics.be/api/v4/projects/9/packages/npm/"
  }
}
```

- **Locally**: `exports` points to TypeScript source
- **Published**: `publishConfig.exports` overrides and points to `dist/`

## Troubleshooting

### Package not found on the registry

```bash
npm view @granit/logger \
  --registry=https://gitlab.digitaldynamics.be/api/v4/projects/9/packages/npm/
```

Or check in GitLab: **granit-front > Packages and registries > Package registry**.

### Authentication error (401/403)

- Verify `.npmrc` contains the correct `_authToken`
- In CI: `CI_JOB_TOKEN` is automatic, no configuration needed
- Locally: use a deploy token with `read_package_registry` scope

### Docker build fails on @granit/* packages

1. Verify `--build-arg NPM_TOKEN=xxx` is passed to `docker build`
2. Verify packages are published on the registry
3. Verify `.npmrc` is copied in the `deps` stage (not excluded by `.dockerignore`)

## See also

- [Frontend CI/CD](/operations/frontend-ci-cd/) — pipeline and release workflow
- [Frontend Quick Start](/guides/frontend-quick-start/) — local setup
