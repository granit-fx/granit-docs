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
import { redirects } from "./src/config/redirects.mjs";
import { sidebarTopics } from "./src/config/sidebar.mjs";

export default defineConfig({
  site: "https://granit-fx.dev",
  build: {
    assets: "assets",
  },
  markdown: {
    gfm: true,
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
  redirects,
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
        baseUrl: "https://github.com/granit-fx/granit-docs/edit/develop/",
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
          sidebarTopics,
          {
            exclude: ["/blog", "/blog/**/*"],
          },
        ),
        starlightLinksValidator({
          errorOnRelativeLinks: true,
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
        // og:image / twitter:image are emitted per page by Head.astro,
        // backed by the /og/[...route].ts social-card endpoint.
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
            name: "theme-color",
            content: "#7c3aed",
          },
        },
        {
          tag: "script",
          content: `document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll("a.author[href]").forEach(function(a){a.setAttribute("target","_blank");a.setAttribute("rel","noopener noreferrer")})})`,
        },
        {
          tag: "script",
          attrs: {
            src: "https://www.googletagmanager.com/gtag/js?id=G-DDTTVZTD67",
            async: true,
          },
        },
        {
          tag: "script",
          content: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-DDTTVZTD67');`,
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
