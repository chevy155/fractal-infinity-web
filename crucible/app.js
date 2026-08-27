import { runSimulation } from "./engine/simulator.js";
import { analyzeStateFlips } from "./engine/state-flips.js";
import { buildWorldSummary, yearSummary } from "./engine/summary.js";
import { computeDriverAttribution, collapsedDrivers, lineageAdjustedEvidence } from "./engine/drivers.js";
import { buildTrajectory, liveCompanies } from "./engine/trajectory.js";
import { createScene3D, drawTrajectoryChart } from "./scene3d.js";
import { renderDriverVectors, drawDriverSurface, renderOutcomes, renderSensitivityFlow } from "./viz.js";

const DATA = {};
let presetKey = "all";
let worldCount = 10000;
let scene = null;
let trajectory = [];
let selectedYear = 2026;
let collapsedCache = null;
let lastResult = null;
let lastSummary = null;
let liveCache = [];

const SCENARIO_DESC = {
  all: "Balanced mix of plausible future conditions.",
  ai_supercycle: "Sustained AI infrastructure demand increases the value of interconnect execution, ecosystem pull, and qualification momentum.",
  capital_winter: "Funding becomes scarce and capital-intensive companies face pressure.",
  packaging_bottleneck: "Advanced packaging and manufacturing capacity become dominant constraints.",
  optical_breakout: "Optical interconnect adoption accelerates faster than expected.",
  optical_delay: "Electrical interconnect remains competitive longer than expected.",
  supply_shock: "Manufacturing and geopolitical disruption dominate."
};

const DIM_STATE_KEY = {
  packaging_integration: "manufacturing_readiness",
  commercial_momentum: "commercial_momentum",
  capital_resilience: "capital_resilience",
  market_timing: "market_timing",
  technology_maturity: "technology_maturity",
  technology_readiness: "technology_maturity"
};

const STATE_LABELS = {
  commercial_momentum: "Commercial momentum",
  technology_maturity: "Technology readiness",
  manufacturing_readiness: "Packaging integration",
  capital_resilience: "Capital resilience",
  ecosystem_strength: "Ecosystem strength",
  execution_quality: "Execution quality",
  competitive_position: "Competitive position",
  market_timing: "Market timing"
};

async function loadData() {
  const base = "crucible/data/";
  const files = ["sources.json", "claims.json", "technology.json", "ayar.json", "lightmatter.json", "graph.json", "scenarios.json"];
  await Promise.all(files.map(async (f) => {
    DATA[f.replace(".json", "")] = await (await fetch(base + f)).json();
  }));
}

function $(id) { return document.getElementById(id); }

function updateScenarioDesc() {
  const el = $("scenarioDesc");
  if (el) el.textContent = SCENARIO_DESC[presetKey] || "";
}

function updateRunCta() {
  const btn = $("runBtn");
  if (btn && !btn.disabled) btn.textContent = `Run ${worldCount.toLocaleString()} worlds`;
}

function showEvidence(varId, side) {
  const company = DATA[side];
  const v = company.variables.find(x => x.id === varId);
  if (!v) return;
  const claims = (v.claim_ids || []).map(id => DATA.claims.claims.find(c => c.id === id)).filter(Boolean);
  const srcMap = Object.fromEntries(DATA.sources.sources.map(s => [s.id, s]));
  $("evTitle").textContent = `${company.name} · ${v.label}`;
  $("evBody").innerHTML = `
    <p class="ev-val"><b>Value:</b> ${typeof v.value === "number" ? v.value.toFixed(2) : v.value}</p>
    <p class="ev-val"><b>Type:</b> ${v.type} · <b>Confidence:</b> ${(v.confidence * 100).toFixed(0)}% · <b>As of:</b> ${v.as_of}</p>
    <p class="ev-val"><b>Claim supported:</b></p>
    <ul class="ev-claims">${claims.map(c => `<li><span class="tag-${c.type.toLowerCase()}">${c.type}</span> ${c.text} <span class="ev-conf">${(c.confidence * 100).toFixed(0)}%</span></li>`).join("") || "<li>No linked claim</li>"}</ul>
    <p class="ev-val"><b>Sources:</b></p>
    <ul class="ev-src">${(v.sources || []).map(id => {
      const s = srcMap[id];
      return s ? `<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a><br><span class="ev-meta">${s.publisher || "—"} · ${s.date} · lineage: ${s.lineage}</span></li>` : "";
    }).join("") || "<li>No source linked</li>"}</ul>`;
  $("evPanel").classList.add("on");
}

