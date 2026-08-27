import { runSimulation, buildTrajectory, liveState, DEFAULT_SLIDERS } from "./engine/simulator.js";
import { analyzeStateFlips } from "./engine/state-flips.js";
import { buildWorldSummary, yearSummary } from "./engine/summary.js";
import { computeDriverAttribution, collapsedDrivers, lineageAdjustedEvidence, analystPriorShare } from "./engine/drivers.js";
import { createScene3D, drawTrajectoryChart } from "./scene3d.js";

const DATA = { companies: [] };
let presetKey = "all";
let worldCount = 10000;
let sliders = { ...DEFAULT_SLIDERS };
let scene = null;
let trajectory = [];
let selectedYear = 2026;
let collapsedCache = null;
let lastSummary = null;

const SCENARIO_DESC = {
  all: "Balanced mix of plausible AI-memory futures.",
  ai_supercycle: "AI infrastructure demand remains extremely strong.",
  hbm_shortage: "Memory supply remains the binding constraint on AI deployment.",
  hbm4_transition: "Next-generation qualification and ramp execution determine leadership.",
  packaging_crisis: "Advanced packaging capacity becomes the dominant bottleneck.",
  price_war: "Supply catches demand and HBM pricing/margins compress.",
  nvidia_diversifies: "Major accelerator customers deliberately increase supplier diversification.",
  china_korea_shock: "Geopolitical and regional supply-chain disruption changes production risk.",
  inference_explosion: "Inference demand dominates future AI infrastructure requirements.",
  memory_wall: "Compute improves faster than memory bandwidth — HBM becomes more strategically valuable."
};

const SLIDER_META = [
  { key: "hbm_demand", label: "HBM demand" },
  { key: "packaging_constraint", label: "Packaging constraint" },
  { key: "price_pressure", label: "Price pressure" },
  { key: "customer_diversification", label: "Customer diversification" },
  { key: "ai_accelerator_growth", label: "Accelerator growth" },
  { key: "supply_chain_disruption", label: "Supply disruption" },
  { key: "hbm4_transition_speed", label: "HBM4 transition" }
];

const CO_IDS = ["sk_hynix", "micron", "samsung"];

async function loadData() {
  const base = "crucible/memory/data/";
  const map = {
    sources: "sources.json", claims: "claims.json", technology: "technology.json",
    sk_hynix: "sk-hynix.json", micron: "micron.json", samsung: "samsung.json",
    graph: "graph.json", scenarios: "scenarios.json"
  };
  await Promise.all(Object.entries(map).map(async ([k, f]) => {
    DATA[k] = await (await fetch(base + f)).json();
  }));
  DATA.companies = [DATA.sk_hynix, DATA.micron, DATA.samsung];
}

function $(id) { return document.getElementById(id); }

function lvl(v, t = 0.55, m = 0.35) {
  return v > t ? "HIGH" : v > m ? "MED" : "LOW";
}

function updateScenarioDesc() {
  const el = $("scenarioDesc");
  if (el) el.textContent = SCENARIO_DESC[presetKey] || "";
}

function updateRunCta() {
  const btn = $("runBtn");
  if (btn && !btn.disabled) btn.textContent = `Run ${worldCount.toLocaleString()} worlds`;
}

function renderSliders() {
  $("sliderPanel").innerHTML = SLIDER_META.map(s => `
    <label class="mc-slider-compact">
      <span>${s.label}</span>
      <input type="range" min="0" max="100" value="${Math.round(sliders[s.key] * 100)}" data-key="${s.key}" aria-label="${s.label}" />
    </label>`).join("");
}

