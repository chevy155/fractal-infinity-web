/* Memory Crucible — 15-dimension state + 3D coords */
export const STATE_KEYS = [
  "hbm_technology_readiness", "next_gen_roadmap", "customer_qualification",
  "commercial_momentum", "hbm_production_scale", "advanced_packaging",
  "manufacturing_yield_ramp", "capital_strength", "customer_diversification",
  "ecosystem_leverage", "execution_velocity", "geopolitical_resilience",
  "pricing_power", "supply_flexibility", "market_timing"
];

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export function num(v) {
  if (typeof v === "number" && Number.isFinite(v)) return clamp(v);
  return null;
}

export function avgVars(company, ids) {
  const map = Object.fromEntries(company.variables.map(v => [v.id, v]));
  let sum = 0, n = 0;
  for (const id of ids) {
    const val = num(map[id]?.value);
    if (val != null) { sum += val; n++; }
  }
  return n ? sum / n : 0.5;
}

export function buildStateVector(company) {
  const w = company.state_weights;
  const state = {};
  for (const k of STATE_KEYS) {
    let v = avgVars(company, w[k] || []);
    if (k === "market_timing") {
      const tr = num(company.variables.find(x => x.id === "timing_risk")?.value) ?? 0.5;
      v = clamp(v * (1 - tr * 0.3));
    }
    if (k === "geopolitical_resilience") {
      const geo = num(company.variables.find(x => x.id === "geopolitical_exposure")?.value) ?? 0.5;
      v = clamp(1 - geo * 0.85);
    }
    if (k === "customer_diversification") {
      const conc = num(company.variables.find(x => x.id === "customer_concentration")?.value) ?? 0.5;
      v = clamp(v * (1 - conc * 0.25));
    }
    state[k] = clamp(v);
  }
  return state;
}

export function computeDynamics(company, state) {
  const s = state;
  const mass = clamp(
    s.hbm_production_scale * 0.28 + s.capital_strength * 0.22 +
    s.ecosystem_leverage * 0.18 + s.advanced_packaging * 0.17 +
    s.hbm_technology_readiness * 0.15
  );
  const velocity = clamp(
    s.execution_velocity * 0.30 + s.commercial_momentum * 0.28 +
    s.customer_qualification * 0.22 + s.next_gen_roadmap * 0.20
  );
  const momentum = mass * velocity;
  const energy = clamp(
    s.capital_strength * 0.22 + s.supply_flexibility * 0.20 +
    s.hbm_technology_readiness * 0.18 + s.commercial_momentum * 0.18 +
    s.pricing_power * 0.12 + s.geopolitical_resilience * 0.10
  );
  const potential = clamp(
    s.next_gen_roadmap * 0.35 + s.hbm_technology_readiness * 0.25 +
    s.market_timing * 0.25 + s.ecosystem_leverage * 0.15
  );
  return { mass, velocity, momentum, energy, potential };
}

export function coords3D(state) {
  return {
    x: clamp(state.customer_qualification * 0.30 + state.commercial_momentum * 0.28 +
      state.customer_diversification * 0.22 + state.pricing_power * 0.12 + state.ecosystem_leverage * 0.08),
    y: clamp(state.hbm_technology_readiness * 0.40 + state.next_gen_roadmap * 0.35 +
      state.ecosystem_leverage * 0.15 + state.market_timing * 0.10),
    z: clamp(state.hbm_production_scale * 0.32 + state.advanced_packaging * 0.28 +
      state.manufacturing_yield_ramp * 0.25 + state.supply_flexibility * 0.15)
  };
}

export function evidenceConfidence(company) {
  const vars = company.variables.filter(v => typeof v.value === "number");
  if (!vars.length) return { level: "LOW", score: 0.3 };
  const avg = vars.reduce((a, v) => a + (v.confidence || 0.5), 0) / vars.length;
  const level = avg >= 0.80 ? "HIGH" : avg >= 0.72 ? "MEDIUM" : "LOW";
  return { level, score: clamp(avg) };
}

const LEVEL_MAP = {
  weak: -1, steady: 0, surge: 1, available: 1, tight: 0, crisis: -1,
  low: 1, moderate: 0, severe: -1, slow: -1, explosive: 1,
  stable: 1, stressed: 0, delayed: -1, normal: 0, accelerated: 1, high: 1
};