function showDimensionEvidence(stateKey, side) {
  const company = DATA[side];
  const ids = company.state_weights[stateKey] || [];
  const vars = ids.map(id => company.variables.find(x => x.id === id)).filter(Boolean);
  if (!vars.length) return;
  const primary = vars.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
  showEvidence(primary.id, side);
}

function renderInspector(coId) {
  const co = liveCache.find(c => c.id === coId);
  if (!co) return;
  $("inspTitle").textContent = co.name.toUpperCase();
  const rows = Object.entries(co.state).map(([k, v]) =>
    `<div><dt>${STATE_LABELS[k] || k}</dt><dd class="cr-mono cr-insp-val" data-key="${k}" data-side="${coId}">${v.toFixed(2)}</dd></div>`
  ).join("");
  const dyn = `<div><dt>Mass</dt><dd class="cr-mono">${co.dynamics.mass.toFixed(2)}</dd></div>
    <div><dt>Velocity</dt><dd class="cr-mono">${co.dynamics.velocity.toFixed(2)}</dd></div>
    <div><dt>Momentum</dt><dd class="cr-mono">${co.dynamics.momentum.toFixed(2)}</dd></div>
    <div><dt>Energy</dt><dd class="cr-mono">${co.dynamics.energy.toFixed(2)}</dd></div>
    <div><dt>Evidence confidence</dt><dd>${co.evidence.level}</dd></div>`;
  $("inspBody").innerHTML = rows + dyn;
  $("coInspector").hidden = false;
  scene?.select(coId);
}

function renderExecutive(result, summary, collapsed) {
  const leader = summary.winner;
  const other = 100 - (collapsed.top[collapsed.top.length - 1]?.cumulative || 0);
  const drivers = collapsed.top.slice(0, 3).map(d =>
    `<div class="cr-exec-driver"><span>${d.label}</span><span class="cr-mono">${d.share}%</span></div>`
  ).join("") + (other > 0 ? `<div class="cr-exec-driver cr-other"><span>Other</span><span class="cr-mono">${other}%</span></div>` : "");

  $("executiveBody").innerHTML = `
    <p class="cr-exec-text">${summary.executive}</p>
    <div class="cr-exec-meta">
      <div class="cr-exec-drivers">
        <p class="cr-exec-sub">Top drivers</p>
        ${drivers}
      </div>
      <div class="cr-exec-badges">
        <div><span class="cr-badge-label">Strategic leader</span><span class="cr-badge">${leader}</span></div>
        <div><span class="cr-badge-label">Modeled lead</span><span class="cr-badge">~${result.leaderPct}%</span></div>
        <div><span class="cr-badge-label">Evidence</span><span class="cr-badge">${summary.combinedConfidence}</span></div>
        <div><span class="cr-badge-label">Stability</span><span class="cr-badge">${summary.stability}</span></div>
      </div>
    </div>`;

  $("executivePlaceholder").hidden = true;
  $("executiveRead").hidden = false;
  $("sensitivityPanel").hidden = false;
  $("evConfInline").textContent = summary.combinedConfidence;
}

function renderYearButtons() {
  $("yearBtns").innerHTML = [2026, 2027, 2028, 2029, 2030, 2031, 2032].map(y =>
    `<button type="button" class="cr-year ${y === selectedYear ? "active" : ""}" data-y="${y}">${y}</button>`).join("");
}

function renderYearPanel() {
  const idx = trajectory.findIndex(t => t.year === selectedYear);
  const pt = trajectory[idx];
  if (!pt || !collapsedCache) return;
  const prev = idx > 0 ? trajectory[idx - 1] : null;
  const ys = yearSummary(pt, collapsedCache, prev);
  $("yearPanel").innerHTML = `<p>${ys.text}</p>`;
}

function refreshLive() {
  liveCache = liveCompanies(DATA.ayar, DATA.lightmatter);
  if (scene) scene.setCompanies(liveCache);
  trajectory = buildTrajectory(DATA.ayar, DATA.lightmatter);
  drawTrajectoryChart($("trajChart"), trajectory, selectedYear);
  renderDriverVectors($("driverVectors"), DATA.ayar, DATA.lightmatter, (key, side) => {
    showDimensionEvidence(key, side);
  });
  drawDriverSurface($("driverSurface"), DATA.ayar, DATA.lightmatter);
  renderYearPanel();
}

