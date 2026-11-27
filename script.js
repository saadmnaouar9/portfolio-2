/* =========================================================================
   script.js — behaviour only. Content lives in projects.js
   ========================================================================= */
(() => {
  "use strict";
  const SITE = window.SITE || { projects: [], categories: [], contact: {}, stats: [], heroImages: [] };
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cursorEl = fine && !reduce ? $("#cursor") : null;
  const ARROW ='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';

  /* ---------- PLACEHOLDER ART (one abstract mockup per category) ---------- */
  const ART = {
    branding: `<circle class="s" cx="200" cy="215" r="92"/><path class="s gl" d="M200 100v230M85 215h230"/><circle class="a" cx="200" cy="215" r="38"/><path class="s" d="M200 160l34 55-34 55-34-55z"/><text class="t" x="200" y="395" text-anchor="middle">BRAND MARK</text><text class="tm" x="200" y="425" text-anchor="middle">VISUAL IDENTITY</text>`,
    social: `<rect class="s" x="95" y="110" width="210" height="210" rx="26"/><circle class="a" cx="200" cy="215" r="48"/><circle class="s" cx="200" cy="215" r="70"/><circle class="f" cx="270" cy="145" r="7"/><rect class="s" x="95" y="350" width="100" height="14" rx="7"/><rect class="s gl" x="95" y="378" width="160" height="12" rx="6"/>`,
    ads: `<rect class="s" x="60" y="130" width="280" height="170" rx="14"/><text class="t" x="85" y="205" style="font-size:44px">BIG</text><text class="t" x="85" y="255" style="font-size:44px">IDEA.</text><rect class="a" x="250" y="245" width="70" height="34" rx="17"/><path class="s" d="M130 300v90M270 300v90M100 390h60M240 390h60"/>`,
    food: `<circle class="s" cx="200" cy="240" r="120"/><circle class="s gl" cx="200" cy="240" r="90"/><circle class="a" cx="200" cy="240" r="58"/><path class="s" d="M70 120v90M60 120v40M80 120v40M330 120c-14 10-14 50 0 60v30"/><circle class="f" cx="200" cy="240" r="8"/>`,
    posters: `<rect class="s" x="105" y="75" width="190" height="270" rx="10"/><rect class="a" x="125" y="95" width="150" height="100" rx="6"/><text class="t" x="125" y="245" style="font-size:34px">LIVE</text><text class="t" x="125" y="282" style="font-size:34px">EVENT</text><path class="s" d="M125 308h90"/><text class="tm" x="200" y="400" text-anchor="middle">POSTER · FLYER</text>`,
    football: `<rect class="s" x="55" y="120" width="290" height="190" rx="8"/><path class="s" d="M200 120v190"/><circle class="s" cx="200" cy="215" r="38"/><rect class="s" x="55" y="170" width="46" height="90"/><rect class="s" x="299" y="170" width="46" height="90"/><circle class="a" cx="200" cy="215" r="16"/><text class="t" x="200" y="380" text-anchor="middle">MATCH DAY</text>`,
    motion: `<circle class="s" cx="200" cy="200" r="78"/><path class="a" d="M180 160l62 40-62 40z"/><rect class="s" x="60" y="335" width="280" height="12" rx="6"/><rect class="a" x="60" y="335" width="140" height="12" rx="6"/><circle class="f" cx="200" cy="341" r="10"/><text class="tm" x="200" y="400" text-anchor="middle">MOTION · AI VIDEO</text>`,
    web: `<rect class="s" x="50" y="105" width="300" height="220" rx="16"/><path class="s" d="M50 145h300"/><circle class="f" cx="76" cy="125" r="5"/><circle class="a" cx="94" cy="125" r="5"/><rect class="a" x="76" y="172" width="120" height="14" rx="7"/><rect class="s gl" x="76" y="198" width="170" height="10" rx="5"/><rect class="s gl" x="76" y="218" width="140" height="10" rx="5"/><rect class="s" x="76" y="252" width="84" height="32" rx="16"/><rect class="s" x="228" y="172" width="96" height="112" rx="10"/>`,
    video: `<rect class="s" x="50" y="130" width="300" height="170" rx="12"/><path class="a" d="M185 180l50 35-50 35z"/><path class="s" d="M60 345h280M60 375h280"/><rect class="a" x="60" y="336" width="110" height="18" rx="4"/><rect class="s" x="190" y="366" width="70" height="18" rx="4"/>`,
    other: `<circle class="s" cx="140" cy="210" r="70"/><rect class="a" x="190" y="190" width="120" height="120" rx="10"/><path class="s" d="M120 340l80-40 80 40"/>`,
    packaging: `<path class="s" d="M200 95l110 55v135l-110 55-110-55V150z"/><path class="s" d="M90 150l110 55 110-55M200 205v135"/><path class="a" d="M200 205l110-55v40l-110 55z" opacity=".9"/><text class="tm" x="200" y="420" text-anchor="middle">PACKAGING</text>`
  };
  const art = (key, tone) => `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${ART[key] || ART.branding}</svg>`;

  /* ---------- LINKS from projects.js ---------- */
  const C = SITE.contact || {};
  const linkMap = {
    email: `mailto:${C.email || ""}`,
    whatsapp: `https://wa.me/${(C.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent("Hello Saad, I saw your portfolio and I'd like to talk about a project.")}`,
    behance: C.behance, instagram: C.instagram, linkedin: C.linkedin
  };
  const isPlaceholder = v => !v || /yourdomain|yourprofile|^2126000000+$/.test(String(v));
  const emailOK = !isPlaceholder(C.email);
  $$("[data-link]").forEach(a => {
    const k = a.dataset.link;
    if (isPlaceholder(C[k])) { (a.closest("li") || a).hidden = true; return; }   // never ship a dead / fake link
    if (linkMap[k]) a.href = linkMap[k];
  });
  const cl = $(".contact__links");
  if (cl && $$("[data-link]", cl).every(a => (a.closest("li") || a).hidden)) cl.hidden = true;
  $$("[data-text=email]").forEach(el => el.textContent = C.email || el.textContent);
  $("#year").textContent = new Date().getFullYear();


  /* ---------- LOADER ---------- */
  const loader = $("#loader"), bar = $("#loaderBar"), cnt = $("#loaderCount");
  let pct = 0, ready = false, start = performance.now();
  addEventListener("load", () => ready = true);
  if (document.readyState === "complete") ready = true;
  const tick = now => {
    const t = Math.min((now - start) / 1100, 1);
    const target = ready ? 100 : Math.min(90, t * 90);
    pct += (target - pct) * .12;
    const v = Math.round(pct);
    cnt.textContent = v; bar.style.width = v + "%";
    if (pct > 99.3 && t >= 1) return finish();
    requestAnimationFrame(tick);
  };
  function finish() {
    cnt.textContent = 100; bar.style.width = "100%";
    loader.classList.add("done");
    document.body.classList.add("is-loaded");
    setTimeout(() => loader.remove(), 1200);
  }
  if (reduce) finish(); else requestAnimationFrame(tick);
  setTimeout(() => !document.body.classList.contains("is-loaded") && finish(), 5000);

  /* ---------- NAV ---------- */
  const nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 20);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const setMenu = open => {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", !open);
    document.body.classList.toggle("is-locked", open);
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));

  // active link on scroll
  const spy = $$("[data-spy]");
  const spyIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) spy.forEach(a => a.classList.toggle("active", a.dataset.spy === e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["home", "about", "services", "portfolio", "contact"].forEach(id => $("#" + id) && spyIO.observe($("#" + id)));

  /* ---------- REVEAL ---------- */
  const revIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); revIO.unobserve(e.target); }
  }), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  const observeReveals = () => $$(".reveal:not(.in)").forEach(el => revIO.observe(el));
  observeReveals();

  // process line draws when steps enter
  const steps = $("#steps");
  if (steps) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { steps.classList.add("line-in"); o.disconnect(); } }, { threshold: .2 }).observe(steps);

  /* ---------- STATS ---------- */
  const statsEl = $("#stats");
  statsEl.innerHTML = (SITE.stats || []).map(s =>
    `<div class="stat"><b data-to="${+s.value}" data-suf="${esc(s.suffix)}">0${esc(s.suffix)}</b><span>${esc(s.label)}</span></div>`).join("");
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return; o.disconnect();
    $$("b[data-to]", statsEl).forEach(b => {
      const to = +b.dataset.to, suf = b.dataset.suf, dur = 1600, t0 = performance.now();
      const step = n => {
        const p = reduce ? 1 : Math.min((n - t0) / dur, 1);
        b.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .5 }).observe(statsEl);

  /* ---------- PROJECT DATABASE (Behance import + manual projects + overrides) ---------- */
  const cats = SITE.categories || [];
  const catBy = k => cats.find(c => c.key === k);
  const catLabel = k => (catBy(k) || {}).label || "Design";
  const slugify = t => String(t).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-") || "project";
  const ov = SITE.overrides || {};
  const seenIds = new Set();
  const feedIds = new Set(([...(window.BEHANCE_PROJECTS || []), ...(window.ADDED_PROJECTS || [])]).map(p => String(p.behanceId)));
  // projects exported from the full Behance profile that the public feed didn't list
  const extras = (window.LOCAL_PROJECTS || []).filter(l => !feedIds.has(String(l.behanceId))).map(l => {
    const f = (l.images && l.images[0]) || {}, r = f.w && f.h ? f.w / f.h : 1.3;
    return { id: l.id, behanceId: l.behanceId, slug: l.slug, title: l.title, categories: l.categories, cover: l.cover || f.src || "", year: "",
             shape: r > 1.9 ? "wide" : r > 1.1 ? "landscape" : r < .9 ? "portrait" : "square" };
  });
  const projects = [...([...(window.BEHANCE_PROJECTS || []), ...(window.ADDED_PROJECTS || [])]), ...extras, ...(SITE.projects || [])]
    .filter(p => { const k = p.behanceId || p.id; if (seenIds.has(k)) return false; seenIds.add(k); return true; })
    .map((p, i) => {
      const o = ov[p.id] || (p.behanceId && ov["be-" + p.behanceId]) || {};
      const loc = (window.LOCAL_PROJECTS || []).find(l => p.behanceId && l.behanceId === String(p.behanceId));
      const m = { ...p, ...(loc ? { cover: loc.cover || p.cover, coverLg: loc.cover || p.coverLg, images: loc.images, videos: loc.videos, description: loc.description || p.description, complete: loc.complete } : {}), ...o, _i: i };
      m.slug = m.slug || (slugify(m.title) + (m.behanceId ? "-" + m.behanceId : ""));
      m.images = (m.images || []).map(x => typeof x === "string" ? { src: x } : x);
      m.categories = (m.categories && m.categories.length ? m.categories : [m.category || "other"]).filter(k => catBy(k));
      if (!m.categories.length) m.categories = ["other"];
      return m;
    })
    .filter(p => !p.hidden)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (a.order ?? 1e6) - (b.order ?? 1e6) || a._i - b._i);
  const byId = id => projects.find(p => p.slug === id || p.id === id);
  const inCat = k => projects.filter(p => p.categories.includes(k));
  const catsText = p => p.categories.map(catLabel).join(" · ");
  const isBlocked = u => /-blocked\./.test(u || "");            // Behance's grey "restricted" placeholder is never shown
  const imgSrc = im => (im && (im.src || im)) || "";
  const coverOf = p => (p.cover && !isBlocked(p.cover) ? p.cover : "") || imgSrc(p.images && p.images[0]) || "";
  // clean fallback (only when no original image exists / loads): the category artwork on a fixed-size card
  const fallbackArt = p => `<div class="card__media ph" data-tone="${(catBy(p.categories[0]) || {}).tone ?? 0}" data-fallback="1">${art((catBy(p.categories[0]) || {}).art || "other")}</div>`;

  /* ---------- CATEGORY TILES (each opens its own page) ---------- */
  const catGrid = $("#catGrid");
  // tile image: the category's own `image` (set in projects.js); tiles without one keep the line-art drawing
  const catCover = c => c.image || "";
  catGrid.innerHTML = cats.map((c, i) => `
    <a class="cat ph${inCat(c.key).length ? "" : " cat--soon"}${catCover(c) ? " cat--img" : ""}" data-tone="${c.tone}" style="--i:${i}" href="#/category/${esc(c.key)}" data-cursor="Open">
      ${catCover(c) ? `<img class="cat__img" src="${esc(catCover(c))}" alt="" loading="lazy" decoding="async" onerror="this.closest('.cat').classList.remove('cat--img');this.remove()">` : ""}
      <span class="cat__n">${esc(c.num)}</span>
      <span class="cat__art">${art(c.art)}</span>
      <span class="cat__name">${esc(c.label)}</span>
      <span class="cat__count">${inCat(c.key).length ? `${inCat(c.key).length} project${inCat(c.key).length === 1 ? "" : "s"}` : "Coming soon"}</span>
    </a>`).join("");

  /* ---------- GRID: filters + search + lazy "load more on scroll" ---------- */
  const grid = $("#grid"), filtersEl = $("#filters"), emptyEl = $("#empty"), countEl = $("#count"), searchEl = $("#search");
  const BATCH = 12;   // multiple of 4 → complete rows in the 4-column grid
  let active = "all", query = "", visible = [], shown = 0;

  const cardHTML = (p, i, ctx) => `
    <a class="card card--${esc(p.shape || "landscape")}" style="--i:${i}" href="#/project/${esc(p.slug)}" data-ctx="${esc(ctx)}" data-cursor="View" aria-label="Open project: ${esc(p.title)}">
      ${coverOf(p) ? `<div class="card__media"><img src="${esc(coverOf(p))}" alt="${esc(p.title)} — ${esc(catsText(p))}" loading="lazy" decoding="async"></div>` : fallbackArt(p)}
      <span class="card__shade"></span>
      <span class="card__tag">${p.featured ? "★ Featured" : esc(catLabel(p.categories[0]))}</span>
      <span class="card__info"><span><small>${esc(catsText(p))}</small><h3>${esc(p.title)}</h3></span><span class="card__go">${ARROW}</span></span>
    </a>`;

  const renderFilters = () => {
    const list = [{ key: "all", label: "All", n: projects.length }, ...cats.map(c => ({ key: c.key, label: c.label, n: inCat(c.key).length })).filter(c => c.n)];
    filtersEl.innerHTML = list.map(c => `<button class="fbtn" role="tab" data-cat="${esc(c.key)}" aria-selected="${c.key === active}">${esc(c.label)}<sup>${c.n}</sup></button>`).join("");
  };
  const sentinel = document.createElement("div"); sentinel.style.cssText = "height:1px;grid-column:1/-1";
  const moreIO = new IntersectionObserver(es => es.some(e => e.isIntersecting) && renderMore(), { rootMargin: "600px 0px" });
  function renderMore() {
    moreIO.unobserve(sentinel); sentinel.remove();       // re-register every time so the observer always reports the new position
    const next = visible.slice(shown, shown + BATCH);
    grid.insertAdjacentHTML("beforeend", next.map((p, i) => cardHTML(p, i, active)).join(""));
    shown += next.length; bindCursor();
    if (shown < visible.length) { grid.appendChild(sentinel); moreIO.observe(sentinel); }
  }
  const renderGrid = () => {
    const q = query.trim().toLowerCase();
    visible = projects.filter(p => (active === "all" || p.categories.includes(active)) &&
      (!q || (p.title + " " + catsText(p)).toLowerCase().includes(q)));
    grid.innerHTML = ""; shown = 0; renderMore();
    emptyEl.hidden = visible.length > 0;
    countEl.textContent = `${visible.length} project${visible.length === 1 ? "" : "s"}${active !== "all" ? " in " + catLabel(active) : ""}${q ? ` matching “${query.trim()}”` : ""}`;
  };
  const refresh = () => { grid.classList.add("leaving"); setTimeout(() => { renderGrid(); grid.classList.remove("leaving"); }, reduce ? 0 : 220); };
  renderFilters(); renderGrid();
  filtersEl.addEventListener("click", e => {
    const b = e.target.closest(".fbtn"); if (!b || b.dataset.cat === active) return;
    active = b.dataset.cat; renderFilters(); refresh();
  });
  let st; searchEl.addEventListener("input", () => { clearTimeout(st); st = setTimeout(() => { query = searchEl.value; refresh(); }, 160); });

  document.addEventListener("error", e => {
    const im = e.target; if (!im || im.tagName !== "IMG") return;
    const box = im.closest(".card__media"); if (!box || box.classList.contains("ph")) return;
    const card = im.closest(".card"); const p = card && projects.find(x => x.slug === (card.getAttribute("href") || "").split("/").pop());
    if (p) box.outerHTML = fallbackArt(p);
  }, true);

  /* ---------- IN-SITE PAGES: #/project/<id> and #/category/<key> ---------- */
  const modal = $("#modal"), mBody = $("#mBody"), mCount = $("#mCount"), panel = $("#mPanel");
  const mBack = $("#mBack"), mBackLabel = $("#mBackLabel");
  let depth = 0, seq = [], seqPos = 0, backHash = null, lastFocus = null, ctxCat = "all";

  const go = h => { depth++; location.hash = h; };
  const closeView = () => depth > 0 ? history.go(-depth) : (location.hash = "#portfolio");

  const GAL_LABEL = { brand: "Brand presentation", social: "All posts & variations", print: "Print materials", posters: "Posters & flyers", packaging: "Packaging & mockups", food: "Food & beverage visuals", football: "Matchday & sports graphics", motion: "Motion & video", video: "Video projects", web: "Screens & interfaces", other: "Project visuals" };
  const videoHTML = v => /\.(mp4|webm|mov)(\?|$)/i.test(v)
    ? `<div class="vid"><video src="${esc(v)}" controls playsinline preload="metadata"></video></div>`
    : `<div class="vid vid--embed"><iframe src="${esc(v)}" title="Project video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
  const galleryHTML = p => {
    const vids = [...(p.videos || []), ...(p.video ? [p.video] : [])];
    if (p.images && p.images.length) { // the real presentation: original order, original proportions
      const label = GAL_LABEL[p.categories[0]] || "Project visuals";
      return `<p class="pd__glabel">${esc(label)} <b>${p.images.length}</b></p><div class="pd__flow">${
        p.images.map((im, i) => `<button type="button" class="shot" data-zoom="${i}" aria-label="View image ${i + 1} full screen"><img src="${esc(im.src)}" alt="${esc(p.title)} — image ${i + 1} of ${p.images.length}" ${im.w && im.h ? `width="${im.w}" height="${im.h}"` : ""} loading="${i < 2 ? "eager" : "lazy"}" decoding="async"></button>`).join("")}</div>${vids.map(videoHTML).join("")}`;
    }
    // Not imported yet: say so plainly; never present a cover alone as the full project.
    return `${!coverOf(p) ? `<div class="pd__flow"><div class="shot ph" data-tone="${(catBy(p.categories[0]) || {}).tone ?? 0}">${art((catBy(p.categories[0]) || {}).art || "other")}</div></div>` : ""}${coverOf(p) ? `<div class="pd__flow"><button type="button" class="shot" data-zoom="0"><img src="${esc(p.coverLg || coverOf(p))}" alt="${esc(p.title)} — cover" decoding="async"></button></div>` : ""}${vids.map(videoHTML).join("")}
      <div class="pd__pending"><div class="pd__ptxt"><span class="pd__ptag">Cover only</span><b>Full presentation not imported yet</b><p>${p.embed ? "The complete original project can be viewed inside this site, but its images haven't been saved into the portfolio yet." : "More images for this project will be added soon."}</p></div>${p.embed ? `<button type="button" class="pd__pbtn" data-open="${esc(p.slug)}"><span>View complete project</span><i>${ARROW}</i></button>` : ""}</div>`;
  };

  const miniCard = (p, label) => `<a class="pn" href="#/project/${esc(p.slug)}" data-ctx="${esc(ctxCat)}">${coverOf(p) ? `<img src="${esc(coverOf(p))}" alt="" loading="lazy">` : `<i class="pn__ph" aria-hidden="true"></i>`}<span><small>${label}</small><b>${esc(p.title)}</b></span></a>`;

  function showProject(p) {
    const list = ctxCat !== "all" && p.categories.includes(ctxCat) ? inCat(ctxCat) : projects;
    seq = list.map(x => "#/project/" + x.slug); seqPos = list.indexOf(p);
    const prev = list[(seqPos - 1 + list.length) % list.length], next = list[(seqPos + 1) % list.length];
    const rel = projects.filter(x => x !== p && x.categories.some(c => p.categories.includes(c))).slice(0, 3);
    const mainCat = ctxCat !== "all" && p.categories.includes(ctxCat) ? ctxCat : p.categories[0];
    backHash = "#/category/" + mainCat; mBackLabel.textContent = catLabel(mainCat);
    mCount.textContent = `${String(seqPos + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
    mBody.innerHTML = `
      <article class="pd">
        <div class="pd__head">
          <div>
            <div class="pd__chips">${p.categories.map(c => `<a class="pd__cat" href="#/category/${esc(c)}">${esc(catLabel(c))}</a>`).join("")}${p.featured ? '<span class="pd__cat pd__cat--f">★ Featured</span>' : ""}</div>
            <h2 id="mTitle">${esc(p.title)}</h2>
          </div>
          ${p.description ? `<p class="pd__desc">${esc(p.description)}</p>` : ""}
        </div>
        ${(p.year || p.client || p.role || (p.tools || []).length) ? `<div class="pd__meta">${[["Client", p.client], ["Year", p.year], ["Role", p.role], ["Tools", (p.tools || []).join(", ")]].filter(m => m[1]).map(m => `<div><small>${m[0]}</small><b>${esc(m[1])}</b></div>`).join("")}</div>` : ""}
        <div class="pd__gal">${galleryHTML(p)}</div>
        <nav class="pn-row" aria-label="Project navigation">${list.length > 1 ? miniCard(prev, "← Previous") + miniCard(next, "Next →") : ""}</nav>
        ${rel.length ? `<h3 class="pd__rel">Related projects</h3><div class="pd__relgrid">${rel.map((x, i) => cardHTML(x, i, ctxCat)).join("")}</div>` : ""}
        <a class="btn btn--dark pd__back" href="${esc(backHash)}"><svg viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(-135deg)"><path d="M7 17L17 7M8 7h9v9"/></svg><span>Back to ${esc(catLabel(mainCat))}</span></a>
      </article>`;
    document.title = `${p.title} — Saad Mnaouar`;
  }

  function showCategory(c) {
    const list = inCat(c.key), idx = cats.indexOf(c);
    seq = cats.map(x => "#/category/" + x.key); seqPos = idx;
    backHash = null; mBackLabel.textContent = "All projects";
    mCount.textContent = `${c.num} / ${String(cats.length).padStart(2, "0")}`;
    mBody.innerHTML = `
      <section class="cp">
        <header class="cp__head ph" data-tone="${c.tone}">
          <div class="cp__txt"><span class="cp__n">${esc(c.num)}</span><h2 id="mTitle">${esc(c.label)}</h2><p>${esc(c.blurb || "")}</p><span class="cp__count">${list.length} project${list.length === 1 ? "" : "s"}</span></div>
          <div class="cp__art">${art(c.art)}</div>
        </header>
        <div class="grid">${list.map((p, i) => cardHTML(p, i, c.key)).join("") || '<p class="work__empty" style="grid-column:1/-1">No projects in this category yet.</p>'}</div>
        <div class="cp__others"><h3 class="pd__rel">More categories</h3><div class="cp__chips">${cats.filter(x => x !== c).map(x => `<a class="fbtn" href="#/category/${esc(x.key)}">${esc(x.label)}<sup>${inCat(x.key).length}</sup></a>`).join("")}</div></div>
      </section>`;
    document.title = `${c.label} — Saad Mnaouar`;
  }

  function route() {
    const m = location.hash.match(/^#\/(project|category)\/([^/?]+)/);
    if (!m) { // close
      if (modal.classList.contains("open")) {
        modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("is-locked");
        document.title = "Saad Mnaouar — Graphic Designer & Visual Creative";
        lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
        setTimeout(() => { if (!modal.classList.contains("open")) mBody.innerHTML = ""; }, 500);
      }
      depth = 0; return;
    }
    const id = decodeURIComponent(m[2]);
    const wasOpen = modal.classList.contains("open");
    if (m[1] === "project") { const p = byId(id); if (!p) return closeView(); showProject(p); }
    else { const c = catBy(id); if (!c) return closeView(); ctxCat = c.key; showCategory(c); }
    if (!wasOpen) { lastFocus = document.activeElement; modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); document.body.classList.add("is-locked"); cursorEl && cursorEl.classList.remove("big"); }
    mBody.scrollTop = 0; setTimeout(() => panel.focus({ preventScroll: true }), 30);
    bindCursor();
  }
  addEventListener("hashchange", route);

  // internal links inside the page count as navigation depth; remember category context
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href^='#/']"); if (!a) return;
    const ctx = a.dataset.ctx; if (ctx) ctxCat = ctx; else if (a.getAttribute("href").startsWith("#/category/")) ctxCat = a.getAttribute("href").split("/")[2];
    if (modal.classList.contains("open")) depth++;
    else depth = 1;
  });
  /* full-screen viewer: shows every poster of a project without leaving the site */
  const viewer = document.createElement("div");
  viewer.className = "viewer"; viewer.setAttribute("role", "dialog"); viewer.setAttribute("aria-modal", "true"); viewer.setAttribute("aria-hidden", "true");
  viewer.innerHTML = `<div class="viewer__bar"><b id="vTitle"></b><span><button id="vClose" aria-label="Close viewer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span></div><div class="viewer__body"><p class="viewer__load">Loading all posters…</p></div>`;
  document.body.appendChild(viewer);
  const openViewer = p => {
    $("#vTitle", viewer).textContent = p.title;
    $(".viewer__body", viewer).innerHTML = `<p class="viewer__load">Loading all posters…</p><iframe src="${esc(p.embed)}" title="${esc(p.title)} — all posters" allowfullscreen allow="clipboard-write; fullscreen"></iframe>`;
    viewer.classList.add("open"); viewer.setAttribute("aria-hidden", "false"); $("#vClose", viewer).focus();
  };
  const closeViewer = () => { viewer.classList.remove("open"); viewer.setAttribute("aria-hidden", "true"); $(".viewer__body", viewer).innerHTML = ""; };
  $("#vClose", viewer).addEventListener("click", closeViewer);

  /* full-screen image viewing (click any image of a project) */
  const lb = document.createElement("div"); lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-hidden", "true");
  lb.innerHTML = `<button class="lb__x" aria-label="Close image">×</button><button class="lb__n lb__n--p" aria-label="Previous image">‹</button><img alt=""><button class="lb__n lb__n--n" aria-label="Next image">›</button><span class="lb__c"></span>`;
  document.body.appendChild(lb);
  let lbList = [], lbI = 0;
  const lbShow = i => { lbI = (i + lbList.length) % lbList.length; const im = $("img", lb); im.src = lbList[lbI].src; im.alt = lbList[lbI].alt || ""; $(".lb__c", lb).textContent = `${lbI + 1} / ${lbList.length}`; lb.classList.toggle("single", lbList.length < 2); };
  const lbClose = () => { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); };
  let tx0 = null;   // swipe left/right to change image on touch screens
  lb.addEventListener("touchstart", e => { tx0 = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (tx0 === null || lbList.length < 2) return;
    const dx = e.changedTouches[0].clientX - tx0; tx0 = null;
    if (Math.abs(dx) > 50) lbShow(lbI + (dx < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener("click", e => {
    const z = e.target.closest("[data-zoom]"); if (!z) return;
    const imgs = $$(".pd__flow .shot img", mBody); lbList = imgs.map(i => ({ src: i.currentSrc || i.src, alt: i.alt }));
    lbShow(+z.dataset.zoom); lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
  });
  lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lb__x")) lbClose(); else if (e.target.classList.contains("lb__n--p")) lbShow(lbI - 1); else if (e.target.classList.contains("lb__n--n")) lbShow(lbI + 1); });
  document.addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) { const p = byId(b.dataset.open); p && openViewer(p); } });

  mBack.addEventListener("click", () => backHash ? (depth++, location.hash = backHash) : closeView());
  $("#mClose").addEventListener("click", closeView);
  const step = d => { if (seq.length > 1) { depth++; location.hash = seq[(seqPos + d + seq.length) % seq.length]; } };
  $("#mPrev").addEventListener("click", () => step(-1));
  $("#mNext").addEventListener("click", () => step(1));
  addEventListener("keydown", e => {
    if (!modal.classList.contains("open")) { if (e.key === "Escape") setMenu(false); return; }
    if (lb.classList.contains("open")) { if (e.key === "Escape") lbClose(); if (e.key === "ArrowRight") lbShow(lbI + 1); if (e.key === "ArrowLeft") lbShow(lbI - 1); return; }
    if (e.key === "Escape") return viewer.classList.contains("open") ? closeViewer() : closeView();
    if (e.key === "ArrowRight" && !e.target.closest("input,iframe")) step(1);
    if (e.key === "ArrowLeft" && !e.target.closest("input,iframe")) step(-1);
  });
  route(); // deep links like index.html#/project/be-246912965

  /* ---------- MAGNETIC BUTTONS ---------- */
  if (false && fine && !reduce) { // disabled: buttons stay in place on hover
    $$(".magnetic").forEach(b => {
      b.addEventListener("mousemove", e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      b.addEventListener("mouseleave", () => b.style.transform = "");
    });
  }

  /* ---------- CUSTOM CURSOR (desktop only, subtle) ---------- */
  function bindCursor() {
    if (!cursorEl) return;
    $$("[data-cursor]").forEach(el => {
      el.onmouseenter = () => { $("span", cursorEl).textContent = el.dataset.cursor; cursorEl.classList.add("big"); };
      el.onmouseleave = () => cursorEl.classList.remove("big");
    });
  }
  if (cursorEl) {
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; cursorEl.classList.add("on"); }, { passive: true });
    document.addEventListener("mouseleave", () => cursorEl.classList.remove("on"));
    (function loop() {
      x += (tx - x) * .2; y += (ty - y) * .2;
      cursorEl.style.transform = `translate(${x}px,${y}px)`;
      requestAnimationFrame(loop);
    })();
    bindCursor();
  }

  /* ---------- CONTACT FORM ---------- */
  const form = $("#form"), status = $("#formStatus");
  const say = (t, bad) => { status.textContent = t; status.classList.toggle("bad", !!bad); };
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (d._gotcha) return;
    let ok = true;
    ["name", "email", "message"].forEach(k => {
      const f = form.elements[k], bad = !f.value.trim() || (k === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
      f.closest(".field").classList.toggle("err", bad); if (bad) ok = false;
    });
    if (!ok) return say("Please fill in your name, a valid email and a message.", true);

    if (C.formEndpoint) {
      say("Sending…");
      try {
        const r = await fetch(C.formEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(d) });
        if (!r.ok) throw 0;
        form.reset(); say("Thank you! Your message was sent. I'll reply soon.");
      } catch { say("Something went wrong. Please email me directly.", true); }
    } else if (!emailOK) {
      say("Messaging isn't available just yet. Please check back soon.", true);
    } else {
      const subject = encodeURIComponent(`Project enquiry — ${d.type}`);
      const body = encodeURIComponent(`${d.message}\n\n— ${d.name} (${d.email})`);
      location.href = `mailto:${C.email}?subject=${subject}&body=${body}`;
      say("Opening your email app…");
    }
  });
})();
