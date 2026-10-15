/* =========================================================
   HARIOM.OPS — portfolio interactions
   Edit CONFIG to change copy, numbers and stack names.
   ========================================================= */
const CONFIG = {
  linkedin: "https://www.linkedin.com/in/hariom2003/",
  roles: [
    "devops_engineer",
    "cloud_engineer",
    "site_reliability_engineer",
    "platform_engineer",
    "ci/cd_architect",
    "infra_as_code_enthusiast",
  ],
  cost: [ // [label, typical managed, mine] relative monthly units
    ["Compute", 100, 38],
    ["LB / Gateway", 60, 12],
    ["Database", 80, 35],
    ["Observability", 55, 10],
    ["Egress / CDN", 45, 15],
  ],
};

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- Boot sequence ---------------- */
(async function boot() {
  const log = $("#boot-log"), fill = $("#boot-fill");
  const lines = [
    "[  0.000] HARIOM-OPS kernel 6.9.0-devops x86_64",
    "[  0.112] mounting /dev/experience ............ <ok>",
    "[  0.241] starting containerd ................. <ok>",
    "[  0.380] kubelet: node hariom-ops Ready ...... <ok>",
    "[  0.512] nginx: upstream pool healthy ........ <ok>",
    "[  0.640] kong: gateway routes loaded ......... <ok>",
    "[  0.771] prometheus: scraping 42 targets ..... <ok>",
    "[  0.903] cost-optimizer: budget within SLO ... <ok>",
    "[  1.020] launching portfolio.service ......... <ok>",
  ];
  // full boot once per visit; quick flash on reloads so content shows fast
  let seen = false;
  try { seen = sessionStorage.getItem("booted") === "1"; sessionStorage.setItem("booted", "1"); } catch (e) {}
  if (reduced || seen) lines.length = 2;
  for (let i = 0; i < lines.length; i++) {
    log.innerHTML += lines[i].replace("<ok>", '<span class="ok">[ OK ]</span>') + "\n";
    fill.style.width = ((i + 1) / lines.length) * 100 + "%";
    await sleep(reduced || seen ? 40 : rand(45, 85));
  }
  await sleep(seen ? 50 : 150);
  $("#boot").classList.add("done");
  document.body.classList.remove("loading");
  startTyping();
})();

/* ---------------- Visibility helpers ---------------- */
// Run a rAF loop only while `el` is on screen (rAF already sleeps in hidden tabs).
function rafWhileVisible(el, fn) {
  let on = false, id = 0, last = 0;
  const step = t => { fn(t, last ? Math.min(50, t - last) : 16); last = t; id = requestAnimationFrame(step); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; last = 0; id = requestAnimationFrame(step); }
    else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(id); }
  }, { rootMargin: "100px" }).observe(el);
  return () => on;
}
// Run fn once, when the element is within ~1 screen of the viewport (keeps startup work small).
function whenNear(sel, fn, margin = "100% 0px") {
  const el = $(sel);
  if (!el) return;
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(el);
}
// Off-screen sections use content-visibility:auto (styles.css), which already skips their rendering and animation work.
// The marquee sits outside those sections, so pause it explicitly when it scrolls away.
const pauseIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("paused", !e.isIntersecting)), { rootMargin: "150px" });
$$(".marquee").forEach(s => pauseIO.observe(s));

/* ---------------- Background particle network ---------------- */
(function bg() {
  const c = $("#bg-canvas"), ctx = c.getContext("2d");
  let w = 0, h = 0, pts = [], mx = -9999, my = -9999, started = false;
  const D = 130, D2 = D * D, R2 = 150 * 150;
  const resize = (cw, ch) => {
    w = c.width = Math.round(cw); h = c.height = Math.round(ch); // 1x backing store: plenty for soft particles
    const n = Math.min(65, Math.floor((w * h) / 20000));
    pts = Array.from({ length: n }, (_, i) => ({ x: rand(0, w), y: rand(0, h), vx: rand(-.3, .3), vy: rand(-.3, .3), r: rand(1, 2.2), pink: i % 7 === 0 }));
  };
  // The canvas is fixed to the viewport; ResizeObserver hands us its size after layout,
  // so startup never forces a synchronous layout of the whole page.
  let rt;
  new ResizeObserver(([e]) => {
    const { width, height } = e.contentRect;
    if (!started) { started = true; resize(width, height); frame(); return; }
    clearTimeout(rt); rt = setTimeout(() => resize(width, height), 150);
  }).observe(c);
  addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  const alphas = [.06, .13, .22];
  const lite = matchMedia("(max-width: 760px), (pointer: coarse)").matches; // phones: ~20fps is plenty for drifting dots
  let tick = 0;
  function frame() {
    if (lite && tick++ % 3) { if (!reduced) requestAnimationFrame(frame); return; }
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - mx, dy = p.y - my, md2 = dx * dx + dy * dy;
      if (md2 < R2 && md2 > 1) { const md = Math.sqrt(md2); p.x += dx / md * 1.2; p.y += dy / md * 1.2; }
    }
    // batch every line into 3 alpha buckets: 3 strokes per frame instead of hundreds
    const buckets = [new Path2D(), new Path2D(), new Path2D()];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < D2) {
          const k = d2 < D2 * .2 ? 2 : d2 < D2 * .55 ? 1 : 0;
          buckets[k].moveTo(a.x, a.y); buckets[k].lineTo(b.x, b.y);
        }
      }
    }
    ctx.lineWidth = .7;
    for (let b = 0; b < 3; b++) { ctx.strokeStyle = `rgba(34,228,255,${alphas[b]})`; ctx.stroke(buckets[b]); }
    const cyan = new Path2D(), pink = new Path2D();
    for (const p of pts) { const P = p.pink ? pink : cyan; P.moveTo(p.x + p.r, p.y); P.arc(p.x, p.y, p.r, 0, 6.283); }
    ctx.fillStyle = "rgba(34,228,255,.7)"; ctx.fill(cyan);
    ctx.fillStyle = "rgba(255,62,165,.8)"; ctx.fill(pink);
    if (!reduced) requestAnimationFrame(frame);
  }
})();

/* ---------------- Custom cursor: targeting reticle ---------------- */
(function cursor() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.documentElement.classList.add("has-cur");
  const root = document.createElement("div");
  root.id = "cur"; root.setAttribute("aria-hidden", "true");
  root.innerHTML = '<div class="cur-cross"><i></i></div><div class="cur-c tl"></div><div class="cur-c tr"></div><div class="cur-c bl"></div><div class="cur-c br"></div><div class="cur-dot"></div><div class="cur-label"></div>';
  document.body.appendChild(root);
  const [cross, tl, tr, bl, br, dot, label] = root.children;
  const S = 12, IDLE = 13, PAD = 7;
  const SEL = "a, button, .node, .planet, .chip, input, [data-cursor]";
  let mx = -100, my = -100, cx = -100, cy = -100, running = false, lockEl = null, txt = "";
  const box = { x1: -120, y1: -120, x2: -80, y2: -80 }, tgt = { ...box };
  const setLabel = t => { if (t !== txt) { txt = t; label.textContent = t; } };
  const pad4 = v => String(Math.max(0, Math.round(v))).padStart(4, "0");

  function frame() {
    if (lockEl && lockEl.isConnected) {
      const r = lockEl.getBoundingClientRect();
      tgt.x1 = r.left - PAD; tgt.y1 = r.top - PAD; tgt.x2 = r.right + PAD; tgt.y2 = r.bottom + PAD;
    } else {
      tgt.x1 = mx - IDLE; tgt.y1 = my - IDLE; tgt.x2 = mx + IDLE; tgt.y2 = my + IDLE;
      setLabel(`X:${pad4(mx)} Y:${pad4(my)}`);
    }
    const k = lockEl ? .28 : .25;
    let delta = Math.abs(mx - cx) + Math.abs(my - cy);
    for (const key in tgt) { const d = tgt[key] - box[key]; box[key] += d * k; delta += Math.abs(d); }
    cx += (mx - cx) * .35; cy += (my - cy) * .35;
    dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    cross.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    tl.style.transform = `translate3d(${box.x1}px,${box.y1}px,0)`;
    tr.style.transform = `translate3d(${box.x2 - S}px,${box.y1}px,0)`;
    bl.style.transform = `translate3d(${box.x1}px,${box.y2 - S}px,0)`;
    br.style.transform = `translate3d(${box.x2 - S}px,${box.y2 - S}px,0)`;
    label.style.transform = `translate3d(${box.x2 + 6}px,${box.y2 + 4}px,0)`;
    // keep animating while easing or locked onto something that may move; otherwise sleep
    if (delta > .2 || lockEl) requestAnimationFrame(frame); else running = false;
  }
  const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

  addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; root.classList.add("on"); kick(); }, { passive: true });
  document.addEventListener("mouseleave", () => root.classList.remove("on"));
  document.addEventListener("mouseover", e => {
    const el = e.target.closest(SEL);
    const isText = !!el && el.matches("input, [data-cursor=text]");
    root.classList.toggle("text", isText);
    const next = el && !isText ? el : null;
    if (next === lockEl) return;
    lockEl = next;
    root.classList.toggle("lock", !!lockEl);
    if (isText) setLabel("> INPUT_");
    else if (lockEl) {
      const name = (lockEl.dataset.cursor || lockEl.getAttribute("aria-label") || lockEl.textContent || "").replace(/[^\w ./:+-]/g, "").trim().toUpperCase();
      setLabel("◉ " + (name.length > 18 ? name.slice(0, 17) + "…" : name || "TARGET"));
    }
    kick();
  });
  addEventListener("mousedown", () => {
    root.classList.add("down");
    const r = document.createElement("div");
    r.className = "cur-ripple"; r.style.transform = `translate3d(${mx}px,${my}px,0)`;
    r.addEventListener("animationend", () => r.remove());
    root.appendChild(r);
  });
  addEventListener("mouseup", () => root.classList.remove("down"));
})();

