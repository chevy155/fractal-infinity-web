export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function entityName(entities, id) {
  return entities.find((e) => e.id === id)?.name || id;
}

export function dependents(rels, nodeId) {
  return rels.filter((r) => r.to === nodeId).map((r) => r.from);
}

export function driversHtml(drivers, obs) {
  return drivers
    .map((d) => {
      const rationale =
        obs?.[`${d.key}_rationale`] || (d.key === "scarcity" ? null : obs?.[`${d.key}_rationale`]);
      const scarcityRationale =
        d.key === "scarcity"
          ? [
              obs?.capacity_pressure_rationale && `capacity_pressure: ${obs.capacity_pressure_rationale}`,
              obs?.supplier_concentration_rationale &&
                `supplier_concentration: ${obs.supplier_concentration_rationale}`,
              obs?.lead_time_pressure_rationale && `lead_time_pressure: ${obs.lead_time_pressure_rationale}`
            ]
              .filter(Boolean)
              .join(" ")
          : null;
      const note = d.key === "scarcity" ? scarcityRationale : rationale;
      const val = typeof d.value === "number" ? d.value.toFixed(3) : d.value;
      return `<li><code>${escapeHtml(d.key)}</code> = ${escapeHtml(val)}${
        note ? `<div class="xr-rationale">${escapeHtml(note)}</div>` : ""
      }</li>`;
    })
    .join("");
}

export function buildRankHtml(ranked, nodes, selectedId) {
  return ranked
    .map((row, i) => {
      const node = nodes.find((n) => n.id === row.node_id);
      return `<button type="button" class="xr-rank-item${
        row.node_id === selectedId ? " is-active" : ""
      }"><span class="xr-rank-n">#${i + 1}</span><span class="xr-rank-label">${escapeHtml(
        node?.label || row.node_id
      )}<small class="xr-rank-status">${escapeHtml(row.status)}</small></span><span class="xr-rank-score">${escapeHtml(
        row.score
      )}</span></button>`;
    })
    .join("");
}

export function buildDetailHtml(nodeId, ctx) {
  const { nodes, entities, rels, claims, ranked, cascade } = ctx;
  const node = nodes.find((n) => n.id === nodeId);
  const score = ranked.find((r) => r.node_id === nodeId);
  const obs = score?.observation;
  const deps = dependents(rels, nodeId);
  const evidence = claims.filter((c) => c.subject === nodeId);

  const controllers = (node?.controllers || []).map((id) => entityName(entities, id)).join(", ") || "—";
  const depLabels = deps.map((id) => nodes.find((n) => n.id === id)?.label || id).join(", ") || "—";
  const evidenceHtml = evidence.length
    ? evidence
        .map((c) => {
          const src = c.source_url
            ? ` — <a href="${escapeHtml(c.source_url)}" target="_blank" rel="noopener">${escapeHtml(
                c.source_title || "source"
              )}</a> <span class="xr-src-date">(${escapeHtml(c.source_date || "?")}, ${escapeHtml(
                c.source_class || "?"
              )})</span>`
            : " — no source";
          return `<li><span class="xr-claim-type">${escapeHtml(c.claim_type)}</span> [${escapeHtml(
            c.data_class
          )}] ${escapeHtml(c.statement)}${src}</li>`;
        })
        .join("")
    : "<li>No claims attached yet.</li>";

  return `
    <h2>Selected node</h2>
    <p class="xr-badge">${escapeHtml(obs?.data_class || "MODELED")} · severity CALCULATED · confidence separate</p>
    <h3>${escapeHtml(node?.label || nodeId)}</h3>
    <p class="xr-scoreline">Constraint severity <strong>${escapeHtml(score?.score ?? "—")}</strong></p>
    <p class="xr-conf-line">Evidence confidence <strong>${escapeHtml(score?.evidence_confidence_pct ?? "—")}%</strong></p>
    <p class="xr-status-line">${escapeHtml(score?.status || "—")}</p>
    <dl class="xr-dl">
      <dt>What it is</dt><dd>${escapeHtml(node?.what || "—")}</dd>
      <dt>Why it matters</dt><dd>${escapeHtml(node?.why_matters || "—")}</dd>
      <dt>Who controls it</dt><dd>${escapeHtml(controllers)}</dd>
      <dt>Who / what depends on it</dt><dd>${escapeHtml(depLabels)}</dd>
      <dt>Substitution difficulty</dt><dd>${escapeHtml(obs?.substitution_difficulty ?? "—")}${
        obs?.substitution_difficulty_rationale
          ? `<div class="xr-rationale">${escapeHtml(obs.substitution_difficulty_rationale)}</div>`
          : ""
      }</dd>
      <dt>What could relieve it</dt><dd>${escapeHtml((node?.relief_levers || []).join("; ") || "—")}</dd>
      <dt>What would falsify this bottleneck</dt><dd>${escapeHtml(node?.falsify || "—")}</dd>
      ${
        node?.opportunity_on_relief
          ? `<dt>Opportunity to investigate after relief</dt><dd>${escapeHtml(node.opportunity_on_relief)}</dd>`
          : ""
      }
    </dl>
    <h4>Severity drivers</h4>
    <ul class="reason-list">${driversHtml(score?.drivers || [], obs)}</ul>
    <h4>Supporting evidence</h4>
    <ul class="reason-list">${evidenceHtml}</ul>
  `;
}

