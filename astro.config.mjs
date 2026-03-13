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
      defaultLocale: "en",
      locales: {
        en: { label: "English", lang: "en" },
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
        },
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Reference",
          items: [
            { label: "Overview", link: "/reference/" },
            {
              label: ".NET Modules",
              autogenerate: { directory: "reference/modules" },
            },
            {
              label: "Frontend SDK",
              autogenerate: { directory: "reference/frontend" },
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
          attrs: { type: "module" },
          content: `
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

            function initMermaid() {
              const isDark = document.documentElement.dataset.theme === 'dark'
                || window.matchMedia('(prefers-color-scheme: dark)').matches;

              // Convert mermaid code blocks to <pre class="mermaid"> for rendering.
              // Expressive Code (build): <div class="expressive-code"><figure><pre data-language="mermaid">...
              // Standard Markdown (dev):  <pre><code class="language-mermaid">...
              document.querySelectorAll('pre[data-language="mermaid"], code.language-mermaid').forEach(el => {
                const isExpressiveCode = el.matches('pre[data-language="mermaid"]');
                const wrapper = isExpressiveCode
                  ? (el.closest('.expressive-code') || el.parentElement)
                  : el.parentElement;
                const text = el.textContent;
                const pre = document.createElement('pre');
                pre.classList.add('mermaid');
                pre.textContent = text;
                pre.setAttribute('data-original', text);
                wrapper.replaceWith(pre);
              });

              mermaid.initialize({
                startOnLoad: false,
                theme: isDark ? 'dark' : 'default',
                securityLevel: 'loose',
              });
              mermaid.run();
            }

            // Run on page load
            initMermaid();

            // Re-render on Starlight theme toggle
            const observer = new MutationObserver(() => {
              const nowDark = document.documentElement.dataset.theme === 'dark';
              mermaid.initialize({ theme: nowDark ? 'dark' : 'default', securityLevel: 'loose' });
              document.querySelectorAll('.mermaid[data-processed]').forEach(el => {
                el.removeAttribute('data-processed');
                el.innerHTML = el.getAttribute('data-original') || el.textContent;
              });
              mermaid.run();
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

            // Re-render on Astro page navigation (View Transitions)
            document.addEventListener('astro:page-load', () => initMermaid());
          `,
        },
      ],
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    }),
  ],
});
