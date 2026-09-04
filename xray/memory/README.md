# X-Ray snapshot memory

Append-only longitudinal store for live Bottleneck X-Ray investigations.

## Path

`xray/memory/snapshots.jsonl`

One JSON object per line. Rows are never rewritten or deleted by the snapshot script.

## Write

```bash
node xray/scripts/snapshot.mjs --all
node xray/scripts/snapshot.mjs ai-accelerator
```

## Stable IDs

- `investigation_id`: folder id (`ai-accelerator`, `datacenter-buildout`, `ai-networking`)
- `node_id`: investigation node ids already used by the ranking engine
- `snapshot_id`: `{investigation_id}:{captured_at}`

## Fields

See `buildSnapshot()` in `xray/scripts/snapshot.mjs`. Minimum product fields:

investigation_id, captured_at, ranked[{node_id,score,evidence_confidence,status}], evidence_set_hash, bottleneck_id, next_bottleneck_id, cascade, opportunity, watch_signals, intelligence_confidence, later_outcome (null until filled later).
