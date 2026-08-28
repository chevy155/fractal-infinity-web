import { buildStateVector, computeDynamics, structuralScore, evidenceConfidence, STATE_KEYS } from "./engine/dynamics.js";
import { runSimulation, liveState } from "./engine/simulator.js";
import { computeDriverAttribution, analyzeStateFlips } from "./engine/sensitivity.js";
import { buildWorldSummary } from "./engine/summary.js";
import { buildWhitePaper } from "./engine/report.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(__dirname, "data", f), "utf8"));

const urnm = load("urnm.json");
const remx = load("remx.json");
const scenarios = load("scenarios.json");
const sources = load("sources.json");
const claims = load("claims.json");
const meta = load("meta.json");

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error("FAIL:", msg); } }

ok(urnm.variable_count >= 20, "urnm variables");
ok(remx.variable_count >= 20, "remx variables");
ok(claims.count >= 25, "claims");
ok(sources.sources.length >= 20, "sources");
ok(sources.independent_lineages >= 8, "lineages");
ok(Object.keys(scenarios.presets).length >= 10, "world presets");
ok(STATE_KEYS.length === 10, "state dims");

const su = buildStateVector(urnm);
ok(Object.keys(su).length === 10, "urnm state");
const du = computeDynamics(urnm, su);
ok(du.momentum > 0 && du.momentum <= 1, "momentum");
ok(structuralScore(su, du) > 0, "score");
ok(evidenceConfidence(urnm).level, "evidence");

const res = runSimulation({ urnm, remx, scenarios, presetKey: "all", worldCount: 500 });
ok(res.N === 500, "N");
ok(res.urnm.winPct + res.remx.winPct + res.tiesPct <= 102, "pct sum");
ok(["urnm", "remx", "tie"].includes(res.leader), "leader");

const resN = runSimulation({ urnm, remx, scenarios, presetKey: "nuclear_renaissance", worldCount: 400 });
ok(resN.presetKey === "nuclear_renaissance", "nuclear preset");
ok(resN.urnm.winPct >= resN.remx.winPct - 5, "nuclear favors urnm loosely");

const resC = runSimulation({ urnm, remx, scenarios, presetKey: "china_ree_shock", worldCount: 400 });
ok(resC.remx.winPct >= 40, "china shock remx competitive");

const attr = computeDriverAttribution(urnm, remx);
ok(attr.top.length >= 3, "drivers");

const flips = analyzeStateFlips({ urnm, remx, scenarios, presetKey: "all", worldCount: 600 });
ok(flips.base, "flips");

const summary = buildWorldSummary(res, urnm, remx, flips, attr);
ok(summary.executive && summary.executive.length > 80, "executive");

const paper = buildWhitePaper({
  result: res, summary, urnm, remx, sources, claims, flipAnalysis: flips,
  matrix: [{ world: "test", leader: "URNM", urnmWin: 60, remxWin: 40 }]
});
ok(paper.bibliography.length === sources.sources.length, "biblio");
ok(paper.page1.keyFindings.length >= 3, "findings");

const live = liveState(urnm, remx);
ok(live.length === 2, "live");

ok(meta.data_current_through, "data stamp");
ok(urnm.thesis_breakers.length >= 4, "urnm breakers");
ok(remx.thesis_breakers.length >= 4, "remx breakers");

// provenance: every FACT variable has sources
for (const v of [...urnm.variables, ...remx.variables].filter(x => x.type === "FACT")) {
  ok(v.sources?.length > 0, `fact sourced ${v.id}`);
}

console.log(`Materials Crucible tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
