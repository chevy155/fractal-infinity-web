/**
 * Effective driver attribution — collapses 89 research variables to state dimensions
 * that actually feed leadershipScore. No runtime AI.
 */
import { buildStateVector, computeDynamics, leadershipScore, STATE_KEYS } from "./dynamics.js";

const DRIVER_LABEL = {
  commercial_momentum: "Commercial momentum",
  manufacturing_readiness: "Manufacturing readiness",
  capital_resilience: "Capital resilience",
  ecosystem_strength: "Ecosystem strength",
  technology_maturity: "Technology maturity",
  market_timing: "Market timing",
  competitive_position: "Competitive position",
  execution_quality: "Execution quality"
};

/** One-at-a-time state-dimension influence on head-to-head leadership margin */
export function computeDriverAttribution(ayar, lightmatter) {
  const sa = buildStateVector(ayar);
  const sl = buildStateVector(lightmatter);
  const da = computeDynamics(ayar, sa);
  const dl = computeDynamics(lightmatter, sl);
  const scoreA = leadershipScore(sa, da);
  const scoreL = leadershipScore(sl, dl);
  const baseMargin = scoreA - scoreL;

  const influences = [];
  for (const k of STATE_KEYS) {
    const saSwap = { ...sa, [k]: sl[k] };
    const slSwap = { ...sl, [k]: sa[k] };
    const marginA = leadershipScore(saSwap, computeDynamics(ayar, saSwap)) - scoreL;
    const marginL = scoreA - leadershipScore(slSwap, computeDynamics(lightmatter, slSwap));
    const influence = (Math.abs(baseMargin - marginA) + Math.abs(baseMargin - marginL)) / 2;
    influences.push({
      id: k,
      label: DRIVER_LABEL[k] || k,
      influence,
      ayar: sa[k],
      lightmatter: sl[k],
      delta: sa[k] - sl[k]
    });
  }

  const total = influences.reduce((s, d) => s + d.influence, 0) || 1;
  const drivers = influences
    .map(d => ({ ...d, share: Math.round(d.influence / total * 100) }))
    .sort((a, b) => b.share - a.share);

  let cum = 0;
  const top = [];
  for (const d of drivers) {
    cum += d.share;
    top.push({ ...d, cumulative: cum });
    if (cum >= 80) break;
  }

  return {
    baseMargin,
    scoreA,
    scoreL,
    drivers,
    topDrivers: top,
    effectiveCount: top.length,
    explains80: cum
  };
}

/** Merge packaging-adjacent dimensions for user-facing 4–6 driver view */
export function collapsedDrivers(attribution) {
  const groups = {
    packaging_integration: ["manufacturing_readiness", "ecosystem_strength"],
    commercial_momentum: ["commercial_momentum"],
    capital_resilience: ["capital_resilience"],
    market_timing: ["market_timing", "execution_quality"],
    technology_maturity: ["technology_maturity", "competitive_position"]
  };
  const map = Object.fromEntries(attribution.drivers.map(d => [d.id, d]));
  const merged = {};
  for (const [label, ids] of Object.entries(groups)) {
    let inf = 0;
    for (const id of ids) inf += map[id]?.influence || 0;
    if (inf > 0) merged[label] = inf;
  }
  const total = Object.values(merged).reduce((a, b) => a + b, 0) || 1;
  const rows = Object.entries(merged)
    .map(([id, inf]) => ({
      id,
      label: id === "packaging_integration" ? "Packaging integration" :
        id === "commercial_momentum" ? "Commercial momentum" :
        id === "manufacturing_readiness" ? "Manufacturing readiness" :
        id === "capital_resilience" ? "Capital resilience" :
        id === "market_timing" ? "Market timing" :
        "Technology maturity",
      share: Math.round(inf / total * 100)
    }))
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
