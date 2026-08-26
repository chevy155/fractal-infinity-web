import { buildStateVector, applyForces, computeDynamics, leadershipScore } from "./dynamics.js";
import { runSimulation } from "./simulator.js";

const FLIP_VARS = [
  { id: "manufacturing_readiness", label: "Manufacturing readiness", delta: 0.15 },
  { id: "capital_resilience", label: "Capital resilience", delta: 0.15 },
  { id: "commercial_momentum", label: "Commercial momentum", delta: 0.12 },
  { id: "qualification_status", label: "Qualification progress", delta: 0.12 },
  { id: "hyperscaler_relationships", label: "Hyperscaler buy-in", delta: 0.10 }
];

function cloneCompany(company) {
  return JSON.parse(JSON.stringify(company));
}

function setVar(company, id, delta) {
  const v = company.variables.find(x => x.id === id);
  if (!v || typeof v.value !== "number") return false;
  v.value = Math.max(0, Math.min(1, v.value + delta));
  return true;
}

export function analyzeFlipConditions({ ayar, lightmatter, tech, scenarios, presetKey, worldCount = 2000 }) {
  const base = runSimulation({ ayar, lightmatter, tech, scenarios, presetKey, worldCount });
  const baseLeader = base.leader;
  const flips = [];

  for (const co of [
    { key: "ayar", data: ayar, name: "Ayar Labs" },
    { key: "lightmatter", data: lightmatter, name: "Lightmatter" }
  ]) {
    for (const fv of FLIP_VARS) {
      const a = cloneCompany(ayar);
      const l = cloneCompany(lightmatter);
      const target = co.key === "ayar" ? a : l;
      if (!setVar(target, fv.id, fv.delta)) continue;
      const res = runSimulation({ ayar: a, lightmatter: l, tech, scenarios, presetKey, worldCount: 1500 });
      const leadDelta = co.key === "ayar" ? res.ayar.winPct - base.ayar.winPct : res.lightmatter.winPct - base.lightmatter.winPct;
      if (baseLeader !== res.leader || Math.abs(leadDelta) >= 8) {
        flips.push({
          company: co.name,
          variable: fv.label,
          delta: fv.delta,
          leadershipDelta: leadDelta,
          newLeader: res.leader,
          flipped: baseLeader !== res.leader && res.leader === co.key
        });
      }
    }
  }

  const preset = scenarios.presets[presetKey];
  const scenarioFlips = [];
  if (presetKey === "optical_delay") {
    scenarioFlips.push({ condition: "Optical adoption accelerates to rapid", effect: "Favors company with stronger near-term qualification + ecosystem pull" });
  }
  if (presetKey === "capital_winter") {
    scenarioFlips.push({ condition: "Capital returns to abundant funding", effect: "Reduces relative penalty on higher capital-intensity paths" });
  }
  if (presetKey === "packaging_bottleneck") {
    scenarioFlips.push({ condition: "Packaging capacity expands", effect: "Rewards deeper OSAT/foundry partnerships" });
  }

  flips.sort((a, b) => Math.abs(b.leadershipDelta) - Math.abs(a.leadershipDelta));
  return { base, flips: flips.slice(0, 6), scenarioFlips };
}

export function dominantDrivers(result, ayar, lightmatter) {
  const preset = result.presetKey;
  const drivers = [];
  if (preset === "capital_winter") drivers.push("Capital resilience", "Financing dependence", "Runway indicators");
  else if (preset === "packaging_bottleneck") drivers.push("Manufacturing readiness", "Packaging relationships", "Yield/scaling risk");
  else if (preset === "optical_breakout") drivers.push("Optical I/O positioning", "Hyperscaler relationships", "Qualification status");
  else if (preset === "optical_delay") drivers.push("Market timing", "Integration complexity", "Commercial momentum");
  else if (preset === "ai_supercycle") drivers.push("AI scale-up fit", "Demonstrated bandwidth", "Ecosystem strength");
  else if (preset === "supply_shock") drivers.push("Manufacturing partners", "Geo/supply exposure", "Packaging readiness");
  else drivers.push("Commercial momentum", "Manufacturing readiness", "Ecosystem strength");
  return drivers;
}
