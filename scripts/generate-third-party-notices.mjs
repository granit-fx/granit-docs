/**
 * Regenerates THIRD-PARTY-NOTICES.md from the resolved pnpm graph.
 *
 * The mechanical sections (license summary, direct and transitive dependency
 * tables) are derived from `pnpm licenses list --prod --json`. The hand-written
 * "Notable licenses" prose is carried over verbatim from the existing file —
 * it holds legal acknowledgments that no generator can infer.
 *
 * Usage: node scripts/generate-third-party-notices.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOTICES = join(root, "THIRD-PARTY-NOTICES.md");

// Licenses that are not permissive and must be reviewed before a dep is merged.
const NON_PERMISSIVE = /^(?!.*OR )(GPL|LGPL|AGPL|SSPL|EUPL|BUSL)/i;

const raw = execFileSync("pnpm", ["licenses", "list", "--prod", "--json"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

/** @type {Map<string, {version: string, license: string, homepage: string}>} */
const packages = new Map();
for (const [license, entries] of Object.entries(JSON.parse(raw))) {
  for (const entry of entries) {
    packages.set(entry.name, {
      version: entry.versions.join(" / "),
      license,
      homepage: entry.homepage || `https://www.npmjs.com/package/${entry.name}`,
    });
  }
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const directNames = new Set(Object.keys(pkg.dependencies ?? {}));

const byName = (a, b) => a[0].localeCompare(b[0], "en");
const rows = [...packages.entries()].sort(byName);
const direct = rows.filter(([name]) => directNames.has(name));
const transitive = rows.filter(([name]) => !directNames.has(name));

// MD059 rejects generic link text, so label each link with its host rather
// than a bare "link".
function linkText(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "homepage";
  }
}

const row = ([name, m]) =>
  `| \`${name}\` | ${m.version} | ${m.license} | [${linkText(m.homepage)}](${m.homepage}) |`;

const counts = new Map();
for (const [, m] of rows) counts.set(m.license, (counts.get(m.license) ?? 0) + 1);
const summary = [...counts.entries()].sort((a, b) => b[1] - a[1] || byName(a, b));

const permissive = summary.map(([l]) => l).filter((l) => !NON_PERMISSIVE.test(l));
const flagged = summary.map(([l]) => l).filter((l) => NON_PERMISSIVE.test(l));

// Carry the hand-written legal prose across regenerations.
const previous = readFileSync(NOTICES, "utf8");
const notable = previous.slice(
  previous.indexOf("## Notable licenses"),
  previous.indexOf("## Update procedure"),
);
if (!notable) throw new Error("Could not locate the 'Notable licenses' section to preserve");

const today = new Date().toISOString().slice(0, 10);

const out = `# THIRD-PARTY NOTICES — Granit Docs

Last generated: ${today}

This file lists the third-party open-source packages bundled or used at build
time by \`granit-fx/granit-docs\`, together with their licenses. The site is built
with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

**Total production packages:** ${rows.length}

## License summary

| License | Packages |
| --- | --- |
${summary.map(([l, n]) => `| ${l} | ${n} |`).join("\n")}

All licenses above are permissive (${permissive.join(", ").replace(/\*/g, "\\*")})${
  flagged.length
    ? ` except for ${flagged.join(", ")} — see the *Notable licenses* section below.`
    : "."
}

## Direct dependencies

Packages declared in [package.json](package.json):

| Package | Version | License | Homepage |
| --- | --- | --- | --- |
${direct.map(row).join("\n")}

## Transitive dependencies

The full transitive graph (resolved by pnpm) contains the following packages.
Versions reflect the pinned \`pnpm-lock.yaml\`.

<details>
<summary>Show ${transitive.length} transitive packages</summary>

| Package | Version | License | Homepage |
| --- | --- | --- | --- |
${transitive.map(row).join("\n")}

</details>

${notable}## Update procedure

After any change to \`package.json\` or \`pnpm-lock.yaml\`, regenerate this file:

\`\`\`bash
pnpm install --frozen-lockfile
node scripts/generate-third-party-notices.mjs
\`\`\`

Per the global contribution rules, any **non-permissive license** (GPL, AGPL,
SSPL, EUPL, BUSL) that appears here MUST be flagged to maintainers before the
dep is merged.
`;

writeFileSync(NOTICES, out);
console.log(
  `THIRD-PARTY-NOTICES.md: ${rows.length} packages (${direct.length} direct, ${transitive.length} transitive)`,
);
if (flagged.length) console.log(`Non-permissive licenses present: ${flagged.join(", ")}`);
