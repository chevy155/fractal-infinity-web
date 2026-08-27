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

const CONF_LEVELS = {
  HIGH: "Multiple strong independent evidence lineages support the primary drivers.",
  MEDIUM: "Evidence is credible but important inputs include inference or limited independent verification.",
  LOW: "Important inputs depend heavily on assumptions, sparse evidence, or unresolved uncertainty."
};

const SLIDER_META = [
  { key: "hbm_demand", label: "HBM demand growth", low: "Low", high: "Very high" },
  { key: "packaging_constraint", label: "Packaging constraint", low: "Low", high: "Severe" },
  { key: "price_pressure", label: "Price pressure", low: "Low", high: "Severe" },
  { key: "customer_diversification", label: "Customer diversification", low: "Low", high: "High" },
  { key: "ai_accelerator_growth", label: "AI accelerator growth", low: "Low", high: "Very high" },
  { key: "supply_chain_disruption", label: "Supply-chain disruption", low: "Low", high: "Severe" },
  { key: "hbm4_transition_speed", label: "HBM4 transition speed", low: "Slow", high: "Fast" }
];

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

function updateScenarioDesc() {
  const el = $("scenarioDesc");
  if (el) el.textContent = SCENARIO_DESC[presetKey] || "";
}

function updateRunCta() {
  const btn = $("runBtn");
  if (btn && !btn.disabled) btn.textContent = `Run ${worldCount.toLocaleString()} future worlds`;
}

function refreshLive() {
  const live = liveState(DATA.companies, DATA.technology, sliders);
  if (scene) scene.setCompanies(live.companies);
  trajectory = buildTrajectory(DATA.companies, DATA.technology, sliders, presetKey);
  drawTrajectoryChart($("trajChart"), trajectory, selectedYear);
  renderYearPanel();
}

function renderSliders() {
  $("sliderPanel").innerHTML = SLIDER_META.map(s => `
    <label class="mc-slider-row">
      <span class="mc-slider-label">${s.label}</span>
      <input type="range" min="0" max="100" value="${Math.round(sliders[s.key] * 100)}" data-key="${s.key}" />
      <span class="mc-slider-ends"><span>${s.low}</span><span>${s.high}</span></span>
    </label>`).join("");
}

function renderVerdict(result, summary) {
  $("verdict").innerHTML = result.leader === "tie"
    ? `<p class="mc-verdict-name">Dead heat</p><p class="mc-verdict-pct">~${result.tiesPct}% tied worlds</p>`
    : `<p class="mc-verdict-name">${summary.leader.toUpperCase()} leads</p>
       <p class="mc-verdict-pct">~${summary.winPct}% of modeled worlds</p>
       <dl class="mc-verdict-meta">
         <div><dt>Selected world</dt><dd>${summary.preset}</dd></div>
         <div><dt>Evidence confidence</dt><dd>${summary.evidenceConfidence}</dd></div>
       </dl>`;
}

function renderSummary(summary) {
  $("worldSummary").innerHTML = `
    <div class="mc-summary-section"><h3>Why</h3><p>${summary.why}</p></div>
    <div class="mc-summary-section"><h3>What changed</h3><ul>${summary.changed.map(c => `<li>${c}</li>`).join("")}</ul></div>
    <div class="mc-summary-section"><h3>What would flip it</h3><p>${summary.flip}</p></div>`;
}

function renderDrivers(collapsed) {
  const other = 100 - (collapsed.top[collapsed.top.length - 1]?.cumulative || 0);
  $("driverBlock").innerHTML = collapsed.top.slice(0, 5).map(d =>
    `<div class="mc-driver-row"><span>${d.label}</span><span>${d.share}%</span></div>`
  ).join("") + (other > 0 ? `<div class="mc-driver-row mc-other"><span>Other modeled factors</span><span>${other}%</span></div>` : "");
}

