import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runCascade } from "../engine/cascade.js";
import { rankConstraints } from "../engine/score.js";
import {
  buildCascadeHtml,
  buildCurrentHtml,
  buildDetailHtml,
  buildIntelligenceHtml,
  buildRankHtml,
  buildXrayModel
} from "../render.js";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..");
const xrayRoot = join(webRoot, "xray");

export const PAGES = [
  {
    investigationId: "ai-accelerator",
    htmlPath: join(webRoot, "tools", "xray", "ai-accelerator.html"),
    methodologyHref: "methodology.html"
  },
  {
    investigationId: "datacenter-buildout",
    htmlPath: join(webRoot, "tools", "xray", "datacenter-buildout.html"),
    methodologyHref: "methodology.html"
  },
  {
    investigationId: "ai-networking",
    htmlPath: join(webRoot, "tools", "xray", "ai-networking.html"),
    methodologyHref: "methodology.html"
  }
];

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function replaceMarkedSection(html, key, content) {
  const start = `<!-- xray-prerender:${key}:start -->`;
  const end = `<!-- xray-prerender:${key}:end -->`;
  if (!html.includes(start) || !html.includes(end)) {
    throw new Error(`Missing markers for ${key}`);
  }
  return html.replace(new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`), `${start}\n${content}\n${end}`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPageData(investigationId) {
  const base = join(xrayRoot, "investigations", investigationId);
  const scenario = loadJson(join(base, "scenario.json"));
  const entitiesFile = loadJson(join(base, "entities.json"));
  const nodesFile = loadJson(join(base, "nodes.json"));
  const relFile = loadJson(join(base, "relationships.json"));
  const constraints = loadJson(join(base, "constraints.json"));
  const evidence = loadJson(join(base, "evidence.json"));
  const weights = loadJson(join(xrayRoot, "config", "weights.json"));
  let intelligence = null;
  try {
    intelligence = loadJson(join(base, "intelligence.json"));
  } catch {
    intelligence = null;
  }

  const model = buildXrayModel({
    scenario,
    entitiesFile,
    nodesFile,
    relFile,
    constraints,
    evidence,
    weights,
    intelligence,
    rankConstraints,
    runCascade
  });

  return {
    ...model,
    asOf: intelligence?.as_of || scenario.as_of || null,
    evidenceDisclaimer: evidence.disclaimer || null
  };
}

export function buildPrerenderSections(investigationId, methodologyHref = "methodology.html") {
  const model = buildPageData(investigationId);
  const selected = model.ranked[0]?.node_id;

  return {
    asOf: model.asOf ? `Evidence as of ${model.asOf}` : "",
    methodology: `Methodology: <a href="${methodologyHref}">How scoring and cascade work</a>`,
    rank: buildRankHtml(model.ranked, model.nodes, selected),
    current: buildCurrentHtml(model),
    detail: buildDetailHtml(selected, model),
    cascade: buildCascadeHtml(model.cascade, model.nodes),
    intel: buildIntelligenceHtml(model.intelligence, model.ranked, model.cascade, model.nodes),
    evidenceDisclaimer: model.evidenceDisclaimer || ""
  };
}

export function prerenderHtml(html, investigationId, methodologyHref = "methodology.html") {
  const sections = buildPrerenderSections(investigationId, methodologyHref);
  let next = html;
  next = replaceMarkedSection(next, "as-of", sections.asOf);
  next = replaceMarkedSection(next, "methodology", sections.methodology);
  next = replaceMarkedSection(next, "rank", sections.rank);
  next = replaceMarkedSection(next, "current", sections.current);
  next = replaceMarkedSection(next, "detail", sections.detail);
  next = replaceMarkedSection(next, "cascade", sections.cascade);
  next = replaceMarkedSection(next, "intel", sections.intel);
  next = replaceMarkedSection(next, "evidence-disclaimer", sections.evidenceDisclaimer);
  return next;
}

export function prerenderFile(page) {
  const current = readFileSync(page.htmlPath, "utf8");
  const next = prerenderHtml(current, page.investigationId, page.methodologyHref);
  if (next !== current) writeFileSync(page.htmlPath, next);
}

function main() {
  PAGES.forEach(prerenderFile);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
