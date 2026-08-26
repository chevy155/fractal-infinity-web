import { buildStateVector, computeDynamics, evidenceConfidence } from "./engine/dynamics.js";
import { runSimulation, contributionAnalysis } from "./engine/simulator.js";
import { analyzeFlipConditions } from "./engine/sensitivity.js";
import { buildWorldSummary } from "./engine/summary.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(__dirname, "data", f), "utf8"));

const ayar = load("ayar.json");
const lightmatter = load("lightmatter.json");
const tech = load("technology.json");
const scenarios = load("scenarios.json");
const claims = load("claims.json");
const sources = load("sources.json");

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("FAIL:", msg); } }

ok(ayar.variable_count >= 25, "ayar variables");
ok(lightmatter.variable_count >= 25, "lightmatter variables");
ok(tech.count >= 10, "tech variables");
ok(claims.count >= 40, "claims");
ok(sources.sources.length >= 20, "sources");
ok(sources.independent_lineages >= 10, "lineages");

const sv = buildStateVector(ayar);
ok(Object.keys(sv).length === 8, "state vector");
const dyn = computeDynamics(ayar, sv);
ok(dyn.momentum > 0 && dyn.momentum <= 1, "momentum range");

const res = runSimulation({ ayar, lightmatter, tech, scenarios, presetKey: "all", worldCount: 500 });
ok(res.N === 500, "world count");
ok(res.ayar.winPct + res.lightmatter.winPct + res.tiesPct <= 102, "percent sum");
ok(res.leader === "ayar" || res.leader === "lightmatter" || res.leader === "tie", "leader");

const res2 = runSimulation({ ayar, lightmatter, tech, scenarios, presetKey: "capital_winter", worldCount: 500 });
ok(res2.presetKey === "capital_winter", "preset");

const ca = contributionAnalysis(ayar);
ok(ca.top.length >= 5, "contributions");

const flip = analyzeFlipConditions({ ayar, lightmatter, tech, scenarios, presetKey: "all", worldCount: 800 });
ok(flip.base, "flip base");

const summary = buildWorldSummary(res, ayar, lightmatter, flip);
ok(summary.winner && summary.why && summary.flip, "summary");

console.log(`Crucible v2 tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
