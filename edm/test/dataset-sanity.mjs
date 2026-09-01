import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../investigations/lightmatter");
const nodes = JSON.parse(readFileSync(join(root, "nodes.json"), "utf8"));
const edges = JSON.parse(readFileSync(join(root, "edges.json"), "utf8"));
const evidence = JSON.parse(readFileSync(join(root, "evidence.json"), "utf8"));
const signals = JSON.parse(readFileSync(join(root, "signals.json"), "utf8"));

const nodeIds = new Set(nodes.nodes.map((n) => n.id));
let pass = true;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    pass = false;
  } else console.log("PASS:", label);
}

ok("node count in range", nodes.nodes.length >= 10 && nodes.nodes.length <= 40);
ok("anchor exists", nodeIds.has(nodes.anchor));

for (const e of edges.edges) {
  ok(`edge ${e.id} endpoints`, nodeIds.has(e.from) && nodeIds.has(e.to));
  ok(`edge ${e.id} has evidence`, e.evidence?.length > 0);
  ok(`edge ${e.id} has class`, !!e.class);
}

for (const ev of evidence.evidence) {
  ok(`evidence ${ev.id} has url`, !!ev.source_url?.startsWith("http"));
  ok(`evidence ${ev.id} has class`, !!ev.data_class);
}

const edgeEvidenceIds = new Set(edges.edges.flatMap((e) => e.evidence));
for (const id of edgeEvidenceIds) {
  ok(`evidence ref ${id} exists`, evidence.evidence.some((e) => e.id === id));
}

ok("signals present", signals.signals.length >= 3);
console.log(`\nNODES ${nodes.nodes.length} EDGES ${edges.edges.length} EVIDENCE ${evidence.evidence.length}`);
process.exit(pass ? 0 : 1);
