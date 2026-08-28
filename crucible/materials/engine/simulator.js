import {
  buildStateVector, computeDynamics, applyForces, structuralScore, evidenceConfidence, coords3D
} from "./dynamics.js";

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rnd, labels, weights) {
  let r = rnd() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < labels.length; i++) {
    if (r < weights[i]) return labels[i];
    r -= weights[i];
  }
  return labels[labels.length - 1];
}

function sampleForces(rnd, scenarios, presetKey) {
  const preset = scenarios.presets[presetKey];
  const out = {};
  for (const f of scenarios.forces) {
    if (preset?.fixed?.[f]) out[f] = preset.fixed[f];
    else out[f] = pickWeighted(rnd, scenarios.levels[f], scenarios.default_weights[f]);
  }
  return out;
}

/** Transmission layer: fundamentals → price proxy → equity → ETF score delta */
export function transmissionDelta(fund, state, forces) {
  const commodity = fund.id === "urnm"
    ? (state.supply_scarcity * 0.4 + state.industry_economics * 0.35 + state.structural_demand * 0.25)
    : (state.geopolitical_leverage * 0.40 + state.supply_scarcity * 0.30 + state.technological_demand * 0.30);
  const maturity = fund.id === "urnm" ? 0.72 : 0.70;
  const purity = fund.variables.find(v => v.id === "commodity_purity")?.value ?? 0.5;
  const leverage = fund.variables.find(v => v.id === "equity_leverage")?.value ?? 0.7;
  const jurisdictionDrag = (fund.variables.find(v => v.id === "jurisdiction_risk")?.value ?? 0.5) * 0.08;
  let shock = 0;
  if (fund.id === "remx") {
    if (forces.rare_earth_export_controls === "severe") shock += 0.06;
    if (forces.china_trade_tension === "war") shock += 0.04;
    if (forces.rare_earth_export_controls === "normalized") shock -= 0.05;
  } else {
    if (forces.uranium_supply_growth === "shock_down") shock += 0.05;
    if (forces.reactor_build_rate === "renaissance") shock += 0.04;
    if (forces.uranium_supply_growth === "surge") shock -= 0.04;
  }
  return (commodity - 0.5) * leverage * purity * maturity - jurisdictionDrag + shock +
    (forces.recession_probability === "recession" ? -0.05 : 0);
}

function runWorld(rnd, urnm, remx, scenarios, presetKey) {
  let su = buildStateVector(urnm);
  let sr = buildStateVector(remx);
  let lastForces = null;
  const phases = scenarios.phases || 4;
  for (let p = 0; p < phases; p++) {
    const forces = sampleForces(rnd, scenarios, presetKey);
    lastForces = forces;
    su = applyForces(su, urnm, forces, p);
    sr = applyForces(sr, remx, forces, p);
    // small stochastic noise (bounded)
    for (const k of Object.keys(su)) {
      su[k] = Math.max(0, Math.min(1, su[k] + (rnd() - 0.5) * 0.02));
      sr[k] = Math.max(0, Math.min(1, sr[k] + (rnd() - 0.5) * 0.02));
    }
  }
  const du = computeDynamics(urnm, su);
  const dr = computeDynamics(remx, sr);
  const scoreU = structuralScore(su, du) + transmissionDelta(urnm, su, lastForces) * 0.35;
  const scoreR = structuralScore(sr, dr) + transmissionDelta(remx, sr, lastForces) * 0.35;
  const cu = Math.max(0, Math.min(1, scoreU));
  const cr = Math.max(0, Math.min(1, scoreR));
  return {
    su, sr, du, dr, scoreU: cu, scoreR: cr, forces: lastForces,
    winner: Math.abs(cu - cr) < 0.02 ? "tie" : cu > cr ? "urnm" : "remx",
    margin: cu - cr
  };
}

