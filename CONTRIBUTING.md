# Contributing to Granit Docs

Thanks for helping improve the Granit documentation.

This repository hosts the source of <https://granit-fx.dev>. Framework code lives
elsewhere — see [`granit-fx/granit-dotnet`](https://github.com/granit-fx/granit-dotnet)
and sibling repositories.

## Quick start

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # must complete with 0 errors
pnpm lint     # markdownlint must pass
```

Node.js 22+ and pnpm (via `corepack enable`) are required.

## Branching & PRs

GitFlow-style branches:

- `main` — production (auto-deployed to <https://granit-fx.dev>)
- `feature/<topic>` for new content or features
- `fix/<topic>` for corrections

Open pull requests against `main`. Each PR gets a Cloudflare Pages preview build.
PR titles follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
docs(security): document DPoP token rotation
fix(getting-started): typo in module install snippet
feat(blog): add 2026-05 release notes
chore(deps): bump astro to 6.3.0
```

## Writing guidelines

- **Language:** English. Use clear, declarative prose; prefer active voice and short
  sentences.
- **Audience:** intermediate-to-senior .NET / React engineers. Skip beginner tutorials
  unless the page is explicitly tagged as a getting-started guide.
- **Frontmatter:** every page needs a `title` and a `description` (the description
  feeds the SEO meta tag and search snippet).
- **Code samples:** must compile against the latest released Granit version. Prefer
  realistic, minimal snippets — no boilerplate unless it carries meaning.
- **Diagrams:** use [Mermaid](https://mermaid.js.org) (`astro-mermaid` is wired in).
  Avoid ASCII art for non-trivial diagrams.
- **Cross-links:** when documenting a new module, cross-link from related pages and
  the relevant section index.

## File placement

```text
src/content/docs/
  dotnet/                 # .NET framework reference
    architecture/         # ADRs, patterns
    core/                 # module system, validation, diagnostics
    security/             # authn, authz, encryption
    data/                 # persistence, caching, multi-tenancy
    api/                  # endpoints, OpenAPI, versioning
    infrastructure/       # messaging, jobs, notifications, webhooks
    business/             # workflow, data exchange, templating
    ai/                   # LLM abstractions, MCP, vector data
    compliance/           # GDPR, ISO 27001, audit trail
    guides/               # step-by-step tutorials
  front/                  # React companion (granit-front)
  contributing/           # contribution & convention docs
```

When adding a new module page, bump `PACKAGE_COUNT` in `src/data/constants.ts`.

## Cross-repo coordination

Documentation changes triggered by framework changes are still shipped here, but in a
**separate PR** from the code change. This keeps doc churn out of framework PRs and
allows docs to be hotfixed independently of releases.

If you're proposing a doc change that depends on an unreleased framework feature,
mention the target Granit version in the PR description and add a
`<Aside>Available from Granit X.Y.</Aside>` callout on the page.

## Definition of Done

Before requesting review:

- [ ] `pnpm build` completes with 0 errors
- [ ] `pnpm lint` passes (markdownlint)
- [ ] Pages added under `src/content/docs/` have valid frontmatter (`title`, `description`)
- [ ] Internal links resolve (`starlight-links-validator` runs as part of build)
- [ ] Screenshots/diagrams have `alt` text
- [ ] No leaked secrets, tokens, or PII in samples (use placeholders like
      `sk_test_…`, `tenant-123`, `user@example.com`)

CI runs the same checks on every PR — the build must be green before merge.

## Reporting issues

- Bugs, broken links, content errors → open an issue on this repository
- Framework bugs or feature requests → open them against
  [`granit-fx/granit-dotnet`](https://github.com/granit-fx/granit-dotnet/issues) instead

## License

By contributing, you agree your contributions will be licensed under the
[Apache License 2.0](LICENSE).
