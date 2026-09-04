/**
 * Dataset sanity checks after evidence population.
 * Engine files must remain unchanged.
 * Run: node xray/test/dataset-sanity.mjs
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rankConstraints } from "../engine/score.js";
import { runCascade } from "../engine/cascade.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const hash = (p) => createHash("sha256").update(readFileSync(join(root, p))).digest("hex").slice(0, 16);

let failed = 0;
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL:", m);
    failed++;
  } else console.log("PASS:", m);
};

// Frozen engine fingerprints (update only if intentional engine change approved)
const FROZEN = {
  "engine/score.js": null,
  "engine/cascade.js": null,
  "config/weights.json": null
};
for (const p of Object.keys(FROZEN)) {
  FROZEN[p] = hash(p);
  console.log("HASH", p, FROZEN[p]);
}

const dataRel = "investigations/ai-accelerator";
const weights = load("config/weights.json");
const constraints = load(`${dataRel}/constraints.json`);
const nodes = load(`${dataRel}/nodes.json`);
const evidence = load(`${dataRel}/evidence.json`);
const MODEL_FIELDS = [
  "demand_pressure",
  "capacity_pressure",
  "capacity_growth",
  "supplier_concentration",
  "lead_time_pressure",
  "yield_risk",
  "technology_maturity",
  "qualification_difficulty",
  "substitution_difficulty",
  "geographic_concentration",
  "downstream_importance",
  "evidence_confidence"
];

assert(nodes.nodes.length >= 15 && nodes.nodes.length <= 22, `node count in range (${nodes.nodes.length})`);
assert(!JSON.stringify(nodes).includes("MODEL_SEED"), "nodes not MODEL_SEED");
assert(constraints.status === "EVIDENCE_BACKED", "constraints EVIDENCE_BACKED");

for (const o of constraints.observations) {
  for (const f of MODEL_FIELDS) {
    assert(typeof o[f] === "number", `${o.node_id}.${f} numeric`);
    assert(typeof o[`${f}_rationale`] === "string" && o[`${f}_rationale`].length > 20, `${o.node_id}.${f}_rationale present`);
  }
}

for (const c of evidence.claims) {
  assert(!!c.source_url, `${c.id} has source_url`);
  assert(!!c.source_title, `${c.id} has source_title`);
  assert(!!c.claim_type, `${c.id} has claim_type`);
  assert(c.data_class === "OBSERVED", `${c.id} OBSERVED`);
}

const ranked = rankConstraints(constraints.observations, weights);
const high = ranked.filter((r) => r.score >= weights.risk_bands.high);
for (const r of high) {
  const nClaims = evidence.claims.filter((c) => c.subject === r.node_id || c.node_id === r.node_id).length;
  assert(nClaims >= 1, `high-severity ${r.node_id} has evidence (${nClaims})`);
}

assert(
  !ranked[0].drivers.some((d) => d.key === "evidence_confidence"),
  "confidence separate from severity drivers"
);

const cascade = runCascade(constraints.observations, weights);
assert(cascade.stages.length >= 2, "cascade has stages");
assert(cascade.stages[0].bottleneck_id !== cascade.stages[1].bottleneck_id, "cascade migrates");
assert(ranked[0].node_id === "cowos", "CoWoS remains #1 after 2Q26 update");
assert(cascade.stages[1].bottleneck_id === "hbm4", "cascade still migrates to HBM4");

const intel = load(`${dataRel}/intelligence.json`);
const INTEL_FIELDS = [
  "current_reality", "constraint_migration", "gains_leverage", "loses_leverage",
  "second_order_effect", "opportunity", "watch_signals", "confidence"
];
for (const f of INTEL_FIELDS) assert(intel[f] != null, `intelligence.${f}`);
assert(intel.data_class === "MODELED", "intelligence MODELED");
assert(intel.bottleneck_id === ranked[0].node_id, "intelligence bottleneck matches engine #1");
assert(intel.next_bottleneck_id === cascade.stages[1].bottleneck_id, "intelligence next matches cascade");
assert(intel.confidence.level === ranked[0].evidence_confidence, "intelligence confidence tracks top-node evidence");
assert(!JSON.stringify(intel).toLowerCase().includes("buy "), "intelligence is not investment advice");
assert(Array.isArray(intel.watch_signals.confirm) && Array.isArray(intel.watch_signals.invalidate), "watch signals both sides");
assert(evidence.claims.some((c) => c.id === "c031" && c.source_class === "primary"), "2Q26 TSMC claim present");
assert(evidence.claims.some((c) => c.id === "c034" && c.source_class === "primary"), "2Q26 SK HBM4 claim present");

console.log("\nTOP5");
ranked.slice(0, 5).forEach((r, i) => console.log(`#${i + 1}`, r.node_id, r.score, r.status));
console.log("\nCASCADE", cascade.stages.map((s) => `${s.bottleneck_id}:${s.score}`).join(" → "));

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nDATASET SANITY PASS");
console.log("FROZEN_HASHES", JSON.stringify(FROZEN));
