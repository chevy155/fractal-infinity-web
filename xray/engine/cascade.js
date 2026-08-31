/**
 * Deterministic constraint cascade — sensitivity exercise, not a forecast.
 * Relief = variable perturbation of the top node, then full recompute.
 * Does NOT delete the node or zero its score.
 */
import { rankConstraints } from "./score.js";

const INTACT = [
  "demand_pressure",
  "substitution_difficulty",
  "downstream_importance",
  "technology_maturity",
  "qualification_difficulty",
  "yield_risk",
  "geographic_concentration",
  "capacity_growth",
  "evidence_confidence"
];

export function relieve(obs, weights) {
  const cfg = weights.relief;
  const next = { ...obs };
  for (const [key, factor] of Object.entries(cfg.multipliers)) {
    if (!(key in next)) continue;
    const floor = cfg.floor ?? 0.05;
    next[key] = Math.max(floor, next[key] * factor);
  }
  for (const key of INTACT) {
    if (key in obs) next[key] = obs[key];
  }
  next._relieved = true;
  next._relief = {
    applied: Object.keys(cfg.multipliers),
    intact: INTACT.filter((k) => k in obs),
    multipliers: { ...cfg.multipliers }
  };
  return next;
}

export function runCascade(observations, weights, stages = weights.cascade_stages) {
  let current = observations.map((o) => ({ ...o }));
  const stagesOut = [];

  for (let i = 0; i < stages; i++) {
    const ranked = rankConstraints(current, weights);
    const top = ranked[0];
    if (!top) break;

    const before = current.find((o) => o.node_id === top.node_id);
    const after = relieve(before, weights);

    stagesOut.push({
      stage: i + 1,
      bottleneck_id: top.node_id,
      score: top.score,
      evidence_confidence: top.evidence_confidence,
      status: top.status,
      drivers: top.drivers,
      label: i === 0 ? "CURRENT" : "AFTER PRIOR RELIEF",
      data_class: "CALCULATED",
      relief_applied: {
        node_id: top.node_id,
        before: pickReliefVars(before, weights),
        after: pickReliefVars(after, weights),
        intact: after._relief.intact
      }
    });

    current = current.map((o) =>
      o.node_id === top.node_id ? after : { ...o }
    );
  }

  return {
    type: "constraint_cascade",
    disclaimer: "Structured sensitivity exercise. Not a forecast. Relief perturbs capacity/lead-time/(optional) concentration only.",
    stages: stagesOut
  };
}

function pickReliefVars(obs, weights) {
  const keys = Object.keys(weights.relief.multipliers);
  const out = {};
  for (const k of keys) out[k] = obs[k];
  return out;
}
