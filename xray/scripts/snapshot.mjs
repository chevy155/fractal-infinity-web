/**
 * Append-only X-Ray snapshot writer.
 * Usage:
 *   node xray/scripts/snapshot.mjs
 *   node xray/scripts/snapshot.mjs ai-accelerator
 *   node xray/scripts/snapshot.mjs --all
 *
 * Writes one JSON object per line to xray/memory/snapshots.jsonl.
 * Never truncates or rewrites prior rows.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, appendFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { rankConstraints } from "../engine/score.js";
import { runCascade } from "../engine/cascade.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const memoryDir = join(root, "memory");
const snapshotPath = join(memoryDir, "snapshots.jsonl");
const LIVE = ["ai-accelerator", "datacenter-buildout", "ai-networking"];

const load = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const fileHash = (p) => sha(readFileSync(join(root, p)));

export function buildSnapshot(investigationId, capturedAt = new Date().toISOString()) {
  const base = `investigations/${investigationId}`;
  const scenario = load(`${base}/scenario.json`);
  const constraints = load(`${base}/constraints.json`);
  const evidence = load(`${base}/evidence.json`);
  const weights = load("config/weights.json");
  let intelligence = null;
  try {
    intelligence = load(`${base}/intelligence.json`);
  } catch {
    intelligence = null;
  }

  const ranked = rankConstraints(constraints.observations, weights);
  const cascade = runCascade(constraints.observations, weights);
  const top = ranked[0];
  const next = cascade.stages[1];

  const claimIds = (evidence.claims || []).map((c) => c.id).sort();
  const evidenceSetHash = sha(JSON.stringify({
    claim_ids: claimIds,
    source_ids: (evidence.source_inventory || []).map((s) => s.id).sort()
  }));

  return {
    schema_version: 1,
    snapshot_id: `${investigationId}:${capturedAt}`,
    investigation_id: investigationId,
    captured_at: capturedAt,
    scenario_id: scenario.scenario_id || scenario.title || investigationId,
    evidence_set_hash: evidenceSetHash,
    evidence_file_hash: fileHash(`${base}/evidence.json`),
    constraints_file_hash: fileHash(`${base}/constraints.json`),
    intelligence_file_hash: intelligence ? fileHash(`${base}/intelligence.json`) : null,
    ranked: ranked.map((r) => ({
      node_id: r.node_id,
      score: r.score,
      evidence_confidence: r.evidence_confidence,
      status: r.status
    })),
    bottleneck_id: top?.node_id ?? null,
    next_bottleneck_id: next?.bottleneck_id ?? null,
    cascade: cascade.stages.map((s) => ({
      stage: s.stage,
      bottleneck_id: s.bottleneck_id,
      score: s.score,
      evidence_confidence: s.evidence_confidence
    })),
    opportunity: intelligence?.opportunity ?? null,
    watch_signals: intelligence?.watch_signals ?? null,
    intelligence_confidence: intelligence?.confidence ?? null,
    next_question: intelligence?.next_question ?? null,
    later_outcome: null
  };
}

export function appendSnapshot(snapshot, path = snapshotPath) {
  mkdirSync(dirname(path), { recursive: true });
  const beforeBytes = existsSync(path) ? statSync(path).size : 0;
  const line = `${JSON.stringify(snapshot)}\n`;
  appendFileSync(path, line, { encoding: "utf8", flag: "a" });
  const afterBytes = statSync(path).size;
  if (afterBytes < beforeBytes + Buffer.byteLength(line)) {
    throw new Error("append did not grow file as expected");
  }
  return { path, beforeBytes, afterBytes, snapshot_id: snapshot.snapshot_id };
}

export function readSnapshots(path = snapshotPath) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

function main() {
  const arg = process.argv[2];
  const ids = !arg || arg === "--all" ? LIVE : [arg];
  for (const unknown of ids) {
    if (!LIVE.includes(unknown) && arg && arg !== "--all") {
      // allow explicit id if folder exists
      if (!existsSync(join(root, "investigations", unknown))) {
        console.error(`Unknown investigation: ${unknown}`);
        process.exit(1);
      }
    }
  }
  const capturedAt = new Date().toISOString();
  const written = [];
  for (const id of ids) {
    const snap = buildSnapshot(id, capturedAt);
    const meta = appendSnapshot(snap);
    written.push(meta);
    console.log(`APPEND ${meta.snapshot_id} (+${meta.afterBytes - meta.beforeBytes} bytes) → ${meta.path}`);
  }
  console.log(`OK ${written.length} snapshot(s)`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
