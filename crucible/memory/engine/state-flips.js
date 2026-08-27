import { runSimulation } from "./simulator.js";

const STATE_FLIP = [
  { key: "hbm_technology_readiness", label: "HBM technology readiness", delta: 0.15 },
  { key: "next_gen_roadmap", label: "HBM4 readiness", delta: 0.15 },
  { key: "customer_qualification", label: "Customer qualification", delta: 0.15 },
  { key: "hbm_production_scale", label: "Manufacturing scale", delta: 0.15 },
  { key: "advanced_packaging", label: "Packaging strength", delta: 0.12 },
  { key: "commercial_momentum", label: "Commercial momentum", delta: 0.15 }
];

function cloneCo(c) { return JSON.parse(JSON.stringify(c)); }

function bumpStateDimension(company, stateKey, delta) {
  const ids = company.state_weights[stateKey] || [];
  let n = 0;
  for (const id of ids) {
    const v = company.variables.find(x => x.id === id);
    if (v && typeof v.value === "number") {
      v.value = Math.max(0, Math.min(1, v.value + delta));
      n++;
    }
  }
  return n > 0;
}

export function analyzeStateFlips({ companies, tech, scenarios, presetKey, sliders, worldCount = 1500 }) {
  const base = runSimulation({ companies, tech, scenarios, presetKey, worldCount, sliders });
  const baseLeader = base.leaderId;
  const flips = [];

  for (let ci = 0; ci < companies.length; ci++) {
    for (const sf of STATE_FLIP) {
      const cos = companies.map(cloneCo);
      if (!bumpStateDimension(cos[ci], sf.key, sf.delta)) continue;
      const res = runSimulation({ companies: cos, tech, scenarios, presetKey, worldCount: 1000, sliders });
      const marginShift = res.leaderPct - base.leaderPct;
      if (baseLeader !== res.leaderId || Math.abs(marginShift) >= 8) {
        flips.push({
          company: companies[ci].name,
          dimension: sf.label,
          delta: sf.delta,
          flipped: baseLeader !== res.leaderId && res.leaderId === companies[ci].id,
          newLeader: res.leaderName,
          marginShift
        });
      }
    }
  }

  flips.sort((a, b) => Math.abs(b.marginShift) - Math.abs(a.marginShift));
  return { base, flips: flips.slice(0, 6) };
}
