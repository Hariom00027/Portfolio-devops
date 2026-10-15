/* Lightweight script for secondary pages: custom cursor, nav, scroll progress. No boot screen, no canvas. */
const $ = (s, r = document) => r.querySelector(s);

/* ---------------- Custom cursor: targeting reticle (same as the homepage) ---------------- */
(function cursor() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.documentElement.classList.add("has-cur");
  const root = document.createElement("div");
  root.id = "cur"; root.setAttribute("aria-hidden", "true");
  root.innerHTML = '<div class="cur-cross"><i></i></div><div class="cur-c tl"></div><div class="cur-c tr"></div><div class="cur-c bl"></div><div class="cur-c br"></div><div class="cur-dot"></div><div class="cur-label"></div>';
  document.body.appendChild(root);
  const [cross, tl, tr, bl, br, dot, label] = root.children;
  const S = 12, IDLE = 13, PAD = 7;
  const SEL = "a, button, [data-cursor]";
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
    if (delta > .2 || lockEl) requestAnimationFrame(frame); else running = false;
  }
  const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

  addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; root.classList.add("on"); kick(); }, { passive: true });
  document.addEventListener("mouseleave", () => root.classList.remove("on"));
  document.addEventListener("mouseover", e => {
    const next = e.target.closest(SEL);
    if (next === lockEl) return;
    lockEl = next;
    root.classList.toggle("lock", !!lockEl);
    if (lockEl) {
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

/* ---------------- Nav + reading progress ---------------- */
(function nav() {
  const navEl = $("#nav"), prog = $("#progress");
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    navEl.classList.toggle("scrolled", y > 30);
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
  $("#burger").onclick = () => $("#nav-links").classList.toggle("open");
})();

$("#yr").textContent = new Date().getFullYear();
