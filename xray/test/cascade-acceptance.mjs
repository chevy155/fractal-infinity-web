/**
 * Acceptance: relieve top constraint → ranking migrates with explainable scores.
 * Run: node xray/test/cascade-acceptance.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rankConstraints } from "../engine/score.js";
import { runCascade } from "../engine/cascade.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

const weights = load("config/weights.json");
const { observations } = load("investigations/ai-accelerator/constraints.json");
const { nodes } = load("investigations/ai-accelerator/nodes.json");
const label = (id) => nodes.find((n) => n.id === id)?.label || id;

const ranked = rankConstraints(observations, weights);
const cascade = runCascade(observations, weights);

console.log("RANKED (severity | confidence)");
ranked.slice(0, 5).forEach((r, i) =>
  console.log(`#${i + 1}`, label(r.node_id), r.score, `${r.evidence_confidence_pct}%`, r.status)
);

console.log("\nCASCADE");
cascade.stages.forEach((s, i) => console.log(`stage ${i + 1}`, label(s.bottleneck_id), s.score));

const ids = cascade.stages.map((s) => s.bottleneck_id);
const uniqueMigration = ids.length >= 2 && ids[0] !== ids[1];
const topHasDrivers = ranked[0].drivers.length >= 4;
const confSeparate = !ranked[0].drivers.some((d) => d.key === "evidence_confidence");
const reliefIsPerturb =
  cascade.stages[0].relief_applied.before.capacity_pressure >
  cascade.stages[0].relief_applied.after.capacity_pressure;

if (!uniqueMigration) {
  console.error("FAIL: cascade did not migrate to a different bottleneck after relief");
  process.exit(1);
}
if (!topHasDrivers) {
  console.error("FAIL: missing score drivers");
  process.exit(1);
}
if (!confSeparate) {
  console.error("FAIL: evidence_confidence still in severity drivers");
  process.exit(1);
}
if (!reliefIsPerturb) {
  console.error("FAIL: relief did not perturb capacity_pressure");
  process.exit(1);
}
console.log("\nPASS: cascade migrates after variable relief; severity≠confidence");
