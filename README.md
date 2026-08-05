# Fractal Infinity — Website

Static one-pager. Plain HTML/CSS, no build step, no dependencies. Production hosting target: Cloudflare Pages, per the approved website plan.

## Structure
- `index.html` — the page.
- `styles.css` — brand system (Infinite Midnight / Archive Ivory / Signal Lime / Event Horizon), fully responsive (breakpoints at 860px and 520px).
- `privacy.html` — lightweight privacy disclosure for the newsletter-led site.
- `assets/` — Archival Portal mark, 4 episode thumbnails (EP01, EP02, EP05, EP06), Don't Read Until 2037 cover crop. All resized/compressed for web (JPEG, longest side ≤900px).

## Live integrations

1. **Beehiiv embed: resolved.** The official form loader for form `cdb87a22-75f9-4f73-b466-7cb69262c6b1` and Beehiiv's attribution script are wired into `index.html`. The real publication form was verified over a local HTTP origin on 2026-08-05.
2. **YouTube channel URL: resolved.** Existing Buzz history identifies the channel as `@Fractal-Infinity`; episode and footer links point to the real handle.

Everything else — copy, layout, images, Ledger sample data — is real and final, not placeholder.

## Deployment

The release-critical Beehiiv form is functional. Production is ready for Cloudflare-hosted deployment after the final source-state check.

## Verification notes
Visually inspected at desktop (1440px) and true mobile viewport (390px, verified via Playwright/CDP — the system Chrome CLI's `--headless --screenshot` flag does not reliably emulate viewports under ~500px in this environment, silently rendering wider and cropping the screenshot; a real headless run via `playwright-core` pointed at the system Chrome binary was used instead to confirm no horizontal overflow or clipped text at true mobile widths). Fixed one real bug found this way: the topbar was overflowing at narrow widths before `overflow-x: hidden` + topbar truncation rules were added.
