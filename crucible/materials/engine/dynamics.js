/** URNM × REMX state dynamics — display/scoring layer only; no fabricated precision. */

export const STATE_KEYS = [
  "structural_demand",
  "supply_scarcity",
  "geopolitical_leverage",
  "policy_support",
  "technological_demand",
  "industry_economics",
  "supply_chain_resilience",
  "capital_market_momentum",
  "valuation_pressure",
  "time_to_supply"
];

export const STATE_LABELS = {
  structural_demand: "Structural demand",
  supply_scarcity: "Supply scarcity",
  geopolitical_leverage: "Geopolitical leverage",
  policy_support: "Policy support",
  technological_demand: "Technological demand",
  industry_economics: "Industry economics",
  supply_chain_resilience: "Supply-chain resilience",
  capital_market_momentum: "Capital-market momentum",
  valuation_pressure: "Valuation pressure",
  time_to_supply: "Time-to-supply constraint"
};

export function clamp(x, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, x));
}

function num(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function buildStateVector(fund) {
  const state = {};
  for (const key of STATE_KEYS) {
    const ids = fund.state_weights[key] || [];
    const vars = ids.map(id => fund.variables.find(v => v.id === id)).filter(Boolean);
    if (!vars.length) {
      state[key] = 0.5;
      continue;
    }
    let wSum = 0, s = 0;
    for (const v of vars) {
      const val = num(v.value);
      if (val == null) continue;
      // secondary_supply_buffer / exchina capacity raise resilience, lower scarcity effect
      let x = val;
      if (v.id === "secondary_supply_buffer" || v.id === "exchina_capacity_build") {
        // for scarcity dims these reduce scarcity; handled via weight sign in scoring
        x = val;
      }
      if (key === "supply_scarcity" && (v.id === "secondary_supply_buffer" || v.id === "exchina_capacity_build")) {
        x = 1 - val;
      }
      if (key === "supply_chain_resilience" && v.id === "commodity_purity") {
        x = val;
      }
      if (key === "valuation_pressure") {
        x = val; // high = stretched (bearish for structural score later)
      }
      const w = v.weight || 1;
      s += x * w;
      wSum += w;
    }
    state[key] = clamp(wSum ? s / wSum : 0.5);
  }
  return state;
}

export function computeDynamics(fund, state) {
  const mass = clamp(
    state.supply_chain_resilience * 0.35 +
    state.policy_support * 0.25 +
    (1 - state.valuation_pressure) * 0.20 +
    state.structural_demand * 0.20
  );
  const velocity = clamp(
    state.capital_market_momentum * 0.30 +
    state.technological_demand * 0.30 +
    state.industry_economics * 0.25 +
    state.geopolitical_leverage * 0.15
  );
  const momentum = clamp(Math.sqrt(mass * velocity) * 1.05);
  const energy = clamp(
    state.structural_demand * 0.30 +
    state.supply_scarcity * 0.25 +
    state.policy_support * 0.20 +
    (1 - Math.min(state.time_to_supply, 0.95)) * 0.10 +
    (1 - state.valuation_pressure) * 0.15
  );
  const drag = clamp(state.time_to_supply * 0.45 + state.valuation_pressure * 0.30 + (1 - state.supply_chain_resilience) * 0.25);
  return { mass, velocity, momentum, energy, drag };
}

/** Structural advantage score — NOT a price forecast. */
export function structuralScore(state, dynamics) {
  return clamp(
    state.structural_demand * 0.18 +
    state.supply_scarcity * 0.16 +
    state.geopolitical_leverage * 0.12 +
    state.policy_support * 0.10 +
    state.technological_demand * 0.10 +
    state.industry_economics * 0.10 +
    state.supply_chain_resilience * 0.08 +
    state.capital_market_momentum * 0.06 +
    (1 - state.valuation_pressure) * 0.05 +
    state.time_to_supply * 0.05 + // slow supply response supports scarcity thesis
    dynamics.momentum * 0.10 +
    dynamics.energy * 0.10 -
    dynamics.drag * 0.08
  );
}

export function evidenceConfidence(fund) {
  const vars = fund.variables.filter(v => typeof v.value === "number");
  if (!vars.length) return { level: "LOW", score: 0.3 };
  const avg = vars.reduce((a, v) => a + (v.confidence || 0.5), 0) / vars.length;
  const facts = vars.filter(v => v.type === "FACT").length / vars.length;
  const score = clamp(avg * 0.7 + facts * 0.3);
  const level = score >= 0.82 ? "HIGH" : score >= 0.70 ? "MEDIUM" : "LOW";
  return { level, score };
}

export function coords3D(state) {
  return {
    x: state.structural_demand,
    y: state.supply_scarcity,
    z: state.geopolitical_leverage
  };
}

/** Force level → signed delta helper */
export function forceSign(level, force) {
  const order = {
    ai_power_growth: ["plateau", "steady", "accel"],
    reactor_build_rate: ["stalled", "steady", "renaissance"],
    uranium_supply_growth: ["shock_down", "tight", "surge"],
    enrichment_capacity: ["bottleneck", "constrained", "ample"],
    china_trade_tension: ["detente", "managed", "war"],
    rare_earth_export_controls: ["normalized", "licensed", "severe"],
    robotics_growth: ["slow", "steady", "boom"],
    ev_growth: ["slow", "steady", "boom"],
    defense_spending: ["peace", "baseline", "surge"],
    interest_rates: ["low", "neutral", "high"],
    commodity_capex: ["frozen", "selective", "boom"],
    recession_probability: ["expansion", "soft", "recession"],
    geopolitical_conflict: ["peace", "stressed", "hot"],
    uranium_price: ["weak", "firm", "spike"]
  };
  const arr = order[force] || [];
  const i = arr.indexOf(level);
  if (i < 0) return 0;
  return i === 0 ? -1 : i === arr.length - 1 ? 1 : 0;
}

/**
 * Apply scenario forces through ETF transmission sensitivities + feedback loops.
 */
export function applyForces(state, fund, forces, phase = 0) {
  const next = { ...state };
  const sens = fund.sensitivities || {};
  const bump = (k, amt) => { next[k] = clamp(next[k] + amt); };

  const fs = (f) => forceSign(forces[f], f);
  const isU = fund.id === "urnm";
  const w = (key, fallback = 0) => Math.abs(sens[key] ?? fallback);

  // Shared macro
  bump("capital_market_momentum", -fs("recession_probability") * 0.08 - fs("interest_rates") * 0.04);
  bump("valuation_pressure", fs("recession_probability") === -1 ? 0.04 : fs("recession_probability") === 1 ? -0.05 : 0);
  bump("industry_economics", -fs("interest_rates") * 0.04);
  bump("time_to_supply", fs("commodity_capex") === 1 ? -0.05 : fs("commodity_capex") === -1 ? 0.04 : 0);

  if (isU) {
    bump("structural_demand", fs("reactor_build_rate") * 0.09 * (1 + w("reactor_build_rate")));
    bump("structural_demand", fs("ai_power_growth") * 0.045 * (1 + w("ai_power_growth")));
    bump("technological_demand", fs("ai_power_growth") * 0.05);
    bump("supply_scarcity", -fs("uranium_supply_growth") * 0.10 * (1 + w("uranium_supply_growth")));
    bump("supply_scarcity", -fs("enrichment_capacity") * 0.07 * (1 + w("enrichment_capacity")));
    bump("industry_economics", fs("uranium_price") * 0.10 * (1 + w("uranium_price")));
    bump("geopolitical_leverage", fs("geopolitical_conflict") * 0.04 + (fs("uranium_supply_growth") === -1 ? 0.05 : 0));
    bump("policy_support", fs("reactor_build_rate") * 0.04);
    // weak cross-sensitivity to China trade (risk appetite only)
    bump("capital_market_momentum", fs("china_trade_tension") * -0.02);
  } else {
    bump("structural_demand", fs("defense_spending") * 0.05 * (1 + w("defense_spending")));
    bump("structural_demand", fs("robotics_growth") * 0.04 + fs("ev_growth") * 0.04);
    bump("technological_demand", (fs("robotics_growth") * 0.08 + fs("ev_growth") * 0.06 + fs("ai_power_growth") * 0.03) * (1 + w("robotics_growth")));
    bump("supply_scarcity", fs("rare_earth_export_controls") * 0.12 * (1 + w("rare_earth_export_controls")));
    bump("geopolitical_leverage", (fs("rare_earth_export_controls") * 0.11 + fs("china_trade_tension") * 0.09) * (1 + w("china_trade_tension")));
    bump("policy_support", fs("china_trade_tension") > 0 ? 0.06 : fs("rare_earth_export_controls") > 0 ? 0.05 : 0);
    bump("policy_support", fs("defense_spending") * 0.04);
    bump("industry_economics", fs("rare_earth_export_controls") * 0.07);
    // China holdings: export stress hurts resilience of CN names but lifts scarcity premium for ex-China
    if (fs("rare_earth_export_controls") > 0 || fs("china_trade_tension") > 0) {
      bump("supply_chain_resilience", -0.04);
      bump("industry_economics", 0.05);
    }
    // nuclear renaissance is mostly orthogonal for REMX
    bump("structural_demand", fs("reactor_build_rate") * 0.015);
  }

  // Feedback loops (second-order, phase-dependent)
  if (phase >= 2) {
    if (next.supply_scarcity > 0.7 && fs("commodity_capex") >= 0) {
      bump("supply_scarcity", -0.025 * phase * 0.35);
      bump("supply_chain_resilience", 0.02);
    }
    if (!isU && fs("rare_earth_export_controls") > 0 && phase >= 3) {
      bump("policy_support", 0.05);
      bump("supply_chain_resilience", 0.04);
      bump("supply_scarcity", -0.025);
    }
    if (isU && fs("uranium_price") > 0) {
      bump("capital_market_momentum", 0.04);
      if (phase >= 3) bump("supply_scarcity", -0.025);
    }
  }

  return next;
}
