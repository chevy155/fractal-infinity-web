import { rankConstraints } from "./engine/score.js";
import { runCascade } from "./engine/cascade.js";
import {
  buildCascadeHtml,
  buildCurrentHtml,
  buildDetailHtml,
  buildIntelligenceHtml,
  buildRankHtml,
  buildXrayModel
} from "./render.js";

const $ = (id) => document.getElementById(id);

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function renderRank(ranked, nodes, selectedId, onSelect) {
  const list = $("xr-rank");
  list.innerHTML = buildRankHtml(ranked, nodes, selectedId);
  Array.from(list.querySelectorAll(".xr-rank-item")).forEach((btn, index) => {
    const row = ranked[index];
    if (!row) return;
    btn.addEventListener("click", () => onSelect(row.node_id));
  });
}

function renderDetail(nodeId, ctx) {
  $("xr-detail").innerHTML = buildDetailHtml(nodeId, ctx);
  $("xr-current").innerHTML = buildCurrentHtml(ctx);
}

function renderCascade(cascade, nodes) {
  $("xr-cascade").innerHTML = buildCascadeHtml(cascade, nodes);
}

function renderIntelligence(layer, ranked, cascade, nodes) {
  const host = $("xr-intel");
  if (!host) return;
  if (!layer) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }
  host.hidden = false;
  host.innerHTML = buildIntelligenceHtml(layer, ranked, cascade, nodes);
}

async function main() {
  const inv = document.body.dataset.investigation || "ai-accelerator";
  const dataBase = new URL(`./investigations/${inv}/`, import.meta.url);
  const configBase = new URL("./config/", import.meta.url);
  const [scenario, entitiesFile, nodesFile, relFile, constraints, evidence, weights] = await Promise.all([
    loadJson(new URL("scenario.json", dataBase).href),
    loadJson(new URL("entities.json", dataBase).href),
    loadJson(new URL("nodes.json", dataBase).href),
    loadJson(new URL("relationships.json", dataBase).href),
    loadJson(new URL("constraints.json", dataBase).href),
    loadJson(new URL("evidence.json", dataBase).href),
    loadJson(new URL("weights.json", configBase).href)
  ]);

  let intelligence = null;
  if ($("xr-intel")) {
    try {
      intelligence = await loadJson(new URL("intelligence.json", dataBase).href);
    } catch {
      intelligence = null;
    }
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
  const { entities, nodes, rels, claims, ranked, cascade } = model;

  $("xr-title").textContent = scenario.title;
  $("xr-scenario").textContent = `Scenario: ${scenario.scaling_target}`;
  $("xr-disclaimer").textContent = scenario.disclaimer;
  const asOf = intelligence?.as_of || scenario.as_of;
  const asOfEl = $("xr-as-of");
  if (asOfEl) asOfEl.textContent = asOf ? `Evidence as of ${asOf}` : "";

  let selected = ranked[0]?.node_id;
  const ctx = { nodes, entities, rels, claims, ranked, cascade };

  const select = (id) => {
    selected = id;
    renderRank(ranked, nodes, selected, select);
    renderDetail(selected, ctx);
  };

  renderRank(ranked, nodes, selected, select);
  renderCascade(cascade, nodes);
  renderDetail(selected, ctx);
  renderIntelligence(intelligence, ranked, cascade, nodes);

  window.__xray = { ranked, cascade, weights, scenario, intelligence };
}

main().catch((err) => {
  console.error(err);
  const el = $("xr-title");
  if (el) el.textContent = "X-Ray failed to load — see console";
});
