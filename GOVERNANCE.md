# Production Governance

## Authority and Scope

- Canonical source: `chevy155/fractal-infinity-web`.
- Repository owner and emergency administrator: `chevy155` (Marco).
- Production host: Cloudflare Worker deployed from `main`.
- Public canonical hostname: `https://fractalinfinity.io`.
- `www.fractalinfinity.io` permanently redirects to the apex while preserving the path and query string.
- `command.fractalinfinity.io` is an unrelated Cloudflare Tunnel and is out of scope for website operations.
- Legacy reference: `geniusblack9999/fractal-infinity-site`. It remains intact, with its GitHub Pages configuration unchanged, for rollback and historical reference only.

## Contributions

Normal website changes must follow this flow:

1. Create a `feature/` or `fix/` branch from current `main`.
2. Make the focused change and verify it locally.
3. Open a pull request against `main`.
4. Resolve review comments and applicable checks.
5. Merge the pull request into `main`.
6. Allow Cloudflare's Git integration to deploy `main`.
7. Verify the apex homepage, privacy page, assets, Beehiiv signup, browser console, and network requests.
8. Record the deployed commit and validation evidence in the pull request.

Direct pushes to `main` are not the normal contribution path.

## Main Branch Governance

The intended active GitHub ruleset is named `Production main governance` and targets `main`.

It must require a pull request before merging, block force pushes, and prevent deletion of `main`. Require conversation resolution when GitHub permits it without introducing unsupported review requirements. Do not require status checks, deployments, signed commits, code scanning, multiple reviewers, or mandatory approving reviews unless they are already supported by the repository workflow.

`chevy155` must retain the emergency owner/admin bypass supported by GitHub. Do not apply a ruleset that can lock the repository owner out. If GitHub requires one or more approving reviews in order to enforce pull requests, stop and obtain an explicit reviewer-policy decision before enabling the ruleset.

## Normal Rollback

`git revert` is the normal rollback mechanism. Do not use `git reset --hard` followed by a force push for a normal production rollback.

1. Identify the last known-good commit on `main`.
2. Create a revert commit for the offending commit or merged pull request.
3. Submit and merge the revert through the governed pull-request workflow.
4. Allow Cloudflare's Git integration to deploy updated `main`.
5. Verify the apex, privacy page, assets, Beehiiv signup, browser console, and network requests.
6. Record the deployed commit and validation evidence.

## Emergency DNS Rollback

DNS rollback is emergency-only. Repository revert plus Cloudflare redeployment is the normal rollback mechanism.

If the Worker path is unavailable and an explicitly authorized emergency rollback is required, restore the historical GitHub Pages records only after recording the incident and preserving the Cloudflare configuration:

- Apex A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`.
- `www` target: `geniusblack9999.github.io`.

Do not change `command.fractalinfinity.io` during this procedure. After emergency recovery, verify the public hostnames and document the exact DNS mutation and result.

## Legacy Retirement Gate

Do not disable GitHub Pages, archive, delete, rewrite, or otherwise modify `geniusblack9999/fractal-infinity-site` yet. It may be considered for retirement only when all of the following are true:

1. The canonical Cloudflare deployment remains stable through the agreed rollback window.
2. At least one subsequent canonical website deployment succeeds.
3. The collaborator and governed pull-request workflow are verified.
4. The normal repository rollback procedure above has been exercised or reviewed.
5. Marco explicitly authorizes retirement.

Until then, the legacy repository is rollback/reference only and must receive no code, GitHub Pages, DNS, archive, deletion, history-rewrite, or force-push changes.