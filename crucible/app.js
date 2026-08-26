import { runSimulation, contributionAnalysis } from "./engine/simulator.js";
import { analyzeFlipConditions } from "./engine/sensitivity.js";
import { buildWorldSummary, formatSummaryText } from "./engine/summary.js";
import { computeDriverAttribution, collapsedDrivers, lineageAdjustedEvidence } from "./engine/drivers.js";

const DATA = {};
let presetKey = "all";
let lastResult = null;

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

function renderContributions(side, analysis) {
  const host = $(side === "ayar" ? "contribA" : "contribB");
  host.innerHTML = analysis.top.map(it => {
    const sign = it.value >= 0 ? "+" : "";
    const cls = it.value >= 0 ? "pos" : "neg";
    return `<button type="button" class="contrib-row ${cls}" data-var="${it.id}" data-side="${side}"><span>${it.label}</span><span>${sign}${it.value}</span></button>`;
  }).join("");
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
    <p class="ev-val"><b>Value:</b> ${typeof v.value === "number" ? v.value.toFixed(2) : v.value} · <b>${v.type}</b> · confidence ${(v.confidence * 100).toFixed(0)}% · as of ${v.as_of}</p>
    <ul class="ev-claims">${claims.map(c => `<li><span class="tag-${c.type.toLowerCase()}">${c.type}</span> ${c.text} <span class="ev-conf">${(c.confidence * 100).toFixed(0)}%</span></li>`).join("")}</ul>
    <ul class="ev-src">${(v.sources || []).map(id => { const s = srcMap[id]; return s ? `<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a> · ${s.date} · ${s.lineage}</li>` : ""; }).join("")}</ul>`;
  $("evPanel").classList.add("on");
}

function renderDriverBlock(result, summary, collapsed, attribution) {
  const leader = result.leader === "ayar" ? result.ayar.name.toUpperCase() :
    result.leader === "lightmatter" ? result.lightmatter.name.toUpperCase() : "NO CLEAR LEADER";
  const lineages = lineageAdjustedEvidence(DATA.sources);
  const rows = collapsed.top.map((d, i) =>
    `<div class="driver-row"><span>${i + 1}. ${d.label}</span><span>${d.share}%</span></div>`
  ).join("");
  $("driverBlock").innerHTML = `
    <p class="driver-headline"><b>${leader} LEADS: ${result.leaderPct}%</b></p>
    <p class="driver-sub">Result is primarily driven by (${collapsed.top.length} effective dimensions explain ~${collapsed.top[collapsed.top.length - 1]?.cumulative || 80}%):</p>
    ${rows}
    <p class="driver-meta">89 research variables · 8 state dimensions · ${collapsed.effectiveCount} drivers explain ≥80% of margin<br>
    Evidence strength: <b>${summary.evidenceConfidence.ayar === "HIGH" && summary.evidenceConfidence.lightmatter === "HIGH" ? "MEDIUM-HIGH" : "MEDIUM"}</b> ·
    Independent source lineages: <b>${lineages}</b> (not ${DATA.sources.independent_lineages})<br>
    <span class="driver-note">Research inventory ≠ decision dimensions. ±12% single-variable moves rarely flip outcomes; state-level gaps dominate.</span></p>`;
}

function renderFlips(flip) {
  $("flipList").innerHTML = (flip.flips.length ? flip.flips : [{ company: "—", variable: "No flip in ±15% single-variable pass", leadershipDelta: 0 }])
    .map(f => `<li>${f.company}: ${f.variable}${f.leadershipDelta ? ` (${f.leadershipDelta > 0 ? "+" : ""}${f.leadershipDelta} pts)` : ""}${f.flipped ? " · <b>flips leader</b>" : ""}</li>`).join("");
}

function renderSummary(summary) {
  $("worldSummary").textContent = formatSummaryText(summary);
}

function renderVerdict(result, summary) {
  const leader = result.leader === "ayar" ? result.ayar.name : result.leader === "lightmatter" ? result.lightmatter.name : "No clear leader";
  $("verdict").innerHTML = result.leader === "tie"
    ? `Dead heat across ${result.N.toLocaleString()} worlds (${summary.preset}).`
    : `<b>${leader}</b> leads in <span class="pct">${result.leaderPct}%</span> of ${result.N.toLocaleString()} simulated worlds (${summary.preset}). Same outcome tier tie rate: ${result.tiesPct}%. Evidence confidence: Ayar <b>${summary.evidenceConfidence.ayar}</b> · Lightmatter <b>${summary.evidenceConfidence.lightmatter}</b>. Model result ≠ real-world certainty.`;
}

async function runSim() {
  const btn = $("runBtn");
  btn.disabled = true;
  btn.textContent = "Running…";
  const worldCount = +$("worldCount").value;
  await new Promise(r => setTimeout(r, 40));

  const result = runSimulation({
    ayar: DATA.ayar,
    lightmatter: DATA.lightmatter,
    tech: DATA.technology,
    scenarios: DATA.scenarios,
    presetKey,
    worldCount
  });
  const flip = analyzeFlipConditions({
    ayar: DATA.ayar, lightmatter: DATA.lightmatter, tech: DATA.technology,
    scenarios: DATA.scenarios, presetKey, worldCount: Math.min(2000, worldCount)
  });
  const summary = buildWorldSummary(result, DATA.ayar, DATA.lightmatter, flip);
  const attribution = computeDriverAttribution(DATA.ayar, DATA.lightmatter);
  const collapsed = collapsedDrivers(attribution);
  lastResult = { result, flip, summary, attribution, collapsed };

  renderVerdict(result, summary);
  renderSummary(summary);
  renderOutcomes("ayar", result.ayar);
  renderOutcomes("lightmatter", result.lightmatter);
  renderContributions("ayar", contributionAnalysis(DATA.ayar));
  renderContributions("lightmatter", contributionAnalysis(DATA.lightmatter));
  renderFlips(flip);
  renderDriverBlock(result, summary, collapsed, attribution);

  let phase = 0;
  const anim = () => {
    phase += 0.08;
    renderParticle("ayar", { dynamics: result.ayar.dynamics, avgMomentum: result.ayar.avgMomentum, avgEnergy: result.ayar.avgEnergy }, phase);
    renderParticle("lightmatter", { dynamics: result.lightmatter.dynamics, avgMomentum: result.lightmatter.avgMomentum, avgEnergy: result.lightmatter.avgEnergy }, phase);
  };
  anim();
  if (window._crAnim) clearInterval(window._crAnim);
  window._crAnim = setInterval(anim, 120);

  $("results").classList.add("on");
  btn.disabled = false;
  btn.textContent = "Run Simulation";
}

function bindUI() {
  document.querySelectorAll(".cr-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cr-preset").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      presetKey = btn.dataset.p;
    });
  });
  $("runBtn").addEventListener("click", runSim);
  document.body.addEventListener("click", e => {
    const row = e.target.closest(".contrib-row");
    if (row) showEvidence(row.dataset.var, row.dataset.side);
  });
  $("evClose").addEventListener("click", () => $("evPanel").classList.remove("on"));
}

async function init() {
  if (!$("runBtn")) return;
  try {
    await loadData();
    bindUI();
  } catch (err) {
    $("verdict").textContent = "Failed to load Crucible data: " + err.message;
    $("results").classList.add("on");
  }
}

init();
