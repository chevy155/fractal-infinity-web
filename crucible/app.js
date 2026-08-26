import { runSimulation } from "./engine/simulator.js";
import { analyzeStateFlips } from "./engine/state-flips.js";
import { buildWorldSummary } from "./engine/summary.js";
import { computeDriverAttribution, collapsedDrivers, lineageAdjustedEvidence } from "./engine/drivers.js";

const DATA = {};
let presetKey = "all";
let worldCount = 10000;
let hasRun = false;

const SCENARIO_DESC = {
  all: "Balanced mix of plausible future conditions.",
  ai_supercycle: "AI infrastructure demand remains exceptionally strong.",
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
  technology_maturity: "technology_maturity"
};

const CONF_LEVELS = {
  HIGH: "Multiple strong, independent sources support the main drivers.",
  MEDIUM: "Good evidence exists, but some important inputs rely on inference or limited independent verification.",
  LOW: "Important drivers depend heavily on analyst assumptions, sparse evidence, or unresolved uncertainty."
};

async function loadData() {
  const base = "crucible/data/";
  const files = ["sources.json", "claims.json", "technology.json", "ayar.json", "lightmatter.json", "graph.json", "scenarios.json"];
  await Promise.all(files.map(async (f) => {
    const r = await fetch(base + f);
    DATA[f.replace(".json", "")] = await r.json();
  }));
}

function $(id) { return document.getElementById(id); }

function outcomeRows(out) {
  return [
    ["Survival", out.survival], ["Scale", out.scale], ["Leadership", out.leadership],
    ["Acquisition", out.acquisition], ["Niche", out.niche], ["Failure", out.failure]
  ];
}

function combinedConfidence(summary) {
  const { ayar, lightmatter } = summary.evidenceConfidence;
  if (ayar === "LOW" || lightmatter === "LOW") return "LOW";
  if (ayar === "HIGH" && lightmatter === "HIGH") return "HIGH";
  return "MEDIUM";
}

function updateScenarioDesc() {
  const el = $("scenarioDesc");
  if (el) el.textContent = SCENARIO_DESC[presetKey] || "";
}

function updateRunCta() {
  const btn = $("runBtn");
  if (btn && !btn.disabled) {
    btn.textContent = `Run ${worldCount.toLocaleString()} future worlds`;
  }
}

function renderParticle(side, co, animPhase) {
  const el = $(side === "ayar" ? "particleA" : "particleB");
  const d = co.dynamics;
  const m = co.avgMomentum;
  const e = co.avgEnergy;
  const r = 28 + d.mass * 34;
  const x = (d.velocity - 0.5) * 36 + Math.sin(animPhase + (side === "ayar" ? 0 : 1.2)) * 8;
  const y = (m - 0.35) * -28 + Math.cos(animPhase * 0.7) * 6;
  el.style.width = el.style.height = `${r * 2}px`;
  el.style.transform = `translate(${x}px, ${y}px)`;
  el.querySelector(".p-momentum").textContent = `Momentum ${m.toFixed(2)}`;
  el.querySelector(".p-energy").textContent = `Energy ${e.toFixed(2)}`;
  el.querySelector(".p-mass").textContent = `Mass ${d.mass.toFixed(2)}`;
  el.querySelector(".p-vel").textContent = `Velocity ${d.velocity.toFixed(2)}`;
}