function pctile(sorted, p) {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function runSimulation({ urnm, remx, scenarios, presetKey, worldCount }) {
  const rnd = mulberry32(scenarios.seed || 20260828);
  const N = worldCount;
  const scoresU = [], scoresR = [], margins = [];
  let winsU = 0, winsR = 0, ties = 0;
  const driverTally = {};
  let sumMu = 0, sumMr = 0, sumEu = 0, sumEr = 0;

  for (let w = 0; w < N; w++) {
    const res = runWorld(rnd, urnm, remx, scenarios, presetKey);
    scoresU.push(res.scoreU);
    scoresR.push(res.scoreR);
    margins.push(res.margin);
    if (res.winner === "urnm") winsU++;
    else if (res.winner === "remx") winsR++;
    else ties++;
    sumMu += res.du.momentum; sumMr += res.dr.momentum;
    sumEu += res.du.energy; sumEr += res.dr.energy;
    // attribute dominant force by sensitivity × force extremity
    let best = null, bestAbs = 0;
    for (const [f, lvl] of Object.entries(res.forces || {})) {
      const su = Math.abs(urnm.sensitivities[f] || 0);
      const sr = Math.abs(remx.sensitivities[f] || 0);
      const extreme = (lvl.includes("boom") || lvl.includes("war") || lvl.includes("shock") || lvl.includes("severe") || lvl.includes("renaissance") || lvl.includes("spike") || lvl.includes("recession") || lvl.includes("hot")) ? 1.5 : 1;
      const v = (su + sr) * extreme;
      if (v > bestAbs) { bestAbs = v; best = f; }
    }
    if (best) driverTally[best] = (driverTally[best] || 0) + 1;
  }

  scoresU.sort((a, b) => a - b);
  scoresR.sort((a, b) => a - b);
  margins.sort((a, b) => a - b);
  const pct = (x) => Math.round(x / N * 100);

  const baseU = buildStateVector(urnm);
  const baseR = buildStateVector(remx);
  const dynU = computeDynamics(urnm, baseU);
  const dynR = computeDynamics(remx, baseR);

  const dominantDrivers = Object.entries(driverTally)
    .map(([id, n]) => ({ id, label: id.replace(/_/g, " "), share: pct(n) }))
    .sort((a, b) => b.share - a.share);

  return {
    N,
    presetKey,
    urnm: {
      name: urnm.name,
      ticker: "URNM",
      winPct: pct(winsU),
      score: {
        current: structuralScore(baseU, dynU),
        median: pctile(scoresU, 0.5),
        bull: pctile(scoresU, 0.9),
        bear: pctile(scoresU, 0.1),
        dispersion: pctile(scoresU, 0.9) - pctile(scoresU, 0.1)
      },
      avgMomentum: sumMu / N,
      avgEnergy: sumEu / N,
      baseState: baseU,
      dynamics: dynU,
      coords: coords3D(baseU),
      evidence: evidenceConfidence(urnm)
    },
    remx: {
      name: remx.name,
      ticker: "REMX",
      winPct: pct(winsR),
      score: {
        current: structuralScore(baseR, dynR),
        median: pctile(scoresR, 0.5),
        bull: pctile(scoresR, 0.9),
        bear: pctile(scoresR, 0.1),
        dispersion: pctile(scoresR, 0.9) - pctile(scoresR, 0.1)
      },
      avgMomentum: sumMr / N,
      avgEnergy: sumEr / N,
      baseState: baseR,
      dynamics: dynR,
      coords: coords3D(baseR),
      evidence: evidenceConfidence(remx)
    },
    tiesPct: pct(ties),
    margin: {
      median: pctile(margins, 0.5),
      p10: pctile(margins, 0.1),
      p90: pctile(margins, 0.9)
    },
    leader: winsU === winsR ? "tie" : winsU > winsR ? "urnm" : "remx",
    leaderPct: pct(Math.max(winsU, winsR)),
    dominantDrivers
  };
}

export function liveState(urnm, remx) {
  const su = buildStateVector(urnm);
  const sr = buildStateVector(remx);
  return [
    { id: "urnm", name: urnm.name, ticker: "URNM", state: su, dynamics: computeDynamics(urnm, su), coords: coords3D(su), evidence: evidenceConfidence(urnm) },
    { id: "remx", name: remx.name, ticker: "REMX", state: sr, dynamics: computeDynamics(remx, sr), coords: coords3D(sr), evidence: evidenceConfidence(remx) }
  ];
}
