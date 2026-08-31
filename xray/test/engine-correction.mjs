/**
 * Engine correction tests (data-agnostic synthetic observations).
 * Run: node xray/test/engine-correction.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scoreObservation, rankConstraints } from "../engine/score.js";
import { relieve, runCascade } from "../engine/cascade.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const weights = JSON.parse(readFileSync(join(root, "config/weights.json"), "utf8"));

const synth = (id, conf = 0.6) => ({
  node_id: id,
  data_class: "MODELED",
  demand_pressure: 0.95,
  capacity_pressure: 0.92,
  capacity_growth: 0.5,
  supplier_concentration: 0.9,
  lead_time_pressure: 0.85,
  yield_risk: 0.5,
  technology_maturity: 0.7,
  qualification_difficulty: 0.8,
  substitution_difficulty: 0.9,
  geographic_concentration: 0.8,
  downstream_importance: 0.95,
  evidence_confidence: conf
});

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed++;
  } else console.log("PASS:", msg);
}

const base = synth("node-a", 0.55);
const lowConf = scoreObservation({ ...base, evidence_confidence: 0.2 }, weights);
const highConf = scoreObservation({ ...base, evidence_confidence: 0.95 }, weights);
assert(lowConf.score === highConf.score, `severity unchanged by confidence (${lowConf.score})`);
assert(lowConf.status.includes("LOW CONFIDENCE"), lowConf.status);
assert(highConf.status.includes("HIGH CONFIDENCE"), highConf.status);
assert(!lowConf.drivers.some((d) => d.key === "evidence_confidence"), "confidence not a severity driver");

const danger = synth("unknown-danger", 0.15);
danger.demand_pressure = 0.99;
danger.capacity_pressure = 0.99;
danger.supplier_concentration = 0.99;
danger.lead_time_pressure = 0.99;
danger.substitution_difficulty = 0.99;
danger.downstream_importance = 0.99;
const ranked = rankConstraints([synth("other", 0.9), danger], weights);
assert(ranked[0].node_id === "unknown-danger", "low-confidence high-severity still #1");

const before = synth("node-a");
const after = relieve(before, weights);
assert(after.capacity_pressure < before.capacity_pressure, "capacity_pressure decreased");
assert(after.lead_time_pressure < before.lead_time_pressure, "lead_time_pressure decreased");
assert(after.supplier_concentration < before.supplier_concentration, "supplier_concentration decreased");
assert(after.demand_pressure === before.demand_pressure, "demand intact");
assert(after.substitution_difficulty === before.substitution_difficulty, "substitution intact");
assert(after.downstream_importance === before.downstream_importance, "downstream intact");
assert(after.technology_maturity === before.technology_maturity, "maturity intact");

const observations = [
  synth("top", 0.7),
  {
    ...synth("second", 0.7),
    demand_pressure: 0.93,
    capacity_pressure: 0.88,
    supplier_concentration: 0.85,
    lead_time_pressure: 0.8,
    substitution_difficulty: 0.88,
    downstream_importance: 0.93
  },
  {
    ...synth("third", 0.7),
    demand_pressure: 0.7,
    capacity_pressure: 0.6,
    supplier_concentration: 0.6,
    lead_time_pressure: 0.5,
    substitution_difficulty: 0.65,
    downstream_importance: 0.75
  }
];
const cascade = runCascade(observations, weights);
assert(
  cascade.stages[0].relief_applied.before.capacity_pressure >
    cascade.stages[0].relief_applied.after.capacity_pressure,
  "cascade records capacity perturbation"
);
assert(cascade.stages[1].bottleneck_id !== cascade.stages[0].bottleneck_id, "cascade migrates after relief");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nALL PASS — engine correction");
