/**
 * Datacenter Buildout dataset sanity.
 * Run: node xray/test/datacenter-buildout-sanity.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rankConstraints } from "../engine/score.js";
import { runCascade } from "../engine/cascade.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

let failed = 0;
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL:", m);
    failed++;
  } else console.log("PASS:", m);
};

const dataRel = "investigations/datacenter-buildout";
const weights = load("config/weights.json");
const constraints = load(`${dataRel}/constraints.json`);
const nodes = load(`${dataRel}/nodes.json`);
const evidence = load(`${dataRel}/evidence.json`);
const rels = load(`${dataRel}/relationships.json`);

const MODEL_FIELDS = [
  "demand_pressure", "capacity_pressure", "capacity_growth", "supplier_concentration",
  "lead_time_pressure", "yield_risk", "technology_maturity", "qualification_difficulty",
  "substitution_difficulty", "geographic_concentration", "downstream_importance", "evidence_confidence"
];

assert(nodes.nodes.length >= 8 && nodes.nodes.length <= 12, `node count (${nodes.nodes.length})`);
assert(constraints.status === "EVIDENCE_BACKED", "constraints EVIDENCE_BACKED");
assert(evidence.claims.length >= 15 && evidence.claims.length <= 25, `claims count (${evidence.claims.length})`);
assert(rels.relationships.length >= 10, `relationships (${rels.relationships.length})`);

const nodeIds = new Set(nodes.nodes.map((n) => n.id));
for (const o of constraints.observations) {
  assert(nodeIds.has(o.node_id), `obs node ${o.node_id}`);
  for (const f of MODEL_FIELDS) {
    assert(typeof o[f] === "number", `${o.node_id}.${f}`);
    assert(typeof o[`${f}_rationale`] === "string" && o[`${f}_rationale`].length > 20, `${o.node_id}.${f}_rationale`);
  }
}

for (const r of rels.relationships) {
  assert(nodeIds.has(r.from) && nodeIds.has(r.to), `edge ${r.from}->${r.to}`);
}

for (const c of evidence.claims) {
  assert(!!c.source_url?.startsWith("http"), `${c.id} url`);
  assert(c.data_class === "OBSERVED", `${c.id} OBSERVED`);
  assert(nodeIds.has(c.node_id) || nodeIds.has(c.subject), `${c.id} node`);
}

const primary = evidence.source_inventory.filter((s) => s.class === "primary").length;
const secondary = evidence.source_inventory.filter((s) => s.class === "secondary").length;
assert(primary >= 8, `primary sources (${primary})`);
console.log(`SOURCES primary=${primary} secondary=${secondary}`);

const ranked = rankConstraints(constraints.observations, weights);
const cascade = runCascade(constraints.observations, weights);
assert(ranked.length === constraints.observations.length, "rank length");
assert(cascade.stages.length >= 3, "cascade stages");
assert(ranked[0].drivers.every((d) => d.key !== "evidence_confidence"), "confidence not severity driver");

const accelRank = ranked.findIndex((r) => r.node_id === "ai-accelerators");
const xfmrRank = ranked.findIndex((r) => r.node_id === "large-power-transformers");
const iceRank = ranked.findIndex((r) => r.node_id === "grid-interconnection");
const turbRank = ranked.findIndex((r) => r.node_id === "gas-turbines");
assert(accelRank > 0, "accelerators not #1 for datacenter expansion");
assert(xfmrRank < accelRank && iceRank < accelRank, "power-delivery nodes outrank accelerators");
assert(["large-power-transformers", "grid-interconnection", "gas-turbines"].includes(ranked[0].node_id), "top bottleneck is a power-delivery node");

const scores = ranked.map((r) => r.score);
assert(new Set(scores).size >= 5, "scores not identical");
assert(cascade.stages[1].bottleneck_id !== cascade.stages[0].bottleneck_id, "relief changes top node");

const xfmr = constraints.observations.find((o) => o.node_id === "large-power-transformers");
assert(xfmr.evidence_confidence < 0.75, "transformer #1 must not claim HIGH confidence without 2026 primary lead times");

const intel = load(`${dataRel}/intelligence.json`);
const INTEL_FIELDS = [
  "current_reality", "constraint_migration", "gains_leverage", "loses_leverage",
  "second_order_effect", "opportunity", "watch_signals", "confidence"
];
for (const f of INTEL_FIELDS) assert(intel[f] != null, `intelligence.${f}`);
assert(intel.data_class === "MODELED", "intelligence MODELED");
assert(intel.bottleneck_id === ranked[0].node_id, "intelligence bottleneck matches engine #1");
assert(intel.next_bottleneck_id === cascade.stages[1].bottleneck_id, "intelligence next matches cascade");
assert(intel.confidence.band === "MODERATE" || intel.confidence.level < 0.75, "intelligence confidence not overstated");
assert(!JSON.stringify(intel).toLowerCase().includes("buy "), "intelligence is not investment advice");
assert(Array.isArray(intel.watch_signals.confirm) && Array.isArray(intel.watch_signals.invalidate), "watch signals both sides");

console.log("\nRANKED");
ranked.forEach((r, i) => {
  const n = nodes.nodes.find((x) => x.id === r.node_id);
  console.log(`#${i + 1} ${n?.label} ${r.score} ${r.evidence_confidence_pct}% ${r.status}`);
});
console.log("\nCASCADE");
cascade.stages.forEach((s) => console.log(`stage ${s.stage} ${s.bottleneck_id} ${s.score}`));

if (failed) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}
console.log("\nDATACENTER BUILDOUT SANITY PASS");
