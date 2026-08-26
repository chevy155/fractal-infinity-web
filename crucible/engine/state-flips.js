import { runSimulation } from "./simulator.js";

const STATE_FLIP = [
  { key: "manufacturing_readiness", label: "Manufacturing readiness", delta: 0.15 },
  { key: "commercial_momentum", label: "Commercial momentum", delta: 0.15 },
  { key: "capital_resilience", label: "Capital resilience", delta: 0.15 },
  { key: "ecosystem_strength", label: "Ecosystem strength", delta: 0.12 },
  { key: "market_timing", label: "Market timing", delta: 0.12 }
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

/** State-level flip sensitivity (+15% on dimension inputs) */
export function analyzeStateFlips({ ayar, lightmatter, tech, scenarios, presetKey, worldCount = 2000 }) {
  const base = runSimulation({ ayar, lightmatter, tech, scenarios, presetKey, worldCount });
  const baseLeader = base.leader;
  const flips = [];

  for (const co of [
    { key: "ayar", name: "Ayar Labs" },
    { key: "lightmatter", name: "Lightmatter" }
  ]) {
    for (const sf of STATE_FLIP) {
      const a = cloneCo(ayar);
      const l = cloneCo(lightmatter);
      const target = co.key === "ayar" ? a : l;
      if (!bumpStateDimension(target, sf.key, sf.delta)) continue;
      const res = runSimulation({ ayar: a, lightmatter: l, tech, scenarios, presetKey, worldCount: 1500 });
      const margin = res.ayar.winPct - res.lightmatter.winPct;
      const baseMargin = base.ayar.winPct - base.lightmatter.winPct;
      if (baseLeader !== res.leader || Math.abs(margin - baseMargin) >= 10) {
        flips.push({
          company: co.name,
          dimension: sf.label,
          delta: sf.delta,
          flipped: baseLeader !== res.leader && res.leader === co.key,
          newLeader: res.leader,
          marginShift: margin - baseMargin
        });
      }
    }
  }

  flips.sort((a, b) => Math.abs(b.marginShift) - Math.abs(a.marginShift));
  return { base, flips: flips.slice(0, 5) };
}
