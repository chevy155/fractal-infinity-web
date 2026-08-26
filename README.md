# Fractal Infinity — Website

Static one-pager. Plain HTML/CSS, no build step, no dependencies.

**Canonical public site:** [https://fractalinfinity.io](https://fractalinfinity.io)

Production hosting is a **Cloudflare Worker** serving this repository. The 2026-08-18 GitHub Pages → Cloudflare migration is complete. The site is Fractal-owned, GitHub-controlled, Cloudflare-deployed, and still collaborative.

## Ownership

| Layer | Role |
| --- | --- |
| `chevy155/fractal-infinity-web` | Canonical source of truth. Marco has full admin control. |
| Cloudflare Worker | Production hosting for `fractalinfinity.io` |
| `www.fractalinfinity.io` | Cloudflare 301 to `fractalinfinity.io` (path and query preserved) |
| `command.fractalinfinity.io` | Existing Tunnel. Untouched by this migration. |
| `geniusblack9999/fractal-infinity-site` | Rollback / reference only. Keep intact for a short rollback window. |

Do not treat GitHub Pages, `www`, or Genius’s repo as production.

## Structure

- `index.html` — the page.
- `research-lab.html` — Research Lab / Process Intelligence. **Live:** Fractal Research MCP v0.1. **Coming next:** SDK, GitHub Action.
- `report/sample.html` — sample after-action X-Ray at the `/report/{run}` URL shape.
- Companion package: `../fractal-research-mcp` (recorder Worker + local MCP server).
- `styles.css` — brand system (Infinite Midnight / Archive Ivory / Signal Lime / Event Horizon), fully responsive (breakpoints at 860px and 520px).
- `privacy.html` — lightweight privacy disclosure for the newsletter-led site.
- `assets/` — Archival Portal mark, 4 episode thumbnails (EP01, EP02, EP05, EP06), Don't Read Until 2037 cover crop. All resized/compressed for web (JPEG, longest side ≤900px).

## Live integrations

1. **Beehiiv embed: resolved.** The official form loader for form `cdb87a22-75f9-4f73-b466-7cb69262c6b1` and Beehiiv's attribution script are wired into `index.html`.
2. **YouTube channel URL: resolved.** Existing Buzz history identifies the channel as `@Fractal-Infinity`; episode and footer links point to the real handle.

Everything else — copy, layout, images, Ledger sample data — is real and final, not placeholder.

## Deployment and rollback

Edit and ship from `chevy155/fractal-infinity-web`. Cloudflare deploys the Worker from that repo.

Rollback during the window: keep `geniusblack9999/fractal-infinity-site` intact as reference. Do **not** remove obsolete GitHub Pages production configuration until the new setup is comfortable to operate. Next governance steps (not more migration):

1. Keep Genius’s repo intact for a short rollback window.
2. Add Genius to `chevy155/fractal-infinity-web` with Write/Maintain access.
3. Document this deployment/rollback flow (this README).
4. Remove obsolete GitHub Pages production configuration only after that window.

## Acceptance gates (passed 2026-08-18)

| Gate | Result |
| --- | --- |
| Apex `fractalinfinity.io` | 200 |
| `/privacy` | 200 |
| Unknown routes | 404 |
| Repository / config paths | blocked |
| Beehiiv | working |
| Responsive layouts | clean |
| `www` redirects | preserve path and query |
| Public `www` GitHub Pages dependency | none remaining |

## Verification notes

Visually inspected at desktop (1440px) and true mobile viewport (390px, verified via Playwright/CDP — the system Chrome CLI's `--headless --screenshot` flag does not reliably emulate viewports under ~500px in this environment, silently rendering wider and cropping the screenshot; a real headless run via `playwright-core` pointed at the system Chrome binary was used instead to confirm no horizontal overflow or clipped text at true mobile widths). Fixed one real bug found this way: the topbar was overflowing at narrow widths before `overflow-x: hidden` + topbar truncation rules were added.
