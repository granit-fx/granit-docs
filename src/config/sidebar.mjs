// Sidebar topics for the starlight-sidebar-topics plugin.
// Sections using `autogenerate` pick up new pages automatically; manually
// listed sections need an entry here for every new page.
export const sidebarTopics = [
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
        label: "Migrating from",
        collapsed: true,
        items: [
          { label: "Overview", link: "/migrating-from/" },
          { label: "From ABP Framework", link: "/migrating-from/abp/" },
          { label: "From FullStackHero", link: "/migrating-from/fullstackhero/" },
          { label: "From Clean Architecture", link: "/migrating-from/clean-architecture/" },
        ],
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
              { label: "Secure your Application", link: "/dotnet/guides/secure-your-application/" },
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
        collapsed: true,
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
          { label: "HTTP Hosting", link: "/dotnet/api/http-hosting/" },
          { label: "Blob Storage Endpoints", link: "/dotnet/api/blob-storage-endpoints/" },
          { label: "API Documentation", link: "/dotnet/api/api-documentation/" },
          { label: "Exception Handling", link: "/dotnet/api/exception-handling/" },
          { label: "Idempotency", link: "/dotnet/api/idempotency/" },
          { label: "Rate Limiting", link: "/dotnet/api/rate-limiting/" },
          { label: "Bulkhead", link: "/dotnet/api/bulkhead/" },
          { label: "HTTP Resilience", link: "/dotnet/api/http-resilience/" },
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
        collapsed: true,
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
          { label: "Mentions", link: "/dotnet/building-blocks/mentions/" },
          { label: "TextExtraction", link: "/dotnet/building-blocks/text-extraction/" },
          { label: "LanguageDetection", link: "/dotnet/building-blocks/language-detection/" },
          {
            label: "Address Platform",
            collapsed: true,
            items: [
              { label: "Overview", link: "/dotnet/building-blocks/address-platform/" },
              { label: "Value Objects", link: "/dotnet/building-blocks/address-value-objects/" },
              { label: "Geocoding", link: "/dotnet/building-blocks/geocoding/" },
              { label: "Geocoding Endpoints", link: "/dotnet/building-blocks/geocoding-endpoints/" },
              { label: "Address Enrichment", link: "/dotnet/building-blocks/address-enrichment/" },
              { label: "Address Deliverability", link: "/dotnet/building-blocks/address-deliverability/" },
            ],
          },
          {
            label: "Indexing",
            collapsed: true,
            items: [
              { label: "Overview", link: "/dotnet/building-blocks/indexing/" },
              { label: "Embeddings (RRF)", link: "/dotnet/building-blocks/indexing-embeddings/" },
              { label: "Background reindex", link: "/dotnet/building-blocks/indexing-background-jobs/" },
            ],
          },
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
            label: "Glossary",
            link: "/dotnet/reference/glossary/",
          },
          {
            label: "Configuration Keys",
            link: "/dotnet/reference/configuration-keys/",
          },
          {
            label: "Diagnostics (GRxxx)",
            link: "/dotnet/reference/diagnostics/",
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
          { label: "Structured Completion", link: "/dotnet/ai/structured-completion/" },
          { label: "Agentic Chat", link: "/dotnet/ai/agentic-chat/" },
          { label: "AI Tools", link: "/dotnet/ai/tools/" },
          { label: "AI Prompts", link: "/dotnet/ai/prompts/" },
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
        collapsed: true,
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
        collapsed: true,
      },
      {
        label: "CMS",
        items: [
          { label: "Overview", link: "/dotnet/cms/" },
          { label: "Sites & Pages", link: "/dotnet/cms/sites-and-pages/" },
          { label: "Blocks", link: "/dotnet/cms/blocks/" },
          { label: "Blog", link: "/dotnet/cms/blog/" },
          { label: "Releases", link: "/dotnet/cms/releases/" },
          { label: "SEO", link: "/dotnet/cms/seo/" },
          { label: "Redirects", link: "/dotnet/cms/redirects/" },
          { label: "Custom Domains", link: "/dotnet/cms/hostnames/" },
          { label: "Media References", link: "/dotnet/cms/documents/" },
        ],
        collapsed: true,
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
            link: "/dotnet/architecture/patterns/",
          },
          {
            label: "ADRs",
            link: "/dotnet/architecture/adr/",
          },
        ],
        collapsed: true,
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
        collapsed: true,
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
        collapsed: true,
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
            link: "/frontend/architecture/patterns/",
          },
          {
            label: "ADRs",
            link: "/frontend/architecture/adr/",
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
        label: "Version Upgrades",
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
];