function renderExecutive(result, summary, collapsed, stateFlip) {
  const other = 100 - (collapsed.top[collapsed.top.length - 1]?.cumulative || 0);
  const drivers = collapsed.top.slice(0, 3).map(d =>
    `<div class="mc-exec-driver"><span>${d.label}</span><span class="mc-mono">${d.share}%</span></div>`
  ).join("") + (other > 0 ? `<div class="mc-exec-driver mc-other"><span>Other</span><span class="mc-mono">${other}%</span></div>` : "");

  $("executiveBody").innerHTML = `
    <p class="mc-exec-text">${summary.executive}</p>
    <div class="mc-exec-meta">
      <div class="mc-exec-drivers">
        <p class="mc-exec-sub">Key drivers</p>
        ${drivers}
      </div>
      <div class="mc-exec-badges">
        <div><span class="mc-badge-label">Evidence</span><span class="mc-badge">${summary.evidenceConfidence}</span></div>
        <div><span class="mc-badge-label">Model stability</span><span class="mc-badge">${summary.stability.split(" — ")[0]}</span></div>
      </div>
    </div>`;

  $("executivePlaceholder").hidden = true;
  $("executiveRead").hidden = false;
  $("sensitivityPanel").hidden = false;
  $("evConfInline").textContent = summary.evidenceConfidence;
  renderSensitivity(stateFlip, summary);
}

function renderSensitivity(stateFlip, summary) {
  const flipped = stateFlip.flips.filter(f => f.flipped);
  const near = stateFlip.flips.filter(f => !f.flipped && Math.abs(f.marginShift) >= 5);

  let html = "";
  if (!flipped.length) {
    html += `<p class="mc-sens-lead">The current result is structurally stable. No single modeled state dimension shifted by +15% changes the strategic leader.</p>`;
    html += `<p class="mc-sens-sub">Nearest challenger conditions:</p><ul class="mc-sens-list">`;
    const challengers = [
      { name: "Micron", items: ["HBM4 readiness ↑", "Customer qualification ↑"] },
      { name: "Samsung", items: ["Qualification strength ↑", "Execution velocity ↑"] }
    ];
    for (const c of challengers) {
      html += `<li><strong>${c.name}</strong> — ${c.items.join(" · ")}</li>`;
    }
    for (const f of near.slice(0, 2)) {
      html += `<li><strong>${f.company.split(" ")[0]}</strong> ${f.dimension} +${Math.round(f.delta * 100)}% narrows margin ~${Math.round(Math.abs(f.marginShift))} pts</li>`;
    }
    html += `</ul>`;
  } else {
    html += `<ul class="mc-sens-list">${flipped.map(f =>
      `<li><strong>${f.company}</strong> ${f.dimension} +${Math.round(f.delta * 100)}% → becomes strategic leader</li>`
    ).join("")}</ul>`;
  }
  html += `<p class="mc-sens-note">Sensitivity tests — not predictions.</p>`;
  $("sensitivityBody").innerHTML = html;
}

function renderCompanyTable(live) {
  const rows = [
    { key: "tech", label: "Technology", fn: c => (c.coords.y * 100).toFixed(0) },
    { key: "comm", label: "Commercial", fn: c => (c.coords.x * 100).toFixed(0) },
    { key: "mfg", label: "Manufacturing", fn: c => (c.coords.z * 100).toFixed(0) },
    { key: "mom", label: "Momentum", fn: c => lvl(c.dynamics.momentum) },
    { key: "eng", label: "Energy", fn: c => lvl(c.dynamics.energy) },
    { key: "ev", label: "Evidence", fn: c => c.evidence.level === "MEDIUM" ? "MED" : c.evidence.level.slice(0, 3) }
  ];
  const byId = Object.fromEntries(live.companies.map(c => [c.id, c]));
  $("companyTable").querySelector("tbody").innerHTML = rows.map(r =>
    `<tr data-row="${r.key}"><th>${r.label}</th>${CO_IDS.map(id =>
      `<td><button type="button" class="mc-table-cell" data-id="${id}">${r.fn(byId[id])}</button></td>`
    ).join("")}</tr>`
  ).join("");
}