function renderFlips(stateFlip) {
  const flips = stateFlip.flips.filter(f => f.flipped || Math.abs(f.marginShift) >= 8);
  $("flipList").innerHTML = flips.length ? flips.map(f => {
    const pct = Math.round(f.delta * 100);
    return f.flipped
      ? `<li><strong>${f.company}</strong> ${f.dimension} +${pct}% → ${f.company.split(" ")[0]} becomes strategic leader</li>`
      : `<li><strong>${f.company}</strong> ${f.dimension} +${pct}% → modeled margin shifts ~${Math.round(f.marginShift)} pts</li>`;
  }).join("") : `<li>Result stable within modeled state-dimension bands.</li>`;
}

function renderConfidence(level) {
  $("confidenceBlock").innerHTML = `
    <p class="mc-conf-current">Current model inputs: <strong>${level}</strong></p>
    <dl class="mc-conf-dl">${Object.entries(CONF_LEVELS).map(([k, v]) =>
      `<div class="${k === level ? "active" : ""}"><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}

function renderCompanyStates(result) {
  $("companyStates").innerHTML = result.companies.map(c => `
    <button type="button" class="mc-co-card" data-id="${c.id}">
      <h4>${c.name}</h4>
      <dl>
        <div><dt>Technology</dt><dd>${(c.coords.y * 100).toFixed(0)}%</dd></div>
        <div><dt>Manufacturing</dt><dd>${(c.coords.z * 100).toFixed(0)}%</dd></div>
        <div><dt>Commercial</dt><dd>${(c.coords.x * 100).toFixed(0)}%</dd></div>
        <div><dt>Momentum</dt><dd>${c.dynamics.momentum > 0.55 ? "HIGH" : c.dynamics.momentum > 0.35 ? "MEDIUM" : "LOW"}</dd></div>
        <div><dt>Energy</dt><dd>${c.dynamics.energy > 0.55 ? "HIGH" : c.dynamics.energy > 0.35 ? "MEDIUM" : "LOW"}</dd></div>
        <div><dt>Evidence</dt><dd>${c.evidence.level}</dd></div>
      </dl>
    </button>`).join("");
}

function renderEvidenceExplorer(collapsed, attribution) {
  const lineages = lineageAdjustedEvidence(DATA.sources);
  const prior = analystPriorShare(DATA.companies);
  $("evidenceExplorer").innerHTML = `
    <p class="mc-mono mc-ev-stats">${lineages} defensible lineages · ${DATA.sources.sources.length} sources · ${DATA.claims.count} claims · ~${prior}% analyst priors/inference</p>
    <div class="mc-ev-btns">${collapsed.rows.slice(0, 6).map(d =>
      `<button type="button" class="mc-ev-btn" data-dim="${d.id}">${d.label}</button>`).join("")}</div>`;
}

function showEvidenceForDriver(driverId) {
  const map = {
    hbm_readiness: "hbm_technology_readiness",
    customer_qualification: "customer_qualification",
    manufacturing_scale: "hbm_production_scale",
    packaging_strength: "advanced_packaging",
    capital_resilience: "capital_strength",
    execution_momentum: "execution_velocity"
  };
  const stateKey = map[driverId] || driverId;
  const co = DATA.companies[0];
  const ids = co.state_weights[stateKey] || [];
  const v = co.variables.find(x => x.id === ids[0]);
  if (!v) return;
  showEvidence(v.id, co.id);
}

function showEvidence(varId, coId) {
  const company = DATA.companies.find(c => c.id === coId) || DATA.companies[0];
  const v = company.variables.find(x => x.id === varId);
  if (!v) return;
  const claims = (v.claim_ids || []).map(id => DATA.claims.claims.find(c => c.id === id)).filter(Boolean);
  const srcMap = Object.fromEntries(DATA.sources.sources.map(s => [s.id, s]));
  $("evTitle").textContent = `${company.name} · ${v.label}`;
  $("evBody").innerHTML = `
    <p><b>Value:</b> ${typeof v.value === "number" ? v.value.toFixed(2) : v.value} · <b>${v.type}</b> · confidence ${(v.confidence * 100).toFixed(0)}%</p>
    <ul>${claims.map(c => `<li><span class="tag-${c.type.toLowerCase()}">${c.type}</span> ${c.text}</li>`).join("") || "<li>No linked claim</li>"}</ul>
    <ul>${(v.sources || []).map(id => { const s = srcMap[id]; return s ? `<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a><br>${s.publisher} · ${s.date} · ${s.lineage}</li>` : ""; }).join("")}</ul>`;
  $("evPanel").classList.add("on");
}

