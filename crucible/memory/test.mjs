import { buildStateVector, computeDynamics, coords3D, leadershipScore, STATE_KEYS } from "./engine/dynamics.js";
import { runSimulation, buildTrajectory, liveState, DEFAULT_SLIDERS } from "./engine/simulator.js";
import { analyzeStateFlips } from "./engine/state-flips.js";
import { buildWorldSummary } from "./engine/summary.js";
import { computeDriverAttribution, collapsedDrivers, analystPriorShare } from "./engine/drivers.js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = f => JSON.parse(readFileSync(join(__dirname, "data", f), "utf8"));

const sk = load("sk-hynix.json");
const micron = load("micron.json");
const samsung = load("samsung.json");
const tech = load("technology.json");
const scenarios = load("scenarios.json");
const claims = load("claims.json");
const sources = load("sources.json");
const companies = [sk, micron, samsung];

let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error("FAIL:", m); } }

ok(sk.variable_count >= 35, "sk variables");
ok(micron.variable_count >= 35, "micron variables");
ok(samsung.variable_count >= 35, "samsung variables");
ok(tech.count >= 12, "tech variables");
ok(claims.count >= 100, "claims");
ok(sources.sources.length >= 30, "sources");

const srcIds = new Set(sources.sources.map(s => s.id));
const claimIds = new Set(claims.claims.map(c => c.id));
for (const co of companies) {
  for (const v of co.variables) {
    for (const s of v.sources || []) ok(srcIds.has(s), `source ref ${s}`);
    for (const c of v.claim_ids || []) ok(claimIds.has(c), `claim ref ${c}`);
  }
}

ok(STATE_KEYS.length >= 12 && STATE_KEYS.length <= 15, "state dimensions");

const sv = buildStateVector(sk);
ok(Object.keys(sv).length === STATE_KEYS.length, "state vector size");
const dyn = computeDynamics(sk, sv);
ok(dyn.momentum > 0 && dyn.momentum <= 1, "momentum bounded");
const c3 = coords3D(sv);
ok(c3.x >= 0 && c3.x <= 1 && !Number.isNaN(c3.y), "3D coords valid");

const sliders = { ...DEFAULT_SLIDERS };
const live1 = liveState(companies, tech, sliders);
const sliders2 = { ...sliders, hbm_demand: 0.95, packaging_constraint: 0.9 };
const live2 = liveState(companies, tech, sliders2);
ok(JSON.stringify(live1) !== JSON.stringify(live2), "sliders alter state");

for (const n of [1000, 5000, 10000]) {
  const res = runSimulation({ companies, tech, scenarios, presetKey: "hbm4_transition", worldCount: n, sliders });
  ok(res.N === n, `world count ${n}`);
  ok(res.leaderId === "sk_hynix" || res.leaderId === "micron" || res.leaderId === "samsung" || res.leader === "tie", "leader valid");
  ok(res.companies.every(c => !Number.isNaN(c.avgLeadership)), "no NaN leadership");
}

const traj = buildTrajectory(companies, tech, sliders, "all");
ok(traj.length === 7, "trajectory years");
ok(traj[0].year === 2026 && traj[6].year === 2032, "trajectory range");

const attr = computeDriverAttribution(companies);
const collapsed = collapsedDrivers(attr);
ok(collapsed.rows.length <= 6, "effective drivers <= 6");
const sum = collapsed.rows.reduce((a, r) => a + r.share, 0);
ok(sum >= 95 && sum <= 105, "driver shares sum sensibly");

const flip = analyzeStateFlips({ companies, tech, scenarios, presetKey: "all", sliders, worldCount: 800 });
ok(flip.flips.length >= 0, "flip analysis");

const res = runSimulation({ companies, tech, scenarios, presetKey: "all", worldCount: 500, sliders });
const summary = buildWorldSummary(res, flip, collapsed);
ok(summary.leader && summary.why && summary.flip, "summary");

ok(analystPriorShare(companies) > 0, "analyst prior share");

console.log(`Memory Crucible tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
