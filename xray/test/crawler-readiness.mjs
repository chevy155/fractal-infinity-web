import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PAGES, buildPrerenderSections, prerenderHtml } from "../scripts/prerender-pages.mjs";

for (const page of PAGES) {
  const html = readFileSync(page.htmlPath, "utf8");
  const expected = prerenderHtml(html, page.investigationId, page.methodologyHref);
  const sections = buildPrerenderSections(page.investigationId, page.methodologyHref);

  assert.equal(html, expected, `${page.investigationId} prerendered HTML is current`);
  assert.ok(!html.includes('id="xr-intel" hidden'), `${page.investigationId} intelligence panel visible without JS`);
  assert.ok(html.includes("Supporting evidence"), `${page.investigationId} raw HTML exposes evidence section`);
  assert.ok(html.includes("Constraint cascade"), `${page.investigationId} raw HTML exposes cascade section`);
  assert.ok(html.includes("Methodology:"), `${page.investigationId} raw HTML links methodology`);
  assert.ok(html.includes(sections.asOf), `${page.investigationId} raw HTML exposes evidence date`);
  assert.ok(html.includes(sections.rank), `${page.investigationId} raw HTML exposes ranked results`);
  assert.ok(html.includes(sections.detail), `${page.investigationId} raw HTML exposes top-node detail`);
  assert.ok(html.includes(sections.cascade), `${page.investigationId} raw HTML exposes cascade ordering`);
  assert.ok(html.includes(sections.intel), `${page.investigationId} raw HTML exposes intelligence layer`);
}

console.log(`CRAWLER_READINESS_PASS ${PAGES.length}`);
