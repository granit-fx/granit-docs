import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightLinksValidator from "starlight-links-validator";
import starlightImageZoom from "starlight-image-zoom";
import starlightLlmsTxt from "starlight-llms-txt";
import starlightKbd from "starlight-kbd";
import starlightScrollToTop from "starlight-scroll-to-top";
import starlightSidebarTopics from "starlight-sidebar-topics";
import starlightBlog from "starlight-blog";
import astroMermaid from "astro-mermaid";
import rehypeExternalLinks from "rehype-external-links";
import { remarkVariables } from "./src/plugins/remark-variables.mjs";

export default defineConfig({
  site: "https://granit-fx.dev",
  build: {
    assets: "assets",
  },
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
    optimizeDeps: {
      exclude: ["starlight-blog"],
    },
  },
  redirects: {
    // The Vault documentation was split into a dedicated `vault/` folder.
    // Preserve external and in-repo links that still point at the old URL.
    "/dotnet/data/vault-encryption/": "/dotnet/data/vault/",
    "/dotnet/data/vault-encryption/#key-rotation": "/dotnet/data/vault/encryption/",

    // Pages renamed within /dotnet/.
    "/dotnet/infrastructure/settings/": "/dotnet/infrastructure/application-settings/",
    "/dotnet/infrastructure/wolverine/": "/dotnet/infrastructure/wolverine-messaging/",
    "/dotnet/infrastructure/features/": "/dotnet/infrastructure/feature-flags/",
    "/dotnet/api/webhooks/wolverine/": "/dotnet/api/webhooks/",
    "/dotnet/api/webhooks-endpoints/": "/dotnet/api/webhooks/endpoints/",
    "/dotnet/http/security/url-safety/": "/dotnet/api/url-safety/",
    "/dotnet/http/url-safety/": "/dotnet/api/url-safety/",
    "/dotnet/browsing/": "/dotnet/infrastructure/browsing/",
    "/dotnet/browsing/conventions/": "/dotnet/infrastructure/browsing/conventions/",
    "/dotnet/browsing/security/": "/dotnet/infrastructure/browsing/security/",
    "/dotnet/browsing/providers/playwright/": "/dotnet/infrastructure/browsing/providers/playwright/",
    "/dotnet/browsing/providers/puppeteer-sharp/": "/dotnet/infrastructure/browsing/providers/puppeteer-sharp/",
    "/dotnet/io/temp-files/": "/dotnet/infrastructure/io/temp-files/",
    "/dotnet/configuration-keys/": "/dotnet/reference/configuration-keys/",
    "/dotnet/cloud-providers/": "/dotnet/reference/cloud-providers/",
    "/dotnet/provider-compatibility/": "/dotnet/reference/provider-compatibility/",
    "/dotnet/concepts/multi-tenancy/persistence/": "/dotnet/concepts/multi-tenancy/",
    "/dotnet/security/security/": "/dotnet/security/security-overview/",
    "/dotnet/data/mergeable/persistence/": "/dotnet/data/mergeable/",
    "/dotnet/data/reference-data/": "/dotnet/business/reference-data/",
    "/dotnet/security/privacy/": "/dotnet/compliance/privacy/",
    "/dotnet/compliance/": "/dotnet/concepts/compliance/",

    // Old top-level sections folded under /dotnet/.
    "/guides/encrypt-sensitive-data/": "/dotnet/guides/encrypt-sensitive-data/",
    "/guides/set-up-notifications/": "/dotnet/guides/set-up-notifications/",
    "/getting-started/adding-authentication/": "/dotnet/getting-started/adding-authentication/",
    "/infrastructure/notifications/": "/dotnet/infrastructure/notifications/",
    "/architecture/patterns/null-object/": "/dotnet/architecture/patterns/null-object/",
    "/architecture/patterns/observer-event/": "/dotnet/architecture/patterns/observer-event/",
    "/architecture/patterns/multi-tenancy/": "/dotnet/architecture/patterns/multi-tenancy/",
    "/architecture/patterns/transactional-outbox/": "/dotnet/architecture/patterns/transactional-outbox/",
    "/architecture/patterns/template-method/": "/dotnet/architecture/patterns/template-method/",
    "/architecture/patterns/strategy/": "/dotnet/architecture/patterns/strategy/",
    "/architecture/patterns/feature-flags/": "/dotnet/architecture/patterns/feature-flags/",
    "/architecture/patterns/rate-limiting/": "/dotnet/architecture/patterns/rate-limiting/",
    "/architecture/patterns/bulkhead-isolation/": "/dotnet/architecture/patterns/bulkhead-isolation/",
    "/architecture/adr/006-fluentvalidation/": "/dotnet/architecture/adr/006-fluentvalidation/",
    "/architecture/adr-frontend/005-keycloak/": "/frontend/architecture/adr/005-keycloak/",

    // Business → Building Blocks split: modules that stayed in granit-dotnet
    // (open-source, framework-shipped) moved out of "Business Features".
    "/dotnet/business/workflow/": "/dotnet/building-blocks/workflow/",
    "/dotnet/business/data-exchange/": "/dotnet/building-blocks/data-exchange/",
    "/dotnet/business/data-lookup/": "/dotnet/building-blocks/data-lookup/",
    "/dotnet/business/document-generation/": "/dotnet/building-blocks/document-generation/",
    "/dotnet/business/query-engine/": "/dotnet/building-blocks/query-engine/",
    "/dotnet/business/timeline/": "/dotnet/building-blocks/timeline/",
    "/dotnet/business/templating/": "/dotnet/building-blocks/templating/",

    // Legacy /reference/modules/* — superseded by /dotnet/* layout.
    "/reference/modules/utilities/": "/dotnet/core/time-provider-clock/",
    "/reference/modules/workflow/": "/dotnet/building-blocks/workflow/",
    "/reference/modules/localization/": "/dotnet/infrastructure/localization/",
    "/reference/modules/observability/": "/dotnet/core/observability/",

    // Legacy /reference/frontend/* — superseded by /frontend/* layout.
    "/reference/frontend/settings/": "/frontend/infrastructure/settings/",
    "/reference/frontend/reference-data/": "/frontend/business/reference-data/",
    "/reference/frontend/templating/": "/frontend/business/templating/",
  },
  integrations: [
    starlight({
      title: "Granit",
      description:
        "Rock-solid, production-ready modular framework for .NET 10 — auth, persistence, messaging, GDPR & ISO 27001 compliance out of the box.",
      logo: {
        src: "./src/assets/granit-icon.svg",
        replacesTitle: false,
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/granit-fx/granit-dotnet",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/tZbD5neS",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/granit-fx/granit-dotnet/edit/develop/docs-site/",
      },
      plugins: [
        starlightBlog({
          title: "Blog",
          prefix: "blog",
          postCount: 10,
          recentPostCount: 5,
          prevNextLinksOrder: "reverse-chronological",
          authors: {
            jfmeyers: {
              name: "JF Meyers",
              title: "Framework Author",
              picture: "https://github.com/jfmeyers.png",
              url: "https://github.com/jfmeyers",
            },
          },
          metrics: {
            readingTime: true,
            words: "rounded",
          },
        }),
        starlightSidebarTopics(
          [
            {
              label: "Backend (.NET)",
              link: "/dotnet/",
              icon: "laptop",
              id: "backend",
              items: [
                {
                  label: "Getting Started",
                  items: [{ autogenerate: { directory: "dotnet/getting-started" } }],
                },
                {
                  label: "Concepts",
                  items: [{ autogenerate: { directory: "dotnet/concepts" } }],
                  collapsed: true,
                },
                {
                  label: "Guides",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/dotnet/guides/" },
                    {
                      label: "Modules & Endpoints",
                      collapsed: true,
                      items: [
                        { label: "Create a Module", link: "/dotnet/guides/create-a-module/" },
                        { label: "Add an Endpoint", link: "/dotnet/guides/add-an-endpoint/" },
                        { label: "Configure Multi-Tenancy", link: "/dotnet/guides/configure-multi-tenancy/" },
                      ],
                    },
                    {
                      label: "Messaging & Events",
                      collapsed: true,
                      items: [
                        { label: "Set Up Notifications", link: "/dotnet/guides/set-up-notifications/" },
                        { label: "Implement Data Import", link: "/dotnet/guides/implement-data-import/" },
                        { label: "Add Background Jobs", link: "/dotnet/guides/add-background-jobs/" },
                        { label: "Configure Blob Storage", link: "/dotnet/guides/configure-blob-storage/" },
                        { label: "Implement Webhooks", link: "/dotnet/guides/implement-webhooks/" },
                        { label: "Auto-maintain Party Roles", link: "/dotnet/guides/parties-role-handler/" },
                        { label: "Seed Party on Tenant Created", link: "/dotnet/guides/parties-tenant-seeding/" },
                        { label: "External Mapping Contract", link: "/dotnet/guides/parties-external-mappings/" },
                      ],
                    },
                    {
                      label: "Features & Settings",
                      collapsed: true,
                      items: [
                        { label: "Add Feature Flags", link: "/dotnet/guides/add-feature-flags/" },
                        { label: "Set Up Localization", link: "/dotnet/guides/set-up-localization/" },
                        { label: "Use Reference Data", link: "/dotnet/guides/use-reference-data/" },
                        { label: "Manage Application Settings", link: "/dotnet/guides/manage-application-settings/" },
                      ],
                    },
                    {
                      label: "Documents & Workflow",
                      collapsed: true,
                      items: [
                        { label: "Create Document Templates", link: "/dotnet/guides/create-document-templates/" },
                        { label: "Implement Workflow", link: "/dotnet/guides/implement-workflow/" },
                        { label: "Implement Audit Timeline", link: "/dotnet/guides/implement-audit-timeline/" },
                      ],
                    },
                    {
                      label: "API & Caching",
                      collapsed: true,
                      items: [
                        { label: "Configure Caching", link: "/dotnet/guides/configure-caching/" },
                        { label: "Add API Versioning", link: "/dotnet/guides/add-api-versioning/" },
                        { label: "Configure Idempotency", link: "/dotnet/guides/configure-idempotency/" },
                      ],
                    },
                    {
                      label: "Security & Observability",
                      collapsed: true,
                      items: [
                        { label: "Encrypt Sensitive Data", link: "/dotnet/guides/encrypt-sensitive-data/" },
                        { label: "End-to-End Tracing", link: "/dotnet/guides/end-to-end-tracing/" },
                      ],
                    },
                    {
                      label: "Testing",
                      collapsed: true,
                      items: [
                        { label: "Testing Infrastructure", link: "/dotnet/guides/testing/" },
                      ],
                    },
                  ],
                },
                {
                  label: "Operations",
                  items: [{ autogenerate: { directory: "dotnet/operations" } }],
                  collapsed: true,
                },
                {
                  label: "Core",
                  items: [{ autogenerate: { directory: "dotnet/core" } }],
                },
                {
                  label: "Data",
                  items: [{ autogenerate: { directory: "dotnet/data" } }],
                  collapsed: true,
                },
                {
                  label: "Security",
                  items: [{ autogenerate: { directory: "dotnet/security" } }],
                  collapsed: true,
                },
                {
                  label: "Compliance",
                  collapsed: true,
                  items: [
                    { label: "Audit Log", link: "/dotnet/compliance/audit-log/" },
                    { label: "Crypto-Shredding", link: "/dotnet/compliance/crypto-shredding/" },
                    {
                      label: "Cookies",
                      collapsed: true,
                      items: [{ autogenerate: { directory: "dotnet/compliance/cookies" } }],
                    },
                    {
                      label: "Privacy",
                      collapsed: true,
                      items: [{ autogenerate: { directory: "dotnet/compliance/privacy" } }],
                    },
                  ],
                },
                {
                  label: "API & Http",
                  items: [
                    { label: "Overview", link: "/dotnet/api/" },
                    { label: "CORS", link: "/dotnet/api/cors-cross-origin/" },
                    { label: "Blob Storage Endpoints", link: "/dotnet/api/blob-storage-endpoints/" },
                    { label: "API Versioning", link: "/dotnet/api/api-versioning/" },
                    { label: "API Documentation", link: "/dotnet/api/api-documentation/" },
                    { label: "Exception Handling", link: "/dotnet/api/exception-handling/" },
                    { label: "Idempotency", link: "/dotnet/api/idempotency/" },
                    { label: "Rate Limiting", link: "/dotnet/api/rate-limiting/" },
                    { label: "Bulkhead", link: "/dotnet/api/bulkhead/" },
                    { label: "HTTP Resilience", link: "/dotnet/api/http-resilience/" },
                    { label: "Response Compression", link: "/dotnet/api/response-compression/" },
                    { label: "Output Caching", link: "/dotnet/api/output-caching/" },
                    { label: "OData feed (BI)", link: "/dotnet/api/odata-exposure/" },
                    { label: "URL Safety", link: "/dotnet/api/url-safety/" },
                    {
                      label: "Webhooks",
                      collapsed: true,
                      items: [{ autogenerate: { directory: "dotnet/api/webhooks" } }],
                    },
                    { label: "Endpoint Registry", link: "/dotnet/api/endpoint-registry/" },
                  ],
                },
                {
                  label: "Infrastructure",
                  items: [{ autogenerate: { directory: "dotnet/infrastructure" } }],
                  collapsed: true,
                },
                {
                  label: "SaaS & Commerce",
                  items: [{ autogenerate: { directory: "dotnet/saas" } }],
                  collapsed: true,
                },
                {
                  label: "Building Blocks",
                  collapsed: true,
                  items: [
                    { label: "Data Exchange", link: "/dotnet/building-blocks/data-exchange/" },
                    { label: "Document Generation", link: "/dotnet/building-blocks/document-generation/" },
                    { label: "Workflow", link: "/dotnet/building-blocks/workflow/" },
                    { label: "QueryEngine", link: "/dotnet/building-blocks/query-engine/" },
                    { label: "Data Lookup", link: "/dotnet/building-blocks/data-lookup/" },
                    { label: "Timeline", link: "/dotnet/building-blocks/timeline/" },
                    {
                      label: "Templating",
                      collapsed: true,
                      items: [{ autogenerate: { directory: "dotnet/building-blocks/templating" } }],
                    },
                  ],
                },
                {
                  label: "Business Features",
                  items: [{ autogenerate: { directory: "dotnet/business" } }],
                  collapsed: true,
                },
                {
                  label: "IoT",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/dotnet/iot/" },
                    { label: "Getting Started", link: "/dotnet/iot/getting-started/" },
                    { label: "Device Management", link: "/dotnet/iot/device-management/" },
                    { label: "Data Model", link: "/dotnet/iot/data-model/" },
                    { label: "Telemetry Ingestion", link: "/dotnet/iot/telemetry-ingestion/" },
                    { label: "MQTT Transport", link: "/dotnet/iot/mqtt/" },
                    { label: "Time-Series Storage", link: "/dotnet/iot/time-series/" },
                    { label: "Operations", link: "/dotnet/iot/operations/" },
                    {
                      label: "Cross-Cutting Bridges",
                      collapsed: true,
                      items: [
                        { label: "Notifications", link: "/dotnet/iot/notifications-bridge/" },
                        { label: "Timeline", link: "/dotnet/iot/timeline-bridge/" },
                        { label: "MCP (AI Tools)", link: "/dotnet/iot/mcp-bridge/" },
                      ],
                    },
                    {
                      label: "AWS IoT Core",
                      collapsed: true,
                      items: [{ autogenerate: { directory: "dotnet/iot/aws" } }],
                    },
                    { label: "Bundle Reference", link: "/dotnet/iot/bundle/" },
                  ],
                },
                {
                  label: "Reference",
                  items: [
                    {
                      label: "Configuration Keys",
                      link: "/dotnet/reference/configuration-keys/",
                    },
                    {
                      label: "Cloud Providers",
                      link: "/dotnet/reference/cloud-providers/",
                    },
                    {
                      label: "Provider Compatibility",
                      link: "/dotnet/reference/provider-compatibility/",
                    },
                  ],
                  collapsed: true,
                },
                {
                  label: "AI",
                  items: [
                    { label: "Overview", link: "/dotnet/ai/" },
                    { label: "Setup & Configuration", link: "/dotnet/ai/setup/" },
                    { label: "API Endpoints", link: "/dotnet/ai/endpoints/" },
                    {
                      label: "User Experience",
                      collapsed: true,
                      items: [
                        { label: "Natural Language Query", link: "/dotnet/ai/natural-language-query/" },
                        { label: "Semantic Search & RAG", link: "/dotnet/ai/semantic-search/" },
                      ],
                    },
                    {
                      label: "Data Ingestion",
                      collapsed: true,
                      items: [
                        { label: "Import Mapping", link: "/dotnet/ai/import-mapping/" },
                        { label: "Document Extraction", link: "/dotnet/ai/document-extraction/" },
                      ],
                    },
                    {
                      label: "Business Intelligence",
                      collapsed: true,
                      items: [
                        { label: "Workflow Decision Support", link: "/dotnet/ai/workflow-ai/" },
                        { label: "Notification Intelligence", link: "/dotnet/ai/notifications-ai/" },
                        { label: "Timeline Intelligence", link: "/dotnet/ai/timeline-ai/" },
                      ],
                    },
                    {
                      label: "Security & Compliance",
                      collapsed: true,
                      items: [
                        { label: "PII Detection", link: "/dotnet/ai/privacy-ai/" },
                        { label: "Content Moderation", link: "/dotnet/ai/validation-ai/" },
                        { label: "Blob Storage Intelligence", link: "/dotnet/ai/blob-storage-ai/" },
                        { label: "Access Anomaly Detection", link: "/dotnet/ai/authorization-ai/" },
                      ],
                    },
                    {
                      label: "Operations",
                      collapsed: true,
                      items: [
                        { label: "Log Analysis", link: "/dotnet/ai/observability-ai/" },
                        { label: "Image Analysis", link: "/dotnet/ai/imaging-ai/" },
                      ],
                    },
                  ],
                },
                {
                  label: "MCP",
                  items: [
                    { label: "Overview", link: "/dotnet/mcp/" },
                    { label: "Setup & Configuration", link: "/dotnet/mcp/setup/" },
                    { label: "Creating Tools", link: "/dotnet/mcp/tools/" },
                    { label: "Security & GDPR", link: "/dotnet/mcp/security/" },
                    { label: "Tool Visibility", link: "/dotnet/mcp/visibility/" },
                    { label: "Client (External Servers)", link: "/dotnet/mcp/client/" },
                    { label: "AI Integration", link: "/dotnet/mcp/ai-integration/" },
                  ],
                },
                {
                  label: "Architecture",
                  items: [
                    { label: "Overview", link: "/dotnet/architecture/" },
                    {
                      label: "HTTP Conventions",
                      link: "/dotnet/architecture/http-conventions/",
                    },
                    {
                      label: "Dependency Graph",
                      link: "/dotnet/architecture/dependency-graph/",
                    },
                    {
                      label: "Tech Stack",
                      link: "/dotnet/architecture/tech-stack/",
                    },
                    {
                      label: "Architecture Styles",
                      link: "/dotnet/architecture/architecture-styles/",
                    },
                    {
                      label: "Patterns",
                      items: [{ autogenerate: { directory: "dotnet/architecture/patterns" } }],
                      collapsed: true,
                    },
                    {
                      label: "ADRs",
                      items: [{ autogenerate: { directory: "dotnet/architecture/adr" } }],
                      collapsed: true,
                    },
                  ],
                },
              ],
            },
            {
              label: "Frontend (TS/React)",
              link: "/frontend/",
              icon: "puzzle",
              id: "frontend",
              items: [
                {
                  label: "Getting Started",
                  items: [{ autogenerate: { directory: "frontend/getting-started" } }],
                },
                {
                  label: "Guides",
                  items: [{ autogenerate: { directory: "frontend/guides" } }],
                  collapsed: true,
                },
                {
                  label: "Operations",
                  items: [{ autogenerate: { directory: "frontend/operations" } }],
                  collapsed: true,
                },
                {
                  label: "Core",
                  items: [{ autogenerate: { directory: "frontend/core" } }],
                },
                {
                  label: "Data",
                  items: [{ autogenerate: { directory: "frontend/data" } }],
                  collapsed: true,
                },
                {
                  label: "Security & Compliance",
                  items: [{ autogenerate: { directory: "frontend/security" } }],
                  collapsed: true,
                },
                {
                  label: "API",
                  items: [{ autogenerate: { directory: "frontend/api" } }],
                },
                {
                  label: "Infrastructure",
                  items: [{ autogenerate: { directory: "frontend/infrastructure" } }],
                  collapsed: true,
                },
                {
                  label: "Observability",
                  items: [{ autogenerate: { directory: "frontend/observability" } }],
                  collapsed: true,
                },
                {
                  label: "Business Features",
                  items: [{ autogenerate: { directory: "frontend/business" } }],
                  collapsed: true,
                },
                {
                  label: "Architecture",
                  items: [
                    { label: "Overview", link: "/frontend/architecture/" },
                    {
                      label: "Patterns",
                      items: [{ autogenerate: { directory: "frontend/architecture/patterns" } }],
                      collapsed: true,
                    },
                    {
                      label: "ADRs",
                      items: [{ autogenerate: { directory: "frontend/architecture/adr" } }],
                      collapsed: true,
                    },
                  ],
                },
              ],
            },
            {
              label: "Community",
              link: "/contributing/",
              icon: "heart",
              items: [
                {
                  label: "Contributing",
                  items: [{ autogenerate: { directory: "contributing" } }],
                },
                {
                  label: "Migration",
                  items: [{ autogenerate: { directory: "migration" } }],
                  collapsed: true,
                },
                {
                  label: "Troubleshooting",
                  items: [{ autogenerate: { directory: "troubleshooting" } }],
                  collapsed: true,
                },
              ],
            },
            {
              label: "Tools",
              link: "/tools/ai-assistants/",
              icon: "rocket",
              items: [
                {
                  label: "Tools",
                  items: [{ autogenerate: { directory: "tools" } }],
                },
              ],
            },
          ],
          {
            exclude: ["/blog", "/blog/**/*"],
          },
        ),
        starlightLinksValidator({
          errorOnRelativeLinks: false,
          exclude: ["/", "/api/**", "/blog/**"],
        }),
        starlightImageZoom(),
        starlightLlmsTxt(),
        starlightKbd({
          globalPicker: false,
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
        Head: "./src/components/Head.astro",
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
            content: "https://granit-fx.dev/og-image.png",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:width",
            content: "1200",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:height",
            content: "630",
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
            content: "https://granit-fx.dev/og-image.png",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "theme-color",
            content: "#7c3aed",
          },
        },
        {
          tag: "script",
          content: `document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll("a.author[href]").forEach(function(a){a.setAttribute("target","_blank");a.setAttribute("rel","noopener noreferrer")})})`,
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
