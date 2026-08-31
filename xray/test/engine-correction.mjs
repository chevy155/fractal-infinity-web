/**
 * Engine correction tests:
 * 1) severity independent of evidence_confidence
 * 2) relief is variable perturbation, not node deletion
 * Run: node xray/test/engine-correction.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scoreObservation, rankConstraints } from "../engine/score.js";
import { relieve, runCascade } from "../engine/cascade.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const weights = load("config/weights.json");
const { observations } = load("data/constraints.json");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed++;
  } else {
    console.log("PASS:", msg);
  }
}

// --- 1. Severity independent of confidence ---
const base = { ...observations.find((o) => o.node_id === "advanced-packaging") };
const lowConf = scoreObservation({ ...base, evidence_confidence: 0.2 }, weights);
const highConf = scoreObservation({ ...base, evidence_confidence: 0.95 }, weights);
assert(lowConf.score === highConf.score, `severity score unchanged by confidence (${lowConf.score})`);
assert(lowConf.evidence_confidence !== highConf.evidence_confidence, "confidence values differ");
assert(lowConf.status.includes("LOW CONFIDENCE"), `low conf status: ${lowConf.status}`);
assert(highConf.status.includes("HIGH CONFIDENCE"), `high conf status: ${highConf.status}`);
assert(!lowConf.drivers.some((d) => d.key === "evidence_confidence"), "confidence not a severity driver");

// Dangerous but poorly evidenced must still rank by severity
const fakeDanger = {
  ...base,
  node_id: "unknown-danger",
  demand_pressure: 0.99,
  capacity_pressure: 0.99,
  supplier_concentration: 0.99,
  lead_time_pressure: 0.99,
  substitution_difficulty: 0.99,
  downstream_importance: 0.99,
  evidence_confidence: 0.15
};
const rankedWithDanger = rankConstraints([...observations, fakeDanger], weights);
assert(rankedWithDanger[0].node_id === "unknown-danger", "low-confidence high-severity node still ranks #1");

// --- 2. Relief is perturbation, not deletion ---
const before = { ...base };
const after = relieve(before, weights);
assert(after.node_id === before.node_id, "relieved node still present");
assert(after.capacity_pressure < before.capacity_pressure, "capacity_pressure decreased");
assert(after.lead_time_pressure < before.lead_time_pressure, "lead_time_pressure decreased");
assert(after.supplier_concentration < before.supplier_concentration, "supplier_concentration decreased mildly");
assert(after.demand_pressure === before.demand_pressure, "demand_pressure intact");
assert(after.substitution_difficulty === before.substitution_difficulty, "substitution_difficulty intact");
assert(after.downstream_importance === before.downstream_importance, "downstream_importance intact");
assert(after.technology_maturity === before.technology_maturity, "technology_maturity intact");
assert(after.evidence_confidence === before.evidence_confidence, "evidence_confidence intact");

const cascade = runCascade(observations, weights);
const s0 = cascade.stages[0];
assert(s0.relief_applied.before.capacity_pressure > s0.relief_applied.after.capacity_pressure, "cascade records capacity perturbation");
assert(s0.relief_applied.intact.includes("substitution_difficulty"), "cascade records intact structural fields");

const stillPresent = observations.some((o) => o.node_id === s0.bottleneck_id);
assert(stillPresent, "original observation set still contains relieved node id (no deletion model)");

// After relief of #1, either a different node leads OR same node score dropped materially then may reappear later —
// migration to different bottleneck is expected for seed data:
assert(cascade.stages[1].bottleneck_id !== cascade.stages[0].bottleneck_id, "rerank after perturbation migrates bottleneck");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nALL PASS — engine correction frozen criteria met");
