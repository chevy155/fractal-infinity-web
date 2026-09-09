import { buildDetailHtml, buildIntelligenceHtml, classTag, downstream, evidenceFor, nodeById, statusTag, upstream } from "./render.js";
const $ = (id) => document.getElementById(id);
async function load(path) { const response = await fetch(path); if (!response.ok) throw new Error(path); return response.json(); }
function neighborHtml(title, edges, direction, nodes) {
  if (!edges.length) return `<p class="edm-empty">No ${title.toLowerCase()} recorded at this depth.</p>`;
  return `<h3>${title}</h3><ul class="edm-neighbor-list">${edges.map((edge) => { const id = direction === "upstream" ? edge.to : edge.from; const node = nodeById(nodes, id); return `<li><button type="button" class="edm-neighbor-btn" data-id="${id}"><span class="edm-rel">${edge.rel.replaceAll("_", " ")}</span> <strong>${node?.label || id}</strong><span class="edm-rel-why">${edge.why}</span>${statusTag(edge.relationship_status)}${classTag(edge.class)}</button></li>`; }).join("")}</ul>`;
}
async function main() {
  const mapId = document.body.dataset.investigation || "ai-accelerator-packaging";
  const base = new URL(`./investigations/${mapId}/`, import.meta.url);
  const [investigation, edgesFile, evidenceFile, concentrationFile, intelligence] = await Promise.all(["nodes.json", "edges.json", "evidence.json", "concentration.json", "intelligence.json"].map((file) => load(new URL(file, base))));
  const ctx = { investigation, nodes: investigation.nodes, edges: edgesFile.edges, evidence: evidenceFile.evidence, concentration: concentrationFile.signals, trail: [investigation.anchor] };
  let mode = "both";
  function render(id, nextMode = mode, trim = false) {
    if (trim) { const index = ctx.trail.indexOf(id); ctx.trail = index >= 0 ? ctx.trail.slice(0, index + 1) : [investigation.anchor, id]; } else if (ctx.trail.at(-1) !== id) ctx.trail.push(id);
    mode = nextMode; const node = nodeById(ctx.nodes, id); const up = upstream(ctx.edges, id); const down = downstream(ctx.edges, id);
    $("scm-title").textContent = node?.label || id; $("scm-type").textContent = node?.type || "—";
    $("scm-detail").innerHTML = buildDetailHtml({ investigation, node, up, down, nodeEvidence: evidenceFor(ctx.evidence, id), concentration: ctx.concentration, mode });
    const expansion = $("scm-detail").querySelector(".edm-expansion"); if (expansion) expansion.innerHTML = mode === "upstream" ? neighborHtml("What this depends on", up, "upstream", ctx.nodes) : mode === "downstream" ? neighborHtml("What depends on this", down, "downstream", ctx.nodes) : neighborHtml("What this depends on", up, "upstream", ctx.nodes) + neighborHtml("What depends on this", down, "downstream", ctx.nodes);
    $("scm-detail").querySelectorAll(".edm-neighbor-btn").forEach((button) => button.addEventListener("click", () => render(button.dataset.id)));
    $("scm-trail").innerHTML = ctx.trail.map((trailId, index) => `<button type="button" class="edm-trail-item${trailId === id ? " is-active" : ""}" data-id="${trailId}">${nodeById(ctx.nodes, trailId)?.label || trailId}</button>${index < ctx.trail.length - 1 ? "<span class=\"edm-trail-sep\">→</span>" : ""}`).join("");
    $("scm-trail").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => render(button.dataset.id, "both", true)));
    ["up", "down", "both"].forEach((key) => $("scm-" + key).classList.toggle("is-active", (key === "up" && mode === "upstream") || (key === "down" && mode === "downstream") || (key === "both" && mode === "both")));
  }
  $("scm-up").addEventListener("click", () => render(ctx.trail.at(-1), "upstream", true)); $("scm-down").addEventListener("click", () => render(ctx.trail.at(-1), "downstream", true)); $("scm-both").addEventListener("click", () => render(ctx.trail.at(-1), "both", true)); $("scm-reset").addEventListener("click", () => { ctx.trail = [investigation.anchor]; render(investigation.anchor, "both", true); });
  $("scm-intel").innerHTML = buildIntelligenceHtml(intelligence, ctx.evidence); render(investigation.anchor, "both", true);
}
main().catch((error) => { console.error(error); $("scm-detail").innerHTML = '<p class="muted-note">Failed to load supply-chain map data.</p>'; });