export function forceDelta(levels, idx) {
  const out = {};
  for (const [k, arr] of Object.entries(levels)) {
    const v = idx[k];
    out[k] = LEVEL_MAP[v] ?? 0;
  }
  return out;
}

export function applySliderForces(state, company, sliders) {
  const s = company.sensitivities || {};
  const next = { ...state };
  const bump = (key, amt) => { next[key] = clamp(next[key] + amt); };
  bump("commercial_momentum", (sliders.hbm_demand - 0.5) * 0.14 * (1 + (s.hbm_demand || 0)));
  bump("hbm_production_scale", (sliders.packaging_constraint - 0.5) * -0.12 * (1 + Math.abs(s.packaging_constraint || 0)));
  bump("advanced_packaging", (sliders.packaging_constraint - 0.5) * -0.10);
  bump("pricing_power", (sliders.price_pressure - 0.5) * -0.14);
  bump("customer_diversification", (sliders.customer_diversification - 0.5) * 0.12);
  bump("commercial_momentum", (sliders.ai_accelerator_growth - 0.5) * 0.10);
  bump("geopolitical_resilience", (sliders.supply_chain_disruption - 0.5) * -0.12);
  bump("supply_flexibility", (sliders.supply_chain_disruption - 0.5) * -0.10);
  bump("next_gen_roadmap", (sliders.hbm4_transition_speed - 0.5) * 0.12);
  bump("customer_qualification", (sliders.hbm4_transition_speed - 0.5) * 0.08);
  return next;
}

export function applyForces(state, company, forceIdx, tech, sliders = null) {
  let next = { ...state };
  const fd = forceDelta({
    hbm_demand: ["weak", "steady", "surge"],
    packaging: ["available", "tight", "crisis"],
    price_pressure: ["low", "moderate", "severe"],
    diversification: ["low", "moderate", "high"],
    ai_growth: ["slow", "steady", "explosive"],
    supply_disruption: ["stable", "stressed", "severe"],
    hbm4_pace: ["delayed", "normal", "accelerated"]
  }, forceIdx);
  const sens = company.sensitivities || {};
  const bump = (key, amt) => { next[key] = clamp(next[key] + amt); };

  bump("commercial_momentum", fd.hbm_demand * 0.07 * (1 + sens.hbm_demand));
  bump("hbm_production_scale", fd.packaging * -0.06 * (1 + Math.abs(sens.packaging_constraint || 0)));
  bump("advanced_packaging", fd.packaging * -0.05);
  bump("pricing_power", fd.price_pressure * -0.08);
  bump("customer_diversification", fd.diversification * 0.06);
  bump("commercial_momentum", fd.ai_growth * 0.06);
  bump("geopolitical_resilience", fd.supply_disruption * -0.07);
  bump("supply_flexibility", fd.supply_disruption * -0.05);
  bump("next_gen_roadmap", fd.hbm4_pace * 0.06);
  bump("customer_qualification", fd.hbm4_pace * 0.05);
  bump("market_timing", fd.hbm_demand * 0.04 + fd.hbm4_pace * 0.03);

  const pkg = num(tech.variables.find(t => t.id === "packaging_bottleneck")?.value) ?? 0.7;
  if (fd.packaging < 0) bump("advanced_packaging", -0.04 * pkg);

  if (sliders) next = applySliderForces(next, company, sliders);
  return next;
}

export function leadershipScore(state, dynamics) {
  return clamp(
    dynamics.momentum * 0.32 + dynamics.energy * 0.24 +
    state.customer_qualification * 0.14 + state.commercial_momentum * 0.12 +
    state.hbm_production_scale * 0.10 + state.hbm_technology_readiness * 0.08
  );
}

export function rankCompanies(states, dynamics) {
  const scores = states.map((s, i) => ({
    idx: i,
    score: leadershipScore(s, dynamics[i])
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

export function projectYear(state, dynamics, year, baseYear = 2026) {
  const dt = Math.max(0, year - baseYear);
  const growth = dynamics.velocity * 0.018 * dt;
  const next = { ...state };
  for (const k of STATE_KEYS) {
    next[k] = clamp(state[k] + growth * (k === "next_gen_roadmap" || k === "hbm_technology_readiness" ? 1.2 : 0.8));
  }
  if (year >= 2029) next.next_gen_roadmap = clamp(next.next_gen_roadmap + 0.03);
  if (year >= 2031) next.hbm_technology_readiness = clamp(next.hbm_technology_readiness + 0.02);
  return next;
}
