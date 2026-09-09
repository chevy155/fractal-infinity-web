export function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function classTag(value) {
  const map = { OBSERVED: "edm-tag-obs", INFERRED: "edm-tag-inf", ESTIMATED: "edm-tag-est", DISPUTED: "edm-tag-dis", UNKNOWN: "edm-tag-unk", MODELED: "edm-tag-inf" };
  return `<span class="edm-tag ${map[value] || "edm-tag-unk"}">${escapeHtml(value)}</span>`;
}
export function nodeById(nodes, id) { return nodes.find((node) => node.id === id); }
export function upstream(edges, id) { return edges.filter((edge) => edge.from === id); }
export function downstream(edges, id) { return edges.filter((edge) => edge.to === id); }
export function evidenceFor(evidence, id) { return evidence.filter((item) => item.subjects?.includes(id)); }

function neighborsHtml(title, edges, direction, nodes, interactive = false) {
  if (!edges.length) return `<p class="edm-empty">No ${escapeHtml(title.toLowerCase())} recorded at this depth.</p>`;
  return `<h3>${escapeHtml(title)}</h3><ul class="edm-neighbor-list">${edges.map((edge) => {
    const id = direction === "upstream" ? edge.to : edge.from;
    const node = nodeById(nodes, id);
    const label = `<span class="edm-rel">${escapeHtml(edge.rel.replaceAll("_", " "))}</span> <strong>${escapeHtml(node?.label || id)}</strong><span class="edm-rel-why">${escapeHtml(edge.why)}</span>${classTag(edge.class)}`;
    return `<li>${interactive ? `<button type="button" class="edm-neighbor-btn" data-id="${escapeHtml(id)}">${label}</button>` : label}</li>`;
  }).join("")}</ul>`;
}

export function buildDetailHtml({ investigation, node, up, down, nodeEvidence, concentration, mode = "both" }) {
  const signals = concentration.filter((signal) => signal.nodes.includes(node?.id));
  const expansion = mode === "upstream" ? neighborsHtml("What this depends on", up, "upstream", investigation.nodes) : mode === "downstream" ? neighborsHtml("What depends on this", down, "downstream", investigation.nodes) : neighborsHtml("What this depends on", up, "upstream", investigation.nodes) + neighborsHtml("What depends on this", down, "downstream", investigation.nodes);
  const evidence = nodeEvidence.length ? nodeEvidence.map((item) => `<li>${classTag(item.data_class)} <span class="xr-claim-type">${escapeHtml(item.claim_type)}</span> ${escapeHtml(item.statement)} — <a href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener">${escapeHtml(item.source_title)}</a> <span class="xr-src-date">(${escapeHtml(item.source_date)})</span></li>`).join("") : "<li>No direct evidence attached to this node.</li>";
  const signalsHtml = signals.length ? `<div class="edm-node-signals"><h3>Concentration signals</h3>${signals.map((signal) => `<p><strong>${escapeHtml(signal.title)}</strong> — ${escapeHtml(signal.summary)} ${classTag(signal.class)}</p>`).join("")}</div>` : "";
  return `<p class="edm-question">${escapeHtml(investigation.title)}</p><dl class="xr-dl edm-dl"><dt>What it is</dt><dd>${escapeHtml(node?.what || "—")}</dd><dt>Why it matters</dt><dd>${escapeHtml(node?.why_matters || "—")}</dd><dt>If this scales</dt><dd class="edm-scale">${escapeHtml(node?.if_scales || "—")}</dd></dl>${signalsHtml}<div class="edm-expansion">${expansion}</div><h3>Evidence</h3><ul class="reason-list edm-evidence">${evidence}</ul>`;
}

function list(values) { return Array.isArray(values) && values.length ? `<ul class="reason-list">${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>` : '<p class="muted-note">—</p>'; }
export function buildConcentrationHtml(signals) { return `<h2>Concentration signals</h2><p class="muted-note">Exposure flags are modeled unless a primary source proves a binding condition today.</p>${signals.map((signal) => `<article class="edm-signal-card"><strong>${escapeHtml(signal.title)}</strong><span>${escapeHtml(signal.summary)}</span>${classTag(signal.class)}</article>`).join("")}`; }
export function buildIntelligenceHtml(layer) {
  if (!layer) return "";
  const conf = layer.confidence || {}; const watch = layer.watch_signals || {};
  return `<h2>Intelligence layer</h2><p class="xr-badge">${escapeHtml(layer.data_class || "MODELED")} · interpretation of the supply-chain map · not investment advice</p><dl class="xr-dl"><dt>What is happening</dt><dd>${escapeHtml(layer.current_reality)}</dd><dt>Why it matters</dt><dd>${escapeHtml(layer.why_it_matters)}</dd>${layer.what_changes_from_prior ? `<dt>What changes from the prior generation</dt><dd>${escapeHtml(layer.what_changes_from_prior)}</dd>` : ""}<dt>What it means</dt><dd>${escapeHtml(layer.what_it_means)}</dd><dt>What could happen next</dt><dd>${escapeHtml(layer.what_could_happen_next)}<p class="muted-note">${escapeHtml(layer.if_this_scales)}</p></dd><dt>Concentration may move</dt><dd>${escapeHtml(layer.concentration_migration)}</dd><dt>Who may gain leverage</dt><dd>${list(layer.gains_leverage)}</dd><dt>Who may lose leverage</dt><dd>${list(layer.loses_leverage)}</dd><dt>Second-order consequence</dt><dd>${escapeHtml(layer.second_order_effect)}</dd><dt>What to watch — confirm</dt><dd>${list(watch.confirm)}</dd><dt>What to watch — weaken</dt><dd>${list(watch.invalidate)}</dd><dt>Uncertainty</dt><dd>${escapeHtml(conf.rationale)}</dd><dt>Next question</dt><dd>${escapeHtml(layer.next_question)}</dd></dl><p class="muted-note">${escapeHtml(layer.disclaimer)}</p>`;
}

export function buildModel({ investigation, edgesFile, evidenceFile, concentrationFile, intelligence }) {
  const nodes = investigation.nodes; const edges = edgesFile.edges; const evidence = evidenceFile.evidence; const concentration = concentrationFile.signals;
  const node = nodeById(nodes, investigation.anchor);
  return { investigation, nodes, edges, evidence, concentration, intelligence, detailHtml: buildDetailHtml({ investigation, node, up: upstream(edges, investigation.anchor), down: downstream(edges, investigation.anchor), nodeEvidence: evidenceFor(evidence, investigation.anchor), concentration }), concentrationHtml: buildConcentrationHtml(concentration), intelligenceHtml: buildIntelligenceHtml(intelligence) };
}
