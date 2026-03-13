import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightLinksValidator from "starlight-links-validator";
import starlightImageZoom from "starlight-image-zoom";

export default defineConfig({
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
        // starlightLinksValidator(),  // Re-enable when content is populated
        starlightImageZoom(),
      ],
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        // fr: { label: 'Français', lang: 'fr' },  // Enable when French translation starts
      },
      sidebar: [
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
          label: "Reference",
          items: [
            { label: "Overview", link: "/reference/" },
            {
              label: ".NET Modules",
              autogenerate: { directory: "reference/modules" },
              collapsed: true,
            },
            {
              label: "Frontend SDK",
              autogenerate: { directory: "reference/frontend" },
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
      customCss: ["./src/styles/tailwind.css"],
      head: [
        {
          tag: "script",
          attrs: { type: "module", src: "/mermaid-init.js" },
        },
      ],
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    }),
  ],
});
