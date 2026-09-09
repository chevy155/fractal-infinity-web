import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildModel } from "../render.js";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mapId = process.argv[2] || "ai-accelerator-packaging";
const data = join(root, `investigations/${mapId}`);
const page = join(root, `../tools/supply-chain/${mapId}.html`);
const read = (name) => JSON.parse(readFileSync(join(data, name), "utf8"));
const model = buildModel({ investigation: read("nodes.json"), edgesFile: read("edges.json"), evidenceFile: read("evidence.json"), concentrationFile: read("concentration.json"), intelligence: read("intelligence.json") });
function stamp(html, id, content) { const re = new RegExp(`(<section[^>]*\\bid=["']${id}["'][^>]*>)[\\s\\S]*?(</section>)`, "i"); if (!re.test(html)) throw new Error(`Missing #${id}`); return html.replace(re, `$1\n<!-- scm:prerender:${id} -->\n${content}\n<!-- /scm:prerender:${id} -->\n$2`); }
let html = readFileSync(page, "utf8"); html = stamp(html, "scm-detail", model.detailHtml); html = stamp(html, "scm-concentration", model.concentrationHtml); html = stamp(html, "scm-intel", model.intelligenceHtml); if (!html.includes(`data-investigation="${mapId}"`)) html = html.replace("<body", `<body data-investigation="${mapId}"`); writeFileSync(page, html); console.log(`Prerendered tools/supply-chain/${mapId}.html`);
