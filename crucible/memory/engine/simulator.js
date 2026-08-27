import {
  buildStateVector, computeDynamics, applyForces, leadershipScore,
  evidenceConfidence, rankCompanies, projectYear, coords3D, STATE_KEYS
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

const CO_KEYS = ["sk_hynix", "micron", "samsung"];

function runWorld(rnd, companies, tech, scenarios, presetKey, sliders) {
  const states = companies.map(c => buildStateVector(c));
  const phases = scenarios.phases || 5;
  let lastForces = null;

  for (let p = 0; p < phases; p++) {
    const forces = sampleForces(rnd, scenarios, presetKey);
    lastForces = forces;
    for (let i = 0; i < companies.length; i++) {
      states[i] = applyForces(states[i], companies[i], forces, tech, sliders);
      states[i].hbm_technology_readiness += rnd() * 0.015 - 0.004;
      states[i].next_gen_roadmap += rnd() * 0.012 - 0.003;
    }
  }

  const dynamics = companies.map((c, i) => computeDynamics(c, states[i]));
  const ranked = rankCompanies(states, dynamics);
  const winnerIdx = ranked[0].idx;
  const ties = ranked.length > 1 && Math.abs(ranked[0].score - ranked[1].score) < 0.008;

  return { states, dynamics, ranked, winnerIdx, ties, forces: lastForces };
}

export function runSimulation({ companies, tech, scenarios, presetKey, worldCount, sliders = null }) {
  const rnd = mulberry32(scenarios.seed || 28475163);
  const N = worldCount;
  const wins = [0, 0, 0];
  let tieCount = 0;
  const sumScore = [0, 0, 0];
  const sumMom = [0, 0, 0];
  const sumEnergy = [0, 0, 0];

  for (let w = 0; w < N; w++) {
    const res = runWorld(rnd, companies, tech, scenarios, presetKey, sliders);
    if (res.ties) tieCount++;
    else wins[res.winnerIdx]++;
    for (let i = 0; i < 3; i++) {
      sumScore[i] += res.ranked.find(r => r.idx === i)?.score || 0;
      sumMom[i] += res.dynamics[i].momentum;
      sumEnergy[i] += res.dynamics[i].energy;
    }
  }

  const pct = x => Math.round(x / N * 100);
  const baseStates = companies.map(c => buildStateVector(c));
  const adjustedStates = sliders
    ? companies.map((c, i) => applyForces(baseStates[i], c, {}, tech, sliders))
    : baseStates;
  const baseDyn = companies.map((c, i) => computeDynamics(c, adjustedStates[i]));
  const baseRank = rankCompanies(adjustedStates, baseDyn);

  const coResults = companies.map((c, i) => ({
    id: c.id,
    name: c.name,
    winPct: pct(wins[i]),
    avgLeadership: sumScore[i] / N,
    avgMomentum: sumMom[i] / N,
    avgEnergy: sumEnergy[i] / N,
    baseState: adjustedStates[i],
    dynamics: baseDyn[i],
    coords: coords3D(adjustedStates[i]),
    evidence: evidenceConfidence(c),
    rank: baseRank.findIndex(r => r.idx === i) + 1
  }));

  const leaderIdx = wins.indexOf(Math.max(...wins));
  const leader = tieCount > wins[leaderIdx] ? "tie" : CO_KEYS[leaderIdx];

  return {
    N, presetKey, companies: coResults, tiesPct: pct(tieCount),
    leader, leaderId: leader === "tie" ? null : CO_KEYS[leaderIdx],
    leaderPct: pct(Math.max(...wins)),
    leaderName: leader === "tie" ? null : companies[leaderIdx].name
  };
}

export function buildTrajectory(companies, tech, sliders, presetKey = "all") {
  const years = [2026, 2027, 2028, 2029, 2030, 2031, 2032];
  const baseStates = companies.map(c => buildStateVector(c));
  const adjusted = companies.map((c, i) => applyForces(baseStates[i], c, {}, tech, sliders));

  return years.map(year => {
    const states = adjusted.map((s, i) => {
      const dyn = computeDynamics(companies[i], s);
      return projectYear(s, dyn, year);
    });
    const dynamics = companies.map((c, i) => computeDynamics(c, states[i]));
    const ranked = rankCompanies(states, dynamics);
    const leaderIdx = ranked[0].idx;
    return {
      year,
      leader: companies[leaderIdx].name,
      leaderId: companies[leaderIdx].id,
      companies: companies.map((c, i) => ({
        id: c.id,
        name: c.name,
        state: states[i],
        dynamics: dynamics[i],
        coords: coords3D(states[i]),
        score: leadershipScore(states[i], dynamics[i]),
        rank: ranked.findIndex(r => r.idx === i) + 1,
        evidence: evidenceConfidence(c)
      }))
    };
  });
}

export function liveState(companies, tech, sliders) {
  const states = companies.map(c => {
    const base = buildStateVector(c);
    return applyForces(base, c, {}, tech, sliders);
  });
  const dynamics = companies.map((c, i) => computeDynamics(c, states[i]));
  const ranked = rankCompanies(states, dynamics);
  return {
    companies: companies.map((c, i) => ({
      id: c.id, name: c.name,
      state: states[i], dynamics: dynamics[i],
      coords: coords3D(states[i]),
      evidence: evidenceConfidence(c),
      score: leadershipScore(states[i], dynamics[i]),
      rank: ranked.findIndex(r => r.idx === i) + 1
    })),
    leader: companies[ranked[0].idx].name
  };
}

export const DEFAULT_SLIDERS = {
  hbm_demand: 0.65,
  packaging_constraint: 0.55,
  price_pressure: 0.35,
  customer_diversification: 0.50,
  ai_accelerator_growth: 0.70,
  supply_chain_disruption: 0.40,
  hbm4_transition_speed: 0.55
};
