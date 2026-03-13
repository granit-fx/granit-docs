/**
 * Remark plugin that replaces {{VAR_NAME}} placeholders in markdown content
 * with values from the variables map. Works in both .md and .mdx files.
 *
 * Usage in markdown: "Granit ships {{PACKAGE_COUNT}} packages"
 * Renders as:        "Granit ships 93 packages"
 */
import {
  PACKAGE_COUNT,
  FRONTEND_PACKAGE_COUNT,
  PATTERN_COUNT,
  ADR_COUNT,
} from "../data/constants.ts";

const variables = {
  PACKAGE_COUNT: String(PACKAGE_COUNT),
  FRONTEND_PACKAGE_COUNT: String(FRONTEND_PACKAGE_COUNT),
  PATTERN_COUNT: String(PATTERN_COUNT),
  ADR_COUNT: String(ADR_COUNT),
};

const PLACEHOLDER_RE = /%%(\w+)%%/g;

function replaceInNode(node) {
  if (node.type === "text" && PLACEHOLDER_RE.test(node.value)) {
    node.value = node.value.replace(
      PLACEHOLDER_RE,
      (match, key) => variables[key] ?? match,
    );
  }
  if (node.children) {
    for (const child of node.children) {
      replaceInNode(child);
    }
  }
}

export function remarkVariables() {
  return (tree) => replaceInNode(tree);
}
