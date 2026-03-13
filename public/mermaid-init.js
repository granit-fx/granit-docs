// Mermaid diagram rendering for Starlight docs
// Converts ```mermaid code blocks to rendered SVG diagrams

async function initMermaid() {
  try {
    // Find mermaid code blocks (Expressive Code or standard Markdown)
    const elements = document.querySelectorAll(
      'pre[data-language="mermaid"], code.language-mermaid'
    );

    if (elements.length === 0) return;

    // Dynamically import mermaid only when needed
    const { default: mermaid } = await import(
      "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"
    );

    const isDark =
      document.documentElement.dataset.theme === "dark" ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Replace code blocks with mermaid-renderable <pre class="mermaid">
    elements.forEach((el) => {
      const isExpressiveCode = el.matches('pre[data-language="mermaid"]');
      const wrapper = isExpressiveCode
        ? el.closest(".expressive-code") || el.parentElement
        : el.parentElement;
      // Expressive Code wraps each line in <div class="ec-line"> without
      // newline characters between them. el.textContent concatenates everything
      // into one line, which breaks mermaid parsing. Extract line-by-line instead.
      const lines = el.querySelectorAll(".ec-line");
      const text =
        lines.length > 0
          ? Array.from(lines)
              .map((line) => line.textContent)
              .join("\n")
          : el.textContent;
      const pre = document.createElement("pre");
      pre.classList.add("mermaid");
      pre.textContent = text;
      pre.setAttribute("data-original", text);
      wrapper.replaceWith(pre);
    });

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      securityLevel: "loose",
    });

    await mermaid.run();

    // Re-render on Starlight theme toggle
    const observer = new MutationObserver(async () => {
      try {
        const nowDark = document.documentElement.dataset.theme === "dark";
        mermaid.initialize({
          theme: nowDark ? "dark" : "default",
          securityLevel: "loose",
        });
        document.querySelectorAll(".mermaid[data-processed]").forEach((el) => {
          el.removeAttribute("data-processed");
          el.innerHTML = el.getAttribute("data-original") || el.textContent;
        });
        await mermaid.run();
      } catch (err) {
        console.warn("[mermaid] theme toggle re-render failed:", err);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  } catch (err) {
    console.warn("[mermaid] initialization failed:", err);
  }
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initMermaid());
} else {
  initMermaid();
}

// Re-run on Astro View Transitions page navigation
document.addEventListener("astro:page-load", () => initMermaid());
