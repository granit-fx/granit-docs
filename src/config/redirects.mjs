// Legacy URL map served as redirects by Astro (old path -> new path).
// Every page move or rename gets an entry here — starlight-links-validator
// only protects in-site links, not URLs already indexed or bookmarked.
export const redirects = {
  // The Vault documentation was split into a dedicated `vault/` folder.
  // Preserve external and in-repo links that still point at the old URL.
  "/dotnet/data/vault-encryption/": "/dotnet/data/vault/",
  "/dotnet/data/vault-encryption/#key-rotation": "/dotnet/data/vault/encryption/",

  // Granit.Http.Cors + Granit.Http.ResponseCompression merged into Granit.Http.Hosting.
  "/dotnet/api/cors-cross-origin/": "/dotnet/api/http-hosting/",
  "/dotnet/api/response-compression/": "/dotnet/api/http-hosting/",

  // Granit.Http.ApiVersioning merged into Granit.Http.ApiDocumentation.
  "/dotnet/api/api-versioning/": "/dotnet/api/api-documentation/",

  // Pages renamed within /dotnet/.
  "/dotnet/glossary/": "/dotnet/reference/glossary/",
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
  "/dotnet/data/mergeable/persistence/": "/dotnet/data/entity-merge/",
  "/dotnet/data/mergeable/": "/dotnet/data/entity-merge/",
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
  "/reference/frontend/tracing/": "/frontend/observability/tracing/",
  "/reference/modules/analyzers/": "/dotnet/core/analyzers/",

  // Page moved out of /dotnet/guides/ into the tooling section.
  "/dotnet/guides/use-with-ai-assistants/": "/tools/ai-assistants/",

  // Getting Started was hoisted under /dotnet/ during the multi-stack split.
  "/getting-started/your-first-api/": "/dotnet/getting-started/your-first-api/",

  // ExtraProperties was renamed framework-wide to Metadata.
  "/dotnet/core/extra-properties/": "/dotnet/core/metadata/",

  // Indexed by Google because earlier ADR pages used `./NNN-name` relative
  // links (no trailing slash). Starlight serves the parent as a directory
  // route, so the link resolved as a child of the wrong ADR. Source links
  // are now root-relative; these redirects clean up the indexed URLs.
  "/dotnet/architecture/adr/042-view-catalog/040-three-tier-metadata-architecture":
    "/dotnet/architecture/adr/040-three-tier-metadata-architecture/",
  "/dotnet/architecture/adr/048-cross-module-entity-relations/042-view-catalog":
    "/dotnet/architecture/adr/042-view-catalog/",
  "/dotnet/architecture/adr/045-contributor-pattern/048-cross-module-entity-relations":
    "/dotnet/architecture/adr/048-cross-module-entity-relations/",
  "/dotnet/architecture/adr/044-workspace-navigation/045-contributor-pattern":
    "/dotnet/architecture/adr/045-contributor-pattern/",
  "/dotnet/architecture/adr/038-analytics-dashboard-definition-vs-aggregate/017-ddd-aggregate-value-object-strategy.md":
    "/dotnet/architecture/adr/017-ddd-aggregate-value-object-strategy/",
  "/dotnet/architecture/adr/046-activities-vs-timeline/045-contributor-pattern":
    "/dotnet/architecture/adr/045-contributor-pattern/",
  "/dotnet/architecture/adr/051-user-aggregate-and-parties-bridge/040-three-tier-metadata-architecture":
    "/dotnet/architecture/adr/040-three-tier-metadata-architecture/",
  "/dotnet/architecture/adr/051-user-aggregate-and-parties-bridge/019-user-lookup-dual-mode-cache-vs-local-store":
    "/dotnet/architecture/adr/019-user-lookup-dual-mode/",

  // Frontend pages moved to nested sections (/security/, /infrastructure/, etc.).
  "/frontend/authentication/": "/frontend/security/authentication/",
  "/frontend/authorization/": "/frontend/security/authorization/",
  "/frontend/multi-tenancy/": "/frontend/infrastructure/multi-tenancy/",
  "/frontend/settings/": "/frontend/infrastructure/settings/",
  "/frontend/timeline/": "/frontend/business/timeline/",
  "/frontend/api-client/": "/frontend/api/http-client/",
  "/frontend/query-engine/": "/frontend/data/query-engine/",
  "/frontend/reference-data/": "/frontend/business/reference-data/",
  "/frontend/observability/": "/frontend/observability/error-boundary/",

  // Frontend broken nested paths (wrong sub-path appended to a section URL).
  "/frontend/security/authentication/multi-tenancy/": "/frontend/infrastructure/multi-tenancy/",
  "/frontend/business/data-exchange/query-engine/": "/frontend/data/query-engine/",
  "/frontend/infrastructure/multi-tenancy/authentication/": "/frontend/security/authentication/",
  "/frontend/security/identity/authorization/": "/frontend/security/authorization/",
  "/frontend/observability/error-boundary/logger/": "/frontend/observability/logger/",
  "/frontend/observability/error-boundary/tracing/": "/frontend/observability/tracing/",
  "/frontend/observability/tracing/logger/": "/frontend/observability/logger/",

  // Top-level paths without the /dotnet/ prefix.
  "/getting-started/next-steps/": "/dotnet/getting-started/next-steps/",
  "/business/workflow/": "/dotnet/building-blocks/workflow/",

  // .NET AI pages renamed.
  "/dotnet/ai/extraction/": "/dotnet/ai/document-extraction/",
  "/dotnet/ai/vector-data/": "/dotnet/ai/semantic-search/",
  "/dotnet/ai/blob-classification/": "/dotnet/ai/blob-storage-ai/",

  // .NET wrong section prefixes.
  "/dotnet/concepts/data/vault/": "/dotnet/data/vault/",
  "/dotnet/infrastructure/core/module-system/": "/dotnet/core/module-system/",
  "/dotnet/concepts/messaging/wolverine-optionality/": "/dotnet/concepts/wolverine-optionality/",
  "/dotnet/concepts/wolverine-optionality/messaging/": "/dotnet/concepts/wolverine-optionality/",
  "/dotnet/guides/business/parties/": "/dotnet/business/parties/",
  "/dotnet/data/mergeable/query-filters/": "/dotnet/data/query-filters/",

  // Building-blocks sub-pages still indexed under the old /dotnet/business/templating/ prefix.
  "/dotnet/business/templating/reference/": "/dotnet/building-blocks/templating/reference/",
  "/dotnet/business/templating/rendering-pipeline/": "/dotnet/building-blocks/templating/rendering-pipeline/",
  "/dotnet/business/templating/scriban-engine/": "/dotnet/building-blocks/templating/scriban-engine/",
  "/dotnet/business/templating/mjml-email-templates/": "/dotnet/building-blocks/templating/mjml-email-templates/",
  "/dotnet/business/templating/post-render-transformers/": "/dotnet/building-blocks/templating/post-render-transformers/",
  "/dotnet/business/templating/reference/layouts/": "/dotnet/building-blocks/templating/layouts/",
  "/dotnet/business/timeline/observability/": "/dotnet/building-blocks/timeline/",
  "/dotnet/business/timeline/notifications/": "/dotnet/infrastructure/notifications/",

  // .NET broken nested paths (wrong sub-path appended to a section URL).
  "/dotnet/infrastructure/wolverine-messaging/persistence/": "/dotnet/infrastructure/wolverine-messaging/",
  "/dotnet/business/workflow/persistence/": "/dotnet/building-blocks/workflow/",
  "/dotnet/business/workflow/wolverine/": "/dotnet/building-blocks/workflow/",
  "/dotnet/business/workflow/notifications/": "/dotnet/infrastructure/notifications/",
  "/dotnet/core/module-system/authentication/": "/dotnet/security/authentication/",
  "/dotnet/architecture/patterns/structured-output/ai-workspace/": "/dotnet/architecture/patterns/ai-workspace/",
  "/dotnet/architecture/patterns/structured-output/ai-fallback/": "/dotnet/architecture/patterns/ai-fallback/",
  "/dotnet/architecture/patterns/ai-workspace/factory-method/": "/dotnet/architecture/patterns/factory-method/",
  "/dotnet/infrastructure/notifications/conventions/wolverine-integration/":
    "/dotnet/infrastructure/notifications/wolverine-integration/",
  "/dotnet/business/data-exchange/background-jobs/": "/dotnet/infrastructure/background-jobs/",
  "/dotnet/api/webhooks/persistence/": "/dotnet/api/webhooks/",
  // Templating sub-pages crawled as children of sibling pages (relative-link mis-resolution).
  "/dotnet/building-blocks/templating/rendering-pipeline/scriban-engine/": "/dotnet/building-blocks/templating/scriban-engine/",
  "/dotnet/building-blocks/templating/scriban-engine/reference/": "/dotnet/building-blocks/templating/reference/",
  "/dotnet/building-blocks/templating/mjml-email-templates/layouts/": "/dotnet/building-blocks/templating/layouts/",
  "/dotnet/building-blocks/templating/mjml-email-templates/rendering-pipeline/": "/dotnet/building-blocks/templating/rendering-pipeline/",
  "/dotnet/building-blocks/workflow/persistence/": "/dotnet/data/persistence/",
  "/dotnet/building-blocks/timeline/observability/": "/dotnet/operations/observability/",
  // Infrastructure broken nested paths.
  "/dotnet/infrastructure/localization/persistence/": "/dotnet/data/persistence/",
  "/dotnet/infrastructure/localization/authentication/": "/dotnet/security/authentication/",
  "/dotnet/infrastructure/multi-tenancy/cache/resolvers/": "/dotnet/infrastructure/multi-tenancy/resolvers/",
  "/dotnet/infrastructure/notifications/sms-push-realtime/configuration/": "/dotnet/infrastructure/notifications/configuration/",
  // ADR pages indexed with wrong parent segment (relative links without trailing slash).
  "/dotnet/architecture/adr/003-testing-stack/014-migration-shouldly/": "/dotnet/architecture/adr/014-migration-shouldly/",
  "/dotnet/architecture/adr/020-declarative-definitions-placement/016-sylvan-data-excel-parsing.md": "/dotnet/architecture/adr/016-sylvan-data-excel-parsing/",
  "/dotnet/architecture/adr/038-analytics-dashboard-definition-vs-aggregate/020-declarative-definitions-placement.md": "/dotnet/architecture/adr/020-declarative-definitions-placement/",
  "/dotnet/architecture/adr/049-default-landing-route/044-workspace-navigation": "/dotnet/architecture/adr/044-workspace-navigation/",
  // Contributing broken nested path.
  "/contributing/development-setup/definition-of-done/": "/contributing/definition-of-done/",
  // Frontend broken nested paths.
  "/frontend/business/templating/data-exchange/": "/frontend/business/data-exchange/",
  "/frontend/data/query-engine/data-exchange/": "/frontend/business/data-exchange/",
  "/frontend/api/": "/frontend/api/http-client/",
  "/frontend/cookies/": "/frontend/security/cookies/",

  // Legacy auto-generated API reference pages — redirect to the matching doc section.
  "/api/Granit.Identity.html": "/dotnet/security/identity/",
  "/api/Granit.Workflow.html": "/dotnet/building-blocks/workflow/",
  "/api/Granit.BackgroundJobs.html": "/dotnet/infrastructure/background-jobs/",
  "/api/Granit.html": "/dotnet/core/module-system/",
  "/api/Granit.Caching.html": "/dotnet/data/caching/",
  "/api/Granit.Wolverine.html": "/dotnet/infrastructure/wolverine-messaging/",
  "/api/Granit.DataExchange.html": "/dotnet/building-blocks/data-exchange/",
  "/api/Granit.Notifications.html": "/dotnet/infrastructure/notifications/",
};
