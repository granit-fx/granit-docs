# CLAUDE.md - Granit Docs

## Project

- **Type**: Documentation site for the Granit framework (Astro + Starlight)
- **Repo**: `granit-fx/granit-docs` (open-source, Apache-2.0)
- **Stack**: Astro 7 · Starlight · Tailwind 4 · Mermaid · pnpm · Node 22
- **Deployment**: Cloudflare Workers static assets (Workers Builds, auto-deploy
  from `main`, see `wrangler.jsonc`), <https://granit-fx.dev>
- **Sibling repos**: framework code in `granit-fx/granit-dotnet`,
  `granit-fx/granit-front`, `granit-fx/granit-microservice-template`.

## Layout

```text
src/
  assets/                 # logos, OG images
  components/             # Starlight component overrides (Head, Header, Footer, …)
  config/                 # sidebar + redirects data imported by astro.config.mjs
  content/
    docs/                 # pages (MDX/MD), grouped by topic
      dotnet/             # .NET framework reference
      frontend/           # React companion
      blog/               # blog posts (starlight-blog)
      contributing/       # contribution guide
  content.config.ts       # Starlight content collections
  data/constants.ts       # PACKAGE_COUNT and other cross-page constants
  pages/                  # custom pages (landing page)
  plugins/                # remark/rehype plugins
  styles/                 # global Tailwind + theme overrides
scripts/                  # build utilities (search index, third-party notices)
public/                   # static assets served verbatim
astro.config.mjs          # Astro + Starlight + integrations
wrangler.jsonc            # Cloudflare Workers static-assets config
```

## Commands

```bash
pnpm install           # frozen-lockfile install
pnpm dev               # local dev server (http://localhost:4321)
pnpm build             # production build — must complete with 0 errors
                       # (postbuild regenerates dist/search-index.json)
pnpm lint              # markdownlint
pnpm spell             # cspell on prose (code blocks ignored)
pnpm preview           # serve the built output
```

CI (`.github/workflows/ci.yml`) runs `pnpm lint`, `pnpm spell`, a
`THIRD-PARTY-NOTICES.md` freshness check, and `pnpm build` on every PR.
A weekly job (`.github/workflows/links.yml`) checks external links with lychee.

New legitimate terms cspell doesn't know go in `project-words.txt` (sorted).

## Conventions

### Content

- **Language: English.** Active voice, declarative, short sentences. Audience is
  intermediate-to-senior .NET / React engineers.
- Every page has frontmatter with `title` and `description`. The description feeds
  the SEO meta tag and the search snippet — write it like ad copy, not a recap.
- Code samples must compile against the latest released Granit version. No
  boilerplate unless it carries meaning.
- Diagrams: **Mermaid** (`astro-mermaid` is wired in) — never ASCII art for
  non-trivial flowcharts. Sequence/component diagrams ship as fenced `mermaid` code blocks.
- Cross-link aggressively: a new module page links from related modules and
  the relevant section index.

### File placement

- `.NET` reference → `src/content/docs/dotnet/<area>/`
- React reference → `src/content/docs/frontend/<area>/`
- ADRs → `src/content/docs/dotnet/architecture/adr/NNN-<kebab-title>.md`
- New module page → bump `PACKAGE_COUNT` in `src/data/constants.ts` and add
  a sidebar entry in `src/config/sidebar.mjs` (unless the section uses
  `autogenerate`). URL moves get a redirect in `src/config/redirects.mjs`.

### Linking

- Use **root-relative** internal links: `[ADR-017](/dotnet/architecture/adr/017-…/)`.
  Never relative `../../`. Trailing slash mandatory (Starlight convention).
- External links open in a new tab automatically via `rehype-external-links`.
- `starlight-links-validator` runs in the build — broken internal links fail CI.

### Localization

English-only. Granit's framework strings are localized in 18 cultures, but the
documentation deliberately stays English (lower maintenance, canonical reference).
Do not introduce a second locale without discussion.

### Cross-repo coordination

Doc changes triggered by framework changes ship as a **separate PR** here, not
bundled with the framework PR. Workflow:

1. Land the framework PR on `granit-dotnet` (release-gated).
2. Open the matching doc PR here referencing the framework PR/release.
3. If the doc references an unreleased feature, gate the page with
   `<Aside>Available from Granit X.Y.</Aside>`.

## Code style (Astro / TypeScript)

- ES modules everywhere; no CommonJS.
- 2-space indent, single quotes for JS/TS, double quotes for JSX/MDX attributes
  (Astro default).
- Astro/JSX components: PascalCase. Markdown filenames: kebab-case.
- Plugins (remark/rehype) live in `src/plugins/` and follow the unified ecosystem
  convention (`Plugin<[Options?]>`).

## Anti-patterns

- Editing the same content in two languages — site is English-only.
- Hardcoding paths under `/docs-site/…` — that prefix is legacy from when the site
  lived inside `granit-dotnet`. All links are now site-root relative.
- Copy-pasting framework code into samples without verifying it compiles.
- ASCII diagrams for sequences/flows — use Mermaid.
- Inline HTML for layout — prefer Starlight components (`Aside`, `Tabs`, `Card`,
  `CardGrid`, `Steps`).

## Git workflow

GitFlow: `develop` (default branch) + `main` (auto-deployed to production via
Cloudflare Workers Builds) + `feature/*` + `fix/*` + `release/*` + `hotfix/*`.

**PR target — STRICT**: `feature/*` and `fix/*` → `develop`. `release/*` and
`hotfix/*` → both `main` and `develop`. Direct push to `main` forbidden.

Conventional Commits required for PR titles. CI must be green; preview build
must look correct before merge.

## Definition of Done

Never push a PR without:

- `pnpm build` completes with 0 errors
- `pnpm lint` and `pnpm spell` pass
- Frontmatter present on new pages
- Internal links resolve (validator runs in build)
- Screenshots/diagrams have `alt` text
- No leaked secrets/tokens/PII in code samples — use placeholders

## MCP

The MCP server `granit-tools` ships the **published** content of this site at
`granit-fx.dev/llms-full.txt`. After merging a doc PR, new content becomes
queryable via `docs_search` / `docs_get` once the Cloudflare deploy completes.
The search index it consumes (`dist/search-index.json`) is generated by the
`postbuild` script — it ships with every build automatically.
