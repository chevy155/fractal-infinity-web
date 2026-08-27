/* Crucible v2 — state vector + strategic dynamics (no runtime AI) */
export const STATE_KEYS = [
  "technology_maturity",
  "commercial_momentum",
  "ecosystem_strength",
  "capital_resilience",
  "manufacturing_readiness",
  "competitive_position",
  "execution_quality",
  "market_timing"
];

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export function num(v) {
  if (typeof v === "number" && Number.isFinite(v)) return clamp(v);
  return null;
}

export function avgVars(company, ids) {
  const vars = company.variables;
  const map = Object.fromEntries(vars.map(v => [v.id, v]));
  let sum = 0, n = 0;
  for (const id of ids) {
    const v = map[id];
    const val = num(v?.value);
    if (val != null) { sum += val; n++; }
  }
  return n ? sum / n : 0.5;
}

export function buildStateVector(company) {
  const w = company.state_weights;
  const state = {};
  for (const k of STATE_KEYS) {
    const ids = w[k] || [];
    let v = avgVars(company, ids);
    if (k === "market_timing") {
      const mt = num(company.variables.find(x => x.id === "market_timing")?.value) ?? avgVars(company, ["market_timing"]);
      const tr = num(company.variables.find(x => x.id === "timing_risk")?.value) ?? 0.5;
      v = clamp(mt * (1 - tr * 0.35));
    }
    if (k === "capital_resilience") {
      const fin = num(company.variables.find(x => x.id === "financing_dependence")?.value);
      if (fin != null) v = clamp(v * (1 - fin * 0.25));
    }
    state[k] = clamp(v);
  }
  return state;
}

export function computeDynamics(company, state) {
  const s = state;
  const mass = clamp(
    s.ecosystem_strength * 0.30 +
    s.capital_resilience * 0.25 +
    s.manufacturing_readiness * 0.20 +
    s.competitive_position * 0.15 +
    s.technology_maturity * 0.10
  );
  const velocity = clamp(
    s.commercial_momentum * 0.35 +
    s.execution_quality * 0.25 +
    s.market_timing * 0.20 +
    s.technology_maturity * 0.20
  );
  const momentum = mass * velocity;
  const energy = clamp(
    s.capital_resilience * 0.25 +
    s.ecosystem_strength * 0.20 +
    s.technology_maturity * 0.15 +
    s.commercial_momentum * 0.20 +
    s.manufacturing_readiness * 0.20
  );
  return { mass, velocity, momentum, energy };
}

export function evidenceConfidence(company) {
  const vars = company.variables.filter(v => typeof v.value === "number");
  if (!vars.length) return { level: "LOW", score: 0.3 };
  const avg = vars.reduce((a, v) => a + (v.confidence || 0.5), 0) / vars.length;
  const level = avg >= 0.82 ? "HIGH" : avg >= 0.72 ? "MEDIUM" : "LOW";
  return { level, score: clamp(avg) };
}

export function forceDelta(levels, idx) {
  const map = { plateau: -1, steady: 0, accel: 1, winter: -1, normal: 0, abundant: 1,
    bottleneck: -1, constrained: 0, expansion: 1, delayed: -1, gradual: 0, rapid: 1,
    weak: -1, selective: 0, broad: 1, disrupted: -1, stressed: 0, stable: 1 };
  const out = {};
  for (const [k, arr] of Object.entries(levels)) {
    const i = arr.indexOf(idx[k]);
    out[k] = i <= 0 ? -1 : i >= arr.length - 1 ? 1 : 0;
  }
  return out;
}

