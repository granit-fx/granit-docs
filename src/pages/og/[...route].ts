import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";

// Renders one social-card PNG per docs page at /og/<page-id>.png.
// Head.astro points og:image / twitter:image here; /og-image.png stays as
// the fallback for pages outside the docs collection (landing page).
const entries = await getCollection("docs");

export const { getStaticPaths, GET } = await OGImageRoute({
  param: "route",
  pages: Object.fromEntries(entries.map((entry) => [entry.id, entry.data])),
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description ?? "",
    logo: { path: "./public/granit-icon-64.png", size: [64] },
    bgGradient: [
      [24, 24, 27],
      [46, 16, 101],
    ],
    border: { color: [124, 58, 237], width: 12, side: "block-end" },
    padding: 60,
    font: {
      title: { size: 60, lineHeight: 1.2, weight: "Bold" },
      description: { size: 30, lineHeight: 1.4, color: [212, 212, 216] },
    },
  }),
});
