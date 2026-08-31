/**
 * Deterministic constraint scoring — CALCULATED from MODELED observations.
 * Severity and evidence confidence are SEPARATE outputs.
 * Weights: ../config/weights.json
 */
export function scarcity(obs, weights) {
  const w = weights.scarcity;
  return (
    obs.capacity_pressure * w.capacity_pressure +
    obs.supplier_concentration * w.supplier_concentration +
    obs.lead_time_pressure * w.lead_time_pressure
  );
}

export function riskBand(score, bands) {
  if (score >= bands.high) return "HIGH RISK";
  if (score >= bands.moderate) return "MODERATE RISK";
  return "LOWER RISK";
}

export function confidenceBand(confidence, bands) {
  const pct = Math.round(confidence * 100);
  if (confidence >= bands.high) return { label: "HIGH CONFIDENCE", pct };
  if (confidence >= bands.moderate) return { label: "MODERATE CONFIDENCE", pct };
  return { label: "LOW CONFIDENCE", pct };
}

export function scoreObservation(obs, weights) {
  const scar = scarcity(obs, weights);
  const severity =
    obs.demand_pressure *
    scar *
    obs.substitution_difficulty *
    obs.downstream_importance;
  const score = Math.round(weights.score_scale * severity);
  const confidence = obs.evidence_confidence;
  const conf = confidenceBand(confidence, weights.confidence_bands);
  const risk = riskBand(score, weights.risk_bands);
  return {
    node_id: obs.node_id,
    data_class: "CALCULATED",
    severity,
    scarcity: scar,
    score,
    evidence_confidence: confidence,
    evidence_confidence_pct: conf.pct,
    status: `${risk} / ${conf.label}`,
    risk_band: risk,
    confidence_band: conf.label,
    drivers: [
      { key: "demand_pressure", value: obs.demand_pressure },
      { key: "scarcity", value: Number(scar.toFixed(3)) },
      { key: "substitution_difficulty", value: obs.substitution_difficulty },
      { key: "downstream_importance", value: obs.downstream_importance }
    ],
    observation: obs
  };
}

export function rankConstraints(observations, weights) {
  return observations
    .map((o) => scoreObservation(o, weights))
    .sort((a, b) => b.score - a.score || b.severity - a.severity);
}