export function applyForces(state, company, forceIdx, tech) {
  const sens = company.sensitivities;
  const next = { ...state };
  const fd = forceDelta({
    ai_demand: ["plateau", "steady", "accel"],
    capital: ["winter", "normal", "abundant"],
    manufacturing: ["bottleneck", "constrained", "expansion"],
    optical_adoption: ["delayed", "gradual", "rapid"],
    hyperscaler_buyin: ["weak", "selective", "broad"],
    geopolitics: ["disrupted", "stressed", "stable"]
  }, forceIdx);

  for (const k of STATE_KEYS) next[k] = state[k];

  const bump = (key, amt) => { next[key] = clamp(next[key] + amt); };

  bump("commercial_momentum", fd.ai_demand * 0.06 * (1 + sens.ai_demand));
  bump("market_timing", fd.optical_adoption * 0.07 * (1 + sens.optical_adoption));
  bump("ecosystem_strength", fd.hyperscaler_buyin * 0.06 * (1 + sens.hyperscaler_buyin));
  bump("capital_resilience", fd.capital * 0.08 * (1 + Math.abs(sens.capital)) * (fd.capital < 0 ? -1 : 1));
  bump("manufacturing_readiness", fd.manufacturing * 0.07 * (1 + sens.manufacturing));
  bump("technology_maturity", fd.optical_adoption * 0.04);
  bump("competitive_position", (fd.ai_demand + fd.optical_adoption) * 0.025);
  bump("execution_quality", fd.capital < 0 ? -0.03 : 0.02);

  if (fd.geopolitics < 0) {
    bump("manufacturing_readiness", -0.05 * (1 + Math.abs(sens.geopolitics)));
    bump("ecosystem_strength", -0.03);
  }

  const pkgRisk = num(tech.variables.find(t => t.id === "packaging_bottleneck_risk")?.value) ?? 0.6;
  if (fd.manufacturing < 0) bump("manufacturing_readiness", -0.04 * pkgRisk);

  return next;
}

export function leadershipScore(state, dynamics) {
  return clamp(
    dynamics.momentum * 0.35 +
    dynamics.energy * 0.25 +
    state.commercial_momentum * 0.15 +
    state.competitive_position * 0.15 +
    state.manufacturing_readiness * 0.10
  );
}

/** 3D display coords: X commercial · Y technology · Z manufacturing */
export function coords3D(state) {
  return {
    x: clamp(state.commercial_momentum),
    y: clamp(state.technology_maturity),
    z: clamp(state.manufacturing_readiness)
  };
}

export function projectYear(state, dynamics, year, baseYear = 2026) {
  const dt = Math.max(0, year - baseYear);
  const g = dynamics.velocity * 0.016 * dt;
  const next = { ...state };
  for (const k of STATE_KEYS) {
    next[k] = clamp(state[k] + g * (k === "technology_maturity" || k === "commercial_momentum" ? 1.15 : 0.85));
  }
  if (year >= 2029) next.technology_maturity = clamp(next.technology_maturity + 0.025);
  return next;
}

export function deriveOutcomes(state, dynamics, rnd) {
  const score = leadershipScore(state, dynamics);
  const surv = clamp(dynamics.energy * 0.45 + state.capital_resilience * 0.35 + state.ecosystem_strength * 0.20);
  const scale = clamp(state.manufacturing_readiness * 0.35 + state.commercial_momentum * 0.30 + state.technology_maturity * 0.25 + dynamics.momentum * 0.10);
  const lead = clamp(score * 0.55 + state.competitive_position * 0.25 + state.commercial_momentum * 0.20);
  const acq = clamp((1 - lead) * 0.35 + (1 - state.capital_resilience) * 0.25 + rnd() * 0.08);
  const niche = clamp((scale * 0.4 + (1 - lead) * 0.3) * (0.7 + rnd() * 0.3));
  const fail = clamp((1 - surv) * 0.65 + (1 - dynamics.energy) * 0.35);

  const tiers = { survival: surv, scale, leadership: lead, acquisition: acq * (1 - lead), niche, failure: fail };
  tiers.scale = scale;
  tiers.acquisition = clamp(acq * (lead < 0.55 ? 1.2 : 0.6));
  tiers.niche = clamp(niche * (lead < 0.65 ? 1 : 0.5));
  tiers.failure = clamp(fail * (surv < 0.45 ? 1.3 : 0.7));
  return tiers;
}

export function classifyOutcome(tiers, rnd) {
  const r = rnd();
  if (tiers.leadership > 0.72 && tiers.scale > 0.65 && r < 0.55) return "leadership";
  if (tiers.failure > 0.62 && r < 0.45) return "failure";
  if (tiers.acquisition > 0.52 && tiers.leadership < 0.58 && r < 0.35) return "acquisition";
  if (tiers.niche > 0.55 && tiers.leadership < 0.62 && r < 0.40) return "niche";
  if (tiers.scale > 0.58 && tiers.survival > 0.50) return "scale";
  if (tiers.survival > 0.42) return "survival";
  return "failure";
}
