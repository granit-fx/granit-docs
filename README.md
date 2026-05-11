<p align="center">
  <img src="src/assets/granit-icon.svg" alt="granit" width="200" />
</p>

<p align="center">
  <strong>Documentation site for the Granit framework.</strong>
</p>

<p align="center">
  Astro · Starlight · Tailwind · Mermaid · published to <a href="https://granit-fx.dev">granit-fx.dev</a>
</p>

<p align="center">
  <a href="https://github.com/granit-fx/granit-docs/actions/workflows/ci.yml"><img src="https://github.com/granit-fx/granit-docs/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/granit-fx/granit-docs/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="License"></a>
</p>

---

This repository hosts the source of <https://granit-fx.dev>, the official documentation
site for the [Granit](https://github.com/granit-fx/granit-dotnet) modular .NET framework
and its companion projects (granit-front, granit-microservice-template, etc.). It is
built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build),
deployed to Cloudflare Pages.

The framework code lives in separate repositories:

- [`granit-fx/granit-dotnet`](https://github.com/granit-fx/granit-dotnet) — .NET framework (~128 packages)
- [`granit-fx/granit-front`](https://github.com/granit-fx/granit-front) — React/TypeScript companion
- [`granit-fx/granit-microservice-template`](https://github.com/granit-fx/granit-microservice-template) — Microservice template

## Local development

Prerequisites: [Node.js 22+](https://nodejs.org) and [pnpm](https://pnpm.io) (via `corepack enable`).

```bash
pnpm install
pnpm dev        # local dev server (http://localhost:4321)
pnpm build      # production build — must complete with 0 errors
pnpm lint       # markdownlint
pnpm preview    # serve the built output
```

## Project layout

```text
src/
  assets/                       # logos, OG images, shared media
  content/
    docs/                       # MDX/MD pages, grouped by topic
      dotnet/                   # .NET framework reference
      front/                    # React companion reference
      contributing/             # contribution guide
    config.ts                   # Starlight content collections
  data/constants.ts             # cross-page constants (e.g. PACKAGE_COUNT)
  plugins/                      # remark/rehype plugins
  styles/                       # global Tailwind + theme overrides
scripts/                        # local utilities (search index, etc.)
public/                         # static assets served as-is
astro.config.mjs                # Astro + Starlight integration config
```

## Adding a new page

1. Drop a `.md` or `.mdx` file under `src/content/docs/<topic>/`.
2. Add frontmatter (`title`, `description`).
3. If documenting a new Granit module, also bump `PACKAGE_COUNT` in
   `src/data/constants.ts` and cross-link from related pages.
4. Run `pnpm lint && pnpm build` — both must be clean.

## Deployment

`main` is deployed automatically to <https://granit-fx.dev> via the Cloudflare Pages
GitHub integration. Pull requests get preview deployments on `*.granit-docs.pages.dev`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Doc changes ship in dedicated PRs against this
repository — code changes that need accompanying docs should open two separate PRs
(one against `granit-dotnet`, one here).

## License

Documentation content and source code: [Apache License 2.0](LICENSE).

Third-party dependencies and their licenses are listed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