function bindMagnetic(root = document) {
  $$(".magnetic", root).forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    el.addEventListener("mouseleave", () => el.style.transform = "");
  });
}
function bindTilt(root = document) {
  if (reduced || matchMedia("(hover: none)").matches) return;
  $$(".tilt", root).forEach(el => {
    let r = null, raf = 0, px = 0, py = 0;
    el.addEventListener("mouseenter", () => { r = el.getBoundingClientRect(); });
    el.addEventListener("mousemove", e => {
      if (!r) r = el.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; el.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`; });
    }, { passive: true });
    el.addEventListener("mouseleave", () => { r = null; cancelAnimationFrame(raf); raf = 0; el.style.transform = ""; });
  });
}

/* ---------------- Nav + scroll-driven bits (one rAF-throttled handler) ---------------- */
const onScrollFns = [];
(function scrollLoop() {
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; onScrollFns.forEach(f => f()); });
  }, { passive: true });
})();
(function nav() {
  const navEl = $("#nav"), prog = $("#progress"), links = $$(".nav-links a");
  const secs = links.map(a => $(a.getAttribute("href")));
  let lastCur = -1, lastScrolled = null;
  onScrollFns.push(() => {
    // reads first, then writes, to avoid forced layouts
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    let cur = -1;
    if (y > 200) secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    const sc = y > 30;
    if (sc !== lastScrolled) { navEl.classList.toggle("scrolled", sc); lastScrolled = sc; }
    if (cur !== lastCur) { links.forEach((a, i) => a.classList.toggle("active", i === cur)); lastCur = cur; }
  });
  $("#burger").onclick = () => $("#nav-links").classList.toggle("open");
  links.forEach(a => a.onclick = () => $("#nav-links").classList.remove("open"));
})();

/* ---------------- Typing roles ---------------- */
async function startTyping() {
  const el = $("#typed");
  let i = 0;
  while (true) {
    const word = CONFIG.roles[i++ % CONFIG.roles.length];
    for (let k = 1; k <= word.length; k++) { el.textContent = word.slice(0, k); await sleep(55); }
    await sleep(1600);
    for (let k = word.length; k >= 0; k--) { el.textContent = word.slice(0, k); await sleep(25); }
    await sleep(250);
  }
}

/* ---------------- Reveal + counters ---------------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    e.target.dispatchEvent(new CustomEvent("reveal"));
    io.unobserve(e.target);
  });
}, { threshold: .15 });
function observeAll() { $$(".reveal:not(.in), .tl-item:not(.in)").forEach(el => io.observe(el)); }

function countUp(el) {
  const to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, t0 = performance.now(), dur = 1800;
  el.style.minWidth = el.textContent.length + "ch"; // reserve the final width (tabular digits) without forcing a layout
  (function step(t) {
    const p = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - p, 3));
    el.textContent = v.toFixed(dec);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
const statIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); statIO.unobserve(e.target); } }));
$$("[data-count]").forEach(el => statIO.observe(el));

/* ---------------- Hero orb items ---------------- */
(function orb() {
  const wrap = $("#orb");
  const items = [["🐳", "Docker"], ["☸", "K8s"], ["☁", "AWS"], ["⚙", "CI/CD"], ["🔀", "Nginx"], ["📊", "Grafana"], ["🏗", "Terraform"], ["🦍", "Kong"]];
  const els = items.map(([i, t]) => {
    const d = document.createElement("div");
    d.className = "orb-item"; d.innerHTML = `<div><i>${i}</i>${t}</div>`;
    wrap.appendChild(d); return d;
  });
  let a = 0, R = 0;
  const front = els.map(() => null);
  new ResizeObserver(([e]) => R = e.contentRect.width * .47).observe(wrap);
  rafWhileVisible(wrap, (t, dt) => {
    els.forEach((el, k) => {
      const ang = a + (k / els.length) * Math.PI * 2;
      const z = Math.sin(ang);
      el.style.transform = `translate3d(${Math.cos(ang) * R}px, ${z * R * .42}px, 0) scale(${.8 + (z + 1) * .15})`;
      el.style.opacity = .55 + (z + 1) * .225;
      if (front[k] !== z > 0) { front[k] = z > 0; el.style.zIndex = z > 0 ? 3 : 0; }
    });
    a += reduced ? 0 : .00025 * dt;
  });
})();

/* ---------------- Marquee ---------------- */
whenNear(".marquee", function marquee() {
  const words = ["AWS", "KUBERNETES", "TERRAFORM", "DOCKER", "NGINX", "KONG", "GITHUB ACTIONS", "JENKINS", "ARGOCD", "PROMETHEUS", "GRAFANA", "LOKI", "ANSIBLE", "HELM", "REDIS", "POSTGRESQL", "MONGODB", "VAULT", "TRIVY", "CLOUDFLARE", "GCP", "LINUX"];
  const html = words.map(w => `<span>${w}</span><span>✦</span>`).join("");
  $("#marquee").innerHTML = html + html;
});

/* ---------------- Journey (compact) ---------------- */
(function journey() {
  const steps = [
    ["💻", "Build", "Spring Boot microservices and a React frontend, built with deployment in mind from day one.", "Java · React · Git"],
    ["🐳", "Containerize", "Multi-stage Docker images and one compose file, so every environment is identical.", "Docker · Compose"],
    ["⚙", "Automate", "Terraform for the infrastructure and a CI/CD pipeline that tests, scans and ships on every push.", "Terraform · Actions"],
    ["🌐", "Expose", "CDN + WAF at the edge, an L7 load balancer, and an API gateway as the single front door.", "CDN · Nginx · Kong"],
    ["☸", "Orchestrate", "Kubernetes with autoscaling, self-healing pods and Prometheus/Grafana on everything.", "K8s · Helm · Grafana"],
    ["💰", "Harden & Optimize", "Least-privilege IAM, secrets in Vault, ARM/spot compute: secure, at the lowest possible cost.", "IAM · Vault · FinOps"],
  ];
  if (!$(".j-step")) $("#journey-track").insertAdjacentHTML("beforeend", steps.map(([ic, t, d, tech], i) =>
    `<div class="j-step" style="--i:${i}"><div class="j-node">${ic}</div><div class="j-num">STEP 0${i + 1}</div><h4>${t}</h4><p>${d}</p><div class="j-tech">${tech}</div></div>`).join(""));
})();

/* ---------------- Architecture simulation ---------------- */
whenNear("#hosting", function arch() {
  const svg = $("#arch-svg"), NS = "http://www.w3.org/2000/svg";
  const N = {
    users: { x: 450, y: 38, ic: "👥", t: "Users", s: "web · mobile", role: "CLIENTS", d: "Students, recruiters and institutions reaching Saarthix from browsers and phones around the world.", li: ["HTTPS only (HSTS)", "Geo-distributed traffic", "Burst-heavy usage patterns"] },
    cdn: { x: 450, y: 118, ic: "🌐", t: "Edge / CDN", s: "DNS · WAF · TLS", role: "EDGE LAYER", d: "Cloudflare/CDN edge in front of everything. It terminates TLS, caches static assets, blocks bad bots and absorbs DDoS.", li: ["WAF + bot rules", "Edge caching → less origin egress", "Auto TLS certificates", "DNS failover"] },
    lb: { x: 450, y: 198, ic: "⚖", t: "Load Balancer", s: "nginx · L7", role: "TRAFFIC DISTRIBUTION", d: "Layer-7 load balancer with active health checks. Traffic only reaches healthy upstreams, and nodes drain cleanly during deploys.", li: ["least_conn balancing", "Active health checks", "Gzip / Brotli", "Zero-downtime reloads"] },
    gw: { x: 320, y: 290, ic: "🦍", t: "API Gateway", s: "kong · routing", role: "SINGLE FRONT DOOR", d: "All API traffic goes through the gateway: routing to services, JWT validation, per-client rate limits, CORS and structured access logs.", li: ["Path-based routing", "Rate limiting / quotas", "Auth plugins (JWT)", "Request tracing IDs"] },
    web: { x: 600, y: 290, ic: "⚛", t: "Frontend", s: "react · nginx", role: "STATIC SPA", d: "React SPA built in CI and served by a small Nginx container. Assets are fingerprinted, so the CDN can cache them indefinitely.", li: ["Immutable asset caching", "SPA fallback routing", "~20MB image"] },
    s1: { x: 210, y: 390, ic: "🔐", t: "auth-svc", s: "spring boot", role: "MICROSERVICE", d: "Handles authentication, sessions and OAuth. Runs stateless with tokens, so it scales horizontally.", li: ["HPA on CPU", "Readiness probes", "Secrets from Vault"], pods: 2 },
    s2: { x: 355, y: 390, ic: "💼", t: "jobs-svc", s: "spring boot", role: "MICROSERVICE", d: "Job listings, search and recommendations. It's the busiest service, so it gets the most aggressive autoscaling.", li: ["HPA 2 → 10 pods", "Redis read-through cache", "Rolling updates"], pods: 3 },
    s3: { x: 500, y: 390, ic: "📄", t: "resume-svc", s: "spring boot", role: "MICROSERVICE", d: "Resume builder and file processing. Uploads go straight to object storage with pre-signed URLs.", li: ["Pre-signed uploads", "Async processing", "Memory-tuned JVM"], pods: 2 },
    s4: { x: 645, y: 390, ic: "🔔", t: "notify-svc", s: "events · mail", role: "MICROSERVICE", d: "Email and notification fan-out from an event queue. Retries use exponential backoff.", li: ["Queue consumers", "Idempotent handlers", "DLQ on failure"], pods: 1 },
    db: { x: 280, y: 505, ic: "🗄", t: "Database", s: "mongo · postgres", role: "DATA LAYER", d: "Primary datastore with automated backups, point-in-time recovery and connection pooling. It sits in private subnets only.", li: ["Daily snapshots + PITR", "Private subnet", "Connection pooling"] },
    cache: { x: 460, y: 505, ic: "⚡", t: "Redis", s: "cache · sessions", role: "CACHE LAYER", d: "In-memory cache for hot reads and rate-limit counters. It takes most of the read load off the database.", li: ["TTL-based invalidation", "Rate-limit buckets", "~90% hit ratio target"] },
    store: { x: 640, y: 505, ic: "🪣", t: "Object Store", s: "s3 · media", role: "STORAGE", d: "Resumes, images and backups in object storage with lifecycle rules that move cold data to cheaper tiers.", li: ["Lifecycle → cold tier", "Versioning", "Served via CDN"] },
    ci: { x: 70, y: 198, ic: "⚙", t: "CI/CD", s: "github actions", role: "DELIVERY", d: "Every push is tested, scanned and built into an image, then rolled out to the cluster with automatic rollback.", li: ["Lint → Test → Scan → Build", "Trivy image scan", "Auto rollback"] },
    reg: { x: 70, y: 290, ic: "📦", t: "Registry", s: "container images", role: "ARTIFACTS", d: "Versioned, scanned container images tagged by commit SHA. Lifecycle rules prune old tags to keep storage cheap.", li: ["Immutable SHA tags", "Scan on push", "Tag retention policy"] },
    obs: { x: 790, y: 198, ic: "📊", t: "Observability", s: "prom · grafana", role: "MONITORING", d: "Prometheus scrapes every component, Grafana shows it, Loki collects logs, and Alertmanager pages on SLO burn.", li: ["Golden-signal dashboards", "Log aggregation", "SLO alerting"] },
  };
  const links = [["users", "cdn"], ["cdn", "lb"], ["lb", "gw"], ["lb", "web"], ["gw", "s1"], ["gw", "s2"], ["gw", "s3"], ["gw", "s4"], ["s1", "db"], ["s2", "db"], ["s2", "cache"], ["s3", "store"], ["s3", "db"], ["s4", "cache"], ["ci", "reg"], ["reg", "s1"]];
  const mon = [["obs", "web"], ["obs", "s4"], ["obs", "lb"], ["obs", "cdn"]];
  const W = 118, H = 50;

  const el = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  svg.innerHTML = `<defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
  // zones
  el("rect", { x: 140, y: 238, width: 580, height: 205, rx: 14, class: "zone" });
  el("text", { x: 146, y: 233, class: "zone-lbl" }).textContent = "K8S CLUSTER · PRIVATE";
  el("rect", { x: 200, y: 456, width: 520, height: 84, rx: 14, class: "zone" });
  el("text", { x: 206, y: 451, class: "zone-lbl" }).textContent = "DATA TIER";
  el("rect", { x: 6, y: 152, width: 128, height: 180, rx: 14, class: "zone" });
  el("text", { x: 10, y: 146, class: "zone-lbl" }).textContent = "DELIVERY";

  const linkG = el("g", {});
  const path = (a, b) => `M${N[a].x},${N[a].y} L${N[b].x},${N[b].y}`;
  links.forEach(([a, b]) => el("path", { d: path(a, b), class: "link flow" }, linkG));
  mon.forEach(([a, b]) => el("path", { d: path(a, b), class: "link", "stroke-dasharray": "2 5" }, linkG));
  const pktG = el("g", {});
  const nodeG = el("g", {});

  for (const k in N) {
    const n = N[k];
    const g = el("g", { class: "node", transform: `translate(${n.x - W / 2},${n.y - H / 2})` }, nodeG);
    el("rect", { class: "box", width: W, height: H, rx: 10 }, g);
    el("text", { class: "ic", x: 20, y: 31 }, g).textContent = n.ic;
    const t1 = el("text", { x: 72, y: 22 }, g); t1.textContent = n.t;
    const t2 = el("text", { x: 72, y: 36, class: "sub" }, g); t2.textContent = n.s; n.subEl = t2;
    n.g = g;
    el("title", {}, g).textContent = `${n.t} · ${n.role}
${n.d}`;
    if (n.pods != null) { n.podG = el("g", { transform: `translate(0,${H + 8})` }, g); n.podState = Array(n.pods).fill("ok"); }
    g.addEventListener("click", () => { select(k); describe(k); });
  }

  function drawPods(n) {
    n.podG.innerHTML = "";
    n.podState.forEach((s, i) => {
      const col = { ok: "#3dffa8", dead: "#ff4d6d", new: "#ffb547", canary: "#ff3ea5" }[s] || "#9d5cff";
      el("rect", { x: i * 12, y: 0, width: 9, height: 9, rx: 2, fill: col, opacity: s === "dead" ? .6 : 1 }, n.podG);
    });
  }
  const svcs = ["s1", "s2", "s3", "s4"];
  let describe = () => {};
  const SVC_META = { s1: { ver: "v2.4.1", mem: 310, share: .2 }, s2: { ver: "v3.9.0", mem: 420, share: .45 }, s3: { ver: "v1.7.3", mem: 380, share: .2 }, s4: { ver: "v1.2.8", mem: 190, share: .15 } };
  svcs.forEach(k => Object.assign(N[k], SVC_META[k]));
  svcs.forEach(k => drawPods(N[k]));

  const ins = $("#inspector");
  function select(k) {
    const n = N[k];
    $$(".node", svg).forEach(g => g.classList.remove("sel"));
    n.g.classList.add("sel");
    if (ins) ins.innerHTML = `${n.ic} ${n.t}`;
  }
  select("lb");

  // ---- log ----
  const logEl = $("#arch-log");
  function log(msg, cls = "") {
    const d = document.createElement("div");
    d.className = cls;
    d.innerHTML = cls === "cmd" ? "" : `<span class="ts">${new Date().toTimeString().slice(0, 8)}</span> `;
    d.append(msg);
    logEl.appendChild(d);
    while (logEl.children.length > 60) logEl.firstChild.remove();
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ---- packets ----
  const packets = [];
  const sim = { load: 1, errBoost: 0, latBoost: 0, cacheCold: false, dbDown: false, ddos: 0 };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const alive = s => s !== "dead";
  function healthySvc() {
    const ok = svcs.filter(k => N[k].podState.some(alive));
    return pick(ok.length ? ok : svcs);
  }
  function addPacket(route, color, speed, r = 3.4) {
    const c = el("circle", { r, fill: color }, pktG);
    packets.push({ route, seg: 0, t: 0, c, speed });
  }
  function spawn() {
    const route = ["users", "cdn"];
    let color = "#22e4ff";
    if (Math.random() < .3) { route.push("users"); color = "#3dffa8"; } // edge cache hit
    else {
      route.push("lb");
      if (Math.random() < .3) route.push("web");
      else {
        const s = Math.random() < .45 ? "s2" : healthySvc();
        route.push("gw", s);
        if (!N[s].podState.some(alive)) color = "#ff4d6d";
        else if (s === "s2") route.push(!sim.cacheCold && Math.random() < .6 ? "cache" : "db");
        else if (s === "s3") route.push(Math.random() < .5 ? "store" : "db");
        else if (s === "s1") route.push("db");
        else route.push("cache");
        if (sim.dbDown && route[route.length - 1] === "db") color = "#ffb547"; // queued / retrying
      }
    }
    if (Math.random() < sim.errBoost) color = "#ff4d6d";
    addPacket(route, color, rand(.018, .03) * (1 + sim.load * .15));
  }
  let acc = 0, accBad = 0;
  const archVisible = rafWhileVisible(svg, (ts, dt) => {
    acc += dt * (.012 + sim.load * .02);
    while (acc > 1) { spawn(); acc--; }
    if (sim.ddos) {
      accBad += dt * .22;
      while (accBad > 1) { addPacket(["users", "cdn"], "#ff4d6d", rand(.035, .06), 2.6); accBad--; }
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += p.speed * dt / 16;
      if (p.t >= 1) { p.t = 0; p.seg++; }
      if (p.seg >= p.route.length - 1) { p.c.remove(); packets.splice(i, 1); continue; }
      const a = N[p.route[p.seg]], b = N[p.route[p.seg + 1]];
      p.c.setAttribute("cx", a.x + (b.x - a.x) * p.t);
      p.c.setAttribute("cy", a.y + (b.y - a.y) * p.t);
    }
  });

  // ---- metrics ----
  const hist = Array(60).fill(120);
  const spark = $("#spark"), sctx = spark.getContext("2d");
  let sw = 0, sh = 0;
  new ResizeObserver(() => { sw = spark.width = spark.clientWidth; sh = spark.height = spark.clientHeight; }).observe(spark);
  const tbody = $("#svc-table tbody");
  const rows = {};
  svcs.forEach(k => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="sv-n">${N[k].ic} ${N[k].t}</td><td class="sv-p"></td><td class="sv-c"></td><td><span class="sv-s"></span></td>`;
    tr.onclick = () => { select(k); describe(k); };
    tbody.appendChild(tr);
    rows[k] = { tr, p: $(".sv-p", tr), c: $(".sv-c", tr), s: $(".sv-s", tr) };
  });
  function svcStatus(n) {
    const ps = n.podState;
    if (n.g.classList.contains("down") || !ps.some(alive)) return ["CRITICAL", "bad"];
    if (ps.includes("dead")) return ["DEGRADED", "warn"];
    if (ps.includes("canary")) return ["CANARY", "pink"];
    if (ps.includes("deploy")) return ["ROLLING", "vio"];
    if (ps.includes("new")) return ["SCALING", "warn"];
    return ["HEALTHY", "ok"];
  }
  function renderSvc(apiRps) {
    svcs.forEach(k => {
      const n = N[k], r = rows[k];
      const up = n.podState.filter(alive).length, total = n.podState.length;
      const rps = Math.round(apiRps * n.share);
      const cpu = up ? Math.min(98, Math.round(rps / up * 1.6 + 12 + rand(-3, 3))) : 0;
      const [st, cls] = svcStatus(n);
      r.p.innerHTML = `<b>${up}/${total}</b> ${n.podState.map(p => `<i class="pd ${p}"></i>`).join("")}`;
      r.c.innerHTML = `<span class="bar"><i style="width:${cpu}%" class="${cpu > 80 ? "hot" : cpu > 60 ? "warm" : ""}"></i></span>${cpu}%`;
      r.s.textContent = st; r.s.className = "sv-s " + cls;
      r.tr.classList.toggle("flag", cls !== "ok");
      r.tr.title = `${n.t} · ${n.ver} · ${rps} req/s`;
    });
  }
  renderSvc(59);
  // metrics, table and event feed stay live while any part of the hosting panels is on screen
  let splitOn = false;
  new IntersectionObserver(([e]) => splitOn = e.isIntersecting).observe($("#arch-split"));
  function setM(id, val, cls) { const e = $(id); e.textContent = val; e.className = "m-val " + cls; }
  setInterval(() => {
    sim.load += (1 - sim.load) * .08;
    sim.errBoost *= .85;
    sim.latBoost *= .9;
    if (!splitOn) return;
    const rps = Math.round(120 * sim.load + rand(-10, 10));
    const pods = svcs.reduce((s, k) => s + N[k].podState.filter(alive).length, 0);
    const lat = Math.round(38 + (sim.load - 1) * 40 / Math.max(1, pods / 8) + sim.latBoost + rand(-4, 4));
    const err = (sim.errBoost * 100 + rand(0, .05)).toFixed(2);
    setM("#m-rps", rps, rps > 500 ? "warn" : "ok");
    setM("#m-lat", lat + "ms", lat > 120 ? "bad" : lat > 70 ? "warn" : "ok");
    setM("#m-pods", pods, "ok");
    setM("#m-err", err + "%", err > 1 ? "bad" : err > .3 ? "warn" : "ok");
    renderSvc(rps * .49);
    hist.push(rps); hist.shift();
    const w = sw, h = sh;
    sctx.clearRect(0, 0, w, h);
    const mx = Math.max(300, ...hist);
    const g = sctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(34,228,255,.45)"); g.addColorStop(1, "rgba(34,228,255,0)");
    sctx.beginPath(); sctx.moveTo(0, h);
    hist.forEach((v, i) => sctx.lineTo(i / (hist.length - 1) * w, h - v / mx * h * .9));
    sctx.lineTo(w, h); sctx.fillStyle = g; sctx.fill();
    sctx.beginPath();
    hist.forEach((v, i) => sctx[i ? "lineTo" : "moveTo"](i / (hist.length - 1) * w, h - v / mx * h * .9));
    sctx.strokeStyle = "#22e4ff"; sctx.lineWidth = 2; sctx.stroke();
  }, 500);

  // ambient logs (paused while an event is narrating)
  const ambient = [
    ["GET /api/jobs?q=devops 200 31ms", ""], ["nginx: upstream jobs-svc healthy", "g"], ["cdn: cache HIT /assets/app.7f3a.js", "g"],
    ["kong: rate-limit ok client=web", ""], ["prometheus: scrape ok (42/42)", "g"], ["POST /api/auth/login 200 54ms", ""],
    ["redis: hit ratio 0.91", "g"], ["GET /api/resume/42 200 22ms", ""], ["pgbouncer: 18/100 pool in use", ""],
    ["cert-manager: saarthix.com valid 61d", "g"], ["karpenter: 3 nodes, 71% bin-packed", ""],
  ];
  let busy = false;
  setInterval(() => { if (splitOn && !busy) { const [m, c] = pick(ambient); log(m, c); } }, 1400);

  // ---- helpers for events ----
  const bannerEl = $("#arch-banner");
  let bannerT;
  function banner(text, cls = "") {
    clearTimeout(bannerT);
    bannerEl.className = "arch-banner show " + cls;
    bannerEl.textContent = text;
  }
  const hideBanner = (ms = 1800) => { bannerT = setTimeout(() => bannerEl.classList.remove("show"), ms); };
  describe = k => { if (busy) return; banner(`${N[k].ic} ${N[k].t.toUpperCase()} · ${N[k].role}`); hideBanner(2600); };
  const mark = (k, cls, on = true) => N[k].g.classList.toggle(cls, on);
  const setSub = (k, txt) => { N[k].subEl.textContent = txt; };
  function shock(k) {
    const n = N[k];
    const c = el("circle", { cx: n.x, cy: n.y, r: 40, class: "shockwave" }, pktG);
    setTimeout(() => c.remove(), 1000);
  }
  const podId = () => Math.random().toString(36).slice(2, 7);
  const sha = () => Math.random().toString(16).slice(2, 9);
  const step = async (ms, msg, cls = "") => { await sleep(ms); if (msg) log(msg, cls); };
  const setPods = (k, fn) => { const n = N[k]; n.podState = fn(n.podState); drawPods(n); };

  // ---- events ----
  const EVENTS = [
    ["TRAFFIC", "⚡ traffic spike", "", async () => {
      sim.load = 7; banner("TRAFFIC SPIKE · 6.8× BASELINE", "w"); select("lb");
      log("⚡ traffic spike detected: 6.8x baseline", "w");
      await step(900, "HPA: jobs-svc cpu 87% > 70% target → scaling", "w");
      for (let i = 0; i < 4; i++) { await sleep(450); setPods("s2", p => [...p, "new"]); log(`k8s: jobs-svc-${podId()} ContainerCreating`); }
      setPods("s1", p => [...p, "new"]);
      await sleep(1100);
      ["s1", "s2"].forEach(k => setPods(k, p => p.map(s => s === "new" ? "ok" : s)));
      log("HPA: scaled jobs-svc 3 → 7, auth-svc 2 → 3 ✔", "g"); banner("AUTOSCALED · LATENCY STABLE", "g");
      await sleep(4500);
      setPods("s2", p => p.slice(0, 3)); setPods("s1", p => p.slice(0, 2));
      log("HPA: load normalised, scaled back down to save cost 💰", "g");
    }],
    ["TRAFFIC", "🛡 DDoS attack", "alt", async () => {
      sim.ddos = 1; select("cdn"); banner("DDOS · 48K REQ/S FROM 1,204 IPs", "e");
      log("☠ L7 flood: 48k req/s from 1,204 IPs on /api/jobs", "e");
      await step(1200, "waf: rate rule triggered (>200 req/10s per IP)", "w");
      mark("cdn", "shield"); shock("cdn");
      await step(900, "waf: bot score < 10 → challenge, known bad ASNs → block", "w");
      banner("WAF SHIELD UP · ORIGIN UNTOUCHED", "g");
      for (let i = 0; i < 3; i++) { await sleep(1100); shock("cdn"); log(`waf: blocked ${(12 + i * 15).toFixed(0)}k requests at the edge`, "g"); }
      sim.ddos = 0;
      await step(800, "✔ attack absorbed at the edge, origin load unchanged", "g");
      mark("cdn", "shield", false);
    }],
    ["TRAFFIC", "🌙 off-peak scale-down", "", async () => {
      select("obs"); banner("OFF-PEAK WINDOW · 01:00 IST", "");
      log("cron: off-peak window → scaling to min replicas");
      sim.load = .35;
      for (const k of ["s2", "s1", "s3"]) { await sleep(500); setPods(k, p => p.slice(0, 1)); log(`HPA: ${N[k].t} → 1 replica`); }
      await step(700, "karpenter: consolidating nodes 4 → 2 (spot)", "");
      banner("💰 ~40% LESS COMPUTE TONIGHT", "g");
      await step(2500, "☀ morning ramp-up: restoring baseline replicas", "w");
      setPods("s1", () => ["new", "new"]); setPods("s2", () => ["new", "new", "new"]); setPods("s3", () => ["new", "new"]);
      await sleep(1000);
      svcs.forEach(k => setPods(k, p => p.map(() => "ok")));
      log("✔ back to baseline before traffic arrived", "g");
    }],
    ["FAILURES", "☠ kill a pod", "alt", async () => {
      const k = pick(["s1", "s2", "s3"]), n = N[k], i = Math.floor(Math.random() * n.podState.length);
      n.podState[i] = "dead"; drawPods(n); mark(k, "down");
      sim.errBoost = .08; select(k); banner(`POD OOMKILLED · ${n.t.toUpperCase()}`, "e");
      log(`☠ chaos: killed pod ${n.t}-${podId()} (OOMKilled)`, "e");
      await step(700, "readiness probe failed → removed from endpoints", "w");
      mark(k, "down", false); sim.errBoost = .01;
      await sleep(900);
      n.podState[i] = "new"; drawPods(n); log(`ReplicaSet: recreating ${n.t} pod…`);
      await sleep(1300);
      n.podState[i] = "ok"; drawPods(n);
      log(`✔ ${n.t} self-healed in 3.0s, zero user impact`, "g"); banner("SELF-HEALED · 3.0s", "g");
    }],
    ["FAILURES", "💥 node failure", "alt", async () => {
      select("s2"); banner("NODE NOTREADY · SPOT RECLAIMED", "e");
      log("node ip-10-0-2-17 NotReady (spot instance reclaimed)", "e");
      const lost = {};
      svcs.forEach(k => setPods(k, p => p.map((s, i) => { if (i % 2 === 1 || p.length === 1 && k === "s4") { lost[k] = (lost[k] || 0) + 1; return "dead"; } return s; })));
      svcs.forEach(k => mark(k, "alert", N[k].podState.includes("dead")));
      sim.errBoost = .05; sim.latBoost = 40;
      await step(900, "scheduler: 4 pods Pending, insufficient capacity", "w");
      await step(900, "karpenter: launching replacement node (spot → on-demand fallback)", "w");
      await sleep(1600);
      svcs.forEach(k => setPods(k, p => p.map(s => s === "dead" ? "new" : s)));
      log("node ip-10-0-3-42 Ready → rescheduling pods");
      await sleep(1300);
      svcs.forEach(k => { setPods(k, p => p.map(() => "ok")); mark(k, "alert", false); });
      log("✔ workloads rescheduled, PodDisruptionBudget held", "g"); banner("CAPACITY RESTORED", "g");
    }],
    ["FAILURES", "🗄 DB failover", "alt", async () => {
      select("db"); sim.dbDown = true; mark("db", "down"); sim.latBoost = 60;
      banner("DB PRIMARY DOWN · FAILING OVER", "e");
      log("db-primary: health check failed x3 (AZ-a)", "e");
      await step(900, "pgbouncer: pausing pool, queueing writes", "w");
      await step(1200, "promoting db-replica-1 (AZ-b) → primary", "w");
      setSub("db", "replica → primary");
      await sleep(1200);
      sim.dbDown = false; mark("db", "down", false); mark("db", "alert");
      log("✔ failover complete in 3.8s, connections re-pooled", "g"); banner("NEW PRIMARY IN AZ-B · 3.8s", "g");
      await step(1600, "rebuilding replica in AZ-a from latest snapshot");
      await sleep(1400);
      mark("db", "alert", false); setSub("db", N.db.s);
      log("✔ replication healthy, lag 0.2s", "g");
    }],
    ["FAILURES", "🧊 cache flush", "warn", async () => {
      select("cache"); sim.cacheCold = true; mark("cache", "alert"); sim.latBoost = 70;
      banner("REDIS FLUSHED · HIT RATIO 0%", "w");
      log("redis: FLUSHALL during maintenance, hit ratio 0.00", "w");
      await step(900, "jobs-svc: cache miss storm → reads falling through to DB", "w");
      await step(1000, "db: read IOPS 3.4x, pgbouncer absorbing load", "");
      for (const r of [.31, .62, .84]) { await sleep(900); sim.latBoost = 70 * (1 - r); log(`redis: warming… hit ratio ${r.toFixed(2)}`); }
      sim.cacheCold = false; mark("cache", "alert", false);
      log("✔ cache warm (0.91), latency back to baseline", "g"); banner("CACHE WARM · P95 NORMAL", "g");
    }],
    ["RELEASES", "⟳ rolling deploy", "", async () => {
      const v = sha(); select("ci"); banner(`ROLLING DEPLOY · ${v}`, "");
      log(`ci: pipeline passed for ${v}, image pushed`, "g");
      for (const k of svcs) {
        const n = N[k];
        for (let i = 0; i < n.podState.length; i++) { n.podState[i] = "deploy"; drawPods(n); await sleep(300); n.podState[i] = "ok"; drawPods(n); }
        n.ver = v; log(`rollout: ${n.t} → ${v} (maxUnavailable=0)`);
      }
      log("✔ rolling deploy complete, 0 dropped requests", "g"); banner("DEPLOYED · 0 DROPPED REQUESTS", "g");
    }],
    ["RELEASES", "🐤 canary release", "", async () => {
      const v = sha(); select("s2"); banner(`CANARY · JOBS-SVC ${v} · 10%`, "");
      setPods("s2", p => [...p, "canary"]);
      log(`argo-rollouts: canary jobs-svc:${v} → 10% traffic`);
      await step(1500, "analysis: error 0.02% · p95 39ms ✔", "g");
      banner("CANARY · 50%", ""); await step(800, "argo-rollouts: promote → 50%");
      await step(1400, "analysis: error 0.01% · p95 38ms ✔", "g");
      banner("CANARY · 100%", ""); await step(600, "argo-rollouts: promote → 100%");
      for (let i = 0; i < 3; i++) { await sleep(350); setPods("s2", p => p.map((s, j) => j === i ? "canary" : s)); }
      await sleep(600);
      setPods("s2", p => p.slice(0, 3).map(() => "ok"));
      N.s2.ver = v; log(`✔ jobs-svc ${v} fully promoted, old ReplicaSet scaled to 0`, "g"); banner("CANARY PROMOTED", "g");
    }],
    ["RELEASES", "↩ bad deploy → rollback", "alt", async () => {
      const v = sha(); select("s3"); banner(`DEPLOY RESUME-SVC ${v}`, "");
      const prev = N.s3.ver; N.s3.ver = v; log(`rollout: resume-svc → ${v}`);
      for (let i = 0; i < N.s3.podState.length; i++) { await sleep(350); setPods("s3", p => p.map((s, j) => j === i ? "deploy" : s)); }
      await sleep(500);
      sim.errBoost = .18; mark("s3", "down"); mark("obs", "alert");
      banner("5XX SPIKE · ERROR BUDGET BURNING", "e");
      log("alertmanager: HTTP 5xx 4.1% > 2% on resume-svc 🔥", "e");
      await step(1100, "smoke check failed: POST /api/resume → 500", "e");
      select("obs");
      await step(800, "auto-rollback: helm rollback resume-svc 127", "w");
      for (let i = 0; i < N.s3.podState.length; i++) { await sleep(350); setPods("s3", p => p.map((s, j) => j === i ? "ok" : s)); }
      N.s3.ver = prev; sim.errBoost = .01; mark("s3", "down", false); mark("obs", "alert", false);
      log("✔ rolled back in 41s, bad image quarantined", "g"); banner("ROLLED BACK · BUDGET PRESERVED", "g");
    }],
  ];

  const DESC = {
    "⚡ traffic spike": "6.8× load hits the API → autoscaling",
    "🛡 DDoS attack": "L7 flood from 1,200 IPs → WAF at the edge",
    "🌙 off-peak scale-down": "Night window → shrink to save cost",
    "☠ kill a pod": "OOMKill a random pod → self-healing",
    "💥 node failure": "Spot node reclaimed → reschedule pods",
    "🗄 DB failover": "Primary DB dies → promote replica",
    "🧊 cache flush": "Redis emptied → miss storm → re-warm",
    "⟳ rolling deploy": "Ship a new version with zero downtime",
    "🐤 canary release": "10% → 50% → 100% with health analysis",
    "↩ bad deploy → rollback": "Broken release → alert → auto-rollback",
  };
  const bar = $("#arch-events"), split = $("#arch-split"), statusBox = $("#ctrl-status"), status = $("span", statusBox);
  const groups = {};
  const buttons = [];
  const bare = label => label.replace(/^\S+\s/, "");
  EVENTS.forEach(([grp, label, cls, fn]) => {
    if (!groups[grp]) {
      const g = document.createElement("div");
      g.className = "ev-group";
      g.innerHTML = `<div class="ev-lbl">${grp}</div><div class="ev-btns"></div>`;
      bar.appendChild(g);
      groups[grp] = $(".ev-btns", g);
    }
    const b = document.createElement("button");
    b.type = "button";
    b.className = `ev-item ${cls}`;
    b.dataset.cursor = bare(label);
    b.title = DESC[label] || "";
    b.innerHTML = `<span class="ev-t">${label}</span><span class="ev-go">▶</span>`;
    b.onclick = async () => {
      if (busy) return;
      busy = true;
      buttons.forEach(x => x.disabled = x !== b);
      b.classList.add("running"); split.classList.add("is-running");
      statusBox.className = "ctrl-status run"; status.textContent = `running · ${bare(label)}`;
      log(`$ hariom-ops inject --event="${bare(label)}"`, "cmd");
      // stacked layout: bring the response into view
      if (innerWidth <= 1000) $(".arch-canvas").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      try { await fn(); } finally {
        hideBanner();
        b.classList.remove("running"); split.classList.remove("is-running");
        b.classList.add("done"); setTimeout(() => b.classList.remove("done"), 2500);
        statusBox.className = "ctrl-status ok"; status.textContent = `resolved · ${bare(label)} · system healthy`;
        buttons.forEach(x => x.disabled = false);
        busy = false;
      }
    };
    groups[grp].appendChild(b); buttons.push(b);
  });
}, "0px 0px 300px 0px");

/* ---------------- CI/CD pipeline ---------------- */
whenNear("#pipeline", function pipeline() {
  const S = [
    ["📥", "checkout", [["c", "$ git clone --depth=1 saarthix/platform"], ["", "Receiving objects: 100% (1824/1824) done"]]],
    ["🧹", "lint", [["c", "$ ./gradlew spotlessCheck && npm run lint"], ["g", "✔ 0 problems found"]]],
    ["🧪", "test", [["c", "$ ./gradlew test && npm test -- --ci"], ["", "Tests: 214 passed, 214 total"], ["g", "✔ coverage 81.4%"]]],
    ["🛡", "security", [["c", "$ trivy fs . && gitleaks detect && tfsec infra/"], ["a", "⚠ 0 CRITICAL · 0 HIGH · secrets: none"], ["g", "✔ security gate passed"]]],
    ["🐳", "build", [["c", "$ docker buildx build --platform linux/arm64,linux/amd64"], ["", "=> exporting layers 3.2s"], ["g", "✔ image size 148MB (multi-stage)"]]],
    ["📦", "push", [["c", "$ docker push registry/saarthix/jobs-svc:$SHA"], ["g", "✔ pushed digest sha256:9f2c…"]]],
    ["🚀", "deploy", [["c", "$ helm upgrade --install jobs-svc ./chart --atomic"], ["", "Waiting for rollout… 3/3 pods updated"], ["g", "✔ release revision 128 deployed"]]],
    ["🔍", "verify", [["c", "$ ./smoke.sh https://api.saarthix.com/health"], ["g", "✔ 200 OK · p95 41ms · error budget intact"]]],
  ];
  const wrap = $("#stages");
  wrap.innerHTML = S.map(([ic, n], i) => `${i ? '<div class="connector"><i></i></div>' : ""}<div class="stage"><div class="s-ic">${ic}</div><div class="s-name">${n}</div><div class="s-time"></div></div>`).join("");
  const stages = $$(".stage", wrap), conns = $$(".connector", wrap), term = $("#pipe-term");
  const msgs = ["feat: add job recommendations API", "fix: resume upload timeout", "perf: cache hot job queries in redis", "chore: bump spring boot to 3.3", "feat: institution dashboard"];
  const out = (t, c = "") => { const d = document.createElement("div"); d.className = c; d.textContent = t; term.appendChild(d); term.scrollTop = term.scrollHeight; };
  let running = false;
  async function run() {
    if (running) return; running = true;
    const btn = $("#btn-run"); btn.disabled = true;
    stages.forEach(s => { s.className = "stage"; $(".s-time", s).textContent = ""; });
    conns.forEach(c => c.classList.remove("ok"));
    $("#sha").textContent = Math.random().toString(16).slice(2, 9);
    $("#cmsg").textContent = msgs[Math.floor(Math.random() * msgs.length)];
    term.innerHTML = '<div class="term-bar"><span></span><span></span><span></span></div>';
    out(`▶ workflow "deploy-prod" triggered by push to main`, "p");
    const t0 = performance.now();
    for (let i = 0; i < S.length; i++) {
      stages[i].classList.add("run");
      out(`── stage: ${S[i][1]} ──`, "a");
      const ts = performance.now();
      for (const [c, l] of S[i][2]) { await sleep(rand(250, 550)); out(l, c); }
      stages[i].classList.replace("run", "ok");
      $(".s-time", stages[i]).textContent = ((performance.now() - ts) / 1000 * 7).toFixed(0) + "s";
      if (conns[i]) conns[i].classList.add("ok");
    }
    out(`★ pipeline succeeded in ${((performance.now() - t0) / 1000 * 7 / 60).toFixed(1)} min, shipped to production`, "g");
    btn.disabled = false; running = false;
  }
  $("#btn-run").onclick = run;
  const pipeIO = new IntersectionObserver(es => { if (es[0].isIntersecting) { run(); pipeIO.disconnect(); } }, { threshold: .4 });
  pipeIO.observe($(".pipe"));
});

/* ---------------- Cost chart ---------------- */
whenNear("#cost", function cost() {
  const bars = $("#bars");
  const max = Math.max(...CONFIG.cost.map(c => c[1]));
  bars.innerHTML = CONFIG.cost.map(([l, a, b]) => `
    <div class="bar-col"><div class="bar-pair">
      <div class="bar before" data-h="${a / max * 100}"></div>
      <div class="bar after" data-h="${b / max * 100}"></div>
    </div><div class="bar-lbl">${l}</div></div>`).join("");
  const cio = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    $$(".bar", bars).forEach((b, i) => setTimeout(() => b.style.height = b.dataset.h + "%", i * 120));
    const el = $("#save-pct"), t0 = performance.now();
    if (!el) { cio.disconnect(); return; } // no headline % until real figures are confirmed
    (function step(t) {
      const p = Math.min(1, (t - t0) / 2000);
      el.textContent = Math.round(CONFIG.costSavedPct * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
    cio.disconnect();
  }, { threshold: .3 });
  cio.observe(bars);
});

/* ---------------- Skills ---------------- */
const SKILLS = [
  ["CLOUD & INFRASTRUCTURE", 92, ["AWS", "AWS Landing Zone", "EC2", "RDS", "S3", "Lambda", "EventBridge", "CloudTrail", "GCP", "Alibaba Cloud", "Cloud Networking", "Graviton", "Docker", "Kubernetes", "Karpenter", "Terraform"]],
  ["CI/CD & AUTOMATION", 95, ["GitHub Actions", "GitLab CI/CD", "Jenkins", "GitOps", "ArgoCD", "Ansible", "Bash", "Python", "Golang"]],
  ["MONITORING & OBSERVABILITY", 88, ["Prometheus", "Grafana", "Loki", "Thanos", "Elastic Stack", "AWS CloudWatch", "Sentry", "Datadog", "Alertmanager"]],
  ["DISTRIBUTED SYSTEMS & NETWORKING", 93, ["Load Balancing", "Nginx", "API Gateway", "Kong Gateway", "CDN Architecture", "Caching Strategy", "Helm", "Linux", "imgproxy"]],
  ["SECURITY & DEVSECOPS", 85, ["IAM Governance", "Vault", "Trivy", "Vulnerability Scanning", "WAF Tuning", "Rate Limiting", "Cloud Compliance", "Kubecost"]],
  ["DATABASES", 87, ["PostgreSQL", "PgBouncer", "MySQL", "MongoDB", "Redis"]],
];
// [what it's used for, how it fits in my work] — edit freely
const SKILL_INFO = {
  "AWS": ["Amazon's cloud platform: on-demand compute, storage, networking, databases and managed services.", "The main home for production workloads: VPCs, EC2/EKS compute, RDS, S3 and IAM, all defined in Terraform."],
  "AWS Landing Zone": ["A multi-account AWS baseline with guardrails, centralized logging and identity built in from the start.", "Separating prod, staging and shared-services accounts, with org-wide CloudTrail, SCP guardrails and a tagging policy."],
  "EC2": ["AWS virtual machines: resizable compute you pay for by the second.", "Kubernetes worker nodes and standalone services, right-sized and on spot/ARM wherever the workload allows."],
  "RDS": ["Managed relational databases (PostgreSQL, MySQL) with automated backups, patching and Multi-AZ failover.", "The production database in private subnets, with point-in-time recovery and a standby in a second AZ."],
  "S3": ["Durable, cheap object storage for files, backups, logs and static assets.", "Resume uploads through pre-signed URLs, backups with lifecycle rules to cold tiers, and an origin for the CDN."],
  "Lambda": ["Serverless functions that run on events and cost nothing when idle.", "Glue jobs such as scheduled cleanups, image hooks and alert routing, with no servers to patch."],
  "EventBridge": ["A serverless event bus and scheduler that routes events between AWS services and apps.", "Cron-style schedules (off-peak scale-down, backups) and fanning infrastructure events out to automation."],
  "CloudTrail": ["Audit logging of every API call made in an AWS account.", "Org-wide trail into a locked bucket, so every infrastructure change is traceable for security reviews."],
  "GCP": ["Google Cloud Platform: compute, GKE, Cloud SQL, storage and networking.", "Running and migrating workloads across clouds, with the same Terraform and Kubernetes patterns used on AWS."],
  "Alibaba Cloud": ["A major cloud provider, strong in Asia, with ECS, OSS, RDS and ACK (Kubernetes).", "Understanding legacy footprints and planning migrations from it into a single cloud strategy."],
  "Cloud Networking": ["VPCs, subnets, route tables, NAT, peering, DNS and security groups: how traffic moves in the cloud.", "Public/private subnet layouts where databases and services are never directly reachable from the internet."],
  "Graviton": ["AWS ARM-based processors that give better price-performance than x86.", "Multi-arch Docker builds so services run on Graviton nodes for about 20–40% lower compute cost."],
  "Docker": ["Packages an app and its dependencies into a portable container image.", "Multi-stage Dockerfiles for every service, giving small, reproducible images that run the same everywhere."],
  "Kubernetes": ["A container orchestrator that schedules, scales, heals and networks containerized workloads.", "Running all the Saarthix microservices with HPA autoscaling, probes, rolling updates and PodDisruptionBudgets."],
  "Karpenter": ["A Kubernetes node autoscaler that launches right-sized nodes in seconds.", "Spot-first node pools with on-demand fallback, and consolidation that shrinks the cluster when idle."],
  "Terraform": ["Infrastructure as Code: declare cloud resources in files, then plan and apply changes safely.", "Every VPC, cluster, database and DNS record lives in Git, gets reviewed, and is reproducible per environment."],
  "GitHub Actions": ["CI/CD built into GitHub: workflows that run on pushes, PRs and schedules.", "The main pipeline: lint, test, security scan, multi-arch build, push, Helm deploy and smoke tests."],
  "GitLab CI/CD": ["GitLab's built-in pipeline engine, configured with .gitlab-ci.yml.", "The same pipeline patterns (stages, caching, environments, manual gates) on GitLab-hosted projects."],
  "Jenkins": ["A self-hosted automation server with a huge plugin ecosystem.", "Declarative pipelines with agents that scale on Kubernetes, for teams that already run Jenkins."],
  "GitOps": ["Git is the single source of truth for infrastructure and deployments; changes go through pull requests.", "Cluster state is declared in a repo and synced automatically, so every change is reviewed and reversible."],
  "ArgoCD": ["A GitOps continuous-delivery tool for Kubernetes that syncs clusters to Git.", "Auto-syncing Helm releases, catching drift and running progressive rollouts (canary) with automatic analysis."],
  "Ansible": ["Agentless configuration management and automation over SSH using YAML playbooks.", "Server hardening, package baselines and one-command provisioning of hosts outside Kubernetes."],
  "Bash": ["The Unix shell and scripting language that glues systems together.", "Deploy helpers, backup/restore scripts, health checks and quick automation of repetitive ops work."],
  "Python": ["A general-purpose language, great for automation, APIs and data tasks.", "Internal tooling: cost reports, cleanup jobs, cloud API automation and Slack/alert integrations."],
  "Golang": ["A fast, compiled language and the standard for cloud-native tooling.", "Small, single-binary CLIs and services for infrastructure automation, and reading or extending K8s tooling."],
  "Prometheus": ["A time-series metrics database that scrapes targets and evaluates alert rules.", "Scraping every service, node, gateway and database for golden signals (latency, traffic, errors, saturation)."],
  "Grafana": ["Dashboards and visualization for metrics, logs and traces.", "Service and SLO dashboards, cost panels and a single pane of glass for the whole platform."],
  "Loki": ["Log aggregation from Grafana Labs that indexes labels, not full text, so it's cheap to run.", "Centralized logs from every pod, searched alongside metrics in Grafana during incidents."],
  "Thanos": ["Extends Prometheus with long-term storage, a global query view and high availability.", "Keeping months of metrics in object storage cheaply and querying across clusters."],
  "Elastic Stack": ["Elasticsearch, Logstash/Beats and Kibana for log search and analytics.", "Full-text log search and dashboards where deep querying is needed, run self-managed to control cost."],
  "AWS CloudWatch": ["AWS-native metrics, logs and alarms.", "Alarms on managed services (RDS, ALB, Lambda) and billing, feeding into the same alert routing."],
  "Sentry": ["Application error tracking with stack traces, releases and performance monitoring.", "Catching frontend and backend exceptions per release, so regressions surface right after a deploy."],
  "Datadog": ["A SaaS observability platform covering metrics, APM, logs and synthetics.", "Comfortable with its agents, monitors and dashboards when a team prefers managed observability."],
  "Alertmanager": ["Routes, groups, silences and de-duplicates Prometheus alerts.", "SLO burn-rate alerts sent to the right channel, with noise kept down by grouping and inhibition."],
  "Load Balancing": ["Distributes traffic across healthy backends for scale and fault tolerance.", "L7 balancing with active health checks, connection draining and zero-downtime upstream changes."],
  "Nginx": ["A high-performance web server, reverse proxy and load balancer.", "Serving the React SPA, reverse-proxying APIs, TLS, gzip/brotli, caching headers and rate limits."],
  "API Gateway": ["A single entry point for APIs that handles routing, auth, rate limits and observability.", "Every API call goes through one front door, so policies live in one place instead of in every service."],
  "Kong Gateway": ["An open-source, Nginx-based API gateway with a plugin ecosystem.", "Path-based routing to microservices, JWT auth, per-client rate limiting, CORS and request IDs."],
  "CDN Architecture": ["Caching content at edge locations close to users for speed, lower origin load and DDoS protection.", "Immutable fingerprinted assets cached at the edge, so most static traffic never reaches the origin."],
  "Caching Strategy": ["Deciding what to cache, where (edge, app, Redis) and how to invalidate it.", "Read-through Redis caching for hot queries, plus TTLs and cache-busting that keep data fresh and DB load low."],
  "Helm": ["The package manager for Kubernetes: templated, versioned releases.", "One chart per service with per-environment values, and atomic upgrades that roll back on failure."],
  "Linux": ["The operating system behind nearly all servers and containers.", "Day-to-day administration: systemd, networking, permissions, performance debugging and hardening."],
  "imgproxy": ["A fast, secure on-the-fly image resizing and optimization server.", "Serving right-sized, modern-format images behind the CDN instead of storing many variants."],
  "IAM Governance": ["Managing who can do what in the cloud with least privilege, roles and auditing.", "Role-based access, no long-lived keys, scoped service roles for workloads, and regular access reviews."],
  "Vault": ["HashiCorp's secrets manager: dynamic secrets, encryption and access policies.", "Keeping DB passwords and API keys out of Git and images, injected into pods at runtime."],
  "Trivy": ["An open-source scanner for vulnerabilities in images, filesystems, IaC and Kubernetes.", "A pipeline gate: builds fail on CRITICAL/HIGH CVEs or misconfigurations before anything ships."],
  "Vulnerability Scanning": ["Continuously finding known CVEs and misconfigurations in code, images and infrastructure.", "Container, secret (gitleaks) and IaC (tfsec) scans built into every CI run."],
  "WAF Tuning": ["Configuring Web Application Firewall rules to block attacks without blocking real users.", "Rate rules, bot scoring and managed rule sets at the edge, tuned from real traffic to cut false positives."],
  "Rate Limiting": ["Capping how many requests a client can make in a time window.", "Per-IP and per-client limits at the gateway and edge to protect APIs from abuse and traffic spikes."],
  "Cloud Compliance": ["Keeping cloud setups aligned with security standards and audit requirements.", "Guardrails, encryption by default, audit trails and tagging, so infrastructure is audit-ready by design."],
  "Kubecost": ["Cost visibility for Kubernetes, broken down by namespace, workload and label.", "Finding over-provisioned workloads and showing exactly where each rupee of cluster spend goes."],
  "PostgreSQL": ["A powerful open-source relational database.", "The primary transactional store, with tuned indexes, PITR backups, read replicas and failover."],
  "PgBouncer": ["A lightweight connection pooler for PostgreSQL.", "Stopping connection storms from autoscaled pods from overwhelming the database, and smoothing failovers."],
  "MySQL": ["A widely used open-source relational database.", "Running and migrating MySQL workloads, with replication, backups and query tuning."],
  "MongoDB": ["A document database for flexible, JSON-like data.", "Storing semi-structured product data, with indexes, backups and replica sets."],
  "Redis": ["An in-memory data store used for caching, sessions, queues and counters.", "Hot-path caching that takes most reads off the DB, plus session storage and rate-limit buckets."],
};
const SKILL_ALIAS = { "K8s": "Kubernetes", "Kong": "Kong Gateway", "GH Actions": "GitHub Actions", "Postgres": "PostgreSQL" };

whenNear("#skills", function skills() {
  const cats = $("#skill-cats");
  // skills are pre-rendered in index.html for search engines; build only if missing
  if (!cats.children.length) cats.innerHTML = SKILLS.map(([t, p, list], i) => `
    <div class="glass skill-cat reveal d${i % 4}">
      <h4><span>${t}</span><span>${p}%</span></h4>
      <div class="meter"><i data-w="${p}"></i></div>
      <div class="chips">${list.map(s => `<button type="button" class="chip" data-skill="${s}">${s}</button>`).join("")}</div>
    </div>`).join("");
  $$(".skill-cat", cats).forEach(c => c.addEventListener("reveal", () => { const m = $(".meter i", c); m.style.width = m.dataset.w + "%"; }));

  // ---- detail modal ----
  const modal = document.createElement("div");
  modal.className = "sk-modal";
  modal.innerHTML = `<div class="glass neon sk-card" role="dialog" aria-modal="true" aria-labelledby="sk-title">
      <button class="sk-close" aria-label="Close">✕</button>
      <div class="sk-cat"></div><h3 id="sk-title"></h3>
      <div class="sk-sec"><h5>WHAT IT'S USED FOR</h5><p class="sk-use"></p></div>
      <div class="sk-sec"><h5>HOW I USE IT</h5><p class="sk-how"></p></div>
      <div class="sk-rel"><h5>RELATED TOOLS</h5><div class="chips"></div></div>
    </div>`;
  document.body.appendChild(modal);
  let lastFocus = null;
  function open(name) {
    name = SKILL_ALIAS[name] || name;
    const info = SKILL_INFO[name];
    if (!info) return;
    const cat = SKILLS.find(c => c[2].includes(name));
    $(".sk-cat", modal).textContent = cat ? cat[0] : "SKILL";
    $("#sk-title", modal).textContent = name;
    $(".sk-use", modal).textContent = info[0];
    $(".sk-how", modal).textContent = info[1];
    const rel = cat ? cat[2].filter(s => s !== name).slice(0, 8) : [];
    $(".sk-rel .chips", modal).innerHTML = rel.map(s => `<button type="button" class="chip" data-skill="${s}">${s}</button>`).join("");
    if (!modal.classList.contains("open")) lastFocus = document.activeElement;
    modal.classList.remove("open"); void modal.offsetWidth; // restart the scan animation
    modal.classList.add("open");
    $(".sk-close", modal).focus({ preventScroll: true });
  }
  function close() {
    modal.classList.remove("open");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  modal.addEventListener("click", e => {
    if (e.target === modal || e.target.closest(".sk-close")) return close();
    const chip = e.target.closest("[data-skill]");
    if (chip) open(chip.dataset.skill);
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) close(); });
  cats.addEventListener("click", e => { const c = e.target.closest("[data-skill]"); if (c) open(c.dataset.skill); });

  const gal = $("#galaxy");
  const colors = ["#22e4ff", "#9d5cff", "#ff3ea5", "#3dffa8", "#ffb547"];
  const rings = [
    { r: .26, sp: .006, items: ["Docker", "K8s", "Terraform", "AWS"] },
    { r: .36, sp: -.004, items: ["Nginx", "Kong", "Helm", "Jenkins", "GH Actions", "Ansible"] },
    { r: .46, sp: .0025, items: ["Prometheus", "Grafana", "Loki", "Redis", "Postgres", "Vault", "Trivy", "GCP"] },
  ];
  const planets = [];
  rings.forEach((ring, ri) => ring.items.forEach((name, i) => {
    const p = document.createElement("button");
    p.type = "button"; p.className = "planet"; p.textContent = name; p.dataset.skill = name;
    p.style.setProperty("--c", colors[(ri * 3 + i) % colors.length]);
    p.onclick = () => open(name);
    gal.appendChild(p);
    planets.push({ el: p, ring, a: (i / ring.items.length) * Math.PI * 2 });
  }));
  let paused = false;
  gal.addEventListener("mouseenter", () => paused = true);
  gal.addEventListener("mouseleave", () => paused = false);
  let S = 0;
  new ResizeObserver(() => S = gal.clientWidth).observe(gal);
  rafWhileVisible(gal, (t, dt) => {
    planets.forEach(p => {
      if (!paused && !reduced) p.a += p.ring.sp * dt / 16;
      p.el.style.transform = `translate3d(${Math.cos(p.a) * S * p.ring.r}px, ${Math.sin(p.a) * S * p.ring.r}px, 0) translate(-50%, -50%)`;
    });
  });
});

/* ---------------- Interactive shell ---------------- */
whenNear("#terminal", function shell() {
  const sh = $("#shell");
  const PROMPT = '<span class="pr">guest@hariom-ops</span>:<span class="pa">~</span>$ ';
  const hist = []; let hi = 0;
  const print = (html, cls = "") => {
    const d = document.createElement("div"); d.className = "line " + cls; d.innerHTML = html;
    sh.insertBefore(d, row); sh.scrollTop = sh.scrollHeight;
  };
  const CMDS = {
    help: () => `Available commands:
  <span class="hl">whoami</span>        who is Hariom
  <span class="hl">about</span>         career summary
  <span class="hl">skills</span>        full toolbox
  <span class="hl">stack</span>         Saarthix production architecture
  <span class="hl">journey</span>       build → host timeline
  <span class="hl">kubectl get pods</span>
  <span class="hl">neofetch</span>      system info
  <span class="hl">contact</span>       how to reach me
  <span class="hl">linkedin</span>      open LinkedIn
  <span class="hl">sudo hire-me</span>  you know you want to
  <span class="hl">clear</span>         clear screen`,
    whoami: () => "hariom: DevOps / Cloud Engineer · Project Engineer Lead @ Saarthix",
    about: () => `Project Engineer Lead at Saarthix moving into DevOps.
I hosted and run the whole Saarthix platform myself: edge, load balancers,
API gateways, containers, CI/CD, observability and security, at the lowest
cost I could manage without giving up reliability.`,
    skills: () => SKILLS.map(([t, , l]) => `<span class="pa">${t}</span>\n  ${l.join(" · ")}`).join("\n"),
    stack: () => `<span class="mu">users</span> → <span class="pa">CDN/WAF</span> → <span class="pa">Nginx LB</span> → <span class="pa">Kong API Gateway</span>
      → <span class="hl">k8s: auth · jobs · resume · notify</span>
      → <span class="pr">Postgres/Mongo · Redis · Object Storage</span>
CI/CD: GitHub Actions → Trivy → Registry → Helm (atomic) → smoke tests
Obs:   Prometheus · Grafana · Loki · Alertmanager`,
    journey: () => "build → containerize → IaC → CI/CD → edge → LB → gateway → k8s → observability → security → cost-optimize ✔",
    "kubectl get pods": () => `NAME                          READY   STATUS    RESTARTS   AGE
auth-svc-7c9f8b6d4-xk2pq      1/1     <span class="pr">Running</span>   0          12d
jobs-svc-5d7b9c8f6-m4n8r      1/1     <span class="pr">Running</span>   0          3d
jobs-svc-5d7b9c8f6-q7w2e      1/1     <span class="pr">Running</span>   0          3d
resume-svc-6f8d7c5b9-p3l9k    1/1     <span class="pr">Running</span>   0          7d
notify-svc-8b6c9d7f5-z1x4c    1/1     <span class="pr">Running</span>   0          21d
kong-gateway-0                1/1     <span class="pr">Running</span>   0          30d`,
    neofetch: () => `<span class="pa">     ___      </span>  <span class="hl">hariom</span>@<span class="hl">ops</span>
<span class="pa">    /   \\     </span>  ----------------
<span class="pa">   | ◉ ◉ |    </span>  <span class="pa">Role</span>: DevOps · Cloud · SRE
<span class="pa">    \\ ‿ /     </span>  <span class="pa">Kernel</span>: linux-devops 6.9
<span class="pa">   /|___|\\    </span>  <span class="pa">Shell</span>: bash / zsh / python / go
<span class="pa">  /_______\\   </span>  <span class="pa">Uptime</span>: always 99.9%
                <span class="pa">Packages</span>: ${SKILLS.reduce((s, x) => s + x[2].length, 0)} (tools)
                <span class="pa">Infra</span>: Saarthix, run solo`,
    contact: () => `LinkedIn: <a href="${CONFIG.linkedin}" target="_blank" class="pa">${CONFIG.linkedin}</a>`,
    linkedin: () => { window.open(CONFIG.linkedin, "_blank", "noopener"); return "opening LinkedIn…"; },
    "sudo hire-me": () => `[sudo] password for guest: ********
<span class="pr">✔ access granted.</span> Deploying Hariom to your team…
<span class="pr">██████████████████████ 100%</span>
Reach out on LinkedIn → type <span class="hl">linkedin</span>`,
    "hire-me": () => `<span class="er">permission denied</span>: try <span class="hl">sudo hire-me</span>`,
    ls: () => "about.md  skills.yaml  saarthix-infra/  pipeline.yml  resume.pdf",
    "cat skills.yaml": () => CMDS.skills(),
    "cat about.md": () => CMDS.about(),
    date: () => new Date().toString(),
    pwd: () => "/home/guest",
    "rm -rf /": () => `<span class="er">nice try 😄</span> RBAC says no.`,
    exit: () => "there is no escape. type help.",
  };
  const row = document.createElement("div");
  row.className = "in-row";
  row.innerHTML = `<span>${PROMPT}</span><input id="sh-in" autocomplete="off" spellcheck="false" aria-label="terminal input">`;
  sh.appendChild(row);
  const inp = $("#sh-in", row);
  function exec(raw) {
    const cmd = raw.trim();
    print(PROMPT + cmd.replace(/</g, "&lt;"));
    if (!cmd) return;
    hist.push(cmd); hi = hist.length;
    if (cmd === "clear") { $$(".line", sh).forEach(l => l.remove()); return; }
    if (cmd.startsWith("echo ")) return print(cmd.slice(5).replace(/</g, "&lt;"));
    const fn = CMDS[cmd.toLowerCase()];
    print(fn ? fn() : `<span class="er">command not found:</span> ${cmd.replace(/</g, "&lt;")}. Type <span class="hl">help</span>.`);
  }
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") { exec(inp.value); inp.value = ""; }
    else if (e.key === "ArrowUp") { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ""; e.preventDefault(); }
    else if (e.key === "ArrowDown") { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ""; }
    else if (e.key === "Tab") {
      e.preventDefault();
      const m = Object.keys(CMDS).filter(k => k.startsWith(inp.value));
      if (m.length === 1) inp.value = m[0]; else if (m.length) print(m.join("   "), "mu");
    }
  });
  sh.addEventListener("click", () => inp.focus({ preventScroll: true }));
  print('<span class="mu">Welcome to hariom-ops shell v2.0. Type <span class="hl">help</span> to start.</span>');
  $("#term-hints").innerHTML = ["help", "whoami", "stack", "kubectl get pods", "neofetch", "sudo hire-me"]
    .map(c => `<button class="btn sm">${c}</button>`).join("");
  $$("#term-hints .btn").forEach(b => b.onclick = () => { exec(b.textContent); inp.focus({ preventScroll: true }); });
});

/* ---------------- Projects: filters + card spotlight ---------------- */
whenNear("#projects", function projects() {
  const cards = $$(".pcard"), btns = $$(".pf-btn");
  const match = (card, f) => f === "all" || card.dataset.cat.split(" ").includes(f);
  btns.forEach(b => { $("b", b).textContent = cards.filter(c => match(c, b.dataset.f)).length; });
  btns.forEach(b => b.addEventListener("click", () => {
    btns.forEach(x => x.classList.toggle("on", x === b));
    let n = 0;
    cards.forEach(c => {
      const show = match(c, b.dataset.f);
      c.classList.toggle("out", !show);
      c.classList.remove("in-anim");
      if (show) { c.style.setProperty("--n", n++); void c.offsetWidth; c.classList.add("in-anim"); }
    });
  }));
  // soft light that follows the pointer (hover devices only)
  if (matchMedia("(hover: hover)").matches) cards.forEach(c => c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", e.clientX - r.left + "px");
    c.style.setProperty("--my", e.clientY - r.top + "px");
  }, { passive: true }));
});

/* ---------------- Footer & init ---------------- */
$("#yr").textContent = new Date().getFullYear();
const t0 = Date.now();
setInterval(() => {
  const s = Math.floor((Date.now() - t0) / 1000);
  $("#uptime").textContent = [s / 3600, (s / 60) % 60, s % 60].map(v => String(Math.floor(v)).padStart(2, "0")).join(":");
}, 1000);

observeAll();
bindMagnetic();
bindTilt();
