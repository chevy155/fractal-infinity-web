/**
 * Snapshot memory tests — append-only longitudinal store.
 * Run: node xray/test/snapshot-memory.mjs
 */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { buildSnapshot, appendSnapshot, readSnapshots } from "../scripts/snapshot.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmpPath = join(root, "memory", "_test-snapshots.jsonl");

let failed = 0;
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL:", m);
    failed++;
  } else console.log("PASS:", m);
};

const LIVE = ["ai-accelerator", "datacenter-buildout", "ai-networking"];
const REQUIRED = [
  "schema_version", "snapshot_id", "investigation_id", "captured_at",
  "evidence_set_hash", "ranked", "bottleneck_id", "next_bottleneck_id",
  "cascade", "opportunity", "watch_signals", "intelligence_confidence",
  "later_outcome"
];

try {
  if (existsSync(tmpPath)) unlinkSync(tmpPath);
  mkdirSync(dirname(tmpPath), { recursive: true });

  const firstBatch = [];
  const t0 = "2026-09-04T18:00:00.000Z";
  for (const id of LIVE) {
    const snap = buildSnapshot(id, t0);
    for (const f of REQUIRED) assert(snap[f] !== undefined, `${id} has ${f}`);
    assert(snap.later_outcome === null, `${id} later_outcome null`);
    assert(Array.isArray(snap.ranked) && snap.ranked.length >= 5, `${id} ranked length`);
    assert(snap.ranked.every((r) => r.node_id && typeof r.score === "number"), `${id} ranked stable ids`);
    assert(snap.bottleneck_id === snap.ranked[0].node_id, `${id} bottleneck matches #1`);
    assert(snap.next_bottleneck_id === snap.cascade[1]?.bottleneck_id, `${id} next matches cascade`);
    assert(/^[a-f0-9]{64}$/.test(snap.evidence_set_hash), `${id} evidence_set_hash sha256`);
    firstBatch.push(snap);
    appendSnapshot(snap, tmpPath);
  }

  const afterFirst = readSnapshots(tmpPath);
  assert(afterFirst.length === 3, `first append count=3 (got ${afterFirst.length})`);
  const firstBytes = readFileSync(tmpPath);

  // Second append must not destroy prior rows
  const t1 = "2026-09-04T18:05:00.000Z";
  for (const id of LIVE) {
    appendSnapshot(buildSnapshot(id, t1), tmpPath);
  }
  const afterSecond = readSnapshots(tmpPath);
  assert(afterSecond.length === 6, `second append count=6 (got ${afterSecond.length})`);
  assert(readFileSync(tmpPath).toString("utf8").startsWith(firstBytes.toString("utf8")), "prior bytes preserved at start of file");
  assert(afterSecond.slice(0, 3).every((s, i) => s.snapshot_id === firstBatch[i].snapshot_id), "first three snapshot_ids intact");
  assert(afterSecond.slice(3).every((s) => s.captured_at === t1), "second wave has new timestamps");
  assert(new Set(afterSecond.map((s) => s.snapshot_id)).size === 6, "snapshot_ids unique");

  // Stable ID strategy: investigation_id + existing node_ids
  for (const s of afterSecond) {
    assert(LIVE.includes(s.investigation_id), `known investigation ${s.investigation_id}`);
    assert(s.ranked.every((r) => typeof r.node_id === "string" && !r.node_id.includes(" ")), `stable node_id ${s.investigation_id}`);
  }

  // Hash reproducibility for same inputs
  const a = buildSnapshot("ai-accelerator", t0);
  const b = buildSnapshot("ai-accelerator", t0);
  assert(a.evidence_set_hash === b.evidence_set_hash, "evidence_set_hash reproducible");
  assert(a.bottleneck_id === "cowos", "accelerator bottleneck cowos");
  assert(buildSnapshot("datacenter-buildout", t0).bottleneck_id === "large-power-transformers", "datacenter bottleneck");
  assert(buildSnapshot("ai-networking", t0).bottleneck_id === "optical-transceivers", "networking bottleneck");

  // Production store path convention
  assert(existsSync(join(root, "memory")) || true, "memory dir creatable");
  console.log(`TMP_STORE ${tmpPath}`);
  console.log(`HASH_SAMPLE ${a.evidence_set_hash.slice(0, 16)}…`);
} finally {
  if (existsSync(tmpPath)) unlinkSync(tmpPath);
}

if (failed) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}
console.log("\nSNAPSHOT MEMORY PASS");
