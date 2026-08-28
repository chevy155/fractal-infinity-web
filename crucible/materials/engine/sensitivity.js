import { buildStateVector, computeDynamics, structuralScore, STATE_KEYS, STATE_LABELS } from "./dynamics.js";
import { runSimulation } from "./simulator.js";

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function bumpVars(fund, stateKey, delta) {
  const ids = fund.state_weights[stateKey] || [];
  let n = 0;
  for (const id of ids) {
    const v = fund.variables.find(x => x.id === id);
    if (v && typeof v.value === "number") {
      v.value = Math.max(0, Math.min(1, v.value + delta));
      n++;
    }
  }
  return n > 0;
}

export function computeDriverAttribution(urnm, remx) {
  const su = buildStateVector(urnm);
  const sr = buildStateVector(remx);
  const du = computeDynamics(urnm, su);
  const dr = computeDynamics(remx, sr);
  const base = structuralScore(su, du) - structuralScore(sr, dr);
  const influences = [];
  for (const k of STATE_KEYS) {
    const su2 = { ...su, [k]: sr[k] };
    const sr2 = { ...sr, [k]: su[k] };
    const m1 = structuralScore(su2, computeDynamics(urnm, su2)) - structuralScore(sr, dr);
    const m2 = structuralScore(su, du) - structuralScore(sr2, computeDynamics(remx, sr2));
    const influence = (Math.abs(base - m1) + Math.abs(base - m2)) / 2;
    influences.push({
      id: k,
      label: STATE_LABELS[k] || k,
      influence,
      urnm: su[k],
      remx: sr[k],
      delta: su[k] - sr[k],
      direction: su[k] >= sr[k] ? "URNM" : "REMX"
    });
  }
  const total = influences.reduce((s, d) => s + d.influence, 0) || 1;
  const drivers = influences
    .map(d => ({ ...d, share: Math.round(d.influence / total * 100), importance: d.influence / total }))
    .sort((a, b) => b.share - a.share);
  let cum = 0;
  const top = [];
  for (const d of drivers) {
    cum += d.share;
    top.push({ ...d, cumulative: cum });
    if (cum >= 80 || top.length >= 5) break;
  }
  return { baseMargin: base, drivers, top };
}

export function analyzeStateFlips({ urnm, remx, scenarios, presetKey, worldCount = 1500 }) {
  const base = runSimulation({ urnm, remx, scenarios, presetKey, worldCount });
  const flips = [];
  for (const co of [
    { key: "urnm", name: "URNM", obj: urnm },
    { key: "remx", name: "REMX", obj: remx }
  ]) {
    for (const dim of STATE_KEYS) {
      const u = clone(urnm);
      const r = clone(remx);
      const target = co.key === "urnm" ? u : r;
      if (!bumpVars(target, dim, 0.15)) continue;
      const res = runSimulation({ urnm: u, remx: r, scenarios, presetKey, worldCount: 1200 });
      const margin = res.urnm.winPct - res.remx.winPct;
      const baseMargin = base.urnm.winPct - base.remx.winPct;
      if (base.leader !== res.leader || Math.abs(margin - baseMargin) >= 8) {
        flips.push({
          company: co.name,
          dimension: STATE_LABELS[dim] || dim,
          dimensionKey: dim,
          delta: 0.15,
          flipped: base.leader !== res.leader && res.leader === co.key,
          newLeader: res.leader,
          marginShift: margin - baseMargin
        });
      }
    }
  }
  flips.sort((a, b) => Math.abs(b.marginShift) - Math.abs(a.marginShift));
  return { base, flips: flips.slice(0, 8) };
}

export function perFundSensitivity(fund, other, scenarios, presetKey) {
  const attribution = computeDriverAttribution(
    fund.id === "urnm" ? fund : other,
    fund.id === "remx" ? fund : other
  );
  return attribution.drivers.slice(0, 5).map(d => ({
    variable: d.label,
    importance: d.share,
    currentDirection: d.direction === fund.ticker ? "favoring" : "opposing",
    confidence: Math.round((fund.variables.filter(v => (fund.state_weights[d.id] || []).includes(v.id))
      .reduce((a, v, _, arr) => a + v.confidence / (arr.length || 1), 0) || 0.7) * 100),
    flipThreshold: `+15% on ${d.label.toLowerCase()} for the trailing fund can shift modeled leadership`
  }));
}
