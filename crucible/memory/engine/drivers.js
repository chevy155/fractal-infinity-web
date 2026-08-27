import { buildStateVector, computeDynamics, leadershipScore, STATE_KEYS } from "./dynamics.js";

const DRIVER_LABEL = {
  hbm_readiness: "HBM readiness",
  customer_qualification: "Customer qualification",
  manufacturing_scale: "Manufacturing scale",
  packaging_strength: "Packaging strength",
  capital_resilience: "Capital resilience",
  execution_momentum: "Execution momentum"
};

const GROUPS = {
  hbm_readiness: ["hbm_technology_readiness", "next_gen_roadmap"],
  customer_qualification: ["customer_qualification", "ecosystem_leverage"],
  manufacturing_scale: ["hbm_production_scale", "supply_flexibility"],
  packaging_strength: ["advanced_packaging", "manufacturing_yield_ramp"],
  capital_resilience: ["capital_strength", "pricing_power", "geopolitical_resilience"],
  execution_momentum: ["execution_velocity", "commercial_momentum", "market_timing"]
};

function getRunnerUp(scores, leaderIdx) {
  let bestIdx = 0, bestScore = -1;
  for (let i = 0; i < scores.length; i++) {
    if (i === leaderIdx) continue;
    if (scores[i] > bestScore) { bestScore = scores[i]; bestIdx = i; }
  }
  return { idx: bestIdx, score: bestScore };
}

export function computeDriverAttribution(companies) {
  const n = companies.length;
  const bases = companies.map(c => buildStateVector(c));
  const dyns = companies.map((c, i) => computeDynamics(c, bases[i]));
  const scores = bases.map((s, i) => leadershipScore(s, dyns[i]));
  const leader = scores.indexOf(Math.max(...scores));
  const runner = getRunnerUp(scores, leader);
  const baseMargin = scores[leader] - runner.score;

  const influences = [];
  for (const k of STATE_KEYS) {
    let inf = 0;
    for (let i = 0; i < n; i++) {
      const swapped = bases.map((s, j) => {
        if (j === i) return { ...s, [k]: bases[leader === j ? runner.idx : leader][k] };
        return { ...s };
      });
      const newScores = swapped.map((s, j) => leadershipScore(s, computeDynamics(companies[j], s)));
      const newLeader = newScores.indexOf(Math.max(...newScores));
      const newRunner = getRunnerUp(newScores, newLeader);
      inf += Math.abs(baseMargin - (newScores[newLeader] - newRunner.score));
    }
    influences.push({ id: k, label: k.replace(/_/g, " "), influence: inf / n });
  }

  const total = influences.reduce((s, d) => s + d.influence, 0) || 1;
  return {
    leader, runner: runner.idx, baseMargin,
    drivers: influences.map(d => ({ ...d, share: Math.round(d.influence / total * 100) }))
      .sort((a, b) => b.share - a.share)
  };
}

export function collapsedDrivers(attribution) {
  const map = Object.fromEntries(attribution.drivers.map(d => [d.id, d]));
  const merged = {};
  for (const [label, ids] of Object.entries(GROUPS)) {
    let inf = 0;
    for (const id of ids) inf += (map[id]?.influence || 0);
    if (inf > 0) merged[label] = inf;
  }
  const total = Object.values(merged).reduce((a, b) => a + b, 0) || 1;
  const rows = Object.entries(merged)
    .map(([id, inf]) => ({ id, label: DRIVER_LABEL[id] || id, share: Math.round(inf / total * 100) }))
    .sort((a, b) => b.share - a.share);
  let cum = 0;
  const top = [];
  for (const r of rows) {
    cum += r.share;
    top.push({ ...r, cumulative: cum });
    if (cum >= 80) break;
  }
  return { rows, top, effectiveCount: top.length };
}

export function lineageAdjustedEvidence(sourcesMeta) {
  return sourcesMeta?.defensible_independent_lineages ?? sourcesMeta?.independent_lineages ?? 8;
}

export function analystPriorShare(companies) {
  let inf = 0, total = 0;
  for (const c of companies) {
    for (const v of c.variables) {
      total++;
      if (v.type === "INFERENCE" || (v.confidence || 0) < 0.75) inf++;
    }
  }
  return total ? Math.round(inf / total * 100) : 0;
}