function showCompanyInspector(coId) {
  const live = liveState(DATA.companies, DATA.technology, sliders);
  const co = live.companies.find(c => c.id === coId);
  if (!co) return;
  $("evTitle").textContent = co.name;
  $("evBody").innerHTML = `
    <dl class="mc-inspector">
      <div><dt>Technology position</dt><dd>${co.coords.y.toFixed(2)}</dd></div>
      <div><dt>Manufacturing strength</dt><dd>${co.coords.z.toFixed(2)}</dd></div>
      <div><dt>Commercial capture</dt><dd>${co.coords.x.toFixed(2)}</dd></div>
      <div><dt>Momentum</dt><dd>${co.dynamics.momentum.toFixed(2)}</dd></div>
      <div><dt>Energy</dt><dd>${co.dynamics.energy.toFixed(2)}</dd></div>
      <div><dt>Evidence confidence</dt><dd>${co.evidence.level}</dd></div>
    </dl>`;
  $("evPanel").classList.add("on");
  if (scene) scene.select(coId);
}

function renderYearPanel() {
  const pt = trajectory.find(t => t.year === selectedYear);
  if (!pt || !collapsedCache) return;
  const ys = yearSummary(pt, collapsedCache);
  $("yearPanel").innerHTML = `
    <p class="mc-year-lead"><strong>${ys.year}</strong> — ${ys.leader} leads</p>
    <p>${ys.text}</p>
    <p class="mc-mono">Evidence confidence: ${ys.confidence}</p>`;
}

function renderYearButtons() {
  $("yearBtns").innerHTML = [2026, 2027, 2028, 2029, 2030, 2031, 2032].map(y =>
    `<button type="button" class="mc-year ${y === selectedYear ? "active" : ""}" data-y="${y}">${y}</button>`).join("");
}

function showResults() {
  $("resultsEmpty").hidden = true;
  $("resultsBody").hidden = false;
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

    renderVerdict(result, summary);
    renderSummary(summary);
    renderDrivers(collapsed);
    renderFlips(stateFlip);
    renderConfidence(summary.evidenceConfidence);
    renderCompanyStates(result);
    renderEvidenceExplorer(collapsed, attribution);
    refreshLive();
    renderYearPanel();
    showResults();
  } catch (err) {
    console.error(err);
    showResults();
    $("verdict").innerHTML = `<p class="mc-verdict-name">Error</p><p>${err.message}</p>`;
  } finally {
    btn.disabled = false;
    updateRunCta();
  }
}

function bindUI() {
  document.querySelectorAll(".mc-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mc-preset").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      presetKey = btn.dataset.p;
      updateScenarioDesc();
      refreshLive();
    });
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
    refreshLive();
    if (collapsedCache) {
      const attribution = computeDriverAttribution(DATA.companies);
      collapsedCache = collapsedDrivers(attribution);
      renderDrivers(collapsedCache);
    }
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
    const card = e.target.closest(".mc-co-card");
    if (card) { showCompanyInspector(card.dataset.id); return; }
    const ev = e.target.closest(".mc-ev-btn");
    if (ev) { showEvidenceForDriver(ev.dataset.dim); return; }
  });

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scene = createScene3D($("scene3d"), { reducedMotion: reduced });

  renderSliders();
  renderYearButtons();
  updateScenarioDesc();
  updateRunCta();
  collapsedCache = collapsedDrivers(computeDriverAttribution(DATA.companies));
  refreshLive();
}

async function init() {
  if (!$("runBtn")) return;
  try {
    await loadData();
    bindUI();
  } catch (err) {
    $("resultsEmpty").hidden = true;
    $("resultsBody").hidden = false;
    $("verdict").textContent = "Failed to load: " + err.message;
  }
}

init();
