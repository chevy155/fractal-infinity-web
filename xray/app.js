import { rankConstraints } from "./engine/score.js";
import { runCascade } from "./engine/cascade.js";

const $ = (id) => document.getElementById(id);

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function entityName(entities, id) {
  return entities.find((e) => e.id === id)?.name || id;
}

function dependents(rels, nodeId) {
  return rels.filter((r) => r.to === nodeId).map((r) => r.from);
}

function driversHtml(drivers, obs) {
  return drivers
    .map((d) => {
      const rationale = obs?.[`${d.key}_rationale`] || (d.key === "scarcity" ? null : obs?.[`${d.key}_rationale`]);
      const scarR =
        d.key === "scarcity"
          ? [
              obs?.capacity_pressure_rationale && `capacity_pressure: ${obs.capacity_pressure_rationale}`,
              obs?.supplier_concentration_rationale && `supplier_concentration: ${obs.supplier_concentration_rationale}`,
              obs?.lead_time_pressure_rationale && `lead_time_pressure: ${obs.lead_time_pressure_rationale}`
            ]
              .filter(Boolean)
              .join(" ")
          : null;
      const note = d.key === "scarcity" ? scarR : rationale;
      const val = typeof d.value === "number" ? d.value.toFixed(3) : d.value;
      return `<li><code>${d.key}</code> = ${val}${note ? `<div class="xr-rationale">${note}</div>` : ""}</li>`;
    })
    .join("");
}

function renderRank(ranked, nodes, selectedId, onSelect) {
  const list = $("xr-rank");
  list.innerHTML = "";
  ranked.forEach((row, i) => {
    const node = nodes.find((n) => n.id === row.node_id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "xr-rank-item" + (row.node_id === selectedId ? " is-active" : "");
    btn.innerHTML = `<span class="xr-rank-n">#${i + 1}</span><span class="xr-rank-label">${node?.label || row.node_id}<small class="xr-rank-status">${row.status}</small></span><span class="xr-rank-score">${row.score}</span>`;
    btn.addEventListener("click", () => onSelect(row.node_id));
    list.appendChild(btn);
  });
}

function renderDetail(nodeId, ctx) {
  const { nodes, entities, rels, claims, ranked, cascade } = ctx;
  const node = nodes.find((n) => n.id === nodeId);
  const score = ranked.find((r) => r.node_id === nodeId);
  const obs = score?.observation;
  const deps = dependents(rels, nodeId);
  const evidence = claims.filter((c) => c.subject === nodeId);

  const controllers = (node?.controllers || []).map((id) => entityName(entities, id)).join(", ") || "—";
  const depLabels = deps.map((id) => nodes.find((n) => n.id === id)?.label || id).join(", ") || "—";

  $("xr-detail").innerHTML = `
    <h2>Selected node</h2>
    <p class="xr-badge">${obs?.data_class || "MODELED"} · severity CALCULATED · confidence separate</p>
    <h3>${node?.label || nodeId}</h3>
    <p class="xr-scoreline">Constraint severity <strong>${score?.score ?? "—"}</strong></p>
    <p class="xr-conf-line">Evidence confidence <strong>${score?.evidence_confidence_pct ?? "—"}%</strong></p>
    <p class="xr-status-line">${score?.status || "—"}</p>
    <dl class="xr-dl">
      <dt>What it is</dt><dd>${node?.what || "—"}</dd>
      <dt>Why it matters</dt><dd>${node?.why_matters || "—"}</dd>
      <dt>Who controls it</dt><dd>${controllers}</dd>
      <dt>Who / what depends on it</dt><dd>${depLabels}</dd>
      <dt>Substitution difficulty</dt><dd>${obs?.substitution_difficulty ?? "—"}<div class="xr-rationale">${obs?.substitution_difficulty_rationale || ""}</div></dd>
      <dt>What could relieve it</dt><dd>${(node?.relief_levers || []).join("; ") || "—"}</dd>
      <dt>What would falsify this bottleneck</dt><dd>${node?.falsify || "—"}</dd>
    </dl>
    <h4>Severity drivers</h4>
    <ul class="reason-list">${driversHtml(score?.drivers || [], obs)}</ul>
    <h4>Supporting evidence</h4>
    <ul class="reason-list">${
      evidence.length
        ? evidence
            .map((c) => {
              const src = c.source_url
                ? ` — <a href="${c.source_url}" target="_blank" rel="noopener">${c.source_title || "source"}</a> <span class="xr-src-date">(${c.source_date || "?"}, ${c.source_class || "?"})</span>`
                : " — no source";
              return `<li><span class="xr-claim-type">${c.claim_type}</span> [${c.data_class}] ${c.statement}${src}</li>`;
            })
            .join("")
        : "<li>No claims attached yet.</li>"
    }</ul>
  `;

  const current = cascade.stages[0];
  const stage2 = cascade.stages[1];
  const curNode = ranked.find((r) => r.node_id === current.bottleneck_id);
  $("xr-current").innerHTML = `
    <h2>Current bottleneck</h2>
    <p class="level-badge">${nodes.find((n) => n.id === current.bottleneck_id)?.label} · ${current.score}</p>
    <p class="xr-status-line">${curNode?.status || current.status || ""}</p>
    <p class="muted-note">Severity drivers (confidence not included):</p>
    <ul class="reason-list">${driversHtml(current.drivers, curNode?.observation)}</ul>
    <p class="xr-next-label">If this bottleneck is relieved →</p>
    <p class="level-badge xr-next">${nodes.find((n) => n.id === stage2?.bottleneck_id)?.label || "—"} · ${stage2?.score ?? "—"}</p>
    <p class="muted-note">${cascade.disclaimer}</p>
  `;
}

function renderCascade(cascade, nodes) {
  $("xr-cascade").innerHTML = cascade.stages
    .map((s, i) => {
      const label = nodes.find((n) => n.id === s.bottleneck_id)?.label || s.bottleneck_id;
      return `<li><span>${s.label}</span><strong>#${i + 1} ${label}</strong><em>${s.score}</em></li>`;
    })
    .join("");
}

async function main() {
  const base = new URL("./", import.meta.url);
  // app lives in /xray/ so data paths are relative to this module when imported from HTML at /tools/
  // Load via absolute-from-site paths:
  const root = "../xray/";
  const [scenario, entitiesFile, nodesFile, relFile, constraints, evidence, weights] = await Promise.all([
    loadJson(root + "data/scenario.json"),
    loadJson(root + "data/entities.json"),
    loadJson(root + "data/nodes.json"),
    loadJson(root + "data/relationships.json"),
    loadJson(root + "data/constraints.json"),
    loadJson(root + "data/evidence.json"),
    loadJson(root + "config/weights.json")
  ]);

  const entities = entitiesFile.entities;
  const nodes = nodesFile.nodes;
  const rels = relFile.relationships;
  const claims = evidence.claims;
  const ranked = rankConstraints(constraints.observations, weights);
  const cascade = runCascade(constraints.observations, weights);

  $("xr-title").textContent = scenario.title;
  $("xr-scenario").textContent = `Scaling target: ${scenario.scaling_target}`;
  $("xr-disclaimer").textContent = scenario.disclaimer;

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

  // expose for console / tests
  window.__xray = { ranked, cascade, weights, scenario };
}

main().catch((err) => {
  console.error(err);
  const el = $("xr-title");
  if (el) el.textContent = "X-Ray failed to load — see console";
});
