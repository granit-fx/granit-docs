import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightLinksValidator from "starlight-links-validator";
import starlightImageZoom from "starlight-image-zoom";
import starlightLlmsTxt from "starlight-llms-txt";
import starlightKbd from "starlight-kbd";
import starlightScrollToTop from "starlight-scroll-to-top";
import starlightSidebarTopics from "starlight-sidebar-topics";
import astroMermaid from "astro-mermaid";
import rehypeExternalLinks from "rehype-external-links";
import { remarkVariables } from "./src/plugins/remark-variables.mjs";

export default defineConfig({
  site: "https://granit-fx.dev",
  markdown: {
    remarkPlugins: [remarkVariables],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        { target: "_blank", rel: ["noopener", "noreferrer"] },
      ],
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: "Granit",
      description:
        "Rock-solid, production-ready modular framework for .NET and React",
      logo: {
        src: "./src/assets/granit-icon.svg",
        replacesTitle: false,
      },
      social: [
        {
          icon: "gitlab",
          label: "GitLab",
          href: "https://gitlab.com/digital-dynamics/granit-dotnet",
        },
      ],
      editLink: {
        baseUrl:
          "https://gitlab.com/digital-dynamics/granit-dotnet/-/edit/develop/docs-site/",
      },
      plugins: [
        starlightSidebarTopics([
          {
            label: "Docs",
            link: "/getting-started/",
            icon: "document",
            items: [
              {
                label: "Getting Started",
                autogenerate: { directory: "getting-started" },
              },
              {
                label: "Concepts",
                autogenerate: { directory: "concepts" },
                collapsed: true,
              },
              {
                label: "Guides",
                autogenerate: { directory: "guides" },
                collapsed: true,
              },
              {
                label: "Operations",
                autogenerate: { directory: "operations" },
                collapsed: true,
              },
              {
                label: "Contributing",
                autogenerate: { directory: "contributing" },
                collapsed: true,
              },
              {
                label: "Migration",
                autogenerate: { directory: "migration" },
                collapsed: true,
              },
              {
                label: "Troubleshooting",
                autogenerate: { directory: "troubleshooting" },
                collapsed: true,
              },
            ],
          },
          {
            label: "Backend (.NET)",
            link: "/reference/",
            icon: "laptop",
            id: "backend",
            items: [
              {
                label: "Reference",
                items: [
                  { label: "Overview", link: "/reference/" },
                  {
                    label: "Modules",
                    autogenerate: { directory: "reference/modules" },
                    collapsed: true,
                  },
                  {
                    label: "Cross-cutting",
                    items: [
                      {
                        label: "Configuration Keys",
                        link: "/reference/configuration-keys/",
                      },
                      {
                        label: "HTTP Conventions",
                        link: "/reference/http-conventions/",
                      },
                      {
                        label: "Dependency Graph",
                        link: "/reference/dependency-graph/",
                      },
                      {
                        label: "Provider Compatibility",
                        link: "/reference/provider-compatibility/",
                      },
                    ],
                    collapsed: true,
                  },
                ],
              },
              {
                label: "Architecture",
                items: [
                  { label: "Overview", link: "/architecture/" },
                  {
                    label: "Patterns",
                    autogenerate: { directory: "architecture/patterns" },
                    collapsed: true,
                  },
                  {
                    label: "ADRs",
                    autogenerate: { directory: "architecture/adr" },
                    collapsed: true,
                  },
                ],
              },
            ],
          },
          {
            label: "Frontend (TS/React)",
            link: "/reference/frontend/",
            icon: "puzzle",
            id: "frontend",
            items: [
              {
                label: "Reference",
                items: [
                  { label: "Overview", link: "/reference/frontend/" },
                  {
                    label: "Packages",
                    autogenerate: { directory: "reference/frontend" },
                    collapsed: true,
                  },
                ],
              },
              {
                label: "Architecture",
                items: [
                  {
                    label: "Overview",
                    link: "/architecture/frontend-overview/",
                  },
                  {
                    label: "Patterns",
                    autogenerate: {
                      directory: "architecture/patterns-frontend",
                    },
                    collapsed: true,
                  },
                  {
                    label: "ADRs",
                    autogenerate: {
                      directory: "architecture/adr-frontend",
                    },
                    collapsed: true,
                  },
                ],
              },
            ],
          },
        ]),
        starlightLinksValidator({
          errorOnRelativeLinks: false,
          exclude: ["/api/**"],
        }),
        starlightImageZoom(),
        starlightLlmsTxt(),
        starlightKbd({
          types: [
            {
              id: "mac",
              label: "macOS",
              detector: "apple",
            },
            {
              id: "win",
              label: "Windows",
              default: true,
              detector: "windows",
            },
            {
              id: "linux",
              label: "Linux",
              detector: "linux",
            },
          ],
        }),
        starlightScrollToTop({ showOnHomepage: true }),
      ],
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        // fr: { label: 'Français', lang: 'fr' },  // Enable when French translation starts
      },
      components: {
        Header: "./src/components/Header.astro",
        Footer: "./src/components/Footer.astro",
      },
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:type",
            content: "website",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:site_name",
            content: "Granit",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://granit-fx.dev/og-image.svg",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:card",
            content: "summary_large_image",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: "https://granit-fx.dev/og-image.svg",
          },
        },
      ],
      customCss: ["./src/styles/tailwind.css"],
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    }),
    astroMermaid({ autoTheme: true }),
  ],
});