function renderOutcomes(side, co) {
  const host = $(side === "ayar" ? "outcomesA" : "outcomesB");
  host.innerHTML = outcomeRows(co.outcomes).map(([l, v]) =>
    `<div class="out-row"><span>${l}</span><span class="out-bar"><i style="width:${v}%"></i></span><span>${v}%</span></div>`
  ).join("");
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

function renderDriverBlock(collapsed) {
  const rows = collapsed.top.slice(0, 6).map(d =>
    `<div class="driver-row"><span>${d.label}</span><span class="cr-mono">${d.share}%</span></div>`
  ).join("");
  const otherShare = 100 - (collapsed.top[collapsed.top.length - 1]?.cumulative || 0);
  const other = otherShare > 0
    ? `<div class="driver-row driver-other"><span>Other modeled factors</span><span class="cr-mono">${otherShare}%</span></div>`
    : "";
  $("driverBlock").innerHTML = rows + other;
}

function renderSummaryHtml(summary) {
  $("worldSummary").innerHTML = `
    <div class="cr-summary-section">
      <h3 class="cr-h3">Why this happened</h3>
      <p>${summary.why}</p>
    </div>
    <div class="cr-summary-section">
      <h3 class="cr-h3">What changed in this world</h3>
      <ul>${summary.changed.map(c => `<li>${c}</li>`).join("")}</ul>
    </div>`;
}

function renderFlips(stateFlip) {
  const flips = stateFlip.flips.filter(f => f.flipped || Math.abs(f.marginShift) >= 10);
  if (!flips.length) {
    $("flipList").innerHTML = `<li>Result is stable within modeled state-dimension bands at current evidence levels.</li>`;
    return;
  }
  $("flipList").innerHTML = flips.map(f => {
    const pct = Math.round(f.delta * 100);
    const sign = f.delta > 0 ? "+" : "";
    if (f.flipped) {
      return `<li><strong>${f.company}</strong> ${f.dimension} ${sign}${pct}% → ${f.company.split(" ")[0]} becomes the modeled leader</li>`;
    }
    const near = Math.abs(f.marginShift) >= 15 ? "Head-to-head moves to near parity" : `Modeled margin shifts ~${Math.round(f.marginShift)} pts`;
    return `<li><strong>${f.company}</strong> ${f.dimension} ${sign}${pct}% → ${near}</li>`;
  }).join("");
}

function renderVerdict(result, summary) {
  const leader = result.leader === "ayar" ? result.ayar.name : result.leader === "lightmatter" ? result.lightmatter.name : "No clear leader";
  const conf = combinedConfidence(summary);
  if (result.leader === "tie") {
    $("verdict").innerHTML = `
      <p class="cr-verdict-name">Dead heat</p>
      <p class="cr-verdict-pct">~${result.tiesPct}% of modeled worlds</p>
      <dl class="cr-verdict-meta">
        <div><dt>Selected scenario</dt><dd>${summary.preset}</dd></div>
        <div><dt>Evidence confidence</dt><dd>${conf}</dd></div>
      </dl>`;
    return;
  }
  $("verdict").innerHTML = `
    <p class="cr-verdict-name">${leader.toUpperCase()} leads</p>
    <p class="cr-verdict-pct">~${result.leaderPct}% of modeled worlds</p>
    <dl class="cr-verdict-meta">
      <div><dt>Selected scenario</dt><dd>${summary.preset}</dd></div>
      <div><dt>Evidence confidence</dt><dd>${conf}</dd></div>
    </dl>`;
}

function renderConfidence(summary) {
  const level = combinedConfidence(summary);
  $("confidenceBlock").innerHTML = `
    <p class="cr-conf-current">Current model inputs: <strong>${level}</strong></p>
    <dl class="cr-conf-dl">
      ${Object.entries(CONF_LEVELS).map(([k, v]) =>
        `<div class="${k === level ? "active" : ""}"><dt>${k}</dt><dd>${v}</dd></div>`
      ).join("")}
    </dl>`;
}

function renderEvidenceExplorer(collapsed, attribution) {
  const lineages = lineageAdjustedEvidence(DATA.sources);
  const driverMap = Object.fromEntries(attribution.drivers.map(d => [d.id, d]));

  const dimBtns = collapsed.rows.slice(0, 6).map(d => {
    const stateKey = DIM_STATE_KEY[d.id] || d.id;
    const drv = driverMap[stateKey];
    const side = drv && drv.delta >= 0 ? "lightmatter" : "ayar";
    return `<button type="button" class="cr-ev-btn" data-dim="${stateKey}" data-side="${side}">${d.label}</button>`;
  }).join("");

  const ayarVars = DATA.ayar.variables.filter(v => typeof v.value === "number" && v.confidence >= 0.7).slice(0, 3);
  const lmVars = DATA.lightmatter.variables.filter(v => typeof v.value === "number" && v.confidence >= 0.7).slice(0, 3);
  const varBtns = [
    ...ayarVars.map(v => `<button type="button" class="cr-ev-btn" data-var="${v.id}" data-side="ayar">${DATA.ayar.name}: ${v.label}</button>`),
    ...lmVars.map(v => `<button type="button" class="cr-ev-btn" data-var="${v.id}" data-side="lightmatter">${DATA.lightmatter.name}: ${v.label}</button>`)
  ].join("");

  $("evidenceExplorer").innerHTML = `
    <p class="cr-ev-stats cr-mono">${lineages} defensible lineages · ${DATA.sources.sources.length} source records · ${DATA.claims.count} claims</p>
    <p class="cr-panel-note">Click a driver or variable to inspect value, FACT/INFERENCE, confidence, publisher, date, and lineage.</p>
    <div class="cr-ev-btns">${dimBtns}${varBtns}</div>`;
}

function showResults() {
  $("resultsEmpty").hidden = true;
  $("resultsBody").hidden = false;
}

async function runSim() {
  const btn = $("runBtn");
  btn.disabled = true;
  btn.textContent = "Running…";
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
  const summary = buildWorldSummary(result, DATA.ayar, DATA.lightmatter, stateFlip);
  const attribution = computeDriverAttribution(DATA.ayar, DATA.lightmatter);
  const collapsed = collapsedDrivers(attribution);

  renderVerdict(result, summary);
  renderSummaryHtml(summary);
  renderDriverBlock(collapsed);
  renderOutcomes("ayar", result.ayar);
  renderOutcomes("lightmatter", result.lightmatter);
  renderFlips(stateFlip);
  renderConfidence(summary);
  renderEvidenceExplorer(collapsed, attribution);

  let phase = 0;
  const anim = () => {
    phase += 0.08;
    renderParticle("ayar", { dynamics: result.ayar.dynamics, avgMomentum: result.ayar.avgMomentum, avgEnergy: result.ayar.avgEnergy }, phase);
    renderParticle("lightmatter", { dynamics: result.lightmatter.dynamics, avgMomentum: result.lightmatter.avgMomentum, avgEnergy: result.lightmatter.avgEnergy }, phase);
  };
  anim();
  if (window._crAnim) clearInterval(window._crAnim);
  window._crAnim = setInterval(anim, 120);

  hasRun = true;
  showResults();
  btn.disabled = false;
  updateRunCta();
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

  document.body.addEventListener("click", e => {
    const evBtn = e.target.closest(".cr-ev-btn");
    if (evBtn) {
      if (evBtn.dataset.var) showEvidence(evBtn.dataset.var, evBtn.dataset.side);
      else if (evBtn.dataset.dim) showDimensionEvidence(evBtn.dataset.dim, evBtn.dataset.side);
      return;
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
    bindUI();
  } catch (err) {
    $("resultsEmpty").hidden = true;
    $("resultsBody").hidden = false;
    $("verdict").textContent = "Failed to load Crucible data: " + err.message;
  }
}

init();