function renderEvidenceFooter(collapsed) {
  const lineages = lineageAdjustedEvidence(DATA.sources);
  const prior = analystPriorShare(DATA.companies);
  $("evStats").textContent = `${DATA.claims.count} claims · ${DATA.sources.sources.length} sources · ${lineages} defensible lineages`;
  $("priorLine").textContent = `Share of scored model inputs containing analyst inference: ~${prior}%`;
  $("evidenceExplorer").innerHTML = collapsed.rows.slice(0, 6).map(d =>
    `<button type="button" class="mc-ev-btn" data-dim="${d.id}">${d.label}</button>`).join("");
}

function refreshLive() {
  const live = liveState(DATA.companies, DATA.technology, sliders);
  if (scene) scene.setCompanies(live.companies);
  trajectory = buildTrajectory(DATA.companies, DATA.technology, sliders, presetKey);
  drawTrajectoryChart($("trajChart"), trajectory, selectedYear);
  renderCompanyTable(live);
  renderYearPanel();
}

function renderYearPanel() {
  const pt = trajectory.find(t => t.year === selectedYear);
  if (!pt || !collapsedCache) return;
  const ys = yearSummary(pt, collapsedCache);
  $("yearPanel").innerHTML = `
    <p class="mc-mono"><strong>${ys.year}</strong> — ${ys.leader} remains ahead.</p>
    <p>Primary driver: ${ys.driver.toLowerCase()}. Largest state: ${ys.stateChange}. Evidence: ${ys.confidence}.</p>`;
}

function renderYearButtons() {
  $("yearBtns").innerHTML = [2026, 2027, 2028, 2029, 2030, 2031, 2032].map(y =>
    `<button type="button" class="mc-year ${y === selectedYear ? "active" : ""}" data-y="${y}">${y}</button>`).join("");
}

function showEvidenceForDriver(driverId) {
  const map = {
    hbm_readiness: "hbm_technology_readiness", customer_qualification: "customer_qualification",
    manufacturing_scale: "hbm_production_scale", packaging_strength: "advanced_packaging",
    capital_resilience: "capital_strength", execution_momentum: "execution_velocity"
  };
  const stateKey = map[driverId] || driverId;
  const co = DATA.companies[0];
  const v = co.variables.find(x => x.id === (co.state_weights[stateKey] || [])[0]);
  if (v) showEvidence(v.id, co.id);
}

function showEvidence(varId, coId) {
  const company = DATA.companies.find(c => c.id === coId) || DATA.companies[0];
  const v = company.variables.find(x => x.id === varId);
  if (!v) return;
  const claims = (v.claim_ids || []).map(id => DATA.claims.claims.find(c => c.id === id)).filter(Boolean);
  const srcMap = Object.fromEntries(DATA.sources.sources.map(s => [s.id, s]));
  $("evTitle").textContent = `${company.name} · ${v.label}`;
  $("evBody").innerHTML = `
    <p><b>${typeof v.value === "number" ? v.value.toFixed(2) : v.value}</b> · ${v.type} · ${(v.confidence * 100).toFixed(0)}%</p>
    <ul>${claims.slice(0, 4).map(c => `<li><span class="tag-${c.type.toLowerCase()}">${c.type}</span> ${c.text.slice(0, 120)}</li>`).join("")}</ul>
    <ul>${(v.sources || []).slice(0, 3).map(id => { const s = srcMap[id]; return s ? `<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a> · ${s.publisher} · ${s.lineage}</li>` : ""; }).join("")}</ul>`;
  $("evPanel").classList.add("on");
}