export function buildCurrentHtml(ctx) {
  const { nodes, ranked, cascade } = ctx;
  const current = cascade.stages[0];
  const stage2 = cascade.stages[1];
  const curNode = ranked.find((r) => r.node_id === current.bottleneck_id);
  const currentNode = nodes.find((n) => n.id === current.bottleneck_id);
  const nextNode = nodes.find((n) => n.id === stage2?.bottleneck_id);

  return `
    <h2>Current bottleneck</h2>
    <p class="level-badge">${escapeHtml(currentNode?.label || current.bottleneck_id)} · ${escapeHtml(current.score)}</p>
    <p class="xr-status-line">${escapeHtml(curNode?.status || current.status || "")}</p>
    <p class="muted-note">Severity drivers (confidence not included):</p>
    <ul class="reason-list">${driversHtml(current.drivers, curNode?.observation)}</ul>
    <p class="xr-next-label">If this bottleneck is relieved →</p>
    <p class="level-badge xr-next">${escapeHtml(nextNode?.label || "—")} · ${escapeHtml(stage2?.score ?? "—")}</p>
    ${
      currentNode?.opportunity_on_relief
        ? `<p class="muted-note"><strong>Opportunity to investigate:</strong> ${escapeHtml(
            currentNode.opportunity_on_relief
          )}</p>`
        : ""
    }
    <p class="muted-note">${escapeHtml(cascade.disclaimer)}</p>
  `;
}

export function buildCascadeHtml(cascade, nodes) {
  return cascade.stages
    .map((s, i) => {
      const label = nodes.find((n) => n.id === s.bottleneck_id)?.label || s.bottleneck_id;
      return `<li><span>${escapeHtml(s.label)}</span><strong>#${i + 1} ${escapeHtml(label)}</strong><em>${escapeHtml(
        s.score
      )}</em></li>`;
    })
    .join("");
}

export function buildIntelligenceHtml(layer, ranked, cascade, nodes) {
  if (!layer) return "";

  const top = ranked[0];
  const next = cascade.stages[1];
  const topLabel = nodes.find((n) => n.id === top?.node_id)?.label || top?.node_id;
  const nextLabel = nodes.find((n) => n.id === next?.bottleneck_id)?.label || next?.bottleneck_id;
  const conf = layer.confidence || {};
  const watch = layer.watch_signals || {};
  const list = (arr) =>
    Array.isArray(arr) && arr.length
      ? `<ul class="reason-list">${arr.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
      : '<p class="muted-note">—</p>';

  return `
    <h2>Intelligence layer</h2>
    <p class="xr-badge">${escapeHtml(layer.data_class || "MODELED")} · interpretation of ranking · not investment advice</p>
    <p class="xr-status-line">${escapeHtml(conf.band || "—")} CONFIDENCE${
      typeof conf.level === "number" ? ` · ${Math.round(conf.level * 100)}%` : ""
    }</p>
    <dl class="xr-dl">
      <dt>Current reality</dt>
      <dd>${escapeHtml(layer.current_reality || "—")}</dd>
      <dt>Constraint migration</dt>
      <dd>${escapeHtml(layer.constraint_migration || "—")}
        <p class="muted-note">${escapeHtml(topLabel)} (${escapeHtml(top?.score ?? "—")}) → ${escapeHtml(
          nextLabel
        )} (${escapeHtml(next?.score ?? "—")}) · engine cascade</p>
      </dd>
      <dt>Who gains leverage</dt>
      <dd>${list(layer.gains_leverage)}</dd>
      <dt>Who loses leverage</dt>
      <dd>${list(layer.loses_leverage)}</dd>
      <dt>Second-order effect</dt>
      <dd>${escapeHtml(layer.second_order_effect || "—")}</dd>
      <dt>Opportunity</dt>
      <dd>${escapeHtml(layer.opportunity || "—")}</dd>
      <dt>Watch signals — confirm</dt>
      <dd>${list(watch.confirm)}</dd>
      <dt>Watch signals — invalidate</dt>
      <dd>${list(watch.invalidate)}</dd>
      <dt>Confidence</dt>
      <dd>${escapeHtml(conf.rationale || "—")}</dd>
      ${layer.next_question ? `<dt>Next question</dt><dd>${escapeHtml(layer.next_question)}</dd>` : ""}
    </dl>
    <p class="muted-note">${escapeHtml(layer.disclaimer || "")}</p>
  `;
}

export function buildXrayModel({
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
}) {
  const entities = entitiesFile.entities;
  const nodes = nodesFile.nodes;
  const rels = relFile.relationships;
  const claims = evidence.claims;
  const ranked = rankConstraints(constraints.observations, weights);
  const cascade = runCascade(constraints.observations, weights);

  return {
    scenario,
    entities,
    nodes,
    rels,
    claims,
    intelligence,
    ranked,
    cascade
  };
}
