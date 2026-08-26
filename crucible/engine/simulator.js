import {
  buildStateVector, computeDynamics, applyForces, deriveOutcomes, classifyOutcome,
  leadershipScore, evidenceConfidence
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
  const levels = scenarios.levels;
  const weights = scenarios.default_weights;
  const out = {};
  for (const f of scenarios.forces) {
    if (preset?.fixed?.[f]) out[f] = preset.fixed[f];
    else out[f] = pickWeighted(rnd, levels[f], weights[f]);
  }
  return out;
}

function runWorld(rnd, ayar, lightmatter, tech, scenarios, presetKey) {
  let sa = buildStateVector(ayar);
  let sl = buildStateVector(lightmatter);
  const phases = scenarios.phases || 4;
  let lastForces = null;

  for (let p = 0; p < phases; p++) {
    const forces = sampleForces(rnd, scenarios, presetKey);
    lastForces = forces;
    sa = applyForces(sa, ayar, forces, tech);
    sl = applyForces(sl, lightmatter, forces, tech);
    sa.technology_maturity += rnd() * 0.02 - 0.005;
    sl.technology_maturity += rnd() * 0.02 - 0.005;
  }

  const da = computeDynamics(ayar, sa);
  const dl = computeDynamics(lightmatter, sl);
  const la = leadershipScore(sa, da);
  const ll = leadershipScore(sl, dl);
  const oa = classifyOutcome(deriveOutcomes(sa, da, rnd), rnd);
  const ol = classifyOutcome(deriveOutcomes(sl, dl, rnd), rnd);

  return { sa, sl, da, dl, la, ll, oa, ol, forces: lastForces, winner: la === ll ? "tie" : la > ll ? "ayar" : "lightmatter" };
}

export function runSimulation({ ayar, lightmatter, tech, scenarios, presetKey, worldCount }) {
  const rnd = mulberry32(scenarios.seed || 19450716);
  const N = worldCount;
  const counts = {
    ayar: { survival: 0, scale: 0, leadership: 0, acquisition: 0, niche: 0, failure: 0, wins: 0 },
    lightmatter: { survival: 0, scale: 0, leadership: 0, acquisition: 0, niche: 0, failure: 0, wins: 0 },
    ties: 0
  };
  let sumLa = 0, sumLl = 0, sumMa = 0, sumMl = 0, sumEa = 0, sumEl = 0;
  const forceTally = {};

  for (let w = 0; w < N; w++) {
    const res = runWorld(rnd, ayar, lightmatter, tech, scenarios, presetKey);
    counts.ayar[res.oa]++;
    counts.lightmatter[res.ol]++;
    if (res.winner === "ayar") counts.ayar.wins++;
    else if (res.winner === "lightmatter") counts.lightmatter.wins++;
    else counts.ties++;
    sumLa += res.la; sumLl += res.ll;
    sumMa += res.da.momentum; sumMl += res.dl.momentum;
    sumEa += res.da.energy; sumEl += res.dl.energy;
    for (const [k, v] of Object.entries(res.forces || {})) {
      forceTally[k] = forceTally[k] || {};
      forceTally[k][v] = (forceTally[k][v] || 0) + 1;
    }
  }

  const pct = (x) => Math.round(x / N * 100);
  const baseA = buildStateVector(ayar);
  const baseL = buildStateVector(lightmatter);
  const dynA = computeDynamics(ayar, baseA);
  const dynL = computeDynamics(lightmatter, baseL);

  return {
    N,
    presetKey,
    ayar: {
      name: ayar.name,
      outcomes: Object.fromEntries(Object.entries(counts.ayar).filter(([k]) => k !== "wins").map(([k, v]) => [k, pct(v)])),
      winPct: pct(counts.ayar.wins),
      avgLeadership: sumLa / N,
      avgMomentum: sumMa / N,
      avgEnergy: sumEa / N,
      baseState: baseA,
      dynamics: dynA,
      evidence: evidenceConfidence(ayar)
    },
    lightmatter: {
      name: lightmatter.name,
      outcomes: Object.fromEntries(Object.entries(counts.lightmatter).filter(([k]) => k !== "wins").map(([k, v]) => [k, pct(v)])),
      winPct: pct(counts.lightmatter.wins),
      avgLeadership: sumLl / N,
      avgMomentum: sumMl / N,
      avgEnergy: sumEl / N,
      baseState: baseL,
      dynamics: dynL,
      evidence: evidenceConfidence(lightmatter)
    },
    tiesPct: pct(counts.ties),
    forceTally,
    leader: counts.ayar.wins === counts.lightmatter.wins ? "tie" :
      counts.ayar.wins > counts.lightmatter.wins ? "ayar" : "lightmatter",
    leaderPct: pct(Math.max(counts.ayar.wins, counts.lightmatter.wins))
  };
}

export function contributionAnalysis(company) {
  const state = buildStateVector(company);
  const dyn = computeDynamics(company, state);
  const vars = company.variables.filter(v => typeof v.value === "number");
  const items = vars.map(v => {
    const val = typeof v.value === "number" ? v.value : 0.5;
    const w = v.weight || 1;
    let sign = 1;
    if (["yield_scaling_risk", "integration_complexity", "capital_intensity", "financing_dependence",
      "customer_concentration", "pivot_risk", "timing_risk", "competitor_pressure"].includes(v.id)) sign = -1;
    const raw = Math.round((val - 0.5) * 36 * w * sign);
    return { id: v.id, label: v.label, domain: v.domain, value: raw, confidence: v.confidence, sources: v.sources, claim_ids: v.claim_ids, as_of: v.as_of, type: v.type, numeric: val };
  });
  items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { state, dynamics: dyn, top: items.slice(0, 8), all: items };
}