function showCompanyInspector(coId) {
  const live = liveState(DATA.companies, DATA.technology, sliders);
  const co = live.companies.find(c => c.id === coId);
  if (!co) return;
  $("evTitle").textContent = co.name;
  $("evBody").innerHTML = `<dl class="mc-inspector">
    <div><dt>Technology</dt><dd>${(co.coords.y * 100).toFixed(0)}</dd></div>
    <div><dt>Commercial</dt><dd>${(co.coords.x * 100).toFixed(0)}</dd></div>
    <div><dt>Manufacturing</dt><dd>${(co.coords.z * 100).toFixed(0)}</dd></div>
    <div><dt>Momentum</dt><dd>${co.dynamics.momentum.toFixed(2)}</dd></div>
    <div><dt>Energy</dt><dd>${co.dynamics.energy.toFixed(2)}</dd></div>
    <div><dt>Evidence</dt><dd>${co.evidence.level}</dd></div></dl>`;
  $("evPanel").classList.add("on");
  scene?.select(coId);
}

async function runSim() {
  const btn = $("runBtn");
  btn.disabled = true;
  btn.textContent = "Running…";
  try {
    await new Promise(r => setTimeout(r, 30));
    const result = runSimulation({
      companies: DATA.companies, tech: DATA.technology, scenarios: DATA.scenarios,
      presetKey, worldCount, sliders
    });
    const attribution = computeDriverAttribution(DATA.companies);
    const collapsed = collapsedDrivers(attribution);
    collapsedCache = collapsed;
    const stateFlip = analyzeStateFlips({
      companies: DATA.companies, tech: DATA.technology, scenarios: DATA.scenarios,
      presetKey, sliders, worldCount: Math.min(1500, worldCount)
    });
    const summary = buildWorldSummary(result, stateFlip, collapsed);
    lastSummary = summary;
    renderExecutive(result, summary, collapsed, stateFlip);
    renderEvidenceFooter(collapsed);
    refreshLive();
    scene?.render();
  } catch (err) {
    console.error(err);
    $("executiveBody").innerHTML = `<p class="mc-exec-text">Error: ${err.message}</p>`;
    $("executiveRead").hidden = false;
  } finally {
    btn.disabled = false;
    updateRunCta();
  }
}

function bindUI() {
  $("scenarioSelect").addEventListener("change", e => {
    presetKey = e.target.value;
    updateScenarioDesc();
    refreshLive();
  });
  document.querySelectorAll(".mc-size").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mc-size").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      worldCount = +btn.dataset.n;
      updateRunCta();
    });
  });
  $("runBtn").addEventListener("click", runSim);
  $("evClose").addEventListener("click", () => $("evPanel").classList.remove("on"));
  $("reset3d")?.addEventListener("click", () => scene?.resetView());

  $("sliderPanel").addEventListener("input", e => {
    const key = e.target.dataset.key;
    if (!key) return;
    sliders[key] = +e.target.value / 100;
    collapsedCache = collapsedDrivers(computeDriverAttribution(DATA.companies));
    refreshLive();
  });

  document.body.addEventListener("click", e => {
    const yb = e.target.closest(".mc-year");
    if (yb) {
      selectedYear = +yb.dataset.y;
      renderYearButtons();
      drawTrajectoryChart($("trajChart"), trajectory, selectedYear);
      renderYearPanel();
      return;
    }
    const cell = e.target.closest(".mc-table-cell");
    if (cell) { showCompanyInspector(cell.dataset.id); return; }
    const ev = e.target.closest(".mc-ev-btn");
    if (ev) { showEvidenceForDriver(ev.dataset.dim); return; }
  });

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scene = createScene3D($("scene3d"), { reducedMotion: reduced, fallbackEl: $("sceneFallback") });

  renderSliders();
  renderYearButtons();
  updateScenarioDesc();
  updateRunCta();
  collapsedCache = collapsedDrivers(computeDriverAttribution(DATA.companies));
  renderEvidenceFooter(collapsedCache);
  refreshLive();
}

async function init() {
  if (!$("runBtn")) return;
  try {
    await loadData();
    bindUI();
  } catch (err) {
    $("executivePlaceholder").innerHTML = `<p>Failed to load: ${err.message}</p>`;
  }
}

init();
