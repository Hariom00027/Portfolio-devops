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

## SEO notes

- Meta tags, Open Graph/Twitter cards and JSON-LD (`Person`, `ProfilePage`, `WebSite`) live in the `<head>` of `index.html`.
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, icons and `og-image.png` sit in the root. Update `<lastmod>` in the sitemap and `dateModified` in the JSON-LD when content changes.
- The skills and journey sections are pre-rendered in `index.html` so crawlers see them without JavaScript. If you edit `SKILLS` or the journey steps in `script.js`, update the matching HTML too.
- `_headers` and `_redirects` are Cloudflare Pages config (security/cache headers, hiding `README.md` and `serve.js`).
