import { runSimulation, liveState } from "./engine/simulator.js";
import { computeDriverAttribution, analyzeStateFlips } from "./engine/sensitivity.js";
import { buildWorldSummary, buildScenarioMatrix } from "./engine/summary.js";
import { buildWhitePaper } from "./engine/report.js";
import {
  renderMomentum, renderPulse, renderDriverBars, renderOutcomes, drawDistribution,
  renderSensitivityTable, renderThesisBreakers, renderWhitePaper, createParticleField
} from "./viz.js";
import { STATE_LABELS } from "./engine/dynamics.js";

const DATA = {};
let presetKey = "all";
let worldCount = 10000;
let field = null;
let lastResult = null;

const SCENARIO_DESC = {
  all: "Balanced mix of demand, supply, geopolitics, policy, and capital-market futures.",
  ai_infrastructure_boom: "AI/data-center electricity consumption remains exceptionally strong.",
  us_china_trade_war: "Export restrictions and industrial-policy competition intensify.",
  global_recession: "Industrial demand weakens and capital becomes expensive.",
  nuclear_renaissance: "Reactor approvals, restarts, SMRs, and nuclear procurement accelerate.",
  peace_dividend: "Major geopolitical conflicts decline and defense spending growth moderates.",
  resource_nationalism: "Governments increasingly control strategic mineral exports.",
  china_ree_shock: "China materially constrains exports of strategic rare-earth inputs.",
  uranium_supply_shock: "Major uranium production or enrichment capacity becomes unavailable.",
  commodity_capex_boom: "High prices cause aggressive new mining investment.",
  tech_acceleration: "AI + robotics + electrification + defense modernization accelerate together."
};

