/* =========================================================================
   RUN THIS IN YOUR OWN BROWSER (see HOW-TO-IMPORT.md)
   1. Open https://www.behance.net/mnaouarsaad  (scroll once so it loads)
   2. Press Cmd+Option+J (Chrome console), paste this whole file, press Enter
   3. Wait for "DONE" — a file behance-dump.json downloads. Move it into the
      website folder and run:  node tools/import-assets.mjs
   It only reads YOUR public projects through YOUR browser session.
   ========================================================================= */
(async () => {
  const log = (...a) => console.log("%c[import]", "color:#7a9a00;font-weight:bold", ...a);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const SIZE_RANK = ["source", "max_3840", "max_1200_webp", "max_1200", "1400", "fs", "808_webp", "808", "404", "202", "115"];
  const unesc = s => s.replace(/\\u002F/g, "/").replace(/\\\//g, "/").replace(/&amp;/g, "&");

  // 1. load the whole profile (infinite scroll) and collect every project link
  let last = -1;
  for (let i = 0; i < 40; i++) {
    window.scrollTo(0, document.body.scrollHeight); await sleep(1200);
    const n = new Set([...document.querySelectorAll('a[href*="/gallery/"]')].map(a => a.href.match(/gallery\/(\d+)/)?.[1]).filter(Boolean)).size;
    if (n === last) break; last = n;
  }
  const links = new Map();
  document.querySelectorAll('a[href*="/gallery/"]').forEach(a => {
    let u; try { u = new URL(a.href); } catch { return; }
    if (u.hostname !== location.hostname) return;            // never request any other website
    const id = u.pathname.match(/\/gallery\/(\d+)/)?.[1]; if (id && !links.has(id)) links.set(id, u.origin + u.pathname);
  });
  log(`found ${links.size} projects on the profile`);

  // 2. read the images of one project (from its HTML; fall back to a live frame)
  const extract = (html, doc) => {
    const seen = new Map();   // file name -> {url, rank} (keep the largest variant)
    const re = /https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/([^\/"'\s\\)<>]+)\/([^"'\s\\)<>]+)/g;
    let m; const text = unesc(html);
    while ((m = re.exec(text))) {
      const [url, size, file] = m;
      if (/\.(js|css)$/.test(file)) continue;
      const rank = SIZE_RANK.indexOf(size.replace(/_webp$/, "")) < 0 ? 99 : SIZE_RANK.indexOf(size.replace(/_webp$/, ""));
      if (!seen.has(file)) seen.set(file, { url, rank, order: seen.size });
      else if (rank < seen.get(file).rank) seen.get(file).url = url, seen.get(file).rank = rank;
    }
    const og = doc.querySelector('meta[property="og:description"]')?.content || "";
    const videos = [...new Set([...doc.querySelectorAll("video source, video[src]")].map(v => v.src || v.getAttribute("src")).filter(Boolean)
      .concat([...doc.querySelectorAll('iframe[src*="vimeo"],iframe[src*="youtube"]')].map(f => f.src)))];
    return { images: [...seen.values()].sort((a, b) => a.order - b.order).map(x => x.url), description: og, videos,
             title: (doc.querySelector('meta[property="og:title"]')?.content || doc.title || "").replace(/\s*::\s*Behance.*$/i, "").trim() };
  };
  const viaFrame = url => new Promise(res => {
    const f = document.createElement("iframe"); f.style.cssText = "position:fixed;left:-9999px;width:1200px;height:1600px";
    f.onload = async () => { try { const d = f.contentDocument; for (let i = 0; i < 25; i++) { f.contentWindow.scrollTo(0, d.body.scrollHeight); await sleep(500); }
      res(extract(d.documentElement.outerHTML, d)); } catch { res(null); } f.remove(); };
    f.src = url; document.body.appendChild(f);
  });

  const out = [];
  for (const [id, url] of links) {
    let r = null;
    try { const html = await (await fetch(url, { credentials: "same-origin" })).text(); r = extract(html, new DOMParser().parseFromString(html, "text/html")); } catch {}
    if (!r || !r.images.length) { log(`${id}: no images in page HTML, trying live frame…`); r = await viaFrame(url); }
    r = r || { images: [], description: "", videos: [], title: "" };
    out.push({ id, url, ...r });
    log(`${id} “${r.title}” → ${r.images.length} images, ${r.videos.length} videos`);
  }

  // 3. report
  const okN = out.filter(o => o.images.length).length, bad = out.filter(o => !o.images.length);
  console.table(out.map(o => ({ id: o.id, title: o.title, images: o.images.length, videos: o.videos.length })));
  log(`SUMMARY: ${out.length} projects found, ${okN} exported with images, ${bad.length} with NO images${bad.length ? " → " + bad.map(b => b.id).join(", ") : ""}`);

  // 4. download the result (a local file — nothing is uploaded anywhere)
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
  a.download = "behance-dump.json"; a.click();
  log("DONE — move behance-dump.json into the website folder, then run: node tools/import-assets.mjs");
})();
