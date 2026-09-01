const $ = (id) => document.getElementById(id);

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed ${path}`);
  return res.json();
}

function nodeById(nodes, id) {
  return nodes.find((n) => n.id === id);
}

function edgesUpstream(edges, id) {
  return edges.filter((e) => e.from === id);
}

function edgesDownstream(edges, id) {
  return edges.filter((e) => e.to === id);
}

function evidenceByIds(evidence, ids) {
  if (!ids?.length) return [];
  return evidence.filter((e) => ids.includes(e.id));
}

function evidenceForNode(evidence, nodeId) {
  return evidence.filter((e) => e.subjects?.includes(nodeId));
}

function classTag(cls) {
  const map = {
    OBSERVED: "edm-tag-obs",
    INFERRED: "edm-tag-inf",
    ESTIMATED: "edm-tag-est",
    DISPUTED: "edm-tag-dis",
    UNKNOWN: "edm-tag-unk"
  };
  return `<span class="edm-tag ${map[cls] || "edm-tag-unk"}">${cls}</span>`;
}

function renderSignals(signals, nodes, evidence, onSelect) {
  const el = $("edm-signals");
  el.innerHTML = `<h2>What must move if this scales</h2><p class="muted-note">Non-obvious dependencies and second-order demand suggested by the map.</p>`;
  signals.forEach((s) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "edm-signal-card";
    card.innerHTML = `<strong>${s.title}</strong><span>${s.summary}</span>${classTag(s.class)}`;
    card.addEventListener("click", () => {
      const first = s.nodes[0];
      if (first) onSelect(first);
    });
    el.appendChild(card);
  });
}

function renderNeighbors(title, edges, direction, nodes, onSelect) {
  if (!edges.length) return `<p class="edm-empty">No ${title.toLowerCase()} recorded at this depth.</p>`;
  return `<h3>${title}</h3><ul class="edm-neighbor-list">${edges
    .map((e) => {
      const otherId = direction === "upstream" ? e.to : e.from;
      const other = nodeById(nodes, otherId);
      return `<li><button type="button" class="edm-neighbor-btn" data-id="${otherId}"><span class="edm-rel">${e.rel.replace(/_/g, " ")}</span> <strong>${other?.label || otherId}</strong><span class="edm-rel-why">${e.why}</span>${classTag(e.class)}</button></li>`;
    })
    .join("")}</ul>`;
}

function renderDetail(nodeId, ctx, mode) {
  const { nodes, edges, evidence, signals } = ctx;
  const node = nodeById(nodes, nodeId);
  const up = edgesUpstream(edges, nodeId);
  const down = edgesDownstream(edges, nodeId);
  const nodeEvidence = evidenceForNode(evidence, nodeId);
  const relatedSignals = signals.filter((s) => s.nodes.includes(nodeId));

  $("edm-title").textContent = node?.label || nodeId;
  $("edm-type").textContent = node?.type || "—";

  const panel = $("edm-detail");
  panel.innerHTML = `
    <p class="edm-question">${ctx.investigation.title}</p>
    <dl class="xr-dl edm-dl">
      <dt>What it is</dt><dd>${node?.what || "—"}</dd>
      <dt>Why it matters</dt><dd>${node?.why_matters || "—"}</dd>
      <dt>If this scales</dt><dd class="edm-scale">${node?.if_scales || "—"}</dd>
    </dl>
    ${relatedSignals.length ? `<div class="edm-node-signals"><h3>Scaling signals</h3>${relatedSignals.map((s) => `<p><strong>${s.title}</strong> — ${s.summary} ${classTag(s.class)}</p>`).join("")}</div>` : ""}
    <div class="edm-expansion" id="edm-expansion"></div>
    <h3>Evidence</h3>
    <ul class="reason-list edm-evidence">${nodeEvidence.length ? nodeEvidence.map((ev) => `<li>${classTag(ev.data_class)} <span class="xr-claim-type">${ev.claim_type}</span> ${ev.statement} — <a href="${ev.source_url}" target="_blank" rel="noopener">${ev.source_title}</a> <span class="xr-src-date">(${ev.source_date})</span></li>`).join("") : "<li>No direct evidence attached to this node.</li>"}</ul>
  `;

  const exp = $("edm-expansion");
  if (mode === "upstream") {
    exp.innerHTML = renderNeighbors("What this depends on", up, "upstream", nodes, null);
  } else if (mode === "downstream") {
    exp.innerHTML = renderNeighbors("What depends on this", down, "downstream", nodes, null);
  } else {
    exp.innerHTML =
      renderNeighbors("What this depends on", up, "upstream", nodes, null) +
      renderNeighbors("What depends on this", down, "downstream", nodes, null);
  }

  exp.querySelectorAll(".edm-neighbor-btn").forEach((btn) => {
    btn.addEventListener("click", () => ctx.onSelect(btn.dataset.id, "both"));
  });

  $("edm-trail").innerHTML = ctx.trail
    .map(
      (id, i) =>
        `<button type="button" class="edm-trail-item${id === nodeId ? " is-active" : ""}" data-id="${id}">${nodeById(nodes, id)?.label || id}</button>${i < ctx.trail.length - 1 ? '<span class="edm-trail-sep">→</span>' : ""}`
    )
    .join("");
  $("edm-trail").querySelectorAll(".edm-trail-item").forEach((btn) => {
    btn.addEventListener("click", () => ctx.onSelect(btn.dataset.id, "both", true));
  });
}

async function main() {
  const base = new URL("./investigations/lightmatter/", import.meta.url);
  const [inv, edgeFile, evidenceFile, signalFile] = await Promise.all([
    loadJson(new URL("nodes.json", base).href),
    loadJson(new URL("edges.json", base).href),
    loadJson(new URL("evidence.json", base).href),
    loadJson(new URL("signals.json", base).href)
  ]);

  const ctx = {
    investigation: inv,
    nodes: inv.nodes,
    edges: edgeFile.edges,
    evidence: evidenceFile.evidence,
    signals: signalFile.signals,
    trail: [inv.anchor],
    onSelect: null
  };

  let mode = "both";

  function select(nodeId, nextMode = "both", trimTrail = false) {
    if (trimTrail) {
      const idx = ctx.trail.indexOf(nodeId);
      ctx.trail = idx >= 0 ? ctx.trail.slice(0, idx + 1) : [...ctx.trail, nodeId];
    } else if (ctx.trail[ctx.trail.length - 1] !== nodeId) {
      ctx.trail.push(nodeId);
    }
    mode = nextMode;
    renderDetail(nodeId, ctx, mode);
    $("edm-up").classList.toggle("is-active", mode === "upstream");
    $("edm-down").classList.toggle("is-active", mode === "downstream");
    $("edm-both").classList.toggle("is-active", mode === "both");
  }

  ctx.onSelect = select;

  $("edm-up").addEventListener("click", () => select(ctx.trail[ctx.trail.length - 1], "upstream", true));
  $("edm-down").addEventListener("click", () => select(ctx.trail[ctx.trail.length - 1], "downstream", true));
  $("edm-both").addEventListener("click", () => select(ctx.trail[ctx.trail.length - 1], "both", true));
  $("edm-reset").addEventListener("click", () => {
    ctx.trail = [inv.anchor];
    select(inv.anchor, "both", true);
  });

  renderSignals(ctx.signals, ctx.nodes, ctx.evidence, (id) => select(id, "both"));
  select(inv.anchor, "both");
}

main().catch((err) => {
  console.error(err);
  $("edm-detail").innerHTML = `<p class="muted-note">Failed to load investigation data.</p>`;
});