async function loadData() {
  const base = "crucible/materials/data/";
  const files = ["meta", "sources", "claims", "urnm", "remx", "scenarios", "events"];
  await Promise.all(files.map(async f => {
    DATA[f] = await (await fetch(base + f + ".json")).json();
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

function showEvidence(varId, fundKey) {
  const fund = DATA[fundKey];
  const v = fund.variables.find(x => x.id === varId);
  if (!v) return;
  const claims = (v.claim_ids || []).map(id => DATA.claims.claims.find(c => c.id === id)).filter(Boolean);
  const srcMap = Object.fromEntries(DATA.sources.sources.map(s => [s.id, s]));
  $("evTitle").textContent = `${fund.ticker} · ${v.label}`;
  $("evBody").innerHTML = `
    <p><b>Value:</b> ${typeof v.value === "number" ? v.value.toFixed(2) : v.value}</p>
    <p><b>Type:</b> ${v.type} · <b>Confidence:</b> ${Math.round(v.confidence * 100)}% · <b>As of:</b> ${v.as_of}</p>
    <p><b>Claims:</b></p>
    <ul>${claims.map(c => `<li><span class="tag-${c.type.toLowerCase()}">${c.type}</span> ${c.text}</li>`).join("") || "<li>None linked</li>"}</ul>
    <p><b>Sources:</b></p>
    <ul>${(v.sources || []).map(id => {
      const s = srcMap[id];
      return s ? `<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a><br><span class="sm-muted">${s.publisher} · ${s.date} · accessed ${s.retrieved}</span></li>` : "";
    }).join("")}</ul>`;
  $("evPanel").classList.add("on");
}

function showDimensionEvidence(dimId) {
  const fund = DATA.urnm;
  const ids = fund.state_weights[dimId] || [];
  const v = ids.map(id => fund.variables.find(x => x.id === id)).filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence)[0];
  if (v) showEvidence(v.id, "urnm");
  else {
    const rv = (DATA.remx.state_weights[dimId] || []).map(id => DATA.remx.variables.find(x => x.id === id)).filter(Boolean)[0];
    if (rv) showEvidence(rv.id, "remx");
  }
}

function renderSystemPulse() {
  const live = liveState(DATA.urnm, DATA.remx);
  $("pulseUrnm").innerHTML = `<h3>URNM</h3>
    <p class="sm-muted">Nuclear miners + physical U trust</p>
    <p>Dominant force: <strong>Structural nuclear demand</strong></p>
    <p>Largest risk: <strong>Faster mine/midstream supply response</strong></p>
    <p>Evidence: <strong>${live[0].evidence.level}</strong> · Momentum ${live[0].dynamics.momentum.toFixed(2)}</p>`;
  $("pulseRemx").innerHTML = `<h3>REMX</h3>
    <p class="sm-muted">REE + lithium + strategic metals</p>
    <p>Dominant force: <strong>China export-control regime</strong></p>
    <p>Largest risk: <strong>Export normalization + lithium dilution</strong></p>
    <p>Evidence: <strong>${live[1].evidence.level}</strong> · Momentum ${live[1].dynamics.momentum.toFixed(2)}</p>`;
  renderMomentum($("momUrnm"), DATA.urnm);
  renderMomentum($("momRemx"), DATA.remx);
}

function renderEvidenceExplorer() {
  const lineages = DATA.sources.independent_lineages;
  $("evStats").textContent = `${DATA.claims.count} claims · ${DATA.sources.count} sources · ${lineages} lineages · data through ${DATA.meta.data_current_through}`;
  const btns = [
    ...DATA.urnm.variables.filter(v => v.type === "FACT").slice(0, 4).map(v =>
      `<button type="button" class="sm-ev-btn" data-fund="urnm" data-var="${v.id}">URNM: ${v.label}</button>`),
    ...DATA.remx.variables.filter(v => v.type === "FACT").slice(0, 4).map(v =>
      `<button type="button" class="sm-ev-btn" data-fund="remx" data-var="${v.id}">REMX: ${v.label}</button>`)
  ];
  $("evidenceExplorer").innerHTML = btns.join("");
}

async function runSim() {
  const btn = $("runBtn");
  btn.disabled = true;
  btn.textContent = "Running…";
  try {
    await new Promise(r => setTimeout(r, 30));
    const result = runSimulation({
      urnm: DATA.urnm, remx: DATA.remx, scenarios: DATA.scenarios,
      presetKey, worldCount
    });
    const attribution = computeDriverAttribution(DATA.urnm, DATA.remx);
    const flips = analyzeStateFlips({
      urnm: DATA.urnm, remx: DATA.remx, scenarios: DATA.scenarios,
      presetKey, worldCount: Math.min(1500, worldCount)
    });
    const summary = buildWorldSummary(result, DATA.urnm, DATA.remx, flips, attribution);
    lastResult = result;

    $("execPlaceholder").hidden = true;
    $("execRead").hidden = false;
    $("resultsBlock").hidden = false;

    $("execBody").innerHTML = `
      <p class="sm-exec-text">${summary.executive}</p>
      <div class="sm-exec-meta">
        <div>${(summary.topDrivers || []).slice(0, 4).map(d =>
          `<div class="sm-exec-driver"><span>${d.label}</span><span class="sm-mono">${d.share}%</span></div>`).join("")}</div>
        <div class="sm-exec-badges">
          <div><span class="sm-badge-label">Leader</span><span class="sm-badge">${summary.leaderTicker}</span></div>
          <div><span class="sm-badge-label">Lead share</span><span class="sm-badge">~${result.leaderPct}%</span></div>
          <div><span class="sm-badge-label">Evidence</span><span class="sm-badge">${summary.evidenceConfidence}</span></div>
          <div><span class="sm-badge-label">Stability</span><span class="sm-badge">${summary.stability}</span></div>
        </div>
      </div>`;

    renderPulse($("pulseResultUrnm"), result, "urnm");
    renderPulse($("pulseResultRemx"), result, "remx");
    renderOutcomes($("outcomeBlock"), result);
    drawDistribution($("distChart"), result);
    renderDriverBars($("driverBlock"), attribution.drivers, showDimensionEvidence);
    renderSensitivityTable($("sensTable"), attribution.drivers);
    $("whyBlock").textContent = summary.executive;
    renderThesisBreakers($("breakerBlock"), DATA.urnm, DATA.remx);
    $("flipLine").textContent = summary.flip;

    field?.run(worldCount, result.leader);

    // white paper (matrix uses smaller runs)
    const matrix = buildScenarioMatrix(DATA.scenarios, DATA.urnm, DATA.remx, runSimulation);
    const paper = buildWhitePaper({
      result, summary, urnm: DATA.urnm, remx: DATA.remx,
      sources: DATA.sources, claims: DATA.claims, flipAnalysis: flips, matrix
    });
    renderWhitePaper($("whitePaper"), paper);
    $("stateRadar").innerHTML = Object.keys(STATE_LABELS).map(k => {
      const u = result.urnm.baseState[k];
      const r = result.remx.baseState[k];
      return `<div class="sm-radar-row"><span>${STATE_LABELS[k]}</span>
        <span class="sm-mono sm-u">${u.toFixed(2)}</span>
        <span class="sm-mono sm-r">${r.toFixed(2)}</span></div>`;
    }).join("");
  } catch (err) {
    console.error(err);
    $("execPlaceholder").hidden = true;
    $("execRead").hidden = false;
    $("execBody").innerHTML = `<p>Simulation error: ${err.message}</p>`;
  } finally {
    btn.disabled = false;
    updateRunCta();
  }
}

function bindUI() {
  $("scenarioSelect").addEventListener("change", e => {
    presetKey = e.target.value;
    updateScenarioDesc();
  });
  document.querySelectorAll(".sm-size").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sm-size").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      worldCount = +btn.dataset.n;
      updateRunCta();
    });
  });
  $("runBtn").addEventListener("click", runSim);
  document.body.addEventListener("click", e => {
    const b = e.target.closest(".sm-ev-btn");
    if (b) showEvidence(b.dataset.var, b.dataset.fund);
  });
  $("evClose").addEventListener("click", () => $("evPanel").classList.remove("on"));
  updateScenarioDesc();
  updateRunCta();
}

async function init() {
  if (!$("runBtn")) return;
  await loadData();
  $("dataStamp").textContent = `DATA CURRENT THROUGH: ${DATA.meta.data_current_through}`;
  renderSystemPulse();
  renderEvidenceExplorer();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  field = createParticleField($("particleField"), { reducedMotion: reduced });
  bindUI();
}

init();
