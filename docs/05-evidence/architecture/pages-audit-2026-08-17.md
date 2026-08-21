# GitHub Pages audit — 2026-08-17

The failed run reached `actions/deploy-pages@v4`, found the `github-pages` artifact, and failed at `Creating Pages deployment` with HTTP 404. The log explicitly says to ensure GitHub Pages is enabled.

Repository API facts from `gh api repos/A1Dmitry/Ricis3-Expansion-Map`:

```json
{"private":true,"has_pages":false,"permissions":{"admin":true,"maintain":true,"push":true}}
```

The current workflow already declares:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

It uses Node 22 for setup. The Node 20 and `punycode` lines are warnings, not the deployment failure. The direct Pages API request from the current connector returns 403 `Resource not accessible by integration`, while repository metadata confirms admin permission and `has_pages: false`.

Conclusion: the primary blocker is that Pages has not been enabled/configured for this private repository. Workflow improvements can make the build reproducible, but a one-time Pages activation with source `GitHub Actions` is still required.