function renderEvidenceFooter(collapsed) {
  const lineages = lineageAdjustedEvidence(DATA.sources);
  $("evStats").textContent = `${DATA.claims.count} claims · ${DATA.sources.sources.length} sources · ${lineages} defensible evidence lineages`;
  $("evidenceExplorer").innerHTML = collapsed.rows.slice(0, 6).map(d => {
    const stateKey = DIM_STATE_KEY[d.id] || d.id;
    return `<button type="button" class="cr-ev-btn" data-dim="${stateKey}" data-side="lightmatter">${d.label}</button>`;
  }).join("");
}

async function runSim() {
  const btn = $("runBtn");
  btn.disabled = true;
  btn.textContent = "Running…";
  try {
    await new Promise(r => setTimeout(r, 40));

    const result = runSimulation({
      ayar: DATA.ayar,
      lightmatter: DATA.lightmatter,
      tech: DATA.technology,
      scenarios: DATA.scenarios,
      presetKey,
      worldCount
    });
    const stateFlip = analyzeStateFlips({
      ayar: DATA.ayar, lightmatter: DATA.lightmatter, tech: DATA.technology,
      scenarios: DATA.scenarios, presetKey, worldCount: Math.min(2000, worldCount)
    });
    const attribution = computeDriverAttribution(DATA.ayar, DATA.lightmatter);
    const collapsed = collapsedDrivers(attribution);
    collapsedCache = collapsed;
    lastResult = result;
    lastSummary = buildWorldSummary(result, DATA.ayar, DATA.lightmatter, stateFlip, collapsed);

    renderExecutive(result, lastSummary, collapsed);
    renderOutcomes($("outcomeBlock"), result.ayar, result.lightmatter, DATA.ayar.name, DATA.lightmatter.name);
    renderSensitivityFlow($("sensitivityBody"), stateFlip.flips);
    renderEvidenceFooter(collapsed);
    refreshLive();
    drawDriverSurface($("driverSurface"), DATA.ayar, DATA.lightmatter);
  } catch (err) {
    console.error(err);
    $("executivePlaceholder").hidden = true;
    $("executiveRead").hidden = false;
    $("executiveBody").innerHTML = `<p class="cr-exec-text">Simulation error: ${err.message}</p>`;
  } finally {
    btn.disabled = false;
    updateRunCta();
  }
}

function bindUI() {
  document.querySelectorAll(".cr-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cr-preset").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      presetKey = btn.dataset.p;
      updateScenarioDesc();
    });
  });

  document.querySelectorAll(".cr-size").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cr-size").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      worldCount = +btn.dataset.n;
      updateRunCta();
    });
  });

  $("runBtn").addEventListener("click", runSim);
  $("reset3d")?.addEventListener("click", () => scene?.resetView());

  document.body.addEventListener("click", e => {
    const evBtn = e.target.closest(".cr-ev-btn");
    if (evBtn) {
      if (evBtn.dataset.var) showEvidence(evBtn.dataset.var, evBtn.dataset.side);
      else if (evBtn.dataset.dim) showDimensionEvidence(evBtn.dataset.dim, evBtn.dataset.side);
      return;
    }
    const yearBtn = e.target.closest(".cr-year");
    if (yearBtn) {
      selectedYear = +yearBtn.dataset.y;
      document.querySelectorAll(".cr-year").forEach(b => b.classList.toggle("active", +b.dataset.y === selectedYear));
      drawTrajectoryChart($("trajChart"), trajectory, selectedYear);
      renderYearPanel();
      return;
    }
    const insp = e.target.closest(".cr-insp-val");
    if (insp) {
      showDimensionEvidence(insp.dataset.key, insp.dataset.side);
    }
  });

  $("evClose").addEventListener("click", () => $("evPanel").classList.remove("on"));
  updateScenarioDesc();
  updateRunCta();
}

async function init() {
  if (!$("runBtn")) return;
  try {
    await loadData();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scene = createScene3D($("crScene3d"), {
      reducedMotion,
      fallbackEl: $("crSceneFallback"),
      onSelect: renderInspector
    });
    renderYearButtons();
    refreshLive();
    bindUI();
  } catch (err) {
    $("executivePlaceholder").textContent = "Failed to load Crucible data: " + err.message;
  }
}

init();
