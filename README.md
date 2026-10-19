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
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, icons and `og-image.jpg` sit in the root. Update `<lastmod>` in the sitemap and `dateModified` in the JSON-LD when content changes.
- The skills and journey sections are pre-rendered in `index.html` so crawlers see them without JavaScript. If you edit `SKILLS` or the journey steps in `script.js`, update the matching HTML too.
- `_headers` and `_redirects` are Cloudflare Pages config (security/cache headers, hiding `README.md` and `serve.js`).
- Fonts are self-hosted in `fonts/` (latin subsets of Space Grotesk and JetBrains Mono, all SIL Open Font License) and preloaded from the page heads, so there are no third-party font requests.
- Performance: below-the-fold sections use `content-visibility: auto` and initialise their JavaScript only when scrolled near (`whenNear` in `script.js`). Avoid reading layout (`innerWidth`, `getBoundingClientRect`, …) during startup.
- `saarthix-case-study.html` has `<!-- TODO(Hariom): … -->` comments where real numbers (cost, scale, results, an incident) should go. Add them, then bump `dateModified`/`lastmod` and resubmit the URL.
- CSS/JS are referenced with a `?v=` stamp (index.html, saarthix-case-study.html). Bump it whenever styles.css, script.js or page.js change, so cached copies are refreshed.
