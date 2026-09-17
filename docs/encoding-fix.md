# Website UTF-8 repair

## Cause and scope

Commit `ed914fd5ac6bf7e9bad7fb04127bf766c901d5ee` (September 12 cache-busting change) introduced UTF-8 bytes decoded as Windows-1252 and saved back as UTF-8. Earlier Git revisions contain correct punctuation. The exact historical command is not recorded here. All source files were valid UTF-8, so changing charset alone could not fix the stored corruption.

Repaired 429 reversible sequences in 28 HTML files, including titles, descriptions, social metadata, visible copy and labels. Restored punctuation and the original icons without changing wording, CSS, fonts or animations. Preserved the already-live gripper video and restored homepage hero. The shared JavaScript, JSON datasets and generator sources were clean. No runtime replacement was added.

Static responses previously omitted HTTP charset; no conflicting charset was observed. Early HTML UTF-8 declarations were already present. Generated `_headers` explicitly declares UTF-8 for tracked HTML routes and extensionless aliases, without changing media MIME types. Database report responses already declare UTF-8.

## Validation

- Strict source scan covers HTML, JavaScript, templates, JSON, structured metadata and other text; checks raw bytes, reversible mojibake, replacement characters, C1 controls and early HTML charset.
- Four focused regression tests include valid accented/multilingual text, emoji, single/double mojibake, invalid bytes, escaped JSON and HTML entities.
- Production Wrangler dry-run passed; generated Worker bundle passed scanning.
- Historical scaffold regenerated into an isolated output directory: 13 pages passed. Production pages have subsequent hand-edited content and are not overwritten with the older scaffold.
- Read-only audit of all four D1 stored report HTML documents passed.
- Desktop and Chromium iPhone 13 emulation: homepage, Blender page (both URL forms), privacy; clean rendered text/metadata/labels, no page-script errors or horizontal overflow, gripper video 1920x1080 / 20 seconds. WebKit is not installed.
- Route verification exposed an existing static-report redirect collision with D1; static assets now resolve first. Two focused routing tests pass.
- Browser and delivery verification results are recorded in the pull request.

## Caching and limits

A fresh successful origin/CDN fetch verifies current HTML, not previously saved Apple Messages previews. Messages may retain its own title/description cache. Existing conversations may continue showing stale previews; their refresh cannot be claimed without observing it on a device. Browser mobile emulation is not an actual iPhone test.

## Repaired files

- `crucible.html`
- `index.html`
- `materials-crucible.html`
- `memory-crucible.html`
- `privacy.html`
- `reports.html`
- `research-lab.html`
- `vision.html`
- `intelligence/bottleneck-reports.html`
- `intelligence/crucible-results.html`
- `intelligence/live-datasets.html`
- `intelligence/predictions.html`
- `intelligence/research-reports.html`
- `intelligence/supply-chain-maps.html`
- `labs/dataset-builder.html`
- `labs/deep-research.html`
- `labs/supplier-substitute.html`
- `physical-design/blender-rendering.html`
- `report/sample.html`
- `tools/bottleneck-xray.html`
- `tools/crucible.html`
- `tools/evidence-dependency-map.html`
- `tools/thesis-risk-monitor.html`
- `tools/dependency-map/lightmatter.html`
- `tools/xray/ai-accelerator.html`
- `tools/xray/ai-networking.html`
- `tools/xray/datacenter-buildout.html`
- `tools/xray/methodology.html`
