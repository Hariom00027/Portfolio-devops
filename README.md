# Hariom Singh · DevOps Portfolio

An animated, interactive portfolio covering how I built, hosted and operate the Saarthix platform: edge/CDN, load balancers, API gateway, Kubernetes, CI/CD, observability and cost optimization.

- **Live hosting simulation**: click nodes and trigger events (traffic spike, DDoS, node failure, DB failover, canary release, rollback and more)
- **CI/CD pipeline** run-through, **cost** breakdown, **toolbox** with per-skill details, and a working **terminal**

Plain HTML/CSS/JS with no build step. Edit numbers and copy in the `CONFIG` and `SKILL_INFO` objects in `script.js`.

## Run locally

```bash
node serve.js
```

Then open http://localhost:5173. Since it's a static site, it deploys as-is to GitHub Pages, Netlify or Cloudflare Pages.
